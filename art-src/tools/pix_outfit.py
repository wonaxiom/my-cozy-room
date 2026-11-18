import sys
import numpy as np
from PIL import Image
from scipy import ndimage
a=np.array(Image.open(sys.argv[1]).convert('RGBA')).astype(float)
rgb=a[:,:,:3]
bgm=((rgb.min(2)>232)&((rgb.max(2)-rgb.min(2))<16))|(a[:,:,3]<128)
fg=ndimage.binary_closing(~bgm,iterations=3)
lab,n=ndimage.label(fg)
objs=[(sl,i+1) for i,sl in enumerate(ndimage.find_objects(lab)) if (lab[sl]==i+1).sum()>3000]
objs.sort(key=lambda o:(round((o[0][0].start+o[0][0].stop)/2/250),o[0][1].start))
P=4.5
base_pal=np.unique(np.vstack([np.array(Image.open(f'../base/{sys.argv[3]}_{i:02d}.png').convert('RGBA'))[...,:3][np.array(Image.open(f'../base/{sys.argv[3]}_{i:02d}.png').convert('RGBA'))[...,3]>0] for i in (0,18,26)]),axis=0).astype(float)
for k,(sl,li) in enumerate(objs):
    y0,y1=sl[0].start-6,sl[0].stop+6; x0,x1=sl[1].start-6,sl[1].stop+6
    sub=a[y0:y1,x0:x1]; m=~bgm[y0:y1,x0:x1]&(lab[y0:y1,x0:x1]==li)
    def var(ox,oy):
        tot=0;cnt=0
        for gy in np.arange(oy,sub.shape[0]-P,P):
            for gx in np.arange(ox,sub.shape[1]-P,P):
                c=sub[int(gy+1):int(gy+P-1),int(gx+1):int(gx+P-1),:3]
                if c.size: tot+=c.std(axis=(0,1)).mean(); cnt+=1
        return tot/max(cnt,1)
    _,ox,oy=min((var(ox,oy),ox,oy) for ox in np.arange(0,P,P/5) for oy in np.arange(0,P,P/5))
    gys=np.arange(oy,sub.shape[0]-P/2,P); gxs=np.arange(ox,sub.shape[1]-P/2,P)
    o=np.zeros((len(gys),len(gxs),4),np.uint8)
    for j,gy in enumerate(gys):
        for i,gx in enumerate(gxs):
            ya,yb=int(gy+P*0.25),int(gy+P*0.75)+1; xa,xb=int(gx+P*0.25),int(gx+P*0.75)+1
            mm=m[ya:yb,xa:xb]
            if mm.mean()<0.5: continue
            c=np.median(sub[ya:yb,xa:xb,:3][mm],axis=0)
            d=((base_pal-c)**2).sum(1); idx=d.argmin()
            o[j,i,:3]=base_pal[idx] if d[idx]<28**2 else (c//6)*6; o[j,i,3]=255
    ys=np.where(o[:,:,3].any(1))[0]; xs=np.where(o[:,:,3].any(0))[0]
    o=o[ys[0]:ys[-1]+1,xs[0]:xs[-1]+1]
    Image.fromarray(o).save(f'{sys.argv[2]}_{k:02d}.png')
print('done',len(objs))

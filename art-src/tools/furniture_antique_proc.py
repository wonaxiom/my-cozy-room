import numpy as np, sys
from PIL import Image
from scipy import ndimage
from collections import Counter
exec(open('items.py').read())
def objs_of(f):
    lab=np.load(f'lab{f}.npy'); fg=np.load(f'fg{f}.npy')
    objs=[(sl,i+1) for i,sl in enumerate(ndimage.find_objects(lab)) if (lab[sl]==i+1).sum()>1500]
    objs.sort(key=lambda o:(o[0][0].start+o[0][0].stop)/2)
    rows=[];cur=[]
    for o in objs:
        c=(o[0][0].start+o[0][0].stop)/2
        if cur and c-np.mean([(q[0][0].start+q[0][0].stop)/2 for q in cur])>120: rows.append(cur); cur=[]
        cur.append(o)
    rows.append(cur)
    return [o for r in rows for o in sorted(r,key=lambda o:o[0][1].start)], lab, fg
def pix(a,m,tw,qs):
    H,W=a.shape[:2]; p=W/tw; th=max(1,round(H/p)); o=np.zeros((th,tw,4),np.uint8)
    for j in range(th):
        for i in range(tw):
            ya,yb=int(j*p),max(int(j*p)+1,int((j+1)*p)); xa,xb=int(i*p),max(int(i*p)+1,int((i+1)*p))
            c=a[ya:yb,xa:xb][:,:,:3]; bgish=(c.min(2)>244)&((c.max(2)-c.min(2))<8)
            mm=m[ya:yb,xa:xb]&~bgish
            if mm.mean()<0.5: continue
            px=c[mm]; q=Counter(tuple((v//qs)*qs) for v in px).most_common(1)[0][0]
            sel=px[np.all((px//qs)*qs==q,axis=1)]; o[j,i,:3]=sel.mean(0); o[j,i,3]=255
    return o
for f,scale,outdir,qs,erode in ((84,2.4,'out',16,1),(86,0.8,'simple',20,2)):
    src=np.array(Image.open(f'../../images/{f}.webp').convert('RGBA')).astype(int)
    objs,lab,fg=objs_of(f); assert len(objs)==15
    for (sl,li),(idx,id_,name,cat,price,size,ex) in zip(objs,ITEMS):
        w,d,h=size; tw=max(2,round((w+1 if ex.get('wall') else w+d)*scale))
        m=ndimage.binary_erosion((lab[sl]==li)&fg[sl],iterations=erode)
        o=pix(src[sl],m,tw,qs); Image.fromarray(o).save(f'{outdir}/{id_}.png')
        if ex.get('light'):
            off=o.copy().astype(float); g=off[:,:,:3].mean(2,keepdims=True); off[:,:,:3]=(off[:,:,:3]*0.55+g*0.45)*0.72
            Image.fromarray(off.clip(0,255).astype(np.uint8)).save(f'{outdir}/{id_}-off.png')
print('ok')

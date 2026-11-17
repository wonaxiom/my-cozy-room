import numpy as np
from PIL import Image
from scipy import ndimage
from collections import Counter
exec(open('items.py').read())
src=np.array(Image.open('../../images/83.webp').convert('RGBA')).astype(int)
fg=np.load('sfg.npy'); lab,n=ndimage.label(fg)
objs=[]
for i,sl in enumerate(ndimage.find_objects(lab)):
    if (lab[sl]==i+1).sum()<150: continue
    objs.append((sl,i+1))
objs.sort(key=lambda o:(o[0][0].start+o[0][0].stop)/2)
rows=[];cur=[]
for o in objs:
    c=(o[0][0].start+o[0][0].stop)/2
    if cur and c-np.mean([(q[0][0].start+q[0][0].stop)/2 for q in cur])>40: rows.append(cur); cur=[]
    cur.append(o)
rows.append(cur)
objs=[o for r in rows for o in sorted(r,key=lambda o:o[0][1].start)]
assert len(objs)==len(ITEMS), len(objs)
def pix(a,m,tw):
    H,W=a.shape[:2]; p=W/tw; th=max(1,round(H/p)); o=np.zeros((th,tw,4),np.uint8)
    for j in range(th):
        for i in range(tw):
            ya,yb=int(j*p),max(int(j*p)+1,int((j+1)*p)); xa,xb=int(i*p),max(int(i*p)+1,int((i+1)*p))
            c=a[ya:yb,xa:xb][:,:,:3]
            # 배경에서 번진 아주 밝은 회색 점은 빼고 셈
            bgish=(c.min(2)>244)&((c.max(2)-c.min(2))<8)
            mm=m[ya:yb,xa:xb]&~bgish
            if mm.mean()<0.5: continue
            px=c[mm]
            q=Counter(tuple((v//20)*20) for v in px).most_common(1)[0][0]
            sel=px[np.all((px//20)*20==q,axis=1)]
            o[j,i,:3]=sel.mean(0); o[j,i,3]=255
    return o
for (sl,li),(idx,id_,name,cat,price,size,ex) in zip(objs,ITEMS):
    w,d,h=size
    tw=max(2,round((w+1 if ex.get('wall') else w+d)*0.8))
    m=ndimage.binary_erosion(lab[sl]==li,iterations=2); a=src[sl]   # 배경과 섞인 가장자리 2픽셀은 빼기
    o=pix(a,m,tw)
    Image.fromarray(o).save(f'simple/{id_}.png')
    if 'off' in ex:
        off=o.copy().astype(float); g=off[:,:,:3].mean(2,keepdims=True)
        off[:,:,:3]=(off[:,:,:3]*0.55+g*0.45)*0.72
        Image.fromarray(off.clip(0,255).astype(np.uint8)).save(f'simple/{id_}-off.png')
print('ok')

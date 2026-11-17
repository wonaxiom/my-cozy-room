import numpy as np, json
from PIL import Image
from collections import Counter
exec(open('items.py').read())
src=np.array(Image.open('../../images/81.webp').convert('RGBA')).astype(int)
boxes=json.load(open('boxes.json'))
WS=2.4
def crop(i):
    y0,x0,y1,x1=boxes[i]; a=src[y0:y1,x0:x1].copy()
    m=a[:,:,3]>128; ys,xs=np.nonzero(m)
    return a[ys.min():ys.max()+1, xs.min():xs.max()+1]
def pixelize(a, tw):
    H,W=a.shape[:2]; p=W/tw; th=max(1,round(H/p))
    o=np.zeros((th,tw,4),np.uint8)
    for j in range(th):
        for i in range(tw):
            ya,yb=int(round(j*p)),max(int(round(j*p))+1,int(round((j+1)*p))); xa,xb=int(round(i*p)),max(int(round(i*p))+1,int(round((i+1)*p)))
            c=a[ya:yb,xa:xb].reshape(-1,4); m=c[:,3]>128
            if m.mean()<0.5: continue
            px=c[m][:,:3]
            q=Counter(tuple((v//16)*16) for v in px).most_common(1)[0][0]
            sel=px[np.all((px//16)*16==q,axis=1)]
            o[j,i,:3]=sel.mean(0); o[j,i,3]=255
    return o
out={}
for idx,id_,name,cat,price,size,extra in ITEMS:
    w,d,h=size
    tw=round((w+1 if extra.get('wall') else w+d)*WS)
    o=pixelize(crop(idx),tw); Image.fromarray(o).save(f'out/{id_}.png')
    if 'off' in extra:
        Image.fromarray(pixelize(crop(extra['off']),tw)).save(f'out/{id_}-off.png')
    out[id_]=o.shape[:2]
print(out)

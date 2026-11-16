import numpy as np, pickle
from PIL import Image
from scipy import ndimage
from collections import Counter
cells,P=pickle.load(open('cells.pkl','rb'))
def shift(m,dy,dx):
    o=np.zeros_like(m); H,W=m.shape
    ys,xs=np.nonzero(m); ys=ys+dy; xs=xs+dx; ok=(ys>=0)&(ys<H)&(xs>=0)&(xs<W); o[ys[ok],xs[ok]]=1; return o
SPR={}
for (name,view),c in cells.items():
    T=cells[('hairpin',view)]['L']; dy,dx=c['off']
    Ts=shift(T,dy,dx) if T.shape==c['D'].shape else None
    if Ts is None:
        # 크기가 다르면 맞춰서 자름
        Ts=np.zeros_like(c['D']); h=min(T.shape[0],Ts.shape[0]); w=min(T.shape[1],Ts.shape[1]); Ts[:h,:w]=T[:h,:w]; Ts=shift(Ts,dy,dx)
    guide=(c['D']&ndimage.binary_dilation(Ts,iterations=6)&~ndimage.binary_dilation(c['C'],iterations=3))|c['L']
    acc=c['F']&~guide
    lab,n=ndimage.label(acc); sz=ndimage.sum(acc,lab,range(1,n+1))
    acc=np.isin(lab,[i+1 for i,s in enumerate(sz) if s>150])
    p=P[view]['p']; gl=P[view]['gl']+dx; gt=P[view]['gt']+dy
    img=c['img']
    J0,J1,I0,I1=-12,32,-12,40
    out=np.zeros((J1-J0,I1-I0,4),np.uint8)
    for j in range(J0,J1):
        for i in range(I0,I1):
            ya=int(round(gt+j*p)); yb=int(round(gt+(j+1)*p)); xa=int(round(gl+i*p)); xb=int(round(gl+(i+1)*p))
            if ya<0 or xa<0 or yb>acc.shape[0] or xb>acc.shape[1]: continue
            m=acc[ya:yb,xa:xb]
            if m.mean()<0.45: continue
            px=img[ya:yb,xa:xb][m][:,:3]
            q=Counter(tuple((v//12)*12+6) for v in px).most_common(1)[0][0]
            sel=px[np.all((px//12)*12+6==q,axis=1)]
            out[j-J0,i-I0,:3]=sel.mean(0); out[j-J0,i-I0,3]=255
    ys,xs=np.nonzero(out[:,:,3])
    oy,ox=ys.min(),xs.min()
    spr=out[oy:ys.max()+1,ox:xs.max()+1]
    SPR[(name,view)]=(spr,int(ox+I0),int(oy+J0))   # 머리 왼쪽 위 기준 위치
    Image.fromarray(spr).save(f'spr_{name}_{view}.png')
    print(name,view,spr.shape,'at',ox+I0,oy+J0)
pickle.dump(SPR,open('spr.pkl','wb'))

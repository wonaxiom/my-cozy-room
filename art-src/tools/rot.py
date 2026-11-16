import numpy as np
from PIL import Image
def load(p): return np.array(Image.open(p).convert('RGBA'))
lie=load('lie.png'); idle=load('../base/bm_00.png')
CHIN=23
head=idle.copy(); head[CHIN:]=0
def rot(arr,ang,S=4):
    """도트 그림 돌리기: 크게 키워서 돌린 뒤 칸 가운데 색으로 다시 줄임"""
    im=Image.fromarray(arr).resize((arr.shape[1]*S,arr.shape[0]*S),Image.NEAREST)
    r=im.rotate(ang,resample=Image.NEAREST,expand=True,center=(im.width/2,im.height/2))
    W,H=r.width//S,r.height//S
    r=np.array(r)
    out=r[S//2::S,S//2::S][:H,:W]
    return out
def place_score(rh,dx,dy):
    al=lie[:,:,3]>0; H,W=al.shape
    ys,xs=np.nonzero(rh[:,:,3]>0); Y=ys+dy; X=xs+dx
    ok=(Y>=0)&(Y<H)&(X>=0)&(X<W)
    inside=al[Y[ok],X[ok]].sum(); outside=len(Y)-inside
    return inside-3*outside
best=None
for ang in range(0,60,2):
    rh=rot(head,ang)
    for dx in range(-12,lie.shape[1]):
        for dy in range(-12,lie.shape[0]//2):
            s=place_score(rh,dx,dy)
            if best is None or s>best[0]: best=(s,ang,dx,dy)
print(best)

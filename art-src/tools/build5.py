import numpy as np, json, colorsys, sys
from PIL import Image
from collections import deque, Counter
exec(open('fit.py').read())
B='../base/'
def hsvp(p): return colorsys.rgb_to_hsv(*(np.array(p[:3])/255))
def strip_small(a,n=25):
    m=a[:,:,3]>0; H,W=m.shape; seen=np.zeros_like(m)
    for y in range(H):
        for x in range(W):
            if m[y,x] and not seen[y,x]:
                q=deque([(y,x)]); seen[y,x]=1; pts=[]
                while q:
                    cy,cx=q.popleft(); pts.append((cy,cx))
                    for dy in (-1,0,1):
                        for dx in (-1,0,1):
                            ny,nx=cy+dy,cx+dx
                            if 0<=ny<H and 0<=nx<W and m[ny,nx] and not seen[ny,nx]: seen[ny,nx]=1; q.append((ny,nx))
                if len(pts)<n:
                    for py,px in pts: a[py,px]=0
    return a
FR=['idle','blink','breathe','wave1','wave2']+[f'walk{i}' for i in range(1,9)]+['sitChair','sitFloor','water','switch','type','read','snack','back']
def head_offset(ref, refchin, a):
    """ref(서기)의 머리가 a에서 어디 있는지: 머리 부분 색 비교로 찾기"""
    t=ref[:refchin].astype(int); tm=t[:,:,3]>0
    best=None
    for dy in range(-2,a.shape[0]-refchin+1):
        for dx in range(-8,a.shape[1]-ref.shape[1]+9):
            s=0
            ys,xs=np.nonzero(tm); Y=ys+dy; X=xs+dx
            ok=(Y>=0)&(Y<a.shape[0])&(X>=0)&(X<a.shape[1])
            d=np.full(len(Y),300.0)
            d[ok]=np.abs(a[Y[ok],X[ok],:3].astype(int)-t[ys[ok],xs[ok],:3]).sum(1)+np.where(a[Y[ok],X[ok],3]>0,0,300)
            s=(d<60).sum()
            if best is None or s>best[0]: best=(s,dx,dy)
    return best[1],best[2]

from PIL import Image
import numpy as np
from collections import deque
IMG='/tmp/claude-0/-home-user-my-cozy-room/1861c5a4-a6fd-5d71-8605-4c1741f5e8c0/images/'
def load(i, flood=False):
    a=np.array(Image.open(IMG+f'{i}.webp').convert('RGBA')).astype(np.int32)
    if flood:
        # 테두리와 이어진 밝은 무채색(흰색·체크무늬)을 배경으로
        H,W=a.shape[:2]; rgb=a[:,:,:3]
        light=(rgb.min(axis=2)>200)&((rgb.max(axis=2)-rgb.min(axis=2))<18)
        bg=np.zeros((H,W),bool); q=deque()
        for x in range(W):
            for y in (0,H-1):
                if light[y,x] and not bg[y,x]: bg[y,x]=1; q.append((y,x))
        for y in range(H):
            for x in (0,W-1):
                if light[y,x] and not bg[y,x]: bg[y,x]=1; q.append((y,x))
        while q:
            y,x=q.popleft()
            for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
                ny,nx=y+dy,x+dx
                if 0<=ny<H and 0<=nx<W and light[ny,nx] and not bg[ny,nx]: bg[ny,nx]=1; q.append((ny,nx))
        a[:,:,3]=np.where(bg,0,255)
    return a
def comps(a,minn=1500):
    fg=a[:,:,3]>128; H,W=fg.shape; seen=np.zeros_like(fg); out=[]
    for y in range(0,H):
        for x in range(0,W):
            if fg[y,x] and not seen[y,x]:
                q=deque([(y,x)]); seen[y,x]=1; y0=y1=y; x0=x1=x; n=0
                while q:
                    cy,cx=q.popleft(); n+=1
                    y0=min(y0,cy); y1=max(y1,cy); x0=min(x0,cx); x1=max(x1,cx)
                    for dy in (-1,0,1):
                        for dx in (-1,0,1):
                            ny,nx=cy+dy,cx+dx
                            if 0<=ny<H and 0<=nx<W and fg[ny,nx] and not seen[ny,nx]: seen[ny,nx]=1; q.append((ny,nx))
                if n>=minn: out.append([y0,x0,y1,x1,n])
    out.sort(key=lambda c:(round(c[0]/240),c[1]))
    return out
for i,n,fl in [(62,"hair",True)]:
    a=load(i,fl); np.save(f'{n}.npy',a)
    cs=comps(a); np.save(f'{n}_comps.npy',np.array(cs))
    print(n,len(cs)); [print('  ',c) for c in cs]

import numpy as np, colorsys
from PIL import Image
def legrows(a):
    # 반바지(회색) 맨 아래 줄 다음부터, 발 바닥 3줄 전까지 = 다리 줄
    H=a.shape[0]; grey=[]
    for y in range(H):
        for x in range(a.shape[1]):
            if a[y,x,3]:
                h,s,v=colorsys.rgb_to_hsv(*(a[y,x,:3]/255))
                if s<0.14 and v>0.3: grey.append(y)
    return max(grey)+1, H-3
for pre in ('bf','bm'):
    idleH=np.array(Image.open(f'../base/{pre}_00.png')).shape[0]
    for idx in (24,25):
        a=np.array(Image.open(f'{pre}_{idx}.png'))
        need=a.shape[0]-idleH
        y0,y1=legrows(a)
        rows=list(range(a.shape[0]))
        # 위아래 줄과 같은(비슷한) 다리 줄부터 지움
        cand=sorted(range(y0,y1),key=lambda y:np.abs(a[y].astype(int)-a[y-1].astype(int)).sum())
        drop=set(cand[:max(0,need)])
        b=a[[y for y in rows if y not in drop]]
        Image.fromarray(b).save(f'{pre}_{idx}.png'); print(pre,idx,a.shape,'->',b.shape,'legs',y0,y1,'drop',sorted(drop))
row=[]
for pre in ('bf','bm'):
    for f in [f'../base/{pre}_00.png',f'{pre}_24.png',f'{pre}_25.png']: row.append(Image.open(f).convert('RGBA'))
Hh=max(i.height for i in row); Ww=sum(i.width+6 for i in row)
sh=Image.new('RGBA',(Ww,Hh),(239,230,214,255)); x=0
for im in row: sh.alpha_composite(im,(x,Hh-im.height)); x+=im.width+6
sh.resize((sh.width*6,sh.height*6),Image.NEAREST).save('cmp.png')

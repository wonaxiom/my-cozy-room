import numpy as np
from PIL import Image
a=np.array(Image.open('../../images/126.webp').convert('RGBA')).astype(float)
runs=[(101,454),(601,928),(1079,1433),(1576,1906)]
names=[('bf',26),('bf',27),('bm',26),('bm',27)]
def palette(pre):
    cs=[]
    for f in ('00','18'):  # 서기 + 책 읽기(책 갈색)
        b=np.array(Image.open(f'../base/{pre}_{f}.png').convert('RGBA')); cs.append(b[b[:,:,3]>0][:,:3])
    return np.unique(np.vstack(cs),axis=0).astype(float)
for (s,e),(pre,idx) in zip(runs,names):
    sub=a[:,s-12:e+12]; rgb=sub[:,:,:3]
    bg=((rgb.min(2)>235)&((rgb.max(2)-rgb.min(2))<14))|(sub[:,:,3]<128)
    ys=np.where((~bg).any(1))[0]; xs=np.where((~bg).any(0))[0]
    y0,y1,x0,x1=ys[0],ys[-1],xs[0],xs[-1]
    P=11.25; pal=palette(pre)
    def var(ox,oy):
        tot=0;n=0
        for gy in np.arange(y0+oy-P,y1+1,P):
            for gx in np.arange(x0+ox-P,x1+1,P):
                cell=sub[max(0,int(gy+2)):int(gy+P-2),max(0,int(gx+2)):int(gx+P-2)]
                if cell.size==0: continue
                tot+=cell[:,:,:3].std(axis=(0,1)).mean(); n+=1
        return tot/max(n,1)
    _,ox,oy=min((var(ox,oy),ox,oy) for ox in np.arange(0,P,P/6) for oy in np.arange(0,P,P/6))
    gys=np.arange(y0+oy-P,y1+1,P); gxs=np.arange(x0+ox-P,x1+1,P)
    o=np.zeros((len(gys),len(gxs),4),np.uint8)
    for j,gy in enumerate(gys):
        for k,gx in enumerate(gxs):
            ya,yb=max(0,int(round(gy+P*0.2))),int(round(gy+P*0.8)); xa,xb=max(0,int(round(gx+P*0.2))),int(round(gx+P*0.8))
            cell=sub[ya:yb,xa:xb]; m=~bg[ya:yb,xa:xb]
            if cell.size==0 or m.mean()<0.5: continue
            c=np.median(cell[:,:,:3][m],axis=0)
            d=((pal-c)**2).sum(1); i=d.argmin()
            mint=c[1]-c[0]>8 and c[2]-c[0]>4   # 물뿌리개(민트·하늘색)는 옷 회색으로 바꾸지 않음
            q=pal[i] if (d[i]<40**2 and not mint) else (c//6)*6   # 모형 색에 가까우면 그 색, 아니면 그대로
            o[j,k,:3]=q; o[j,k,3]=255
    ys=np.where(o[:,:,3].any(1))[0]; xs=np.where(o[:,:,3].any(0))[0]
    o=o[ys[0]:ys[-1]+1,xs[0]:xs[-1]+1]
    Image.fromarray(o).save(f'{pre}_{idx}.png'); print(pre,idx,o.shape)

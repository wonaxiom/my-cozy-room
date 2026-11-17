import numpy as np
from PIL import Image
a=np.array(Image.open('../../images/103.webp').convert('RGBA')).astype(float)
runs=[(69, 412), (505, 903), (1049, 1419), (1502, 1906)]
names=[('bf',24),('bf',25),('bm',24),('bm',25)]
P=322/27
def palette(pre):
    b=np.array(Image.open(f'../base/{pre}_00.png').convert('RGBA'))
    c=b[b[:,:,3]>0][:,:3]
    u=np.unique(c,axis=0).astype(float)
    return np.vstack([u,[[214,108,110],[150,60,70]]])  # 하품하는 입 색
for (s,e),(pre,idx) in zip(runs,names):
    sub=a[:,s-15:e+15]
    ys=np.where((sub[:,:,3]>128).any(1))[0]; xs=np.where((sub[:,:,3]>128).any(0))[0]
    y0,y1,x0,x1=ys[0],ys[-1],xs[0],xs[-1]
    pal=palette(pre)
    def var(ox,oy):
        tot=0;n=0
        for gy in np.arange(y0+oy-P,y1+1,P):
            for gx in np.arange(x0+ox-P,x1+1,P):
                cell=sub[max(0,int(gy+2)):int(gy+P-2),max(0,int(gx+2)):int(gx+P-2)]
                if cell.size==0 or cell[:,:,3].mean()<128: continue
                tot+=cell[:,:,:3].std(axis=(0,1)).mean(); n+=1
        return tot/max(n,1)
    best=min((var(ox,oy),ox,oy) for ox in np.arange(0,P,P/6) for oy in np.arange(0,P,P/6))
    _,ox,oy=best
    gys=np.arange(y0+oy-P,y1+1,P); gxs=np.arange(x0+ox-P,x1+1,P)
    o=np.zeros((len(gys),len(gxs),4),np.uint8)
    for j,gy in enumerate(gys):
        for k,gx in enumerate(gxs):
            cell=sub[max(0,int(round(gy+P*0.2))):int(round(gy+P*0.8)),max(0,int(round(gx+P*0.2))):int(round(gx+P*0.8))]
            if cell.size==0: continue
            px=cell.reshape(-1,4)
            if (px[:,3]>128).mean()<0.5: continue
            c=np.median(px[px[:,3]>128][:,:3],axis=0)
            q=pal[((pal-c)**2).sum(1).argmin()]
            o[j,k,:3]=q; o[j,k,3]=255
    ys=np.where(o[:,:,3].any(1))[0]; xs=np.where(o[:,:,3].any(0))[0]
    o=o[ys[0]:ys[-1]+1,xs[0]:xs[-1]+1]
    Image.fromarray(o).save(f'{pre}_{idx}.png'); print(pre,idx,o.shape)
# 비교 그림: 서기, 반쯤, 쭉
row=[]
for pre in ('bf','bm'):
    for f in [f'../base/{pre}_00.png',f'{pre}_24.png',f'{pre}_25.png']: row.append(Image.open(f).convert('RGBA'))
Hh=max(i.height for i in row); Ww=sum(i.width+6 for i in row)
sh=Image.new('RGBA',(Ww,Hh),(239,230,214,255)); x=0
for im in row: sh.alpha_composite(im,(x,Hh-im.height)); x+=im.width+6
sh.resize((sh.width*6,sh.height*6),Image.NEAREST).save('cmp.png')

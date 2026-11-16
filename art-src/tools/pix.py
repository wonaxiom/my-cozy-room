import numpy as np, sys
from PIL import Image
def kmeans(px,K,seed=1):
    rng=np.random.default_rng(seed); s=px[rng.choice(len(px),min(20000,len(px)),replace=False)]
    cent=s[rng.choice(len(s),K,replace=False)].astype(float)
    for _ in range(30):
        lab=((s[:,None,:]-cent[None])**2).sum(-1).argmin(1)
        for k in range(K):
            if (lab==k).any(): cent[k]=s[lab==k].mean(0)
    return cent
def run(name,P,K=32):
    a=np.load(f'{name}.npy').astype(float); cs=np.load(f'{name}_comps.npy')
    cent=kmeans(a[a[:,:,3]>200][:,:3],K)
    quant=lambda px: ((px[:,None,:]-cent[None])**2).sum(-1).argmin(1)
    def var(c,ox,oy,p):
        y0,x0,y1,x1,_=c; tot=0;n=0
        for gy in np.arange(y0-p+oy,y1+1,p):
            for gx in np.arange(x0-p+ox,x1+1,p):
                cell=a[max(0,int(gy+1)):int(gy+p-1),max(0,int(gx+1)):int(gx+p-1)]
                if cell.size==0 or cell[:,:,3].mean()<128: continue
                tot+=cell[:,:,:3].std(axis=(0,1)).mean(); n+=1
        return tot/max(n,1)
    out=[]
    for i,c in enumerate(cs):
        y0,x0,y1,x1,_=c
        best=min((var(c,ox,oy,p),ox,oy,p) for p in [P] for ox in np.arange(0,p,p/4) for oy in np.arange(0,p,p/4))
        _,ox,oy,p=best
        gys=np.arange(y0-p+oy,y1+1,p); gxs=np.arange(x0-p+ox,x1+1,p)
        o=np.zeros((len(gys),len(gxs),4),np.uint8)
        for j,gy in enumerate(gys):
            for k,gx in enumerate(gxs):
                cell=a[max(0,int(round(gy+p*0.15))):int(round(gy+p*0.85)),max(0,int(round(gx+p*0.15))):int(round(gx+p*0.85))]
                if cell.size==0: continue
                px=cell.reshape(-1,4)
                if (px[:,3]>128).mean()<0.5: continue
                px=px[px[:,3]>128][:,:3]
                lab=np.bincount(quant(px),minlength=K).argmax()
                o[j,k,:3]=cent[lab]; o[j,k,3]=255
        ys=np.where(o[:,:,3].any(1))[0]; xs=np.where(o[:,:,3].any(0))[0]
        o=o[ys[0]:ys[-1]+1,xs[0]:xs[-1]+1]
        Image.fromarray(o,'RGBA').save(f'{name}_{i:02d}.png'); out.append((i,round(p,2),o.shape[1],o.shape[0]))
    print(name,out)
    imgs=[Image.open(f'{name}_{i:02d}.png') for i,_,_,_ in out]
    cw=max(i.width for i in imgs)+4; ch=max(i.height for i in imgs)+4
    sh=Image.new('RGBA',(cw*4,ch*((len(imgs)+3)//4)),(239,230,214,255))
    for k,im in enumerate(imgs): sh.alpha_composite(im,((k%4)*cw+(cw-im.width)//2,(k//4)*ch+ch-im.height-2))
    sh.resize((sh.width*5,sh.height*5),Image.NEAREST).save(f'{name}_sheet.png')
run(sys.argv[1],float(sys.argv[2]))

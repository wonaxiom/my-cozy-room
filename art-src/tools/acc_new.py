# 새 머리 장식 시트(gpt-acc2)를 예전 시트(gpt-acc)의 머리핀 칸 윤곽선에 맞춰 위치를 찾고 도트로 줄임
import numpy as np, pickle, sys
from PIL import Image
from scipy import ndimage, signal
from collections import Counter
R='/home/user/my-cozy-room/art-src/acc/'
def sheet(path,ROWS,COLS,NAMES,dark_t,col_t,flood=False):
    a=np.array(Image.open(path).convert('RGBA')).astype(int)
    rgb=a[:,:,:3]; mx=rgb.max(2); mn=rgb.min(2)
    light=(mn>215)&((mx-mn)<20)
    if flood:
        # 테두리와 이어진 밝은 곳만 배경 (흰 털·토끼 귀처럼 외곽선 안의 흰색은 남김)
        lab,_=ndimage.label(light); edge=set(lab[0])|set(lab[-1])|set(lab[:,0])|set(lab[:,-1]); edge.discard(0)
        fg=~np.isin(lab,list(edge))
    else: fg=~light
    dark=fg&(mx<dark_t); colored=fg&(mx>=col_t)
    M=30; cells={}
    for ri,(y0,y1) in enumerate(ROWS):
        for ci,(x0,x1) in enumerate(COLS):
            name=NAMES[ri*2+ci//2]; view='back' if ci%2 else 'front'
            Y0,Y1,X0,X1=max(0,y0-M),y1+M,max(0,x0-M),x1+M
            D=dark[Y0:Y1,X0:X1]; F=fg[Y0:Y1,X0:X1]; C=colored[Y0:Y1,X0:X1]
            lab,n=ndimage.label(C); sz=ndimage.sum(C,lab,range(1,n+1))
            C=np.isin(lab,[i+1 for i,s in enumerate(sz) if s>200])
            L=D&~ndimage.binary_dilation(C,iterations=14)
            cells[(name,view)]=dict(D=D,F=F,C=C,L=L,img=a[Y0:Y1,X0:X1])
    return cells
OLD=sheet(R+'gpt-acc.webp',[(75,336),(412,665),(750,1016)],[(19,353),(370,712),(756,1045),(1127,1405)],
          ['cap','beanie','strawHat','headband','ribbon','hairpin'],150,175)
mode=sys.argv[1]
if mode=='old':
    cells=OLD
else:
    cells=sheet(R+'gpt-acc2.webp',[(28,340),(405,664),(700,1019)],[(13,337),(375,684),(752,1044),(1103,1391)],
          ['santaHat','pomBeanie','earmuffs','catEars','bunnyEars','bearEars'],70,70,True)
P={}; W=120
for view in ('front','back'):
    T=OLD[('hairpin',view)]['L'].astype(float)
    ys,xs=np.nonzero(T); P[view]=dict(gl=xs.min(),gt=ys.min(),p=(xs.max()-xs.min()+1)/27)
    for (name,v),c in cells.items():
        if v!=view: continue
        L=c['L'].astype(float)
        cor=signal.fftconvolve(L,T[::-1,::-1],mode='full')
        cy,cx=T.shape[0]-1,T.shape[1]-1
        win=cor[cy-W:cy+W+1,cx-W:cx+W+1]
        iy,ix=np.unravel_index(win.argmax(),win.shape)
        c['off']=(iy-W,ix-W); c['T']=T
def shift(m,dy,dx):
    o=np.zeros_like(m); H,Wd=m.shape
    ys,xs=np.nonzero(m); ys=ys+dy; xs=xs+dx; ok=(ys>=0)&(ys<H)&(xs>=0)&(xs<Wd); o[ys[ok],xs[ok]]=1; return o
SPR={}
for (name,view),c in cells.items():
    T=c['T']>0; dy,dx=c['off']
    Ts=np.zeros_like(c['D']); h=min(T.shape[0],Ts.shape[0]); w=min(T.shape[1],Ts.shape[1]); Ts[:h,:w]=T[:h,:w]; Ts=shift(Ts,dy,dx)
    guide=(c['D']&ndimage.binary_dilation(Ts,iterations=6)&~ndimage.binary_dilation(c['C'],iterations=3))|c['L']
    acc=c['F']&~guide
    lab,n=ndimage.label(acc); sz=ndimage.sum(acc,lab,range(1,n+1))
    acc=np.isin(lab,[i+1 for i,s in enumerate(sz) if s>150])
    p=P[view]['p']; gl=P[view]['gl']+dx; gt=P[view]['gt']+dy
    img=c['img']; J0,J1,I0,I1=-14,34,-14,42
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
    ys,xs=np.nonzero(out[:,:,3]); oy,ox=ys.min(),xs.min()
    spr=out[oy:ys.max()+1,ox:xs.max()+1]
    SPR[(name,view)]=(spr,int(ox+I0),int(oy+J0))
    Image.fromarray(spr).resize((spr.shape[1]*8,spr.shape[0]*8),Image.NEAREST).save(f'big_{name}_{view}.png')
    Image.fromarray(spr).save(f'spr_{name}_{view}.png')
    print(name,view,spr.shape,'at',ox+I0,oy+J0,'off',c['off'])
pickle.dump(SPR,open(f'spr_{mode}.pkl','wb'))

import numpy as np, json, pickle
from PIL import Image
from scipy import ndimage, signal
a=np.array(Image.open('../../images/69.webp').convert('RGBA')).astype(int)
rgb=a[:,:,:3]; mx=rgb.max(2); mn=rgb.min(2)
fg=~((mn>215)&((mx-mn)<20))
dark=fg&(mx<150); colored=fg&(mx>=175)
ROWS=[(75,336),(412,665),(750,1016)]; COLS=[(19,353),(370,712),(756,1045),(1127,1405)]
NAMES=['cap','beanie','strawHat','headband','ribbon','hairpin']
M=30
cells={}
for ri,(y0,y1) in enumerate(ROWS):
    for ci,(x0,x1) in enumerate(COLS):
        name=NAMES[ri*2+ci//2]; view='back' if ci%2 else 'front'
        Y0,Y1,X0,X1=max(0,y0-M),y1+M,max(0,x0-M),x1+M
        D=dark[Y0:Y1,X0:X1]; F=fg[Y0:Y1,X0:X1]; C=colored[Y0:Y1,X0:X1]
        lab,n=ndimage.label(C); sz=ndimage.sum(C,lab,range(1,n+1))
        C=np.isin(lab,[i+1 for i,s in enumerate(sz) if s>200])
        L=D&~ndimage.binary_dilation(C,iterations=14)
        cells[(name,view)]=dict(Y0=Y0,X0=X0,D=D,F=F,C=C,L=L,img=a[Y0:Y1,X0:X1])
# 기준: 머리핀 칸의 머리 윤곽선 (거의 완전한 원)
P={}
for view in ('front','back'):
    T=cells[('hairpin',view)]['L'].astype(float)
    ys,xs=np.nonzero(T); P[view]=dict(gl=xs.min(),gt=ys.min(),gr=xs.max(),gb=ys.max())
    p=(xs.max()-xs.min()+1)/27; P[view]['p']=p
    print(view,'template bbox',P[view],'pitch %.2f'%p)
    for (name,v),c in cells.items():
        if v!=view: continue
        if name=='hairpin': c['off']=(0,0); continue
        L=c['L'].astype(float)
        cor=signal.fftconvolve(L,T[::-1,::-1],mode='full')
        # 이동 범위 제한 ±60
        cy,cx=T.shape[0]-1,T.shape[1]-1
        win=cor[cy-60:cy+61,cx-60:cx+61]
        iy,ix=np.unravel_index(win.argmax(),win.shape)
        c['off']=(iy-60,ix-60)
        print(' ',name,view,'off',c['off'])
pickle.dump((cells,P),open('cells.pkl','wb'))

# 산타 옷: 빨간 옷·흰 털·검은 벨트·금색 버클과 둘레 외곽선을 칸마다 골라 머리 왼쪽 위 기준으로 저장
import numpy as np, pickle
from scipy import ndimage
from cells import cells
FR=['idle','blink','breathe','wave1','wave2']+[f'walk{i}' for i in range(1,9)]+['sitChair','sitFloor','water','switch','type','read','snack','back','chairSit','chairType','chairBack','stretch1','stretch2','waterStand','readStand']
def masks(rgb):
    r,g,b=rgb[...,0],rgb[...,1],rgb[...,2]; mx=rgb.max(2); mn=rgb.min(2)
    return {'red':(r>80)&(r>2*g)&(r>1.8*b),
            'white':(mn>175)&((mx-mn)<26),
            'black':(mx<70)&((mx-mn)<18),
            'gold':(r>150)&(g>110)&(b<90)&(r-b>90)}
OUT={}
for gender,path in (('female','santa_female.webp'),('male','santa_male.webp')):
    cs=cells('/home/user/my-cozy-room/art-src/outfit/'+path,masks)
    assert len(cs)==28,len(cs)
    res={}
    for k,c in enumerate(cs):
        f=FR[k]; o=c['o']; l,t=c['head']; al=o[...,3]>0; cov=c['cov']
        # 도트 색으로 나눔: 피부·회색 반바지가 아닌 칸은 옷 (빨강, 흰 털, 금색 버클). 진한 칸은 옷에 붙은 것만 (벨트·외곽선)
        rgb=o[...,:3].astype(float)/255; mx=rgb.max(2); mn=rgb.min(2); sat=np.where(mx>0,(mx-mn)/np.maximum(mx,1e-6),0)
        r,g,b=rgb[...,0],rgb[...,1],rgb[...,2]
        hue=np.where(mx==r,((g-b)/np.maximum(mx-mn,1e-6))%6,np.where(mx==g,(b-r)/np.maximum(mx-mn,1e-6)+2,(r-g)/np.maximum(mx-mn,1e-6)+4))/6
        dark=al&(mx<0.32)
        skin=al&~dark&((hue<0.12)|(hue>0.92))&(sat>=0.1)&(sat<0.5)&(mx>0.7)
        gray=al&~dark&(sat<0.16)&(mx<0.8)
        isred=al&(r>0.3)&(r>1.8*g)&(r>1.6*b)
        white=(sat<0.2)&(mx>=0.8)
        gold=(hue>=0.07)&(hue<=0.2)&(sat>0.4)&(mx>0.6)
        cloth=al&~dark&~skin&~gray&(isred|white|gold|((sat>0.45)&(r>1.5*g)))   # 빨강·흰 털·금색만 (갈색 책은 빼기)
        cloth[:t+21]=False
        if f in ('water','type','chairType','waterStand','switch','read','readStand','snack'): cloth[:,l+23:]=False   # 손에 든 물건 쪽은 빼기
        lab,n=ndimage.label(cloth)
        keep=[i for i in range(1,n+1) if (isred&(lab==i)).sum()>=3]
        cloth=np.isin(lab,keep)
        # 벨트처럼 옷 사이에 낀 진한 칸
        belt=dark&ndimage.binary_dilation(cloth,structure=[[0,1,0],[0,1,0],[0,1,0]])
        belt&=np.roll(cloth,1,0)|np.roll(cloth,-1,0)|np.roll(np.roll(cloth,1,0),0,1)
        suit=ndimage.binary_fill_holes(cloth|belt)&al
        suit[:t+21]=False
        v=o[...,:3].max(2); dark=al&(v<100)
        ol=dark&ndimage.binary_dilation(suit)&~suit; ol[:t+21]=False
        pts=[(y,x,'s') for y,x in zip(*np.nonzero(suit))]+[(y,x,'o') for y,x in zip(*np.nonzero(ol))]
        res[f]=dict(o=o,pts=pts,head=(l,t))
    OUT[gender]=res
    print(gender,{f:len(d['pts']) for f,d in res.items()})
pickle.dump(OUT,open('santa.pkl','wb'))

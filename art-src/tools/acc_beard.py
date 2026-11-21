# 산타 수염: 민머리 모형 위 흰 수염(과 그 외곽선)만 골라 도트로 줄이고 머리 왼쪽 위 기준 위치로 저장
import numpy as np, pickle
from PIL import Image
from scipy import ndimage
A=np.array(Image.open('/home/user/my-cozy-room/art-src/acc/gpt-beard.webp').convert('RGB')).astype(float)
mx=A.max(2); mn=A.min(2)
light=(mn>225)&((mx-mn)<14)
lab,_=ndimage.label(light); edge=set(lab[0])|set(lab[-1])|set(lab[:,0])|set(lab[:,-1]); edge.discard(0)
fg=~np.isin(lab,list(edge))
lab,n=ndimage.label(ndimage.binary_closing(fg,iterations=3))
objs=[(sl,i+1) for i,sl in enumerate(ndimage.find_objects(lab)) if (lab[sl]==i+1).sum()>20000]
objs.sort(key=lambda o:o[0][1].start)
SPR={}
for k,(sl,li) in enumerate(objs):
    view=['front','back'][k]
    y0,y1,x0,x1=sl[0].start-4,sl[0].stop+4,sl[1].start-4,sl[1].stop+4
    sub=A[y0:y1,x0:x1]; m=(lab[y0:y1,x0:x1]==li)
    # 머리 폭(27칸)으로 칸 크기, 머리 왼쪽·위를 칸 기준으로
    rows=np.nonzero(m.any(1))[0]; top=rows[0]
    xs=np.nonzero(m[top:top+int((rows[-1]-top)*0.45)].any(0))[0]; P=(xs.max()-xs.min()+1)/27; left=xs.min()
    s=sub/255; v=s.max(2); sat=np.where(v>0,(v-s.min(2))/np.maximum(v,1e-6),0)
    white=m&(v>0.78)&(sat<0.14)
    dark=m&(v<0.35)
    # 눈 흰자를 빼려고, 머리 위쪽 60%보다 아래에 있는 흰 덩어리만
    white[:top+int(P*16)]=False
    wl,wn=ndimage.label(white); sz=ndimage.sum(white,wl,range(1,wn+1))
    white=np.isin(wl,[i+1 for i,z in enumerate(sz) if z>P*P*2])
    near=ndimage.binary_dilation(white,iterations=int(P*1.2))
    outl=dark&near
    H=int((rows[-1]-top)/P)+2; W=int((m.shape[1]-left)/P)+2
    out=np.zeros((H,W,4),np.uint8)
    for j in range(H):
        for i in range(-3,W):
            ya,yb=int(top+j*P),int(top+(j+1)*P); xa,xb=int(left+i*P),int(left+(i+1)*P)
            if xa<0 or yb>m.shape[0] or xb>m.shape[1]: continue
            cw=white[ya:yb,xa:xb].mean(); co=outl[ya:yb,xa:xb].mean()
            if cw>=0.4: out[j,i if i>=0 else 0,:3]=np.median(sub[ya:yb,xa:xb][white[ya:yb,xa:xb]],axis=0); out[j,i,3]=255
            elif co>=0.3: out[j,i,:3]=(58,36,32); out[j,i,3]=255
    ys,xs2=np.nonzero(out[...,3])
    spr=out[ys.min():ys.max()+1,xs2.min():xs2.max()+1]
    SPR[('santaBeard',view)]=(spr,int(xs2.min()),int(ys.min()))
    print(view,'P %.2f'%P,spr.shape[:2],xs2.min(),ys.min())
pickle.dump(SPR,open('spr_beard.pkl','wb'))

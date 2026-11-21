# 얼굴 장식 시트(민머리 모형 위에 덧그림)를 도트로 줄이고, 장식 색만 골라 머리 왼쪽 위 기준 위치로 저장
import numpy as np, pickle, colorsys
from PIL import Image
from scipy import ndimage
A=np.array(Image.open('/home/user/my-cozy-room/art-src/acc/gpt-face.webp').convert('RGBA')).astype(float)
al=A[...,3]>128
lab,n=ndimage.label(ndimage.binary_closing(al,iterations=3))
objs=[(sl,i+1) for i,sl in enumerate(ndimage.find_objects(lab)) if (lab[sl]==i+1).sum()>20000]
objs.sort(key=lambda o:(o[0][0].start//300,o[0][1].start))
NAMES=['roundGlasses','bandage','mask']
def pix(sub,m,P):
    def var(ox,oy):
        t=0;c=0
        for gy in np.arange(oy,sub.shape[0]-P,P):
            for gx in np.arange(ox,sub.shape[1]-P,P):
                q=sub[int(gy+1):int(gy+P-1),int(gx+1):int(gx+P-1),:3]
                if q.size: t+=q.std(axis=(0,1)).mean(); c+=1
        return t/c
    _,ox,oy=min((var(ox,oy),ox,oy) for ox in np.arange(0,P,P/6) for oy in np.arange(0,P,P/6))
    gys=np.arange(oy,sub.shape[0]-P/2,P); gxs=np.arange(ox,sub.shape[1]-P/2,P)
    o=np.zeros((len(gys),len(gxs),4),np.uint8)
    for j,gy in enumerate(gys):
        for i,gx in enumerate(gxs):
            ya,yb=int(gy+P*0.25),int(gy+P*0.75)+1; xa,xb=int(gx+P*0.25),int(gx+P*0.75)+1
            mm=m[ya:yb,xa:xb]
            if mm.mean()<0.5: continue
            o[j,i,:3]=np.median(sub[ya:yb,xa:xb,:3][mm],axis=0); o[j,i,3]=255
    ys=np.where(o[:,:,3].any(1))[0]; xs=np.where(o[:,:,3].any(0))[0]
    return o[ys[0]:ys[-1]+1,xs[0]:xs[-1]+1], gys[ys[0]:], gxs[xs[0]:]
def kind(p):
    h,s,v=colorsys.rgb_to_hsv(*(p[:3]/255))
    return h,s,v
SPR={}; full={}
for k,(sl,li) in enumerate(objs):
    name=NAMES[k//2]; view='back' if k%2 else 'front'
    y0,y1,x0,x1=sl[0].start-4,sl[0].stop+4,sl[1].start-4,sl[1].stop+4
    sub=A[y0:y1,x0:x1]; m=al[y0:y1,x0:x1]&(lab[y0:y1,x0:x1]==li)
    xs=np.nonzero(m[:200].any(0))[0]; P=(xs.max()-xs.min()+1)/27
    o,gys,gxs=pix(sub,m,P); full[(name,view)]=o
    # 장식 색을 원본 해상도에서 고르고, 도트 칸마다 덮인 비율로 정함 (가는 안경테도 남게)
    rgb=sub[...,:3]/255; mxc=rgb.max(2); mnc=rgb.min(2); v=mxc; s_=np.where(mxc>0,(mxc-mnc)/np.maximum(mxc,1e-6),0)
    r_,g_,b_=rgb[...,0],rgb[...,1],rgb[...,2]; d=np.maximum(mxc-mnc,1e-6)
    h=np.where(mxc==r_,((g_-b_)/d)%6,np.where(mxc==g_,(b_-r_)/d+2,(r_-g_)/d+4))/6
    if name=='roundGlasses': im=(h>=0.09)&(h<=0.2)&(s_>0.3)&(v>0.45); thr=0.22
    elif name=='bandage': im=(h<0.12)&(s_>0.42)&(v>0.55); thr=0.2
    else: im=(s_<0.1)&(v>0.72); thr=0.5
    im&=m
    chin=24
    sel=np.zeros(o.shape[:2],bool); o=o.copy()
    for y in range(min(o.shape[0],chin+2,len(gys))):
        for x in range(min(o.shape[1],len(gxs))):
            ya,yb=int(gys[y]),int(gys[y]+P); xa,xb=int(gxs[x]),int(gxs[x]+P)
            c=im[ya:yb,xa:xb]
            if c.size and c.mean()>=thr:
                sel[y,x]=True; o[y,x,:3]=np.median(sub[ya:yb,xa:xb,:3][c],axis=0); o[y,x,3]=255
    ys,xs=np.nonzero(sel)
    print(name,view,o.shape[:2],'P %.2f'%P,'dots',len(ys))
    if not len(ys): continue
    spr=np.zeros((ys.max()-ys.min()+1,xs.max()-xs.min()+1,4),np.uint8)
    for y,x in zip(ys,xs): spr[y-ys.min(),x-xs.min()]=o[y,x]
    SPR[(name,view)]=(spr,int(xs.min()),int(ys.min()))
    Image.fromarray(o).resize((o.shape[1]*8,o.shape[0]*8),Image.NEAREST).save(f'face_{name}_{view}.png')
pickle.dump(SPR,open('spr_face.pkl','wb')); pickle.dump(full,open('face_full.pkl','wb'))

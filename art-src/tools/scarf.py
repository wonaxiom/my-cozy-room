# 목도리 시트(기본 모형 28칸에 목도리만 덧그림)에서 목도리만 골라 도트로 줄이고, 칸마다 민머리 왼쪽 위 기준 위치로 저장
import sys, pickle, numpy as np
from PIL import Image
from scipy import ndimage
FR=['idle','blink','breathe','wave1','wave2']+[f'walk{i}' for i in range(1,9)]+['sitChair','sitFloor','water','switch','type','read','snack','back','chairSit','chairType','chairBack','stretch1','stretch2','waterStand','readStand']
def run(path,P=4.5):
    a=np.array(Image.open(path).convert('RGBA')).astype(float); rgb=a[:,:,:3]
    bgm=((rgb.min(2)>232)&((rgb.max(2)-rgb.min(2))<16))|(a[:,:,3]<128)
    fg=ndimage.binary_closing(~bgm,iterations=3)
    lab,n=ndimage.label(fg)
    objs=[(sl,i+1) for i,sl in enumerate(ndimage.find_objects(lab)) if (lab[sl]==i+1).sum()>3000]
    cy=lambda o:(o[0][0].start+o[0][0].stop)/2
    objs.sort(key=cy); rows=[[objs[0]]]
    for o in objs[1:]:
        if cy(o)-cy(rows[-1][-1])<90: rows[-1].append(o)
        else: rows.append([o])
    objs=[o for r in rows for o in sorted(r,key=lambda o:o[0][1].start)]
    assert len(objs)==28,len(objs)
    r,g,b=rgb[...,0],rgb[...,1],rgb[...,2]; mx=rgb.max(2)
    neutral=(np.abs(r-g)<=13)&(np.abs(g-b)<=13)&(mx>=105)&(mx<=236)
    out={}
    for k,(sl,li) in enumerate(objs):
        y0,y1=sl[0].start-6,sl[0].stop+6; x0,x1=sl[1].start-6,sl[1].stop+6
        sub=a[y0:y1,x0:x1]; m=~bgm[y0:y1,x0:x1]&(lab[y0:y1,x0:x1]==li); nm=neutral[y0:y1,x0:x1]&m
        def var(ox,oy):
            t=0;c=0
            for gy in np.arange(oy,sub.shape[0]-P,P):
                for gx in np.arange(ox,sub.shape[1]-P,P):
                    q=sub[int(gy+1):int(gy+P-1),int(gx+1):int(gx+P-1),:3]
                    if q.size: t+=q.std(axis=(0,1)).mean(); c+=1
            return t/max(c,1)
        _,ox,oy=min((var(ox,oy),ox,oy) for ox in np.arange(0,P,P/5) for oy in np.arange(0,P,P/5))
        gys=np.arange(oy,sub.shape[0]-P/2,P); gxs=np.arange(ox,sub.shape[1]-P/2,P)
        o=np.zeros((len(gys),len(gxs),4),np.uint8); cov=np.zeros((len(gys),len(gxs)))
        for j,gy in enumerate(gys):
            for i,gx in enumerate(gxs):
                ya,yb=int(gy+P*0.2),int(gy+P*0.8)+1; xa,xb=int(gx+P*0.2),int(gx+P*0.8)+1
                mm=m[ya:yb,xa:xb]
                if mm.mean()<0.5: continue
                o[j,i,:3]=np.median(sub[ya:yb,xa:xb,:3][mm],axis=0); o[j,i,3]=255
                cov[j,i]=nm[ya:yb,xa:xb].mean()
        al=o[:,:,3]>0; top=int(np.nonzero(al.any(1))[0][0])
        left=int(np.nonzero(al[top:top+20].any(0))[0][0])
        isback=FR[k] in ('back','chairBack')
        sc=cov>=0.45
        # 목 둘레(턱 아래 몇 줄)에 닿은 덩어리만 목도리로 (노트북·물뿌리개 같은 회색 물건은 뺌)
        band=np.zeros_like(sc); band[top+21:top+28]=True
        lab2,n2=ndimage.label(sc,structure=np.ones((3,3)))
        keep=[i for i in range(1,n2+1) if (band&(lab2==i)).any()]
        sc=np.isin(lab2,keep)
        sc[top+36:]=False; sc[:,left+27:]=False
        if FR[k] in ('water','type','chairType','waterStand'): sc[top+30:]=False; sc[:,left+22:]=False   # 손에 든 물건 쪽은 빼기
        # 목도리 둘레의 진한 외곽선
        v=o[:,:,:3].max(2)
        dark=al&(v<95)
        ol=dark&ndimage.binary_dilation(sc)&~sc
        ol[:top+20]=False
        pts=[(y,x,'s') for y,x in zip(*np.nonzero(sc))]+[(y,x,'o') for y,x in zip(*np.nonzero(ol))]
        out[FR[k]]=dict(o=o,pts=pts,head=(left,top),sc=sc,ol=ol)
    return out
if __name__=='__main__':
    R={}
    pass
    R['male']=run('/home/user/my-cozy-room/art-src/outfit/scarf_male.webp')
    pickle.dump(R,open('scarf.pkl','wb'))
    for gname,fr in R.items():
        print(gname,[ (f,len(d['pts'])) for f,d in fr.items()])

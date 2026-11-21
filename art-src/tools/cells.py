# 시트를 칸으로 나눠 도트로 줄임 (칸 순서: 줄마다 왼쪽부터). 장식 색 덮임 비율(cov)도 함께
import numpy as np
from PIL import Image
from scipy import ndimage
def cells(path, maskfn, P=4.5):
    a=np.array(Image.open(path).convert('RGBA')).astype(float); rgb=a[:,:,:3]
    light=((rgb.min(2)>232)&((rgb.max(2)-rgb.min(2))<16))|(a[:,:,3]<128)
    # 바깥 테두리와 이어진 밝은 곳만 배경 (외곽선 안의 흰 털은 남김)
    ll,_=ndimage.label(light); edge=set(ll[0])|set(ll[-1])|set(ll[:,0])|set(ll[:,-1]); edge.discard(0)
    bgm=np.isin(ll,list(edge))
    fg=ndimage.binary_closing(~bgm,iterations=3)
    lab,n=ndimage.label(fg)
    objs=[(sl,i+1) for i,sl in enumerate(ndimage.find_objects(lab)) if (lab[sl]==i+1).sum()>3000]
    cy=lambda o:(o[0][0].start+o[0][0].stop)/2
    objs.sort(key=cy); rows=[[objs[0]]]
    for o in objs[1:]:
        if cy(o)-cy(rows[-1][-1])<90: rows[-1].append(o)
        else: rows.append([o])
    objs=[o for r in rows for o in sorted(r,key=lambda o:o[0][1].start)]
    MK=maskfn(rgb)
    out=[]
    for sl,li in objs:
        y0,y1,x0,x1=sl[0].start-6,sl[0].stop+6,sl[1].start-6,sl[1].stop+6
        sub=a[y0:y1,x0:x1]; m=~bgm[y0:y1,x0:x1]&(lab[y0:y1,x0:x1]==li)
        mk={k:v[y0:y1,x0:x1]&m for k,v in MK.items()}
        def var(ox,oy):
            t=0;c=0
            for gy in np.arange(oy,sub.shape[0]-P,P):
                for gx in np.arange(ox,sub.shape[1]-P,P):
                    q=sub[int(gy+1):int(gy+P-1),int(gx+1):int(gx+P-1),:3]
                    if q.size: t+=q.std(axis=(0,1)).mean(); c+=1
            return t/max(c,1)
        _,ox,oy=min((var(ox,oy),ox,oy) for ox in np.arange(0,P,P/5) for oy in np.arange(0,P,P/5))
        gys=np.arange(oy,sub.shape[0]-P/2,P); gxs=np.arange(ox,sub.shape[1]-P/2,P)
        o=np.zeros((len(gys),len(gxs),4),np.uint8); cov={k:np.zeros((len(gys),len(gxs))) for k in mk}
        for j,gy in enumerate(gys):
            for i,gx in enumerate(gxs):
                ya,yb=int(gy+P*0.2),int(gy+P*0.8)+1; xa,xb=int(gx+P*0.2),int(gx+P*0.8)+1
                mm=m[ya:yb,xa:xb]
                if mm.mean()<0.5: continue
                o[j,i,:3]=np.median(sub[ya:yb,xa:xb,:3][mm],axis=0); o[j,i,3]=255
                for k in mk: cov[k][j,i]=mk[k][ya:yb,xa:xb].mean()
        al=o[:,:,3]>0; top=int(np.nonzero(al.any(1))[0][0])
        left=int(np.nonzero(al[top:top+20].any(0))[0][0])
        out.append(dict(o=o,cov=cov,head=(left,top)))
    return out
def silhouette(c, H=34, W=34):
    """머리 왼쪽 위 기준 몸(턱 아래) 모양"""
    o=c['o']; l,t=c['head']; s=np.zeros((H,W),bool)
    al=o[:,:,3]>0
    for y in range(t+24,min(o.shape[0],t+24+H)):
        for x in range(max(0,l-4),min(o.shape[1],l-4+W)):
            s[y-t-24,x-l+4]=al[y,x]
    return s

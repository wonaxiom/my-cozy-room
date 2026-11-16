# 누운 그림(lie.png)에 머리 모양을 10도 돌려 붙이고 부위를 나눔
import numpy as np, pickle, colorsys
from PIL import Image
SL='/tmp/claude-0/-home-user-my-cozy-room/1861c5a4-a6fd-5d71-8605-4c1741f5e8c0/scratchpad/sleep/'
exec(open(SL+'rot.py').read().split('best=None')[0].replace("load('lie.png')","load(SL+'lie.png')").replace("load('../base/bm_00.png')","load(SL+'../base/bm_00.png')"))
HAIRS=pickle.load(open(SL+'hairs.pkl','rb'))
ANG=10; ANG2=15; PADL=14   # ANG: 머리 모양을 누운 머리에 맞추는 각도, ANG2: 몸 전체를 침대 기울기에 맞추는 각도
def lie_labels(a):
    H,W=a.shape[:2]; L=np.full((H,W),'',object)
    for y in range(H):
        for x in range(W):
            if not a[y,x,3]: continue
            h,s,v=colorsys.rgb_to_hsv(*(a[y,x,:3]/255))
            orange=(h<0.12 or h>0.9)
            if v<0.3: L[y,x]='keep'
            elif orange and s>=0.1 and v>=0.55: L[y,x]='leg' if (x+y>=63 and x>=26) else 'skin'
            elif s<0.14: L[y,x]='bottom' if x+y>=55 else 'top'
            else: L[y,x]='keep'
    return L
def hairlab(p): return 'keep' if colorsys.rgb_to_hsv(*(p[:3]/255))[2]<0.28 else 'hair'
def build_lie(pre, base, accs):
    """base: 기본형 서기 그림 (머리 맞춤 기준). 반환: {style:(C,G,headOrigin,headCenter)}, {acc: (sprite,x,y)}"""
    Lb=lie_labels(lie)
    hl=int(min(np.nonzero((base[:20,:,3]>0).any(0))[0]))
    out={}; accout={}
    for st in [k[1] for k in HAIRS if k[0]==pre]:
        hf,dx0,dy0,chin=HAIRS[(pre,st)]
        Hc,Wc=base.shape[0]+PADL*2,base.shape[1]+PADL*2
        lay={k:np.zeros((Hc,Wc,4),np.uint8) for k in ('back','head','front','org','ctr')}
        lay['head'][PADL:PADL+chin,PADL:PADL+base.shape[1]]=base[:chin]
        for y in range(hf.shape[0]):
            for x in range(hf.shape[1]):
                if hf[y,x,3]:
                    Y,X=y+dy0+PADL,x+dx0+PADL
                    if 0<=Y<Hc and 0<=X<Wc: lay['back' if y+dy0>=chin else 'front'][Y,X]=hf[y,x]
        lay['org'][PADL,PADL+hl]=255          # 머리 왼쪽 위 (장식 기준점)
        lay['ctr'][PADL+chin//2,PADL+hl+13]=255  # 머리 가운데 (베개에 놓는 점)
        R={k:rot(v,ANG) for k,v in lay.items()}
        if st==list(HAIRS)[0][1] or 'dxy' not in globals():
            best=None
            for ddx in range(-30,lie.shape[1]):
                for ddy in range(-30,lie.shape[0]//2):
                    s=place_score(R['head'],ddx,ddy)
                    if best is None or s>best[0]: best=(s,ddx,ddy)
            globals()['dxy']=best[1:]
        dx,dy=globals()['dxy']
        pad=16; H,W=lie.shape[:2]
        C=np.zeros((H+pad*2,W+pad*2,4),np.uint8); G=np.full(C.shape[:2],'',object)
        def put(img,ox,oy,lab):
            ys,xs=np.nonzero(img[:,:,3]>0)
            for y,x in zip(ys,xs):
                Y,X=y+oy+pad,x+ox+pad
                if 0<=Y<C.shape[0] and 0<=X<C.shape[1]:
                    C[Y,X]=img[y,x]; G[Y,X]=lab(y,x)
        put(R['back'],dx,dy,lambda y,x: hairlab(R['back'][y,x]))
        put(lie,0,0,lambda y,x: Lb[y,x])
        put(R['front'],dx,dy,lambda y,x: hairlab(R['front'][y,x]))
        def mark(k):
            ys,xs=np.nonzero(R[k][:,:,3]>0); return (int(xs.mean())+dx+pad,int(ys.mean())+dy+pad)
        # 몸 전체를 침대 기울기(가로 2 : 세로 1)에 맞게 더 돌림
        LABS=['','hair','keep','skin','leg','top','bottom','eye']
        def toimg(fn):
            im=np.zeros(C.shape,np.uint8)
            for y in range(C.shape[0]):
                for x in range(C.shape[1]):
                    v=fn(y,x)
                    if v: im[y,x]=(v,0,0,255)
            return im
        org0,ctr0=mark('org'),mark('ctr')
        Cr=rot(C,ANG2)
        Gi=rot(toimg(lambda y,x: LABS.index(G[y,x]) if C[y,x,3] and G[y,x] else 0),ANG2)
        Gr=np.full(Cr.shape[:2],'',object)
        for y in range(Cr.shape[0]):
            for x in range(Cr.shape[1]):
                if Cr[y,x,3]: Gr[y,x]=LABS[Gi[y,x,0]] if Gi[y,x,3] else 'keep'
        def mk(pt):
            im=np.zeros(C.shape,np.uint8); im[pt[1],pt[0]]=255; r=rot(im,ANG2); ys,xs=np.nonzero(r[:,:,3]>0)
            return (int(xs.mean()),int(ys.mean()))
        out[st]=(Cr,Gr,mk(org0),mk(ctr0))
        if not accout:
            o=mk(org0)
            for name,(spr,ax,ay) in accs.items():
                l=np.zeros((Hc,Wc,4),np.uint8)
                for y in range(spr.shape[0]):
                    for x in range(spr.shape[1]):
                        Y,X=PADL+ay+y,PADL+hl+ax+x
                        if spr[y,x,3] and 0<=Y<Hc and 0<=X<Wc: l[Y,X]=spr[y,x]
                r=rot(l,ANG)
                # 누운 그림 칸에 옮긴 뒤 몸과 같이 한 번 더 돌림
                big=np.zeros(C.shape,np.uint8); ys,xs=np.nonzero(r[:,:,3]>0)
                for y,x in zip(ys,xs):
                    Y,X=y+dy+pad,x+dx+pad
                    if 0<=Y<big.shape[0] and 0<=X<big.shape[1]: big[Y,X]=r[y,x]
                r=rot(big,ANG2); ys,xs=np.nonzero(r[:,:,3]>0)
                if not len(ys): continue
                y0,x0=ys.min(),xs.min()
                accout[name]=(r[y0:ys.max()+1,x0:xs.max()+1],int(x0-o[0]),int(y0-o[1]))
    return out,accout

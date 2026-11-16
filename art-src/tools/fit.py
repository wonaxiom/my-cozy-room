import numpy as np, colorsys
from PIL import Image
B='../base/'
cs=np.load('hair_comps.npy'); P=6.8
CROWN=[34,275,511,755,1009]
NAMES=['short','buzz','bangs','spiky','bob','long','ponytail','pigtails','bun','curly']
def load(p): return np.array(Image.open(p).convert('RGBA'))
def headinfo(a):
    H,W=a.shape[:2]; al=a[:,:,3]>0
    # 머리 = 위에서부터 회색 셔츠가 나오기 전까지
    def gray(p): r,g,b=[int(v) for v in p[:3]]; return max(r,g,b)-min(r,g,b)<25 and 90<r<200
    chin=next(y for y in range(21,H) if sum(gray(a[y,x]) for x in range(W) if al[y,x])>=6)
    eye=np.zeros((H,W),bool)
    for y in range(chin):
        for x in range(W):
            if al[y,x]:
                h,s,v=colorsys.rgb_to_hsv(*(a[y,x,:3]/255))
                if 0.55<h<0.8 and s>0.12 and v<0.75: eye[y,x]=1
    top=next(y for y in range(H) if al[y].any())
    return dict(chin=chin,eye=eye,top=top,al=al)
def comp(frame, hair, dx, dy, front=True, chinY=None):
    """hair를 frame 위에 얹음. front=False면 전부 앞에. 턱 아래 머리카락은 몸 뒤."""
    H,W=frame.shape[:2]; pad=12
    out=np.zeros((H+pad*2,W+pad*2,4),np.uint8)
    hh,hw=hair.shape[:2]
    back=np.zeros_like(out); fr=np.zeros_like(out)
    for y in range(hh):
        for x in range(hw):
            if hair[y,x,3]:
                Y=y+dy+pad; X=x+dx+pad
                if 0<=Y<out.shape[0] and 0<=X<out.shape[1]:
                    tgt = back if (front and chinY is not None and y+dy>=chinY) else fr
                    tgt[Y,X]=hair[y,x]
    for layer in (back,):
        m=layer[:,:,3]>0; out[m]=layer[m]
    m=frame[:,:,3]>0; out[pad:pad+H,pad:pad+W][m]=frame[m]
    m=fr[:,:,3]>0; out[m]=fr[m]
    return out
def fit(frame, hair, info, yoff):
    al=info['al']; eye=info['eye']; chin=info['chin']; H,W=al.shape
    hal=hair[:,:,3]>0; hh,hw=hal.shape
    head=np.zeros_like(al); head[:chin]=al[:chin]
    eyetop=min(np.nonzero(eye)[0]) if eye.any() else chin//2
    best=None
    for dx in range(-12,W):
        dy=info['top']+yoff
        cov=0; bad=0; outside=0
        ys,xs=np.nonzero(hal)
        Y=ys+dy; X=xs+dx
        ok=(Y>=0)&(Y<H)&(X>=0)&(X<W)
        inh=np.zeros(len(Y),bool); inh[ok]=head[Y[ok],X[ok]]
        ineye=np.zeros(len(Y),bool); ineye[ok]=eye[Y[ok],X[ok]]
        # 이마 위쪽 머리 덮기
        top_head=head.copy(); top_head[eyetop-2:]=0
        covered=np.zeros_like(al); covered[Y[ok],X[ok]]=1
        sc=(covered&top_head).sum()-6*ineye.sum()-0.3*(~inh).sum()
        if best is None or sc>best[0]: best=(sc,dx,dy)
    return best

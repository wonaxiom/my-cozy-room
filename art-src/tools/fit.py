import numpy as np, colorsys
from PIL import Image
B='../base/'
cs=np.load('hair_comps.npy'); P=7.3
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
        sc=(covered&top_head).sum()-6*ineye.sum()-1.0*(~inh).sum()
        if best is None or sc>best[0]: best=(sc,dx,dy)
    return best

def fit3(frame,hair,info,yoff):
    best=None
    for yo in (yoff-1,yoff,yoff+1):
        b=fit(frame,hair,info,yo)
        if best is None or b[0]>best[0]: best=b
    return best
def trim_face_side(hair,dx,dy,info,up=0):
    """얼굴 쪽(오른쪽) 머리 밖으로 떠 있는 옆머리 자르기 (눈높이 아래만)"""
    al=info['al']; H,W=al.shape; h=hair.copy()
    eyetop=min(np.nonzero(info['eye'])[0]) if info['eye'].any() else 14
    for y in range(h.shape[0]):
        Y=y+dy
        if Y<eyetop-up or Y>=H: continue
        xs=np.nonzero(al[Y])[0]
        if not len(xs): continue
        edge=xs.max()
        for x in range(h.shape[1]):
            if h[y,x,3] and x+dx>edge+2: h[y,x]=0
    # 잘라내고 남은 작은 조각 지우기
    m=h[:,:,3]>0; seen=np.zeros_like(m)
    for y in range(m.shape[0]):
        for x in range(m.shape[1]):
            if m[y,x] and not seen[y,x]:
                q=[(y,x)]; seen[y,x]=1; pts=[]
                while q:
                    cy,cx=q.pop(); pts.append((cy,cx))
                    for ddy in (-1,0,1):
                        for ddx in (-1,0,1):
                            ny,nx=cy+ddy,cx+ddx
                            if 0<=ny<m.shape[0] and 0<=nx<m.shape[1] and m[ny,nx] and not seen[ny,nx]: seen[ny,nx]=1; q.append((ny,nx))
                if len(pts)<6:
                    for py,px in pts: h[py,px]=0
    return h

# 새 장식(머리 6종, 얼굴 3종, 목도리)을 acc-art.js에 더함. 예전 장식은 그대로 둠
import json, re, pickle, numpy as np, sys
sys.path.insert(0,'.')
from acc_lie import lie_sprite
OUT='/home/user/my-cozy-room/acc-art.js'
src=open(OUT).read(); data=json.loads(re.search(r'const ACC_ART = (\{.*\});',src,re.S).group(1))
pal=data['palette']; rev={v:k for k,v in pal.items()}
used=set(pal); nxt=[0x250]
def ch_of(h):
    if h in rev: return rev[h]
    while chr(nxt[0]) in used or chr(nxt[0]).isdigit(): nxt[0]+=1
    c=chr(nxt[0]); nxt[0]+=1; used.add(c); rev[h]=c; pal[c]=h; return c
def rle(row):
    o='';i=0
    while i<len(row):
        j=i
        while j<len(row) and row[j]==row[i]: j+=1
        n=j-i; o+=(str(n) if n>1 else '')+row[i]; i=j
    return o
def kmeans(px,k):
    px=px.astype(float); u=np.unique(px,axis=0)
    if len(u)<=k: return u
    rng=np.random.default_rng(1); c=u[rng.choice(len(u),k,replace=False)]
    for _ in range(30):
        l=((px[:,None]-c[None])**2).sum(-1).argmin(1)
        for i in range(k):
            if (l==i).any(): c[i]=px[l==i].mean(0)
    return c
def encode(sprs, k=10):
    allpx=np.concatenate([s[s[...,3]>0][:,:3] for s in sprs])
    cent=kmeans(allpx,k)
    def enc(s):
        rows=[]
        for y in range(s.shape[0]):
            line=''
            for x in range(s.shape[1]):
                p=s[y,x]
                if not p[3]: line+='.'; continue
                c=cent[((cent-p[:3])**2).sum(1).argmin()]
                line+=ch_of('#%02x%02x%02x'%tuple(int(round(v)) for v in c))
            rows.append(rle(line))
        return rows
    return enc
HEAD=pickle.load(open('spr_new2.pkl','rb')); FACE=pickle.load(open('spr_face2.pkl','rb'))
HATS={'santaHat','pomBeanie'}
for src_ in (HEAD,FACE):
    names=sorted({n for n,_ in src_})
    for n in names:
        views={v:src_[(n,v)] for v in ('front','back') if (n,v) in src_}
        if n not in HATS:
            s,x,y=views['front']; views['lie']=lie_sprite(s,x,y)
        enc=encode([s for s,_,_ in views.values()], 6 if n in ('roundGlasses','bandage') else 10)
        data['items'][n]={v:{'x':x,'y':y,'rows':enc(s)} for v,(s,x,y) in views.items()}
        print(n,list(data['items'][n]))
# 목도리: 남자 그림에서 고른 목도리를 남녀 모두에 씀 (머리 왼쪽 위 기준이라 맞음)
S=pickle.load(open('scarf.pkl','rb'))['male']
OUTL='#3a2420'
gray=np.concatenate([np.array([d['o'][y,x,:3] for y,x,t in d['pts'] if t=='s']) for d in S.values()])
lv=np.sort(gray.mean(1)); shades=[lv[int(len(lv)*q)] for q in (0.12,0.4,0.68,0.92)]
SH=['#%02x%02x%02x'%(int(v),int(v),int(v)) for v in shades]
frames={}
for f,d in S.items():
    left,top=d['head']; pts=d['pts']
    ys=[p[0] for p in pts]; xs=[p[1] for p in pts]
    y0,x0=min(ys),min(xs); H=max(ys)-y0+1; W=max(xs)-x0+1
    g=[['.']*W for _ in range(H)]
    for y,x,t in pts:
        if t=='o': g[y-y0][x-x0]=ch_of(OUTL)
        else:
            v=d['o'][y,x,:3].mean(); i=int(np.argmin([abs(v-s) for s in shades]))
            g[y-y0][x-x0]=ch_of(SH[i])
    frames[f]={'x':int(x0-left),'y':int(y0-top),'rows':[rle(''.join(r)) for r in g]}
frames['work']=frames['type']
data['neck']={'scarf':{'base':SH[2],'outline':ch_of(OUTL),'frames':frames}}
js=src[:src.index('const ACC_ART')]
js=js.replace("// items.<장식>.front","// neck.scarf.frames[동작]: 목도리 (GPT 그림, 남자 그림에서 골라 남녀 모두에 씀). base 색을 기준으로 고른 색으로 바꿔 칠하고, outline 글자는 그대로\n// items.<장식>.front") if 'neck.scarf' not in js else js
js+='const ACC_ART = '+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n'
open(OUT,'w').write(js); print('saved',len(js),'palette',len(pal),'shades',SH)

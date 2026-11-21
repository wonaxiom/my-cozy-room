# 크리스마스 세트(산타 수염, 크리스마스 목도리, 산타 옷)를 acc-art.js에 더함. 색은 그림 그대로 (바꿔 칠하지 않음)
import json, re, pickle, numpy as np, sys
sys.path.insert(0,'.')
from acc_lie import lie_sprite
OUT='/home/user/my-cozy-room/acc-art.js'
src=open(OUT).read(); data=json.loads(re.search(r'const ACC_ART = (\{.*\});',src,re.S).group(1))
pal=data['palette']; rev={v:k for k,v in pal.items()}; used=set(pal); nxt=[0x250]
def ch_of(h):
    if h in rev: return rev[h]
    while chr(nxt[0]) in used or chr(nxt[0]).isdigit(): nxt[0]+=1
    c=chr(nxt[0]); nxt[0]+=1; used.add(c); rev[h]=c; pal[c]=h; return c
def rle(row):
    o='';i=0
    while i<len(row):
        j=i
        while j<len(row) and row[j]==row[i]: j+=1
        o+=(str(j-i) if j-i>1 else '')+row[i]; i=j
    return o
def kmeans(px,k):
    px=px.astype(float); u=np.unique(px,axis=0)
    if len(u)<=k: return u
    c=u[np.random.default_rng(1).choice(len(u),k,replace=False)]
    for _ in range(30):
        l=((px[:,None]-c[None])**2).sum(-1).argmin(1)
        for i in range(k):
            if (l==i).any(): c[i]=px[l==i].mean(0)
    return c
hexc=lambda c:'#%02x%02x%02x'%tuple(int(round(v)) for v in c)
OUTL='#3a2420'
def frames_of(D,k):
    cols=np.array([D[f]['o'][y,x,:3] for f in D for y,x,t in D[f]['pts'] if t=='s'])
    cent=kmeans(cols,k)
    fr={}
    for f,d in D.items():
        l,t=d['head']; pts=d['pts']
        ys=[p[0] for p in pts]; xs=[p[1] for p in pts]; y0,x0=min(ys),min(xs)
        g=[['.']*(max(xs)-x0+1) for _ in range(max(ys)-y0+1)]
        for y,x,tp in pts:
            if tp=='o': g[y-y0][x-x0]=ch_of(OUTL)
            else:
                p=d['o'][y,x,:3].astype(float); g[y-y0][x-x0]=ch_of(hexc(cent[((cent-p)**2).sum(1).argmin()]))
        fr[f]={'x':int(x0-l),'y':int(y0-t),'rows':[rle(''.join(r)) for r in g]}
    fr['work']=fr['type']
    return fr
# 산타 수염
B=pickle.load(open('spr_beard.pkl','rb'))
views={v:B[('santaBeard',v)] for v in ('front','back')}
s,x,y=views['front']; views['lie']=lie_sprite(s,x,y)
cent=kmeans(np.concatenate([s_[s_[...,3]>0][:,:3] for s_,_,_ in views.values()]),6)
def enc(s_):
    return [rle(''.join('.' if not s_[j,i,3] else ch_of(hexc(cent[((cent-s_[j,i,:3].astype(float))**2).sum(1).argmin()]))
        for i in range(s_.shape[1]))) for j in range(s_.shape[0])]
data['items']['santaBeard']={v:{'x':x_,'y':y_,'rows':enc(s_)} for v,(s_,x_,y_) in views.items()}
# 크리스마스 목도리 (남자 그림을 남녀 모두에)
X=pickle.load(open('xscarf.pkl','rb'))['male']
data['neck']['xmasScarf']={'fixed':True,'outline':ch_of(OUTL),'frames':frames_of(X,8)}
# 산타 옷 (성별마다)
S=pickle.load(open('santa.pkl','rb'))
data['suits']={'santa':{g:frames_of(S[g],12) for g in ('female','male')}}
js=src[:src.index('const ACC_ART')]
if 'suits.santa' not in js:
    js=js.replace("// items.<장식>.front","// neck.<이름>.fixed: 색을 바꾸지 않는 목도리 / suits.santa[성별][동작]: 산타 옷 (몸 위에 덮어 그림)\n// items.<장식>.front")
js+='const ACC_ART = '+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n'
open(OUT,'w').write(js); print('saved',len(js),'palette',len(pal))

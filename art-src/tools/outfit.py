# 옷 층 만들기: GPT가 기본 모형에 입혀 준 옷 그림(칸마다)을 기본 모형 머리에 맞춰 붙이고,
# 턱 아래 몸통을 그 그림으로 바꾸는 "옷 층"을 outfit-art.js로 저장합니다.
# 사용: python3 outfit.py <옷 이름> <여자 칸 폴더/접두사> <남자 칸 폴더/접두사>
import sys
exec(open('make.py').read())
name, fpre, mpre = sys.argv[1], sys.argv[2], sys.argv[3]
OUT='/home/user/my-cozy-room/outfit-art.js'
import os, re
data={'palette':{},'base':{},'outfits':{}}
if os.path.exists(OUT):
    src=open(OUT).read(); m=re.search(r'const OUTFIT_ART = (\{.*\});',src,re.S)
    if m: data=json.loads(m.group(1))
pal=data['palette']; rev={tuple(v):k for k,v in pal.items()}
nextc=[0x3000+len(pal)]
def ch_of(color,part):
    key=(color,part)
    if key not in rev:
        c=chr(nextc[0]); nextc[0]+=1; rev[key]=c; pal[c]=[color,part]
    return rev[key]
def hx(p): return '#%02x%02x%02x'%tuple(int(v) for v in p[:3])
SIT={'sitChair','sitFloor','water','type','read','snack'}
data['outfits'][name]={}
gray_cnt=Counter(); white_cnt=Counter()
for gender,pre,gp in (('female','bf',fpre),('male','bm',mpre)):
    frames=[strip_small(load(B+f'{pre}_{i:02d}.png')) for i in range(28)]
    idle=frames[0]; ii=headinfo(idle); back=frames[20]; bi=headinfo(back)
    hli=int(min(np.nonzero((idle[:20,:,3]>0).any(0))[0])); hlb=int(min(np.nonzero((back[:20,:,3]>0).any(0))[0]))
    offs=[(0,0) if k==20 else head_offset(back,bi['chin'],a) if k==23 else head_offset(idle,ii['chin'],a) for k,a in enumerate(frames)]
    out={}
    for k,a in enumerate(frames):
        f=FR[k]; ox,oy=offs[k]; isback=k in (20,23)
        chin=ii['chin']+oy
        hx0,hy0=(hlb+ox,oy) if isback else (hli+ox,oy)   # 기본 모형 칸 안에서 민머리 왼쪽 위
        g=strip_small(load(f'../jacket/{gp}_{k:02d}.png'))
        # GPT 칸에서 기본 모형 머리(턱 위)가 있는 곳 찾기 → 두 그림을 겹치는 위치
        dx,dy=head_offset(a,chin,g)
        L=label_base(a,f,ii['chin'],oy,None,ox)   # 기본 모형 부위 (하의 자리 판단용)
        H,W=a.shape[:2]
        bottoms=[(y,x) for y in range(H) for x in range(W) if L[y,x]=='bottom']
        waist=min(y for y,x in bottoms) if bottoms else H
        cells={}
        # 옷 층: GPT 칸의 턱 아래 픽셀 (기본 모형 좌표로)
        for gy in range(g.shape[0]):
            for gx in range(g.shape[1]):
                if not g[gy,gx,3]: continue
                bx,by=gx-dx,gy-dy
                if by<chin: continue
                p=g[gy,gx]; h,s,v=hsvp(p); orange=(h<0.12 or h>0.9)
                if v<0.3: part='keep'
                elif orange and s>=0.12 and v>=0.55: part='skin'
                elif s<0.12 and v>0.86: part='top'; white_cnt[hx(p)]+=1
                elif s<0.16:
                    inb=0<=by<H and 0<=bx<W and L[by,bx]=='bottom' and by>=waist+2
                    part='bottom' if inb else 'outer'
                    if part=='outer': gray_cnt[hx(p)]+=1
                else: part='keep'   # 물뿌리개·책·노트북 같은 물건
                cells[(bx,by)]=(hx(p),part)
        # 다리: 하의 아래에서 발끝까지 이어진 피부 (서 있는 그림), 의자 그림은 하의 아래 피부 전부
        if not f.startswith('chair') and f not in SIT:
            ys=[y for (x,y),(c,pt) in cells.items() if pt=='bottom']
            if ys:
                top=min(ys); maxy=max(y for (x,y) in cells)
                seen=set()
                for (x0,y0),(c,pt) in list(cells.items()):
                    if pt!='skin' or y0<top or (x0,y0) in seen: continue
                    q=[(x0,y0)]; seen.add((x0,y0)); comp=[]
                    while q:
                        cx,cy=q.pop(); comp.append((cx,cy))
                        for ddx,ddy in ((1,0),(-1,0),(0,1),(0,-1)):
                            n=(cx+ddx,cy+ddy)
                            if n not in seen and n in cells and cells[n][1]=='skin' and n[1]>=top: seen.add(n); q.append(n)
                    if max(p[1] for p in comp)>=maxy-3:
                        for pt_ in comp: cells[pt_]=(cells[pt_][0],'leg')
        elif f.startswith('chair'):
            ys=[y for (x,y),(c,pt) in cells.items() if pt=='bottom']
            if ys:
                yb=max(ys)
                for (x,y),(c,pt) in list(cells.items()):
                    if pt=='skin' and y>yb: cells[(x,y)]=(c,'leg')
        # 지울 칸: 기본 모형 몸통(턱 아래)인데 옷 층이 덮지 않는 곳
        clear=[(x,y) for y in range(chin,H) for x in range(W) if a[y,x,3] and (x,y) not in cells]
        pts=list(cells)+clear
        x0=min(p[0] for p in pts); y0=min(p[1] for p in pts); x1=max(p[0] for p in pts); y1=max(p[1] for p in pts)
        rows=[]
        for y in range(y0,y1+1):
            line=''
            for x in range(x0,x1+1):
                if (x,y) in cells: line+=ch_of(*cells[(x,y)])
                elif (x,y) in set(clear): line+='_'
                else: line+='.'
            rows.append(line)
        out[f]={'x':x0-hx0,'y':y0-hy0,'rows':rows}   # 민머리 왼쪽 위 기준
    out['work']=out['type']
    data['outfits'][name][gender]=out
    print(gender,'frames',len(out))
data['base'][name]={'outer':gray_cnt.most_common(1)[0][0],'top':white_cnt.most_common(1)[0][0]}
js='''// =============================================================
// outfit-art.js — GPT가 그린 옷 그림 (옷 층). 정리 스크립트로 만든 파일이라 직접 고치지 않습니다.
// 옷을 입으면 그 동작 그림의 턱 아래 몸통을 이 층으로 바꿉니다.
// outfits[옷][성별][동작] = { x, y: 민머리 왼쪽 위 기준 위치, rows: 글자 줄 ('.' 그대로, '_' 지움, 그 밖은 palette) }
// palette: 글자 → [원래 색, 부위]. 부위 outer(겉옷)·top(안의 상의)·bottom·skin·leg는 고른 색으로 바꿔 칠합니다.
// base[옷]: 바꿔 칠할 때 기준이 되는 원래 색
// =============================================================
'''
js+='const OUTFIT_ART = '+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n'
open(OUT,'w').write(js); print('saved',len(js),'palette',len(pal), data['base'][name])

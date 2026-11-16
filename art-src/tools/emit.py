exec(open('make.py').read())
def hx(p): return '#%02x%02x%02x'%tuple(int(v) for v in p[:3])
pal={}; chars=[chr(c) for c in range(ord('!'),ord('~')+1) if chr(c) not in '."\\`0123456789']+[chr(c) for c in range(0xC0,0x24F)]
def enc(C,G):
    rows=[]
    for y in range(C.shape[0]):
        line=''
        for x in range(C.shape[1]):
            if not C[y,x,3] or not G[y,x]: line+='.'; continue
            key=(hx(C[y,x]),G[y,x])
            if key not in pal: pal[key]=chars[len(pal)]
            line+=pal[key]
        rows.append(line.rstrip('.') or '.')
    t=0
    while rows and rows[0]=='.': rows.pop(0); t+=1
    return [r.ljust(CW,'.') for r in rows],t
def rle(row):
    o='';i=0
    while i<len(row):
        j=i
        while j<len(row) and row[j]==row[i]: j+=1
        n=j-i; o+=(str(n) if n>1 else '')+row[i]; i=j
    return o
out={}
for g,pre in (('male','bm'),('female','bf')):
    R=build(pre)
    C,G,_=R['short']['idle']; cnt={}
    for y in range(C.shape[0]):
        for x in range(C.shape[1]):
            if C[y,x,3] and G[y,x]: cnt.setdefault(G[y,x],Counter())[hx(C[y,x])]+=1
    base={k:cnt[k].most_common(1)[0][0] for k in ('hair','skin','top','bottom')}
    base['leg']=base['skin']
    styles={}; eyes={}
    for st,frs in R.items():
        seen={}; o={}; eyes[st]={}
        for f,(C,G,EB) in frs.items():
            rows,t=enc(C,G); key='/'.join(rows)
            if EB: eyes[st][f]=[[b[0],b[1]-t,b[2],b[3]-t] for b in EB]
            if key in seen: o[f]='='+seen[key]
            else: seen[key]=f; o[f]=[rle(r) for r in rows]
        styles[st]=o
    out[g]={'base':base,'styles':styles,'eyes':eyes}; print(g,base,len(pal))
data={'palette':{v:[k[0],k[1]] for k,v in pal.items()},'genders':out}
js='''// =============================================================
// hero-art.js — ver.세밀 캐릭터 그림 (기본 인간 모형 + 머리 모양 파츠를 합쳐 만든 도트 그림)
// 원본: art-src/base (기본형), art-src/hair (머리 모양). 그림 정리 스크립트로 만든 파일이라 직접 고치지 않습니다.
// 글자 하나가 화면 픽셀 1개입니다. 옆을 보는 그림은 오른쪽을 보고, 왼쪽은 뒤집어 씁니다.
// palette: 글자 → [원래 색, 부위]. 부위(hair·skin·leg·top·bottom)는 고른 색으로 바꿔 칠합니다.
// eyes: 머리 모양·동작별 눈 위치 [x1, y1, x2, y2] (안경과 눈 모양을 그릴 자리)
// leg: 하의 아래로 보이는 다리 (긴 바지를 고르면 바지 색으로 칠함)
// 그림은 모두 가로 폭이 같고, 머리 가운데와 발 바닥이 맞춰져 있습니다.
// =============================================================
'''
js+='const HERO_ART = '+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n'
open('/home/user/my-cozy-room/hero-art.js','w').write(js); print(len(js))

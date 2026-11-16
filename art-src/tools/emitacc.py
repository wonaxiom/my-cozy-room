import pickle, json
SPR=pickle.load(open('spr.pkl','rb'))
pal={}; chars=[chr(c) for c in range(ord('!'),ord('~')+1) if chr(c) not in '."\\`0123456789']+[chr(c) for c in range(0xC0,0x24F)]
def rle(row):
    o='';i=0
    while i<len(row):
        j=i
        while j<len(row) and row[j]==row[i]: j+=1
        n=j-i; o+=(str(n) if n>1 else '')+row[i]; i=j
    return o
import numpy as np
allpx=np.concatenate([spr[spr[:,:,3]>0][:,:3] for spr,_,_ in SPR.values()]).astype(float)
rng=np.random.default_rng(1); cent=allpx[rng.choice(len(allpx),48,replace=False)]
for _ in range(25):
    lab=((allpx[:,None]-cent[None])**2).sum(-1).argmin(1)
    for k in range(48):
        if (lab==k).any(): cent[k]=allpx[lab==k].mean(0)
def q(p): return cent[((cent-p[:3].astype(float))**2).sum(1).argmin()]
items={}
for (name,view),(spr,ox,oy) in SPR.items():
    rows=[]
    for y in range(spr.shape[0]):
        line=''
        for x in range(spr.shape[1]):
            p=spr[y,x]
            if not p[3]: line+='.'; continue
            h='#%02x%02x%02x'%tuple(int(round(v)) for v in q(p))
            if h not in pal: pal[h]=chars[len(pal)]
            line+=pal[h]
        rows.append(rle(line))
    items.setdefault(name,{})[view]={'x':ox,'y':oy,'rows':rows}
LIE=pickle.load(open('lie_acc.pkl','rb'))
for name,(spr,ox,oy) in LIE.items():
    rows=[]
    for y in range(spr.shape[0]):
        line=''
        for x in range(spr.shape[1]):
            p=spr[y,x]
            if not p[3]: line+='.'; continue
            h='#%02x%02x%02x'%tuple(int(round(v)) for v in q(p))
            if h not in pal: pal[h]=chars[len(pal)]
            line+=pal[h]
        rows.append(rle(line))
    items[name]['lie']={'x':ox,'y':oy,'rows':rows}
data={'palette':{v:k for k,v in pal.items()},'items':items}
js='''// =============================================================
// acc-art.js — ver.세밀 모자·머리 장식 그림 (GPT 그림을 민머리 기본형에 맞춰 정리한 도트)
// 원본: art-src/acc. 그림 정리 스크립트로 만든 파일이라 직접 고치지 않습니다.
// items.<장식>.front / back / lie(누운 그림용, 10도 돌림): x, y = 민머리 머리 왼쪽 위에서 떨어진 칸 수, rows = 글자 그림 (숫자+글자는 반복)
// 앞모습은 오른쪽을 보고, 왼쪽을 볼 때는 캐릭터와 함께 뒤집힙니다.
// =============================================================
'''
js+='const ACC_ART = '+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n'
open('/home/user/my-cozy-room/acc-art.js','w').write(js); print(len(js),len(pal))

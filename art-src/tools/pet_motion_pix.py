import numpy as np, json
from PIL import Image
a=np.array(Image.open('../../images/105.webp').convert('RGBA')).astype(float)
P=15.0
boxes={('cat','eat'):(60,439,190,444),('cat','play'):(549,939,126,447),('cat','jump'):(1042,1444,83,402),
       ('dog','eat'):(56,453,676,910),('dog','play'):(540,939,595,912),('dog','jump'):(1061,1459,539,861)}
cm=json.load(open('colmap.json'))
def bgish(c): return c.min()>228 and c.max()-c.min()<16
out={}
for (kind,f),(x0,x1,y0,y1) in boxes.items():
    sub=a[y0-10:y1+10,x0-10:x1+10]
    # 강아지: 하얀 몸은 늘 흰색(light)으로, 베이지 귀·무늬는 털색(fur)으로 (흰 강아지에선 둘 다 하얘서 섞임)
    skip={'A','?','L','M','E','G'} if kind=='dog' else set()
    cols={tuple(map(int,k.split(','))):v for k,v in cm[kind].items() if v not in skip}
    keys=np.array(list(cols.keys()),float); chars=list(cols.values())
    def var(ox,oy):
        tot=0;n=0
        for gy in np.arange(oy,sub.shape[0],P):
            for gx in np.arange(ox,sub.shape[1],P):
                cell=sub[int(gy+2):int(gy+P-2),int(gx+2):int(gx+P-2),:3]
                if cell.size==0: continue
                tot+=cell.std(axis=(0,1)).mean(); n+=1
        return tot/max(n,1)
    _,ox,oy=min((var(ox,oy),ox,oy) for ox in np.arange(0,P,P/5) for oy in np.arange(0,P,P/5))
    gys=np.arange(oy,sub.shape[0]-P/2,P); gxs=np.arange(ox,sub.shape[1]-P/2,P)
    grid=[]
    for gy in gys:
        line=''
        for gx in gxs:
            cell=sub[int(gy+P*0.25):int(gy+P*0.75),int(gx+P*0.25):int(gx+P*0.75),:3].reshape(-1,3)
            c=np.median(cell,0)
            if bgish(c): line+='.'; continue
            if kind=='dog' and c.max()>90:
                # 강아지: 조금이라도 어두운 베이지(귀·무늬)는 털색, 아주 밝으면 흰색
                group={'F','H','I','J'} if (c.max()-c.min())/c.max()>=0.10 else {';',':','@','D','/',','}
                idx=[i for i,ch in enumerate(chars) if ch in group]
                line+=chars[idx[int(((keys[idx]-c)**2).sum(1).argmin())]]
                continue
            line+=chars[((keys-c)**2).sum(1).argmin()]
        grid.append(line)
    # 빈 줄·칸 자르기
    while grid and set(grid[0])=={'.'}: grid.pop(0)
    while grid and set(grid[-1])=={'.'}: grid.pop()
    l=min(len(r)-len(r.lstrip('.')) for r in grid); r_=max(len(r.rstrip('.')) for r in grid)
    grid=[r[l:r_] for r in grid]
    out[f'{kind}_{f}']=grid
    print(kind,f,len(grid[0]),len(grid))
json.dump(out,open('newframes.json','w'),ensure_ascii=False)

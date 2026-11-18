import numpy as np, sys, json
from PIL import Image
from scipy import ndimage
from collections import Counter
src, ids, targets, out = sys.argv[1], sys.argv[2].split(','), [int(v) for v in sys.argv[3].split(',')], sys.argv[4]
a=np.array(Image.open(src).convert('RGBA')).astype(int)
rgb=a[:,:,:3]
neutral=(rgb.max(2)-rgb.min(2)<10)&(rgb.min(2)>222)
# 바깥 테두리와 이어진 체커보드(회색·흰색) 부분만 배경으로
lab,_=ndimage.label(neutral)
edge=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
bg=np.isin(lab,list(edge))|(a[:,:,3]<128) # 진짜 투명 배경도
fg=~bg
fg=ndimage.binary_opening(fg,iterations=1)
olab,n=ndimage.label(ndimage.binary_closing(fg,iterations=4))
objs=[(sl,i+1) for i,sl in enumerate(ndimage.find_objects(olab)) if (olab[sl]==i+1).sum()>2500]
# 줄 단위로 정렬 (세로 중심이 비슷한 것끼리)
objs.sort(key=lambda o:(o[0][0].start+o[0][0].stop)/2)
rows=[];cur=[]
for o in objs:
    c=(o[0][0].start+o[0][0].stop)/2
    if cur and c-np.mean([(q[0][0].start+q[0][0].stop)/2 for q in cur])>120: rows.append(cur); cur=[]
    cur.append(o)
rows.append(cur)
objs=[o for r in rows for o in sorted(r,key=lambda o:o[0][1].start)]
print('objects',len(objs),'expected',len(ids))
def pix(a,m,tw,qs=12):
    H,W=a.shape[:2]; p=W/tw; th=max(1,round(H/p)); o=np.zeros((th,tw,4),np.uint8)
    for j in range(th):
        for i in range(tw):
            ya,yb=int(j*p),max(int(j*p)+1,int((j+1)*p)); xa,xb=int(i*p),max(int(i*p)+1,int((i+1)*p))
            c=a[ya:yb,xa:xb]; mm=m[ya:yb,xa:xb]
            if mm.mean()<0.5: continue
            px=c[mm][:,:3]; q=Counter(tuple((v//qs)*qs) for v in px).most_common(1)[0][0]
            sel=px[np.all((px//qs)*qs==q,axis=1)]; o[j,i,:3]=sel.mean(0); o[j,i,3]=255
    return o
info={}
for (sl,li),id_,tw in zip(objs,ids,targets):
    m=(olab[sl]==li)&fg[sl]
    o=pix(a[sl],m,tw)
    Image.fromarray(o).save(f'{out}/{id_}.png'); info[id_]=list(o.shape[:2]); print(id_, o.shape[1],'x',o.shape[0], 'src w', sl[1].stop-sl[1].start)
json.dump(info,open(f'{out}/sizes.json','w'))

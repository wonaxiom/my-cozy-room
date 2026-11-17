import numpy as np
from PIL import Image
from collections import Counter
from scipy import ndimage
def pix(a,tw,qs):
    H,W=a.shape[:2]; p=W/tw; th=max(1,round(H/p)); o=np.zeros((th,tw,4),np.uint8)
    for j in range(th):
        for i in range(tw):
            ya,yb=int(j*p),max(int(j*p)+1,int((j+1)*p)); xa,xb=int(i*p),max(int(i*p)+1,int((i+1)*p))
            c=a[ya:yb,xa:xb]
            m=(c[:,:,3]>128)&~((c[:,:,:3].min(2)>225)&((c[:,:,:3].max(2)-c[:,:,:3].min(2))<16))
            if m.mean()<0.5: continue
            px=c[:,:,:3][m]; q=Counter(tuple((v//qs)*qs) for v in px).most_common(1)[0][0]
            sel=px[np.all((px//qs)*qs==q,axis=1)]; o[j,i,:3]=sel.mean(0); o[j,i,3]=255
    return o
jobs={'107':[('petBed',(149,596,268,605),43),('catTower',(695,1058,33,646),38),('petBall',(1211,1353,435,575),10),('petBowl',(1517,1795,392,604),19)],
      '106':[('petBed',(145,553,277,613),14),('catTower',(675,1013,45,610),13),('petBall',(1103,1225,436,564),3),('petBowl',(1347,1606,380,592),6)]}
for f,lst in jobs.items():
    a=np.array(Image.open(f'../../images/{f}.webp').convert('RGBA')).astype(int)
    for id_,(x0,x1,y0,y1),tw in lst:
        o=pix(a[y0:y1,x0:x1],tw,16 if f=='107' else 24)
        out=('d_' if f=='107' else 's_')+id_+'.png'
        Image.fromarray(o).save(out); print(out,o.shape)
# 미리보기
row=[Image.open(f'd_{n}.png') for n in ['petBed','catTower','petBall','petBowl']]+[Image.open(f's_{n}.png') for n in ['petBed','catTower','petBall','petBowl']]
W=sum(i.width+6 for i in row); H=max(i.height for i in row)
sh=Image.new('RGBA',(W,H),(239,230,214,255)); x=0
for im in row: sh.alpha_composite(im,(x,H-im.height)); x+=im.width+6
sh.resize((W*6,H*6),Image.NEAREST).save('prev.png')

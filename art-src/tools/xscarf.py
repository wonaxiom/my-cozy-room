# 크리스마스 목도리: 빨간 목도리 + 끝의 흰 방울 + 둘레 외곽선, 머리 왼쪽 위 기준
import numpy as np, pickle
from scipy import ndimage
new,amap=pickle.load(open('xscarf_cells.pkl','rb'))
OUT={}
for f,k in amap.items():
    c=new[k]; o=c['o']; l,t=c['head']; al=o[...,3]>0
    red=c['cov']['red']>=0.4
    band=np.zeros_like(red); band[t+20:t+29]=True
    lab,n=ndimage.label(red,structure=np.ones((3,3)))
    red=np.isin(lab,[i for i in range(1,n+1) if (band&(lab==i)).any()])
    red[t+38:]=False
    white=(c['cov']['white']>=0.35)&ndimage.binary_dilation(red,iterations=3)
    white[:t+22]=False
    sc=red|white
    v=o[...,:3].max(2); dark=al&(v<95)
    ol=dark&ndimage.binary_dilation(sc)&~sc; ol[:t+20]=False
    pts=[(y,x,'s') for y,x in zip(*np.nonzero(sc))]+[(y,x,'o') for y,x in zip(*np.nonzero(ol))]
    OUT[f]=dict(o=o,pts=pts,head=(l,t))
pickle.dump({'male':OUT},open('xscarf.pkl','wb'))
print({f:len(d['pts']) for f,d in OUT.items()})

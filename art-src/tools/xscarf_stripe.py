# 크리스마스 목도리에 흰 줄무늬 넣기: 빨간 칸을 2칸 간격 사선으로 흰색으로 ('hv'는 감긴 곳 세로줄·늘어진 끝 가로줄인데 작은 크기에서 잘 안 보여 'diag'를 씀)
import pickle, numpy as np, colorsys
X=pickle.load(open('xscarf.pkl','rb'))
WHITE=[(250,246,242),(232,226,222),(206,198,196)]   # 밝음·중간·그늘
def stripe(d, mode):
    o=d['o'].copy(); l,t=d['head']
    reds=[(y,x) for y,x,tp in d['pts'] if tp=='s' and o[y,x,0]>1.8*o[y,x,1]]
    if not reds: return o
    lv=np.array([o[y,x,:3].astype(float).mean() for y,x in reds]); lo,hi=np.percentile(lv,15),np.percentile(lv,85)
    wrap_bottom=t+27   # 이보다 아래는 늘어진 끝
    for (y,x),v in zip(reds,lv):
        k=((x if y<wrap_bottom else y)//2)%2 if mode=='hv' else ((x+y)//2)%2
        if k: 
            i=0 if v>=hi else (2 if v<=lo else 1)
            o[y,x,:3]=WHITE[i]
    return o
Y={'male':{f:dict(d,o=stripe(d,'diag')) for f,d in X['male'].items()}}
pickle.dump(Y,open('xscarf_striped.pkl','wb'))

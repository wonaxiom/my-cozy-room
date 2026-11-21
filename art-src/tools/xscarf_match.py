import numpy as np, pickle
from cells import cells, silhouette
from scipy.optimize import linear_sum_assignment
FR=['idle','blink','breathe','wave1','wave2']+[f'walk{i}' for i in range(1,9)]+['sitChair','sitFloor','water','switch','type','read','snack','back','chairSit','chairType','chairBack','stretch1','stretch2','waterStand','readStand']
def red(rgb):
    r,g,b=rgb[...,0],rgb[...,1],rgb[...,2]
    return {'red':(r>80)&(r>2*g)&(r>1.8*b),'white':(rgb.min(2)>175)&((rgb.max(2)-rgb.min(2))<26)}
new=cells('/home/user/my-cozy-room/art-src/outfit/xmas_scarf_male.webp',red)
old=cells('/home/user/my-cozy-room/art-src/outfit/scarf_male.webp',lambda rgb:{})
print(len(new),len(old))
SN=[silhouette(c) for c in new]; SO=[silhouette(c) for c in old]
C=np.array([[ (so^sn).sum() for sn in SN] for so in SO])
# 시트에 걷기 칸이 2개 더 그려져 있음(30칸): 서기·손 흔들기 5칸과 앉기부터(3·4줄)는 순서대로, 걷기 8칸만 모양이 가장 비슷한 칸으로
amap={FR[k]:k for k in range(5)}
amap['sitChair']=15
for k in range(14,28): amap[FR[k]]=k+2
walk=[FR.index(f'walk{i}') for i in range(1,9)]; cand=list(range(5,15))
r,c=linear_sum_assignment(C[np.ix_(walk,cand)])
for i,j in zip(r,c): amap[FR[walk[i]]]=cand[j]
for f in FR: print(f,'->',amap[f],C[FR.index(f),amap[f]])
pickle.dump((new,amap),open('xscarf_cells.pkl','wb'))

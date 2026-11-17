import numpy as np, math
from PIL import Image
closed=np.array(Image.open('/home/user/my-cozy-room/img/furn/s/fridge.png').convert('RGBA'))
OW,OH=21,20
out=np.zeros((OH,OW,4),np.uint8); out[:,:14]=closed
def put(x,y,hexc):
    if 0<=x<OW and 0<=y<OH: out[y,x]=[int(hexc[1:3],16),int(hexc[3:5],16),int(hexc[5:7],16),255]
# 앞면 안쪽 (x 7..12)
for x in range(7,13):
    top=math.ceil(7-(x-6)/2)+1; bot=int(18-(x-6)/2)-1
    for y in range(top,bot+1):
        r=y-top
        c='#f9e9b8' if x>7 else '#ead3a0'          # 안쪽 벽 (왼쪽은 그늘)
        if r in (3,6): c='#fff7e2'                 # 선반
        if r==8: c='#e2c9a8'                       # 냉장/냉동 칸 사이
        put(x,y,c)
    # 음식
    t=math.ceil(7-(x-6)/2)+1
    food={8:[(1,'#a9c0de'),(2,'#a9c0de'),(5,'#e0796a'),(9,'#e8a0a0')],
          10:[(2,'#f3c35f'),(4,'#f0a24c'),(5,'#f0a24c'),(7,'#9fbd7f'),(9,'#a9c0de')],
          11:[(1,'#e7836f'),(4,'#f3c35f')]}.get(x,[])
    for r,c in food: put(x,t+r,c)
# 문: 경첩(오른쪽 모서리 x=13)에서 앞쪽으로 90도 열림
for x in range(14,20):
    k=x-13
    top=4+math.floor(k/2); bot=15+math.floor(k/2)
    for y in range(top,bot+1):
        r=y-top
        c='#f1dcc6'
        if x==19 or y==top or y==bot: c='#b59783'  # 테두리
        elif r==8: c='#a48874'                      # 위아래 문 사이
        elif r in (3,6) and x<19: c='#e3cab2'       # 문 안쪽 칸
        put(x,y,c)
    if x==19: put(x,bot,'#9a7d68')
put(15,top_ := 4+0+2,'#f3c35f'); put(17,4+2+2,'#e0806a'); put(16,4+1+5,'#f0a24c'); put(18,4+2+5,'#a9c0de')
# 손잡이 (문 바깥쪽 끝)
for y in (8,9,10,14,15): put(20,y,'#a18f88')
Image.fromarray(out).save('fridge-open-s.png')
closedI=Image.fromarray(closed)
sh=Image.new('RGBA',(14*16+OW*16+20,OH*16),(255,255,255,255))
sh.alpha_composite(closedI.resize((14*16,20*16),Image.NEAREST),(0,0)); sh.alpha_composite(Image.fromarray(out).resize((OW*16,OH*16),Image.NEAREST),(14*16+20,0)); sh.save('cmp_simple.png')

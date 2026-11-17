import numpy as np
from PIL import Image, ImageDraw
from collections import Counter
S=12  # 작업 배율
src=Image.open('../../images/102.webp').convert('RGBA')
closed=Image.open('/home/user/my-cozy-room/img/furn/fridge.png').convert('RGBA')
OW,OH=67,66
def affine(sp,tp):
    # tp(타깃, 고해상도 좌표) -> sp(원본) 로 가는 역변환 계수
    A=[];B=[]
    for (sx,sy),(tx,ty) in zip(sp,tp):
        A.append([tx,ty,1,0,0,0]); B.append(sx)
        A.append([0,0,0,tx,ty,1]); B.append(sy)
    return np.linalg.solve(np.array(A,float),np.array(B,float))
def warp(sp,tp,mask_poly_src):
    m=Image.new('L',src.size,0); ImageDraw.Draw(m).polygon(mask_poly_src,fill=255)
    s=src.copy(); s.putalpha(Image.fromarray(np.minimum(np.array(src)[:,:,3],np.array(m))))
    c=affine(sp,[(x*S,y*S) for x,y in tp])
    return s.transform((OW*S,OH*S),Image.AFFINE,tuple(c),resample=Image.BILINEAR)
# 앞면(안쪽): 원본 앞면 → 닫힌 그림 앞면
front_s=[(426,236),(662,131),(430,851)]
front_t=[(19,21.5),(43,10),(19,65.5)]
front=warp(front_s,front_t,[(426,236),(662,131),(662,748),(430,851)])
# 문(위아래 같이): 경첩 쪽 → 앞면 오른쪽 모서리, 문은 앞으로 90도
door_s=[(660,145),(870,238),(660,760)]
W=20.4
door_t=[(43,10.5),(43+W,10.5+W/2),(43,54)]
door=warp(door_s,door_t,[(655,120),(900,200),(900,820),(655,800)])
def pix(img,qs=12):
    a=np.array(img).astype(int); o=np.zeros((OH,OW,4),np.uint8)
    for j in range(OH):
        for i in range(OW):
            c=a[j*S:(j+1)*S,i*S:(i+1)*S].reshape(-1,4)
            m=c[:,3]>128
            if m.mean()<0.5: continue
            px=c[m][:,:3]; q=Counter(tuple((v//qs)*qs) for v in px).most_common(1)[0][0]
            sel=px[np.all((px//qs)*qs==q,axis=1)]; o[j,i,:3]=sel.mean(0); o[j,i,3]=255
    return o
F=pix(front); D=pix(door)
out=np.zeros((OH,OW,4),np.uint8); out[:,:43]=np.array(closed)
# 앞면 안쪽만 바꿈 (닫힌 그림의 바깥 테두리 1칸은 남김)
poly=Image.new('L',(OW,OH),0); ImageDraw.Draw(poly).polygon([(19.5,22),(41.5,11),(41.5,53),(19.5,64.5)],fill=255)
pm=np.array(poly)>0
sel=pm&(F[:,:,3]>0); out[sel]=F[sel]
dm=D[:,:,3]>0; dm[:,:43]=False; out[dm]=D[dm]
Image.fromarray(out).save('fridge-open.png')
big=Image.fromarray(out).resize((OW*8,OH*8),Image.NEAREST); cb=closed.resize((43*8,66*8),Image.NEAREST)
sh=Image.new('RGBA',(43*8+OW*8+20,OH*8),(255,255,255,255)); sh.alpha_composite(cb,(0,0)); sh.alpha_composite(big,(43*8+20,0)); sh.save('cmp_detail.png')

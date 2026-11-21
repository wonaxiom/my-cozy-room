# 누운 그림용 장식: lie.py와 같은 방법(10도 돌려 누운 머리에 붙인 뒤 몸과 함께 15도 더 돌림)
import numpy as np
from PIL import Image
T='/home/user/my-cozy-room/art-src/'
def rot(arr,ang,S=4):
    im=Image.fromarray(arr).resize((arr.shape[1]*S,arr.shape[0]*S),Image.NEAREST)
    r=im.rotate(ang,resample=Image.NEAREST,expand=True,center=(im.width/2,im.height/2))
    W,H=r.width//S,r.height//S
    return np.array(r)[S//2::S,S//2::S][:H,:W]
lie=np.array(Image.open(T+'base/lie.png').convert('RGBA')); base=np.array(Image.open(T+'base/bm_00.png').convert('RGBA'))
PADL=14; pad=16; hl=int(min(np.nonzero((base[:20,:,3]>0).any(0))[0]))
Hc,Wc=base.shape[0]+PADL*2,base.shape[1]+PADL*2
def lie_sprite(spr,ax,ay,dx=0,dy=0):
    l=np.zeros((Hc,Wc,4),np.uint8); org=np.zeros((Hc,Wc,4),np.uint8); org[PADL,PADL+hl]=255
    for y in range(spr.shape[0]):
        for x in range(spr.shape[1]):
            Y,X=PADL+ay+y,PADL+hl+ax+x
            if spr[y,x,3] and 0<=Y<Hc and 0<=X<Wc: l[Y,X]=spr[y,x]
    def two(img):
        r=rot(img,10); big=np.zeros((lie.shape[0]+pad*2+40,lie.shape[1]+pad*2+40,4),np.uint8)
        big[pad:pad+r.shape[0],pad:pad+r.shape[1]]=r[:big.shape[0]-pad,:big.shape[1]-pad]
        return rot(big,15)
    r=two(l); o=two(org)
    oy,ox=np.nonzero(o[:,:,3]>0); o=(int(ox.mean()),int(oy.mean()))
    ys,xs=np.nonzero(r[:,:,3]>0); y0,x0=ys.min(),xs.min()
    return r[y0:ys.max()+1,x0:xs.max()+1],int(x0-o[0]),int(y0-o[1])
if __name__=='__main__':
    import json,re
    src=open('/home/user/my-cozy-room/acc-art.js').read(); A=json.loads(re.search(r'= (\{.*\});',src,re.S).group(1))
    spr=np.array(Image.open(T+'acc/spr_headband_front.png').convert('RGBA'))
    f=A['items']['headband']['front']; s,x,y=lie_sprite(spr,f['x'],f['y'])
    print('mine',x,y,s.shape[:2],'stored',A['items']['headband']['lie']['x'],A['items']['headband']['lie']['y'],len(A['items']['headband']['lie']['rows']))

exec(open('build5.py').read())
STYLES=['short','buzz','bangs','spiky','bob','long','ponytail','pigtails','bun','curly']
SIT={'sitChair','sitFloor','water','type','read','snack'}
PROP={'water':lambda x,y: x>=21,'switch':lambda x,y: x>=32,'type':lambda x,y: x>=18 and y<=37}
CW=56
def label_base(a,f,chin,oy,eyeb=None,ox=0):
    """기본형 픽셀 → 부위"""
    H,W=a.shape[:2]; L=np.full((H,W),'',object)
    waist=H-(11 if f in SIT else 14)
    for y in range(H):
        for x in range(W):
            if not a[y,x,3]: continue
            h,s,v=hsvp(a[y,x])
            orange=(h<0.12 or h>0.9)
            if v<0.3: L[y,x]='keep'; continue
            if f in PROP and PROP[f](x,y): L[y,x]='keep'; continue
            if y<chin+oy or f=='back' and y<chin:
                if orange and s>=0.1 and v>=0.6: L[y,x]='skin'
                elif orange and s>=0.3: L[y,x]='keep'      # 머리 외곽선의 갈색 번짐
                elif f=='back' or eyeb is None: L[y,x]='keep' if f=='back' else 'eye'
                else: L[y,x]='eye' if any(b[0]+ox<=x<=b[1]+ox and b[2]+oy<=y<=b[3]+oy for b in eyeb) else 'keep'
            else:
                if orange and s>=0.12 and v>=0.55: L[y,x]='skin'
                elif s<0.14: L[y,x]='bottom' if y>=waist else 'top'
                else: L[y,x]='keep'
    # 다리: 반바지 밑단보다 아래에 있는 같은 세로줄의 피부 (서 있는 그림만). 옆에 내린 손은 제외
    if f not in SIT:
        for x in range(W):
            ys=[y for y in range(H) if L[y,x]=='bottom']
            if not ys: continue
            for y in range(max(ys)+1,H):
                if L[y,x]=='skin': L[y,x]='leg'
    return L
def build(pre):
    frames=[strip_small(load(B+f'{pre}_{i:02d}.png')) for i in range(21)]
    idle=frames[0]; ii=headinfo(idle); back=frames[20]; bi=headinfo(back)
    xs=[x for y in range(10) for x in range(idle.shape[1]) if idle[y,x,3]]; hc=(min(xs)+max(xs)+1)/2
    xs=[x for y in range(10) for x in range(back.shape[1]) if back[y,x,3]]; hcb=(min(xs)+max(xs)+1)/2
    L0=label_base(idle,'idle',ii['chin'],0)
    eyeb=[]
    m=(L0=='eye'); seen=np.zeros_like(m)
    for y in range(m.shape[0]):
        for x in range(m.shape[1]):
            if m[y,x] and not seen[y,x]:
                q=[(y,x)]; seen[y,x]=1; pts=[]
                while q:
                    cy,cx=q.pop(); pts.append((cy,cx))
                    for dy in (-1,0,1):
                        for dx in (-1,0,1):
                            ny,nx=cy+dy,cx+dx
                            if 0<=ny<m.shape[0] and 0<=nx<m.shape[1] and m[ny,nx] and not seen[ny,nx]: seen[ny,nx]=1; q.append((ny,nx))
                eyeb.append(pts)
    eyeb=sorted(eyeb,key=len)[-2:]
    eyeb=[(min(p[1] for p in e),max(p[1] for p in e),min(p[0] for p in e),max(p[0] for p in e)) for e in eyeb]
    print(pre,'eyes',eyeb)
    offs=[head_offset(idle,ii['chin'],a) if k!=20 else (0,0) for k,a in enumerate(frames)]
    res={}
    for si,st in enumerate(STYLES):
        r=si//2; i=r*4+(si%2)*2
        hf=load(f'hair_{i:02d}.png'); hb=load(f'hair_{i+1:02d}.png')
        _,fdx,fdy=fit(idle,hf,ii,int(round((cs[i][0]-CROWN[r])/P))-2)
        _,bdx,bdy=fit(back,hb,bi,int(round((cs[i+1][0]-CROWN[r])/P))-2)
        res[st]={}
        for k,a in enumerate(frames):
            f=FR[k]; ox,oy=offs[k]
            isback=(k==20); hair=hb if isback else hf
            dx,dy=(bdx,bdy) if isback else (fdx+ox,fdy+oy)
            chinY=None if isback else ii['chin']+oy
            L=label_base(a,f,ii['chin'],oy,eyeb,ox)
            H,W=a.shape[:2]; padT=14
            cx=(hcb if isback else hc+ox)
            ox0=int(round(CW/2-cx))
            C=np.zeros((H+padT,CW,4),np.uint8); G=np.full((H+padT,CW),'',object)
            def put(img,lab,X,Y):
                if 0<=Y<C.shape[0] and 0<=X<CW: C[Y,X]=img; G[Y,X]=lab
            hp=[(y,x) for y in range(hair.shape[0]) for x in range(hair.shape[1]) if hair[y,x,3]]
            def hl(p): return 'keep' if hsvp(p)[2]<0.28 else 'hair'
            for y,x in hp:   # 몸 뒤 머리카락
                if chinY is not None and y+dy>=chinY: put(hair[y,x],hl(hair[y,x]),x+dx+ox0,y+dy+padT)
            for y in range(H):
                for x in range(W):
                    if a[y,x,3]: put(a[y,x],L[y,x],x+ox0,y+padT)
            for y,x in hp:
                if chinY is None or y+dy<chinY: put(hair[y,x],hl(hair[y,x]),x+dx+ox0,y+dy+padT)
            EB=[] if isback else [[b[0]+ox+ox0,b[2]+oy+padT,b[1]+ox+ox0,b[3]+oy+padT] for b in sorted(eyeb)]
            res[st][f]=(C,G,EB)
            if f=='blink':
                cut=ii['chin']+oy+padT+3
                res[st]['sleep']=(C[:cut].copy(),G[:cut].copy(),EB)
        res[st]['work']=res[st]['type']
    return res

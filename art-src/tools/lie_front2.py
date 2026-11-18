# GPT "베개가 앞쪽인 침대에 누운 전신" 시트 -> lie-front-art.js
# 사용: python3 -I lie_front2.py 시트.webp 서있는머리ref.png 출력.js 피치 [bun대체.png bun대체와같은배율의9번.png]
import numpy as np, sys, json, colorsys
from PIL import Image
from scipy import ndimage
from collections import Counter
src, ref, out_js, pitch = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4])
STYLES = ['short','buzz','bangs','spiky','bob','long','ponytail','pigtails','bun','curly']
def objects(img, minpx):
    a = np.array(img.convert('RGBA')).astype(int); rgb = a[:,:,:3]
    neutral = ((rgb.min(2) > 225) & (rgb.max(2) - rgb.min(2) < 14)) | (a[:,:,3] < 128)
    # 바깥 테두리와 이어진 흰색만 배경 (흰 티셔츠는 남김). 외곽선 틈은 3칸 두껍게 막고 찾은 뒤 되돌림
    sealed = neutral & ~ndimage.binary_dilation(~neutral, iterations=3)
    nl, _ = ndimage.label(sealed)
    edge = set(np.unique(np.concatenate([nl[0], nl[-1], nl[:, 0], nl[:, -1]]))) - {0}
    bg = ndimage.binary_dilation(np.isin(nl, list(edge)), iterations=3) & neutral
    fg = ndimage.binary_opening(~bg, iterations=1)
    lab, n = ndimage.label(ndimage.binary_closing(fg, iterations=5))
    objs = [(sl, i+1) for i, sl in enumerate(ndimage.find_objects(lab)) if (lab[sl] == i+1).sum() > minpx]
    objs.sort(key=lambda o: (o[0][0].start // 200, o[0][1].start))
    return a, fg, lab, objs
def pix(a, m, p, qs=10):
    H, W = a.shape[:2]; tw, th = max(1, round(W / p)), max(1, round(H / p)); px_, py_ = W / tw, H / th
    o = np.zeros((th, tw, 4), np.uint8)
    for j in range(th):
        for i in range(tw):
            ya, yb = int(j*py_), max(int(j*py_)+1, int((j+1)*py_)); xa, xb = int(i*px_), max(int(i*px_)+1, int((i+1)*px_))
            c = a[ya:yb, xa:xb]; mm = m[ya:yb, xa:xb]
            if mm.mean() < 0.5: continue
            q = c[mm][:, :3]; k = Counter(tuple((v//qs)*qs) for v in q).most_common(1)[0][0]
            sel = q[np.all((q//qs)*qs == k, axis=1)]; o[j, i, :3] = sel.mean(0); o[j, i, 3] = 255
    return o
a, fg, lab, objs = objects(Image.open(src), 3000)
assert len(objs) == 10, len(objs)
bodies = {}
for (sl, li), st in zip(objs, STYLES):
    bodies[st] = pix(a[sl], (lab[sl] == li) & fg[sl], pitch)
if len(sys.argv) > 6:  # 9번(올림머리)을 머리 푼 그림으로 바꿈. 같은 배율로 자른 9번 그림으로 크기를 맞춤
    alt, same9 = Image.open(sys.argv[5]), Image.open(sys.argv[6])
    a9 = objs[8][0]; w9 = a9[1].stop - a9[1].start
    _, f2, l2, o2 = objects(same9, 500); ws = o2[0][0][1].stop - o2[0][0][1].start
    b, fb, lb, ob = objects(alt, 500); sl, li = ob[0]
    bodies['bun'] = pix(b[sl], (lb[sl] == li) & fb[sl], pitch * ws / w9)
# 색 줄이기 (모두 모아 40색)
H = max(o.shape[0] for o in bodies.values())
strip = np.concatenate([np.pad(o, ((0, H - o.shape[0]), (0, 0), (0, 0))) for o in bodies.values()], 1)
qa = np.array(Image.fromarray(strip[:, :, :3].astype(np.uint8)).quantize(40, method=Image.Quantize.MEDIANCUT).convert('RGB')); x0 = 0
for st in bodies:
    o = bodies[st]; th, tw = o.shape[:2]; o[:, :, :3] = qa[:th, x0:x0 + tw]; x0 += tw
def hls(c): return colorsys.rgb_to_hls(*(np.array(c[:3]) / 255))
def kind(c):
    h, l, _ = hls(c); _, s, v = colorsys.rgb_to_hsv(*(np.array(c[:3]) / 255))  # 채도는 HSV (흰색 근처에서 HLS 채도가 튐)
    if v < 0.2: return 'keep'
    if s < 0.1 and v > 0.72: return 'top'
    if s < 0.1: return 'bottom'
    if (h < 0.12 or h > 0.92) and l > 0.66: return 'skin'
    if (h < 0.12 or h > 0.92) and s > 0.15: return 'hair'
    return 'keep'
# 테두리 + 부위 나누기 (다리: 반바지보다 발 쪽에 있는 피부)
r0 = np.array(Image.open(ref).convert('RGBA'))
rp = [tuple(r0[y, x, :3]) for y in range(r0.shape[0]) for x in range(r0.shape[1]) if r0[y, x, 3]]
dark = Counter(p for p in rp if max(p) < 77).most_common(1)[0][0]
labels = {}
for st, o in bodies.items():
    al = o[:, :, 3] > 0; pad = np.pad(al, 1)
    edge = al & ~(pad[:-2, 1:-1] & pad[2:, 1:-1] & pad[1:-1, :-2] & pad[1:-1, 2:])
    K = np.full(al.shape, '', object)
    for y, x in zip(*np.nonzero(al)): K[y, x] = kind(o[y, x])
    o[edge, :3] = dark
    # 몸 방향: 머리(오른쪽 아래) -> 발(왼쪽 위). t가 클수록 발 쪽
    t = lambda y, x: -(2 * x + y)
    sh = [t(y, x) for y, x in zip(*np.nonzero(K == 'bottom'))]
    cut = np.percentile(sh, 60)  # 반바지 가운데보다 발 쪽이면 다리
    for y, x in zip(*np.nonzero(al)):
        if edge[y, x]: K[y, x] = 'keep'
        elif K[y, x] == 'skin' and t(y, x) > cut: K[y, x] = 'leg'
    labels[st] = K
    vis = np.zeros_like(o); cols = {'skin': (255,200,160), 'leg': (255,120,60), 'top': (240,240,255), 'bottom': (90,90,200), 'hair': (120,70,40), 'keep': (0,0,0)}
    for y, x in zip(*np.nonzero(al)): vis[y, x, :3] = cols[K[y, x]]; vis[y, x, 3] = 255
    Image.fromarray(np.concatenate([o, vis], 1)).resize((o.shape[1]*12, o.shape[0]*6), Image.NEAREST).save(f'b_{st}.png')
allpx = [(tuple(o[y, x, :3]), labels[st][y, x]) for st, o in bodies.items() for y, x in zip(*np.nonzero(o[:, :, 3]))]
def dom(part, pxs=None):
    return Counter(p for p, k in (pxs or allpx) if k == part).most_common(1)[0][0]
def hexc(c): return '#%02x%02x%02x' % tuple(int(v) for v in c)
def basefor(gdom, rdom, target):
    _, lg, sg = hls(gdom); _, lr, sr = hls(rdom)
    ht, lt, st = colorsys.rgb_to_hls(*(np.array([int(target[i:i+2], 16) for i in (1, 3, 5)]) / 255))
    lb = min(1, max(0, lt + lg - lr)); sb = min(1, max(0, st + (sg - sr) * 2))
    return hexc(np.array(colorsys.hls_to_rgb(ht, lb, sb)) * 255)
rk = [(p, kind(p)) for p in rp]
base = {'hair': basefor(dom('hair'), dom('hair', rk), '#4a3226'), 'skin': basefor(dom('skin'), dom('skin', rk), '#f6d2b8'),
        'top': hexc(dom('top')), 'bottom': hexc(dom('bottom'))}
base['leg'] = base['skin']
print('base', base)
pal = {}; heads = {}
for st, o in bodies.items():
    th, tw = o.shape[:2]; K = labels[st]; rows = []
    for y in range(th):
        row = ''
        for x in range(tw):
            if not o[y, x, 3]: row += '.'; continue
            key = (hexc(o[y, x, :3]), K[y, x])
            if key not in pal: pal[key] = chr(0x4000 + len(pal))
            row += pal[key]
        rows.append(row)
    hy, hx = np.nonzero(K == 'hair')
    sy, sx = np.nonzero((K == 'skin'))
    # 기준점: 머리통 가운데 (머리카락 칸의 가운데)
    heads[st] = {'rows': rows, 'at': [round(float(hx.mean()), 1), round(float(hy.mean()), 1)]}
    print(st, tw, th, heads[st]['at'])
js = 'const LIE_FRONT_ART = ' + json.dumps({'base': base, 'palette': {v: list(k) for k, v in pal.items()}, 'heads': heads}, ensure_ascii=False) + ';\n'
open(out_js, 'w').write('// 베개가 앞쪽인 침대에 누운 모습 (머리 오른쪽 아래, 발 왼쪽 위). GPT 그림을 도트로 바꿔 만든 파일 (art-src/tools/lie_front2.py)\n' + js)
print('palette', len(pal), 'bytes', len(js))

# GPT "정수리가 앞쪽인 누운 머리" 시트 -> lie-front-art.js
import numpy as np, sys, json, colorsys
from PIL import Image
from scipy import ndimage
from collections import Counter
src, ref, out_js, pitch = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4])
STYLES = ['short','buzz','bangs','spiky','bob','long','ponytail','pigtails','bun','curly']
a = np.array(Image.open(src).convert('RGBA')).astype(int); rgb = a[:,:,:3]
bg = (rgb.min(2) > 225) & (rgb.max(2) - rgb.min(2) < 14)
fg = ndimage.binary_opening(~bg, iterations=1)
lab, n = ndimage.label(ndimage.binary_closing(fg, iterations=6))
objs = [(sl, i+1) for i, sl in enumerate(ndimage.find_objects(lab)) if (lab[sl] == i+1).sum() > 1500]
objs.sort(key=lambda o: o[0][1].start)
assert len(objs) == 10, len(objs)
def pix(a, m, tw, th, qs=10):
    H, W = a.shape[:2]; px_, py_ = W / tw, H / th; o = np.zeros((th, tw, 4), np.uint8)
    for j in range(th):
        for i in range(tw):
            ya, yb = int(j*py_), max(int(j*py_)+1, int((j+1)*py_)); xa, xb = int(i*px_), max(int(i*px_)+1, int((i+1)*px_))
            c = a[ya:yb, xa:xb]; mm = m[ya:yb, xa:xb]
            if mm.mean() < 0.5: continue
            p = c[mm][:, :3]; q = Counter(tuple((v//qs)*qs) for v in p).most_common(1)[0][0]
            sel = p[np.all((p//qs)*qs == q, axis=1)]; o[j, i, :3] = sel.mean(0); o[j, i, 3] = 255
    return o
def label(c):
    h, l, s = colorsys.rgb_to_hls(*(np.array(c[:3]) / 255))
    v = max(c[:3]) / 255
    if v < 0.3: return 'keep'
    if l > 0.68 and (h < 0.12 or h > 0.92): return 'skin'
    if (h < 0.12 or h > 0.92) and l <= 0.68 and s > 0.15: return 'hair'
    return 'keep'
heads = {}; allpx = []
for (sl, li), st in zip(objs, STYLES):
    m = (lab[sl] == li) & fg[sl]
    H, W = m.shape; tw, th = max(1, round(W / pitch)), max(1, round(H / pitch))
    o = pix(a[sl], m, tw, th)
    heads[st] = o; allpx += [tuple(o[y, x, :3]) for y in range(th) for x in range(tw) if o[y, x, 3]]
    Image.fromarray(o).resize((tw*6, th*6), Image.NEAREST).save(f'h_{st}.png')
# 색 줄이기: 10개를 한 장에 모아 32색으로
strip = np.concatenate([np.pad(o, ((0, 40 - o.shape[0]), (0, 0), (0, 0))) for o in heads.values()], 1)
q = Image.fromarray(strip[:, :, :3].astype(np.uint8)).quantize(32, method=Image.Quantize.MEDIANCUT)
qa = np.array(q.convert('RGB')); x0 = 0
for st in heads:
    o = heads[st]; th, tw = o.shape[:2]; o[:, :, :3] = qa[:th, x0:x0 + tw]; x0 += tw
allpx = [tuple(o[y, x, :3]) for o in heads.values() for y in range(o.shape[0]) for x in range(o.shape[1]) if o[y, x, 3]]
# 테두리: 바깥과 맞닿은 칸을 기존 캐릭터의 외곽선 색으로
r0 = np.array(Image.open(ref).convert('RGBA'))
dark = Counter(tuple(r0[y, x, :3]) for y in range(r0.shape[0]) for x in range(r0.shape[1]) if r0[y, x, 3] and max(r0[y, x, :3]) < 77).most_common(1)[0][0]
for st, o in heads.items():
    al = o[:, :, 3] > 0
    pad = np.pad(al, 1)
    edge = al & ~(pad[:-2, 1:-1] & pad[2:, 1:-1] & pad[1:-1, :-2] & pad[1:-1, 2:])
    o[edge, :3] = dark
    Image.fromarray(o).resize((o.shape[1]*6, o.shape[0]*6), Image.NEAREST).save(f'h_{st}.png')
allpx = [tuple(o[y, x, :3]) for o in heads.values() for y in range(o.shape[0]) for x in range(o.shape[1]) if o[y, x, 3]]
# 색 기준: 같은 갈색 머리·밝은 피부로 그린 서 있는 머리(ref)의 대표색과 맞춤
def dom(pxs, part):
    c = Counter(p for p in pxs if label(p) == part).most_common(1)
    return c[0][0]
r = np.array(Image.open(ref).convert('RGBA'))
rp = [tuple(r[y, x, :3]) for y in range(r.shape[0]) for x in range(r.shape[1]) if r[y, x, 3]]
def hexc(c): return '#%02x%02x%02x' % tuple(int(v) for v in c)
def basefor(gdom, rdom, target):
    # recolor(orig, base, target): L = Lt + (L0 - Lb)  ->  Lb = Lt + L0 - Lr
    _, lg, sg = colorsys.rgb_to_hls(*(np.array(gdom) / 255)); _, lr, sr = colorsys.rgb_to_hls(*(np.array(rdom) / 255))
    ht, lt, st = colorsys.rgb_to_hls(*(np.array([int(target[i:i+2], 16) for i in (1, 3, 5)]) / 255))
    lb = min(1, max(0, lt + lg - lr)); sb = min(1, max(0, st + (sg - sr) * 2))
    return hexc(np.array(colorsys.hls_to_rgb(ht, lb, sb)) * 255)
base = {'hair': basefor(dom(allpx, 'hair'), dom(rp, 'hair'), '#4a3226'), 'skin': basefor(dom(allpx, 'skin'), dom(rp, 'skin'), '#f6d2b8')}
print('gpt dom', hexc(dom(allpx, 'hair')), hexc(dom(allpx, 'skin')), 'ref dom', hexc(dom(rp, 'hair')), hexc(dom(rp, 'skin')), 'base', base)
pal = {}; outheads = {}
for st, o in heads.items():
    th, tw = o.shape[:2]; rows = []
    ys, xs = np.nonzero(o[:, :, 3])
    for y in range(th):
        row = ''
        for x in range(tw):
            if not o[y, x, 3]: row += '.'; continue
            key = (hexc(o[y, x, :3]), label(o[y, x]))
            if key not in pal: pal[key] = chr(0x4000 + len(pal))
            row += pal[key]
        rows.append(row)
    # 기준점: 피부(얼굴) 가운데와 전체 가운데의 중간 = 머리통 가운데
    sk = [(x, y) for y in range(th) for x in range(tw) if o[y, x, 3] and label(o[y, x]) == 'skin']
    cx = (np.mean([p[0] for p in sk]) + xs.mean()) / 2; cy = (np.mean([p[1] for p in sk]) + ys.mean()) / 2
    outheads[st] = {'rows': rows, 'at': [round(cx, 1), round(cy, 1)]}
    print(st, tw, th)
js = 'const LIE_FRONT_ART = ' + json.dumps({'base': base, 'palette': {v: list(k) for k, v in pal.items()}, 'heads': outheads}, ensure_ascii=False) + ';\n'
open(out_js, 'w').write('// 베개가 앞쪽인 침대에서 자는 머리 (정수리가 보는 쪽). GPT 그림을 도트로 바꿔 만든 파일 (art-src/tools/lie_front.py)\n' + js)
print('palette', len(pal), 'bytes', len(js))

# 배경 장식 시트 -> 조각별 도트 그림 (GPT 시트, 흰 배경·투명 배경 모두)
# 사용: python3 side_theme.py 시트.webp 출력폴더 피치 이름1,이름2,...
#  - 가까운 조각(흩어진 꽃잎, 찻김)은 한 그림으로 묶음
#  - 이름이 ...A, ...B 로 짝지어진 그림(숨 쉬는 동물)은 같은 크기 칸에 아래·가운데를 맞춤
#  - 이름이 ...Strip 인 선반 띠는 이음매 없이 반복되는 ...StripTile 도 만듦
import sys, numpy as np
from PIL import Image
from scipy import ndimage
from collections import Counter
src, out, pitch, names = sys.argv[1], sys.argv[2], float(sys.argv[3]), sys.argv[4].split(',')
im = Image.open(src).convert('RGBA'); bgim = Image.new('RGBA', im.size, (255, 255, 255, 255)); bgim.alpha_composite(im)
a = np.array(bgim.convert('RGB')).astype(int)
neutral = (a.min(2) > 236) & (a.max(2) - a.min(2) < 12)
lab0, _ = ndimage.label(neutral)
edge = set(np.unique(np.concatenate([lab0[0], lab0[-1], lab0[:, 0], lab0[:, -1]]))) - {0}
# 바구니 손잡이 안처럼 막힌 흰 배경 (아주 하얗고 넓은 곳만, 고양이 흰 털은 크림색이라 남음)
for k, sl in enumerate(ndimage.find_objects(lab0)):
    mk = lab0[sl] == k + 1
    if k + 1 not in edge and mk.sum() > 2000 and a[sl][mk].mean(0).min() >= 251.5: edge.add(k + 1)
fg = ~np.isin(lab0, list(edge)); fg = ndimage.binary_opening(fg, iterations=1)
lab, n = ndimage.label(ndimage.binary_closing(fg, iterations=3))
boxes = [[s[0].start, s[1].start, s[0].stop, s[1].stop] for i, s in enumerate(ndimage.find_objects(lab)) if (lab[s] == i + 1).sum() > 120]
G = 30
merged = True
while merged:
    merged = False
    for i in range(len(boxes)):
        for j in range(i + 1, len(boxes)):
            p, q = boxes[i], boxes[j]
            if p[0] - G < q[2] and q[0] - G < p[2] and p[1] - G < q[3] and q[1] - G < p[3]:
                boxes[i] = [min(p[0], q[0]), min(p[1], q[1]), max(p[2], q[2]), max(p[3], q[3])]; del boxes[j]; merged = True; break
        if merged: break
boxes.sort(key=lambda b: (b[0] + b[2]) / 2)
rows, cur = [], []
for b in boxes:
    c = (b[0] + b[2]) / 2
    if cur and c - np.mean([(q[0] + q[2]) / 2 for q in cur]) > 150: rows.append(cur); cur = []
    cur.append(b)
rows.append(cur)
boxes = [b for r in rows for b in sorted(r, key=lambda b: b[1])]
print('objects', len(boxes), 'names', len(names))
made = {}
for (y0, x0, y1, x1), name in zip(boxes, names):
    c = a[y0:y1, x0:x1]; m = fg[y0:y1, x0:x1]
    H, W = m.shape; tw, th = max(1, round(W / pitch)), max(1, round(H / pitch)); px, py = W / tw, H / th
    o = np.zeros((th, tw, 4), np.uint8)
    for j in range(th):
        for i in range(tw):
            ya, yb = int(j * py), max(int(j * py) + 1, int((j + 1) * py)); xa, xb = int(i * px), max(int(i * px) + 1, int((i + 1) * px))
            mm = m[ya:yb, xa:xb]
            if mm.mean() < 0.5: continue
            q = c[ya:yb, xa:xb][mm]; k = Counter(tuple((v // 10) * 10) for v in q).most_common(1)[0][0]
            sel = q[np.all((q // 10) * 10 == k, axis=1)]; o[j, i, :3] = sel.mean(0); o[j, i, 3] = 255
    # 혼자 떨어진 도트(가장자리 부스러기) 지움
    op = o[:, :, 3] > 0; pad = np.pad(op, 1)
    nb = pad[:-2, 1:-1].astype(int) + pad[2:, 1:-1] + pad[1:-1, :-2] + pad[1:-1, 2:]
    o[op & (nb <= 1), 3] = 0
    made[name] = o

# 숨 쉬는 동물 짝: 같은 크기 칸, 바닥을 맞추고 방석 가운데를 맞춤
def base_center(o):
    al = o[:, :, 3] > 0; ys = np.where(al.any(1))[0]; xs = np.where(al[ys[-3]:ys[-1] + 1].any(0))[0]
    return (xs[0] + xs[-1]) / 2
for na in [n for n in made if n.endswith('A') and n[:-1] + 'B' in made]:
    nb = na[:-1] + 'B'; A, B = made[na], made[nb]
    ca, cb = base_center(A), base_center(B); dx = round(ca - cb)
    left = max(0, dx); W = max(A.shape[1] + max(0, -dx), B.shape[1] + left); H = max(A.shape[0], B.shape[0])
    for n, o, x in ((na, A, max(0, -dx)), (nb, B, left)):
        c = np.zeros((H, W, 4), np.uint8); c[H - o.shape[0]:, x:x + o.shape[1]] = o; made[n] = c

# 선반 띠: 양 끝 모서리를 빼고, 끝과 끝이 가장 잘 이어지는 길이로 잘라 반복 그림을 만듦
for n in [n for n in made if n.endswith('Strip')]:
    a = made[n].astype(int); W = a.shape[1]; best = None
    for x0 in range(4, 14):
        for L in range(60, W - x0 - 4):
            d = sum(np.abs(a[:, x0 + k] - a[:, x0 + L + k]).sum() for k in (-1, 0, 1))
            if best is None or d - L * 30 < best[0]: best = (d - L * 30, x0, L)
    t = a[:, best[1]:best[1] + best[2]]; rows = np.where(t[:, :, 3].max(1) > 0)[0]
    made[n + 'Tile'] = t[rows[0]:].astype(np.uint8)
    del made[n]

for n, o in made.items():
    Image.fromarray(o).save(f'{out}/{n}.png'); print(n, o.shape[1], o.shape[0])

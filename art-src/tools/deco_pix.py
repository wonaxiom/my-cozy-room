# GPT 장식 시트 -> 조각별 도트 그림 (배경 흰색 제거, 같은 도트 크기로 줄임)
# 사용: python3 deco_pix.py 시트.webp 출력폴더 피치 이름1,이름2,...
import sys, numpy as np
from PIL import Image
from scipy import ndimage
from collections import Counter
src, out, pitch, names = sys.argv[1], sys.argv[2], float(sys.argv[3]), sys.argv[4].split(',')
a = np.array(Image.open(src).convert('RGB')).astype(int)
neutral = (a.min(2) > 236) & (a.max(2) - a.min(2) < 12)
lab0, _ = ndimage.label(neutral)
edge = set(np.unique(np.concatenate([lab0[0], lab0[-1], lab0[:, 0], lab0[:, -1]]))) - {0}
fg = ~np.isin(lab0, list(edge))
fg = ndimage.binary_opening(fg, iterations=1)
lab, n = ndimage.label(ndimage.binary_closing(fg, iterations=3))
objs = [(s, i + 1) for i, s in enumerate(ndimage.find_objects(lab)) if (lab[s] == i + 1).sum() > 120]
# 줄 단위 정렬
objs.sort(key=lambda o: (o[0][0].start + o[0][0].stop) / 2)
rows, cur = [], []
for o in objs:
    c = (o[0][0].start + o[0][0].stop) / 2
    if cur and c - np.mean([(q[0][0].start + q[0][0].stop) / 2 for q in cur]) > 150: rows.append(cur); cur = []
    cur.append(o)
rows.append(cur)
objs = [o for r in rows for o in sorted(r, key=lambda o: o[0][1].start)]
print('objects', len(objs), 'names', len(names))
for (s, li), name in zip(objs, names):
    c = a[s]; m = (lab[s] == li) & fg[s]
    H, W = m.shape; tw, th = max(1, round(W / pitch)), max(1, round(H / pitch)); px, py = W / tw, H / th
    o = np.zeros((th, tw, 4), np.uint8)
    for j in range(th):
        for i in range(tw):
            ya, yb = int(j * py), max(int(j * py) + 1, int((j + 1) * py)); xa, xb = int(i * px), max(int(i * px) + 1, int((i + 1) * px))
            mm = m[ya:yb, xa:xb]
            if mm.mean() < 0.5: continue
            q = c[ya:yb, xa:xb][mm]; k = Counter(tuple((v // 10) * 10) for v in q).most_common(1)[0][0]
            sel = q[np.all((q // 10) * 10 == k, axis=1)]; o[j, i, :3] = sel.mean(0); o[j, i, 3] = 255
    Image.fromarray(o).save(f'{out}/{name}.png'); print(name, tw, th)

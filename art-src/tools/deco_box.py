# GPT 장식 시트에서 정한 칸(box)을 잘라 도트로 (흩어진 조각이 있는 그림용: 김, 햇살, 폭죽)
# 사용: python3 deco_box.py 시트 출력폴더 피치 "이름:x1,y1,x2,y2;..."
import sys, numpy as np
from PIL import Image
from scipy import ndimage
from collections import Counter
src, out, pitch, spec = sys.argv[1], sys.argv[2], float(sys.argv[3]), sys.argv[4]
A = np.array(Image.open(src).convert('RGB')).astype(int)
for part in spec.split(';'):
    name, box = part.split(':'); x1, y1, x2, y2 = map(int, box.split(','))
    c = A[y1:y2, x1:x2]
    neutral = (c.min(2) > 236) & (c.max(2) - c.min(2) < 12)
    lab, _ = ndimage.label(neutral)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    m = ~np.isin(lab, list(edge))
    ys, xs = np.nonzero(m); c = c[ys.min():ys.max() + 1, xs.min():xs.max() + 1]; m = m[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    H, W = m.shape; tw, th = max(1, round(W / pitch)), max(1, round(H / pitch)); px, py = W / tw, H / th
    o = np.zeros((th, tw, 4), np.uint8)
    for j in range(th):
        for i in range(tw):
            ya, yb = int(j * py), max(int(j * py) + 1, int((j + 1) * py)); xa, xb = int(i * px), max(int(i * px) + 1, int((i + 1) * px))
            mm = m[ya:yb, xa:xb]
            if mm.mean() < 0.4: continue
            q = c[ya:yb, xa:xb][mm]; k = Counter(tuple((v // 10) * 10) for v in q).most_common(1)[0][0]
            sel = q[np.all((q // 10) * 10 == k, axis=1)]; o[j, i, :3] = sel.mean(0); o[j, i, 3] = 255
    Image.fromarray(o).save(f'{out}/{name}.png'); print(name, tw, th)

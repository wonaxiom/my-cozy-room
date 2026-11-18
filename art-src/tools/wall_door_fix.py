# 벽 그림(왼쪽 벽 기준)의 기울기를 벽 기울기(가로 2 : 세로 1)로 바로잡고 높이를 늘림
# 사용: python3 wall_door_fix.py 원본.png 출력.png 새높이(px) [가장자리줄수]
import sys, numpy as np
from PIL import Image
src, out, newh = sys.argv[1], sys.argv[2], int(sys.argv[3]); keep = int(sys.argv[4]) if len(sys.argv) > 4 else 3
a = np.array(Image.open(src).convert('RGBA')); al = a[:, :, 3] > 0; H, W = al.shape
slope = W * 0.5
res = np.zeros((int(slope) + newh + 2, W, 4), np.uint8)
for x in range(W):
    ys = np.nonzero(al[:, x])[0]
    if not len(ys): continue
    col = a[ys.min():ys.max() + 1, x]; n = len(col)
    k = min(keep, n // 3)
    mid = col[k:n - k]; m = newh - 2 * k
    idx = np.minimum((np.arange(m) * len(mid) / m).astype(int), len(mid) - 1)  # 가운데만 늘림 (테두리 두께 유지)
    col2 = np.concatenate([col[:k], mid[idx], col[n - k:]])
    top = int(round((W - 1 - x) * 0.5))
    res[top:top + len(col2), x] = col2
ys = np.nonzero(res[:, :, 3].any(1))[0]
Image.fromarray(res[ys.min():ys.max() + 1]).save(out)
print(out, Image.open(out).size)

# GPT 하찮 앉은 자세 시트 -> 글자 그림 (10칸 머리 기준)
import sys, numpy as np, colorsys
from PIL import Image
from scipy import ndimage
a = np.array(Image.open(sys.argv[1]).convert('RGB')).astype(int)
fg = ~((a.min(2) > 250) & (a.max(2) - a.min(2) < 5))  # 배경은 거의 순백, 흰 티셔츠(약 245)는 남김
lab, n = ndimage.label(ndimage.binary_closing(ndimage.binary_opening(fg, iterations=2), iterations=8))
objs = sorted([s for i, s in enumerate(ndimage.find_objects(lab)) if (lab[s] == i + 1).sum() > 5000], key=lambda s: s[1].start)
print(len(objs))
PAL = {'H': (80, 50, 38), 'S': (246, 210, 184), 'E': (40, 40, 40), 'B': (238, 160, 165), 'C': (247, 244, 238), 'P': (150, 150, 155), 'F': (70, 70, 70), 'K': (150, 110, 85), 'Z': (235, 195, 140), 'z': (90, 55, 35)}
NAMES = ['chairSit', 'chairBack', 'chairType', 'sitFloor', 'read', 'snack']
for s, name in zip(objs, NAMES):
    c = a[s]; m = fg[s]
    # 도트 크기: 머리카락(짙은 갈색) 가장 넓은 줄의 폭 / 8
    hair = (abs(c - np.array(PAL['H'])).sum(2) < 60)
    w = max(hair[y].sum() for y in range(hair.shape[0]))
    xs = np.nonzero(hair.any(0))[0]; ys = np.nonzero(hair.any(1))[0]
    p = (xs.max() - xs.min() + 1) / 8
    x0 = xs.min() - p; y0 = ys.min()   # 머리 맨 왼쪽 = 1칸, 맨 위 = 0줄 (첨부 원본과 같은 자리)
    H = int(round((c.shape[0] - y0) / p)) + 1; W = 12
    rows = []
    for j in range(H):
        row = ''
        for i in range(-1, W - 1):
            cx = int(x0 + (i + 0.5) * p); cy = int(y0 + (j + 0.5) * p)
            if cx < 0 or cy < 0 or cx >= c.shape[1] or cy >= c.shape[0]:
                row += '.'; continue
            win = c[max(0, cy - int(p / 4)):cy + int(p / 4) + 1, max(0, cx - int(p / 4)):cx + int(p / 4) + 1]
            wm = m[max(0, cy - int(p / 4)):cy + int(p / 4) + 1, max(0, cx - int(p / 4)):cx + int(p / 4) + 1]
            if wm.mean() < 0.5: row += '.'; continue
            px = np.median(win[wm], 0)
            row += min(PAL, key=lambda k: ((np.array(PAL[k]) - px) ** 2).sum())
        rows.append(row)
    while rows and set(rows[-1]) == {'.'}: rows.pop()
    print(name, round(p, 1))
    print('\n'.join(rows)); print()

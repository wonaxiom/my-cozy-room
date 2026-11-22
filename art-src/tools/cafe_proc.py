# 카페 미니게임 그림 정리: GPT 시트에서 배경을 지우고 칸을 나눈 뒤 1도트 = 1픽셀로 줄입니다.
# 원본: art-src/cafe/gpt-cups.webp, gpt-ingredients.webp, gpt-upgrades.webp, gpt-small.webp (칸 그림)
#       art-src/cafe/gpt-bg.webp, gpt-counter.webp (가게 배경, 카운터)
# 결과: img/cafe/*.png
# 실행: 저장소 맨 위 폴더에서  python3 art-src/tools/cafe_proc.py
import os
from collections import Counter, deque
import numpy as np
from PIL import Image

SRC = "art-src/cafe/"
OUT = "img/cafe/"

DRINKS = ["empty", "americano", "latte", "vanilla", "choco", "matcha"]

# 시트마다: 파일, 도트 하나의 픽셀 크기(외곽선 두께로 잰 값), 줄마다 칸 이름
SHEETS = [
    ("gpt-cups.webp", 9.5, [[f"hot-{d}" for d in DRINKS], [f"ice-{d}" for d in DRINKS]]),
    ("gpt-ingredients.webp", 13.5, [["shot", "water", "milk", "vanilla", "choco", "matcha"]]),
    ("gpt-upgrades.webp", 10.5, [["machine1", "machine2", "machine3", "chair", "sign"]]),
    ("gpt-small.webp", 17.5, [["trash", "tray", "heart", "angry"]]),
]

# 배경: 파일, 결과 이름, 가로 도트 수 (세로는 비율대로). 흰 여백은 잘라 냄
BACKGROUNDS = [
    ("gpt-bg.webp", "bg", 280),
    ("gpt-counter.webp", "counter", 280),
]


def alpha_mask(a):
    """투명 배경이면 그대로, 흰 배경이면 바깥에서부터 이어진 흰색만 지움 (컵 안쪽 크림색은 남김)"""
    if (a[:, :, 3] < 128).mean() > 0.2:
        return a[:, :, 3] > 128
    h, w = a.shape[:2]
    white = (a[:, :, :3].min(2) > 236) & (a[:, :, :3].max(2) - a[:, :, :3].min(2) < 14)
    bg = np.zeros((h, w), bool)
    q = deque()
    for y in range(h):
        for x in (0, w - 1):
            if white[y, x] and not bg[y, x]:
                bg[y, x] = True; q.append((y, x))
    for x in range(w):
        for y in (0, h - 1):
            if white[y, x] and not bg[y, x]:
                bg[y, x] = True; q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and white[ny, nx] and not bg[ny, nx]:
                bg[ny, nx] = True; q.append((ny, nx))
    return ~bg


def spans(filled, min_gap):
    """채워진 줄(또는 칸)의 구간 나누기. min_gap보다 짧은 빈틈은 이어 붙임"""
    out, start, gap = [], None, 0
    for i, v in enumerate(filled):
        if v:
            if start is None: start = i
            gap = 0
        elif start is not None:
            gap += 1
            if gap >= min_gap:
                out.append((start, i - gap + 1)); start = None; gap = 0
    if start is not None: out.append((start, len(filled)))
    return out


def pixelize(a, m, p):
    """p픽셀을 1도트로: 칸마다 가장 많은 색을 고름"""
    H, W = m.shape
    tw, th = max(1, round(W / p)), max(1, round(H / p))
    px, py = W / tw, H / th
    o = np.zeros((th, tw, 4), np.uint8)
    for j in range(th):
        for i in range(tw):
            ya, yb = int(j * py), max(int(j * py) + 1, int((j + 1) * py))
            xa, xb = int(i * px), max(int(i * px) + 1, int((i + 1) * px))
            mm = m[ya:yb, xa:xb].reshape(-1)
            if mm.mean() < 0.5: continue
            c = a[ya:yb, xa:xb, :3].reshape(-1, 3)[mm]
            key = Counter(tuple(v // 20) for v in c).most_common(1)[0][0]
            sel = c[np.all(c // 20 == key, axis=1)]
            o[j, i, :3] = sel.mean(0); o[j, i, 3] = 255
    return o


os.makedirs(OUT, exist_ok=True)
for fname, p, names in SHEETS:
    a = np.array(Image.open(SRC + fname).convert("RGBA")).astype(int)
    m = alpha_mask(a)
    rows = spans(m.any(1), int(p * 3))
    assert len(rows) == len(names), (fname, rows)
    for (y0, y1), row_names in zip(rows, names):
        cols = spans(m[y0:y1].any(0), int(p * 3))
        assert len(cols) == len(row_names), (fname, cols)
        cells = []
        for (x0, x1), name in zip(cols, row_names):
            cm = m[y0:y1, x0:x1]
            ys, xs = np.nonzero(cm)
            cy0, cy1, cx0, cx1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
            cells.append((name, pixelize(a[y0 + cy0:y0 + cy1, x0 + cx0:x0 + cx1], cm[cy0:cy1, cx0:cx1], p), cy1))
        # 한 줄은 같은 크기의 칸에, 바닥선을 맞춰 넣음
        bottom = max(b for _, _, b in cells)
        cw = max(o.shape[1] for _, o, _ in cells)
        ch = max(o.shape[0] + round((bottom - b) / p) for _, o, b in cells)
        for name, o, b in cells:
            cell = Image.new("RGBA", (cw, ch))
            cell.alpha_composite(Image.fromarray(o), ((cw - o.shape[1]) // 2, ch - o.shape[0] - round((bottom - b) / p)))
            cell.save(OUT + name + ".png")
        print(fname, "칸 크기", (cw, ch), [n for n, _, _ in cells])


for fname, name, tw in BACKGROUNDS:
    a = np.array(Image.open(SRC + fname).convert("RGBA")).astype(int)
    keep = a[:, :, :3].min(2).mean(1) < 235  # 거의 흰색인 위아래 여백 줄은 버림
    ys = np.nonzero(keep)[0]
    a = a[ys.min():ys.max() + 1]
    o = pixelize(a, np.ones(a.shape[:2], bool), a.shape[1] / tw)
    Image.fromarray(o).save(OUT + name + ".png")
    print(fname, "크기", o.shape[1], o.shape[0])

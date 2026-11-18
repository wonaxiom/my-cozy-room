# 가구 색상 변형: 그림에서 '주 재료' 칸만 골라 색을 바꿈 (그림자·밝은 부분은 그대로 살림)
# 사용: python3 recolor_variants.py  (아래 JOBS 목록대로 img/furn/ 에 <id>_<색>.png 를 만듦)
import colorsys, json, sys
import numpy as np
from PIL import Image
from collections import Counter

# 주 재료 고르는 조건 (색상 h 0~1, HSV 채도 s, 밝기 v)
MASKS = {
    'sofa': lambda h, s, v: 0.04 <= h <= 0.18 and s < 0.36 and v > 0.55,  # 크림색 천 (나무·쿠션 제외)
    'bed': lambda h, s, v: 0.5 <= h <= 0.72 and s > 0.12 and v > 0.3,      # 파란 이불
    'armchair': lambda h, s, v: 0.74 <= h <= 0.97 and s > 0.1 and v > 0.2, # 보라 천
}
# 주 재료처럼 보여도 다른 물건에 둘러싸인 칸은 빼기 (소파 위 분홍 담요의 밝은 줄무늬)
AROUND = {
    'sofa': lambda h, s, v: (h > 0.9 or h < 0.04) and s > 0.18,
}
# 색 목록: (이름, 대표색)
COLORS = {
    'sofa': [('navy', '#4f6a9a'), ('sage', '#9db58e'), ('gray', '#9a9aa2'), ('pink', '#eab4bc')],
    'bed': [('pink', '#f0a8b8'), ('mint', '#8fd0b8'), ('yellow', '#f0d27a'), ('gray', '#a9adb5')],
    'armchair': [('brown', '#9a6444'), ('green', '#6f9a66'), ('navy', '#4f6390'), ('mustard', '#d9aa45')],
}
FILES = {'sofa': ['sofa'], 'bed': ['bed', 'bedBack'], 'armchair': ['armchair']}

def hls_of(hexc):
    r, g, b = (int(hexc[i:i + 2], 16) / 255 for i in (1, 3, 5)); return colorsys.rgb_to_hls(r, g, b)

def recolor(px, base, target):
    _, lb, sb = colorsys.rgb_to_hls(*(np.array(base) / 255)); ht, lt, st = hls_of(target)
    _, l0, s0 = colorsys.rgb_to_hls(*(np.array(px) / 255))
    l = min(1, max(0, lt + (l0 - lb))); s = min(1, max(0, st + (s0 - sb) * 0.5))
    return tuple(int(round(c * 255)) for c in colorsys.hls_to_rgb(ht, l, s))

def variants(kind, path, outdir, tag):
    a = np.array(Image.open(path).convert('RGBA')); H, W = a.shape[:2]
    m = np.zeros((H, W), bool)
    for y in range(H):
        for x in range(W):
            if a[y, x, 3]:
                h, s, v = colorsys.rgb_to_hsv(*(a[y, x, :3] / 255)); m[y, x] = MASKS[kind](h, s, v)
    if kind in AROUND:
        o = np.zeros((H, W), bool)
        for y in range(H):
            for x in range(W):
                if a[y, x, 3]:
                    h, s_, v = colorsys.rgb_to_hsv(*(a[y, x, :3] / 255)); o[y, x] = AROUND[kind](h, s_, v)
        from scipy import ndimage  # 다른 물건 영역을 메워서(구멍·줄무늬 포함) 그 안은 제외
        o = ndimage.binary_fill_holes(ndimage.binary_closing(o, iterations=2))
        m &= ~o
    base = Counter(tuple(int(c) for c in a[y, x, :3]) for y, x in zip(*np.nonzero(m))).most_common(1)[0][0]
    for name, col in COLORS[kind]:
        b = a.copy(); cache = {}
        for y, x in zip(*np.nonzero(m)):
            k = tuple(int(c) for c in a[y, x, :3])
            if k not in cache: cache[k] = recolor(k, base, col)
            b[y, x, :3] = cache[k]
        Image.fromarray(b).save(f'{outdir}/{tag}_{name}.png')
    return int(m.sum())

if __name__ == '__main__':
    root = sys.argv[1] if len(sys.argv) > 1 else 'img/furn'
    for kind, files in FILES.items():
        for f in files:
            print(kind, f, variants(kind, f'{root}/{f}.png', root, f), variants(kind, f'{root}/s/{f}.png', f'{root}/s', f) if f != 'bedBack' else '')

# 일본풍 가구 그림 정리: GPT 시트에서 배경을 지우고 칸을 나눈 뒤 방 크기로 줄입니다.
# 원본: art-src/japanese/  결과: img/furn/(ver.세밀), img/furn/s/(ver.하찮, 1/3 크기)
# 가구 1칸 = 2.4픽셀이라 ver.세밀 폭은 data.js size의 (가로 + 세로) × 2.4 근처로 맞춥니다.
# 실행: 저장소 맨 위 폴더에서  python3 art-src/tools/japanese_proc.py
import os
import sys
from collections import deque

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from cafe_proc import alpha_mask, pixelize, spans  # noqa: E402

SRC = "art-src/japanese/"
OUT = "img/furn/"

# 시트: (파일, 도트 크기, 칸마다 가구 이름, ver.세밀 폭)
SHEETS = [
    ("gpt-yukata.webp", 11, ["yukataHanger", "yukataHanger_pink", "yukataHanger_white"], 41),
    ("gpt-temari.webp", 15, ["temari", "temari_navy", "temari_white"], 14),
]


def clear_checker(a, m):
    """GPT가 투명 대신 그려 넣은 체크무늬 배경 중, 바깥과 이어지지 않아 남은 곳(끈 안쪽 등)을 지움.
    체크무늬는 회색 무채색이고, 그림 속 흰색(옷깃 등)은 따뜻한 흰색이라 무채색 비율로 가림"""
    rgb = a[:, :, :3]
    white = (rgb.min(2) > 236) & (rgb.max(2) - rgb.min(2) < 14) & m
    h, w = white.shape
    seen = np.zeros_like(white)
    for y0 in range(h):
        for x0 in range(w):
            if not white[y0, x0] or seen[y0, x0]:
                continue
            q, pts = deque([(y0, x0)]), []
            seen[y0, x0] = True
            while q:
                y, x = q.popleft()
                pts.append((y, x))
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < h and 0 <= nx < w and white[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        q.append((ny, nx))
            ys, xs = np.array(pts).T
            px = rgb[ys, xs]
            if ((px.max(1) - px.min(1)) <= 4).mean() > 0.5:
                m[ys, xs] = False
    return m


def main():
    os.makedirs(OUT + "s", exist_ok=True)
    for fname, p, names, width in SHEETS:
        a = np.array(Image.open(SRC + fname).convert("RGBA")).astype(int)
        m = clear_checker(a, alpha_mask(a))
        (y0, y1), = spans(m.any(1), int(p * 3))
        cols = spans(m[y0:y1].any(0), int(p * 3))
        assert len(cols) == len(names), (fname, cols)
        for (x0, x1), name in zip(cols, names):
            cm = m[y0:y1, x0:x1]
            ys, xs = np.nonzero(cm)
            ca = a[y0 + ys.min():y0 + ys.max() + 1, x0 + xs.min():x0 + xs.max() + 1]
            cm = cm[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
            detail = pixelize(ca, cm, ca.shape[1] / width)
            simple = pixelize(ca, cm, ca.shape[1] / max(4, round(width / 3)))
            Image.fromarray(detail).save(OUT + name + ".png")
            Image.fromarray(simple).save(OUT + "s/" + name + ".png")
            print(name, "세밀", detail.shape[1], detail.shape[0], "하찮", simple.shape[1], simple.shape[0])


if __name__ == "__main__":
    main()

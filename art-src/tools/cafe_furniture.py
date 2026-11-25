# 카페 미니게임 그림으로 방 가구·소품 만들기
# 카페 시트(art-src/cafe/)의 칸을 방 크기에 맞게 다시 줄여서 img/furn/(ver.세밀)과 img/furn/s/(ver.하찮, 1/3 크기)에 넣습니다.
# 가구 1칸 = 2.4픽셀이라, ver.세밀 그림 폭은 data.js의 size (가로 + 세로) × 2.4 근처로 맞춥니다.
# 실행: 저장소 맨 위 폴더에서  python3 art-src/tools/cafe_furniture.py
import os
import sys
from collections import deque

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from cafe_proc import cells_of, pixelize  # noqa: E402

OUT = "img/furn/"

# 가구 id: (시트, 도트 크기, 줄, 칸, ver.세밀 폭)
# 머신·의자·입간판은 방 가구와 같은 아이소메트릭으로 다시 받은 그림 (gpt-furniture-iso.webp, 앞면이 오른쪽 아래)
# 컵·병은 둥근 물건이라 정면 그림(카페 미니게임 그림)을 그대로 씀
# 도트 크기는 칸을 나눌 때 빈틈 기준으로만 씀 (줄이는 크기는 마지막 폭으로 정함)
ITEMS = {
    "homeCoffeeMachine": ("gpt-furniture-iso.webp", 11, 0, 0, 19),
    "espressoMachine": ("gpt-furniture-iso.webp", 11, 0, 1, 24),
    "cafeCoffeeMachine": ("gpt-furniture-iso.webp", 11, 0, 2, 34),
    "cafeArmchair": ("gpt-furniture-iso.webp", 11, 0, 3, 43),
    "cafeSign": ("gpt-furniture-iso.webp", 11, 0, 4, 31),
    # 따뜻한 음료 (머그 폭 17), 아이스 음료 (컵 폭 13)
    "cafeLatteMug": ("gpt-cups.webp", 9.5, 0, 2, 17),
    "cafeAmericanoMug": ("gpt-cups.webp", 9.5, 0, 1, 17),
    "cafeChocoMug": ("gpt-cups.webp", 9.5, 0, 4, 17),
    "cafeMatchaMug": ("gpt-cups.webp", 9.5, 0, 5, 17),
    "cafeVanillaMug": ("gpt-cups2.webp", 9, 0, 1, 17),
    "cafeIceAmericano": ("gpt-cups.webp", 9.5, 1, 1, 13),
    "cafeIceLatte": ("gpt-cups.webp", 9.5, 1, 2, 13),
    "cafeIceMatcha": ("gpt-cups.webp", 9.5, 1, 5, 13),
    "cafeIceVanilla": ("gpt-cups2.webp", 9, 1, 1, 13),
    "cafeIceChoco": ("gpt-cups2.webp", 9, 1, 2, 13),
    # 휘핑크림 올린 음료
    "cafeMatchaWhipMug": ("gpt-cups-whip.webp", 9, 0, 0, 17),
    "cafeChocoWhipMug": ("gpt-cups-whip.webp", 9, 0, 1, 17),
    "cafeIceMatchaWhip": ("gpt-cups-whip.webp", 9, 1, 0, 14),
    "cafeIceChocoWhip": ("gpt-cups-whip.webp", 9, 1, 2, 14),
    # 재료 (에스프레소 잔, 물병, 우유, 시럽, 말차 가루, 휘핑크림 통)
    "cafeEspresso": ("gpt-ingredients.webp", 13.5, 0, 0, 10),
    "cafeWaterPitcher": ("gpt-ingredients.webp", 13.5, 0, 1, 15),
    "cafeMilk": ("gpt-ingredients.webp", 13.5, 0, 2, 12),
    "cafeVanillaSyrup": ("gpt-ingredients.webp", 13.5, 0, 3, 11),
    "cafeChocoSyrup": ("gpt-ingredients.webp", 13.5, 0, 4, 11),
    "cafeMatchaJar": ("gpt-ingredients.webp", 13.5, 0, 5, 12),
    "cafeWhipCan": ("gpt-whip-can.png", 16.5, 0, 0, 9),
    # 쟁반, 휴지통
    "cafeTray": ("gpt-small.webp", 17.5, 0, 1, 22),
    "cafeTrash": ("gpt-small.webp", 17.5, 0, 0, 14),
}

# 벽 장식: 카페 가게 배경(gpt-bg.webp)에서 잘라 낸 정면 그림을 오른쪽 벽 각도(가로 2칸에 세로 1칸)로 기울임
# 가구 id: (자를 범위 [왼쪽, 위, 오른쪽, 아래], ver.세밀 앞면 폭)
# 그림 폭 = 앞면 폭 + 2 (data.js size의 벽 따라 길이 + 1) × 2.4 근처
WALL_ITEMS = {
    "cafeMenuBoard": ((740, 20, 1290, 350), 46),
    "cafeHangingPlant": ((302, 16, 480, 320), 22),
    "cafeFlowerShelf": ((1315, 80, 1525, 255), 27),
}


def wall_mask(c):
    """가게 벽(살구색, 그림자 포함)을 바깥에서부터 지우고, 가장 큰 덩어리와 비슷한 크기의 덩어리만 남김"""
    h, w = c.shape[:2]
    r, g, b = c[:, :, 0], c[:, :, 1], c[:, :, 2]
    wall = (r > 212) & (r - b > 68) & (r - b < 110) & (r - g > 28) & (r - g < 64) & (g > 150)
    bg = np.zeros((h, w), bool)
    q = deque()
    for y in range(h):
        for x in range(w):
            if (y in (0, h - 1) or x in (0, w - 1)) and wall[y, x]:
                bg[y, x] = True
                q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and wall[ny, nx] and not bg[ny, nx]:
                bg[ny, nx] = True
                q.append((ny, nx))
    m = ~bg
    # 덩어리 나누기 (빛줄기 자국 같은 작은 조각 지우기)
    label = np.zeros((h, w), int)
    sizes = [0]
    for y in range(h):
        for x in range(w):
            if not m[y, x] or label[y, x]:
                continue
            n = len(sizes)
            label[y, x] = n
            q.append((y, x))
            cnt = 0
            while q:
                cy, cx = q.popleft()
                cnt += 1
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    ny, nx = cy + dy, cx + dx
                    if 0 <= ny < h and 0 <= nx < w and m[ny, nx] and not label[ny, nx]:
                        label[ny, nx] = n
                        q.append((ny, nx))
            sizes.append(cnt)
    keep = [i for i, s in enumerate(sizes) if i and s >= max(sizes) * 0.02]
    return np.isin(label, keep)


def shear_right_wall(o):
    """정면 그림을 오른쪽 벽 각도로: 오른쪽으로 2픽셀 갈 때마다 1픽셀 내려감"""
    h, w = o.shape[:2]
    out = np.zeros((h + (w + 1) // 2, w, 4), np.uint8)
    for x in range(w):
        dy = x // 2
        out[dy:dy + h, x] = o[:, x]
    return out


def crop(o):
    ys, xs = np.nonzero(o[:, :, 3])
    return o[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


def save_pair(name, detail, simple):
    Image.fromarray(detail).save(OUT + name + ".png")
    Image.fromarray(simple).save(OUT + "s/" + name + ".png")
    print(name, "세밀", detail.shape[1], detail.shape[0], "하찮", simple.shape[1], simple.shape[0])


def main():
    os.makedirs(OUT + "s", exist_ok=True)
    sheets = {}
    for name, (fname, p, row, col, width) in ITEMS.items():
        if (fname, p) not in sheets:
            sheets[(fname, p)] = cells_of(fname, p)
        cells = [c for c in sheets[(fname, p)] if c[0] == row]
        _, a, m = cells[col]
        detail = pixelize(a, m, a.shape[1] / width)
        simple = pixelize(a, m, a.shape[1] / max(4, round(width / 3)))
        save_pair(name, detail, simple)

    bg = np.array(Image.open("art-src/cafe/gpt-bg.webp").convert("RGBA")).astype(int)
    for name, ((x0, y0, x1, y1), width) in WALL_ITEMS.items():
        c = bg[y0:y1, x0:x1]
        m = wall_mask(c)
        detail = crop(shear_right_wall(pixelize(c, m, c.shape[1] / width)))
        simple = crop(shear_right_wall(pixelize(c, m, c.shape[1] / max(4, round(width / 3)))))
        save_pair(name, detail, simple)


if __name__ == "__main__":
    main()

# 카페 미니게임 그림으로 방 가구·소품 만들기
# 카페 시트(art-src/cafe/)의 칸을 방 크기에 맞게 다시 줄여서 img/furn/(ver.세밀)과 img/furn/s/(ver.하찮, 1/3 크기)에 넣습니다.
# 가구 1칸 = 2.4픽셀이라, ver.세밀 그림 폭은 data.js의 size (가로 + 세로) × 2.4 근처로 맞춥니다.
# 실행: 저장소 맨 위 폴더에서  python3 art-src/tools/cafe_furniture.py
import os
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from cafe_proc import cells_of, pixelize  # noqa: E402

OUT = "img/furn/"

# 가구 id: (시트, 도트 크기, 줄, 칸, ver.세밀 폭)
ITEMS = {
    "homeCoffeeMachine": ("gpt-upgrades.webp", 10.5, 0, 0, 19),
    "espressoMachine": ("gpt-upgrades.webp", 10.5, 0, 1, 24),
    "cafeCoffeeMachine": ("gpt-upgrades.webp", 10.5, 0, 2, 34),
    "cafeArmchair": ("gpt-upgrades.webp", 10.5, 0, 3, 43),
    "cafeSign": ("gpt-upgrades.webp", 10.5, 0, 4, 31),
    "cafeLatteMug": ("gpt-cups.webp", 9.5, 0, 2, 17),
    "cafeIceAmericano": ("gpt-cups.webp", 9.5, 1, 1, 13),
    "cafeIceMatcha": ("gpt-cups.webp", 9.5, 1, 5, 13),
}


def main():
    os.makedirs(OUT + "s", exist_ok=True)
    sheets = {}
    for name, (fname, p, row, col, width) in ITEMS.items():
        if fname not in sheets:
            sheets[fname] = cells_of(fname, p)
        cells = [c for c in sheets[fname] if c[0] == row]
        _, a, m = cells[col]
        detail = pixelize(a, m, a.shape[1] / width)
        simple = pixelize(a, m, a.shape[1] / max(4, round(width / 3)))
        Image.fromarray(detail).save(OUT + name + ".png")
        Image.fromarray(simple).save(OUT + "s/" + name + ".png")
        print(name, "세밀", detail.shape[1], detail.shape[0], "하찮", simple.shape[1], simple.shape[0])


if __name__ == "__main__":
    main()

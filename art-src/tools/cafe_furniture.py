# 카페 미니게임 그림으로 방 가구·소품 만들기
# 카페 시트(art-src/cafe/)의 칸을 방 크기에 맞게 다시 줄여서 img/furn/(ver.세밀)과 img/furn/s/(ver.하찮, 1/3 크기)에 넣습니다.
# 가구 1칸 = 2.4픽셀이라, ver.세밀 그림 폭은 data.js의 size (가로 + 세로) × 2.4 근처로 맞춥니다.
# 실행: 저장소 맨 위 폴더에서  python3 art-src/tools/cafe_furniture.py
import os
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from cafe_proc import SRC, alpha_mask, pixelize, spans  # noqa: E402
from japanese_proc import clear_checker  # noqa: E402

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
    # 방 꾸미기용으로 따로 받은 카페 가구 (gpt-room-furniture.webp, 앞면이 오른쪽 아래)
    "cafeCounter": ("gpt-room-furniture.webp", 11, 0, 0, 67),
    "cafeRoundTable": ("gpt-room-furniture.webp", 11, 0, 1, 38),
    "cafeChair": ("gpt-room-furniture.webp", 11, 0, 2, 29),
    "cafeBarStool": ("gpt-room-furniture.webp", 11, 0, 3, 24),
    "cakeShowcase": ("gpt-room-furniture.webp", 11, 0, 4, 50),
    "coffeeBeanSack": ("gpt-room-furniture.webp", 11, 0, 5, 24),
    # 카페 벽 장식 (gpt-room-wall.webp, 오른쪽 벽에 걸린 모습. GPT가 그려 넣은 체크무늬 배경을 지움)
    "cafeMenuBoard": ("gpt-room-wall.webp", 11, 0, 0, 45),
    "cafeHangingPlant": ("gpt-room-wall.webp", 11, 0, 1, 19),
    "cafeFlowerShelf": ("gpt-room-wall.webp", 11, 0, 2, 24),
}

# 체크무늬 배경을 지워야 하는 시트
CHECKER = {"gpt-room-wall.webp"}


def cells_of(fname, p):
    """시트를 줄과 칸으로 나눠 [(줄 번호, 칸 그림, 칸 마스크)] (cafe_proc.cells_of에 체크무늬 지우기를 더함)"""
    a = np.array(Image.open(SRC + fname).convert("RGBA")).astype(int)
    m = alpha_mask(a)
    if fname in CHECKER:
        m = clear_checker(a, m)
    out = []
    for r, (y0, y1) in enumerate(spans(m.any(1), int(p * 3))):
        for x0, x1 in spans(m[y0:y1].any(0), int(p * 3)):
            cm = m[y0:y1, x0:x1]
            ys, xs = np.nonzero(cm)
            out.append((r, a[y0 + ys.min():y0 + ys.max() + 1, x0 + xs.min():x0 + xs.max() + 1],
                        cm[ys.min():ys.max() + 1, xs.min():xs.max() + 1]))
    return out


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


if __name__ == "__main__":
    main()

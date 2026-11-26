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

# GPT가 가로 2칸에 세로 1칸보다 완만하게 그린 그림: 줄이기 전에 기울기를 게임에 맞춤
# - FIX_SHEAR: 판 하나로 된 그림(벽 장식, 입간판)을 칸마다 세로로 밀어 기울기를 맞춤
#   값: (맞출 기울기, 재는 방법). 기울기 0.5는 오른쪽으로 내려감(오른쪽 벽), -0.5는 오른쪽으로 올라감(앞면이 오른쪽 아래)
#   재는 방법 "edge"는 아래 테두리 전체, "feet"는 양쪽 끝 발(왼쪽·오른쪽 1/3에서 가장 아래 점)을 이은 선
# - FIX_BOX: 상자 가구의 양쪽 옆면 바닥선 기울기를 재서 옆면과 윗면을 다시 펼침. 값은 옆면 가운데를 늘려 더 높일 픽셀 수 (ver.세밀 기준)
FIX_SHEAR = {
    "cafeMenuBoard": (0.5, "edge"),
    "cafeFlowerShelf": (0.5, "edge"),
    "cafeSign": (-0.5, "feet"),
}
FIX_BOX = {
    "cafeCounter": 8,  # 카운터를 바 스툴보다 조금 높게 (약 9칸 -> 12칸)
    "cafeCoffeeMachine": 0,
    "espressoMachine": 0,
    "cakeShowcase": 0,
    "cafeArmchair": 0,
}
ISO = 0.5  # 게임의 바닥선 기울기 (가로 2칸에 세로 1칸)


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


def column_edges(m):
    """칸마다 그림의 맨 위, 맨 아래 줄 (빈 칸은 -1)"""
    has = m.any(0)
    top = np.where(has, m.argmax(0), -1)
    bot = np.where(has, m.shape[0] - 1 - m[::-1].argmax(0), -1)
    return top, bot


def slope(bot, x0, x1):
    xs = np.arange(int(x0), int(x1))
    return np.polyfit(xs, bot[xs], 1)[0]


def remap(a, m, src_row, h):
    """칸마다 새 줄 -> 원래 줄 (src_row[x](새 줄들), 없으면 nan)로 다시 그림"""
    W = m.shape[1]
    oa = np.zeros((h, W, 4), int)
    om = np.zeros((h, W), bool)
    rows = np.arange(h)
    for x in range(W):
        src = src_row(x, rows)
        ok = ~np.isnan(src)
        r = np.clip(np.round(src[ok]).astype(int), 0, m.shape[0] - 1)
        oa[rows[ok], x] = a[r, x]
        om[rows[ok], x] = m[r, x]
    ys, xs = np.nonzero(om)
    y0 = ys.min()
    return oa[y0:], om[y0:]


def fix_shear(a, m, target, how):
    """판 그림: 잰 기울기 s를 target으로 (오른쪽으로 갈수록 (target - s)만큼 더 내려감)"""
    H, W = m.shape
    _, bot = column_edges(m)
    if how == "edge":
        s = slope(bot, W * 0.15, W * 0.75)
    else:
        third = W // 3
        xl = int(np.argmax(bot[:third]))
        xr = W - third + int(np.argmax(bot[W - third:]))
        s = (bot[xr] - bot[xl]) / (xr - xl)
    d = target - s
    off = int(np.ceil(max(0, -d * W)))
    pad = int(np.ceil(abs(d) * W)) + 2

    def src_row(x, rows):
        src = rows - x * d - off
        return np.where((src >= 0) & (src < H), src, np.nan)

    return remap(a, m, src_row, H + pad)


def fix_box(a, m, lift=0):
    """상자 가구: 앞 모서리(가장 아래 칸)를 기준으로 왼쪽·오른쪽 옆면의 기울기를 ISO로 맞춤.
    옆면은 칸마다 위로 올리고, 윗면은 앞 모서리와 뒤 모서리 사이를 늘려서 펼침.
    lift: 옆면 가운데 줄을 이만큼 되풀이해 가구를 높임 (원본 픽셀)"""
    H, W = m.shape
    top, bot = column_edges(m)
    xs = np.nonzero(m.any(0))[0]
    xl, xr = xs.min(), xs.max()
    c = int(np.median(np.nonzero(bot == bot.max())[0]))
    sl = slope(bot, xl + (c - xl) * 0.4, xl + (c - xl) * 0.75)      # 왼쪽 옆면: 오른쪽으로 내려감
    sr = -slope(bot, c + (xr - c) * 0.25, xr - (xr - c) * 0.25)     # 오른쪽 옆면: 오른쪽으로 올라감
    dl, dr = ISO - sl, ISO - sr
    yl = top[xl]                                   # 윗면 왼쪽 꼭짓점
    yc = yl + sl * (c - xl)                        # 윗면 앞 꼭짓점
    yb = bot[c]                                    # 바닥 앞 꼭짓점
    xb = xl + (xr - c)                             # 윗면 뒤 꼭짓점

    def front(x):  # 윗면 앞 모서리 줄, 올릴 양
        return (yc + sl * (x - c), dl * (c - x)) if x < c else (yc - sr * (x - c), dr * (x - c))

    def back(x):   # 윗면 뒤 모서리 올릴 양
        return dl * (c - xl) + dr * (x - xl) if x <= xb else dr * (xr - c) + dl * (xr - x)

    pad = int(np.ceil(max(back(x) for x in range(W)))) + lift + 2

    def src_row(x, rows):
        yf, sf = front(x)
        sb = back(x) + lift
        yt = top[x]
        ym = yf + (yb - yc) * 0.5              # 옆면 가운데 줄 (여기를 되풀이)
        r = rows - pad
        out = np.full(len(rows), np.nan)
        low = r >= ym - sf
        out[low] = r[low] + sf
        mid = (r >= ym - sf - lift) & ~low
        out[mid] = ym
        up = (r >= yf - sf - lift) & ~low & ~mid
        out[up] = r[up] + sf + lift
        side = low | mid | up
        if yt >= 0 and yf > yt:
            nt, nf = yt - sb, yf - sf - lift   # 새 윗면 범위
            k = (nf - nt) / (yf - yt)
            on = (r >= nt) & ~side
            out[on] = yf - (nf - r[on]) / k
        return out

    return remap(a, m, src_row, H + pad)


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
        if name in FIX_SHEAR:
            a, m = fix_shear(a, m, *FIX_SHEAR[name])
        if name in FIX_BOX:
            a, m = fix_box(a, m, round(FIX_BOX[name] * a.shape[1] / width))
        detail = pixelize(a, m, a.shape[1] / width)
        simple = pixelize(a, m, a.shape[1] / max(4, round(width / 3)))
        save_pair(name, detail, simple)


if __name__ == "__main__":
    main()

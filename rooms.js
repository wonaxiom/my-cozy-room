// =============================================================
// rooms.js — 방 종류
// 방을 추가하고 싶으면 ROOMS 목록에 하나를 더 적으면 됩니다.
// =============================================================
//
// shape    : 방 모양. "box"(네모난 방) / "attic"(삼각 지붕 다락방)
// price    : 방을 여는 가격 (0이면 처음부터 열려 있음)
// colors   : 이 방의 틀 색 (벽 윗면, 모서리, 걸레받이, 창틀 등)
// wallpaper: 기본 벽지 (아래 WALLPAPERS의 id)
// floor    : 기본 바닥 (아래 FLOORS의 id)
// window   : 창문. style은 "curtain"(커튼) / "shoji"(미닫이 창) / "round"(둥근 창)
//            네모 창은 왼쪽 벽의 y1~y2, z1~z2 범위 / 둥근 창은 중심(cy, cz)과 반지름(r)
// clock    : 벽시계 위치 [x, y, z] (없애려면 null)
// layout   : 처음 시작할 때 놓여 있는 가구. id는 data.js의 FURNITURE 이름, x·y·z는 위치
//            (처음 한 번만 쓰이고, 이후에는 직접 꾸민 배치가 저장됩니다)

const ROOMS = [
  {
    id: "studio",
    name: "원룸",
    shape: "box",
    price: 0,
    wallHeight: 44,
    colors: {},
    wallpaper: "creamDots",
    floor: "oak",
    window: { style: "curtain", y1: 14, y2: 38, z1: 16, z2: 36 },
    clock: [8, 0, 33],
    layout: [
      { id: "mattress", x: 38, y: 1, z: 0 },
      { id: "lamp", x: 32, y: 2, z: 0 },
    ],
  },
  {
    id: "tatami",
    name: "다다미방",
    shape: "box",
    wallHeight: 44,
    price: 1000,
    colors: {
      wallTop: "#7a5236",
      wallEdge: "#5a3b26",
      baseboard: "#6e4a30",
      floorEdge: "#6e4a30",
      windowFrame: "#6e4a30",
    },
    wallpaper: "plasterBeams",
    floor: "tatami",
    window: { style: "shoji", y1: 12, y2: 44, z1: 6, z2: 30 },
    clock: null,
    layout: [],
  },
  {
    id: "attic",
    name: "다락방",
    shape: "attic",
    kneeHeight: 12,
    peakHeight: 56,
    price: 1000,
    colors: {
      wallTop: "#8a6244",
      wallEdge: "#6b4a33",
      baseboard: "#8a6244",
      floorEdge: "#6b4a33",
      windowFrame: "#7a5034",
    },
    wallpaper: "woodPlanks",
    floor: "darkWood",
    window: { style: "round", cy: 32, cz: 31, r: 9 },
    clock: [0, 52, 17],
    layout: [],
  },
];

// =============================================================
// 벽지와 바닥
// price가 0이면 처음부터 가지고 있는 기본 상품입니다.
// pattern(무늬) — 벽지: "dots" 점 / "stripes" 줄무늬 / "planks" 판자 / "beams" 나무 기둥 / "plain" 무늬 없음
//                바닥: "wood" 나무 / "tatami" 다다미 / "tile" 체크 타일 / "carpet" 카펫
// colors: 벽지는 wallLeft(왼쪽 벽), wallRight(오른쪽 벽), wallDot(무늬)
//         바닥은 floor(바닥), floorLine(무늬)
// =============================================================

const WALLPAPERS = [
  { id: "creamDots", name: "크림 점무늬", price: 0, pattern: "dots",
    colors: { wallLeft: "#eadcc6", wallRight: "#e0cfb5", wallDot: "#d6c3a6" } },
  { id: "plasterBeams", name: "회벽과 기둥", price: 0, pattern: "beams",
    colors: { wallLeft: "#efe4cc", wallRight: "#e5d8bc", wallDot: "#6e4a30" } },
  { id: "woodPlanks", name: "나무 판자", price: 0, pattern: "planks",
    colors: { wallLeft: "#dcc7a5", wallRight: "#cfb894", wallDot: "#c7ae88" } },
  { id: "whitePlain", name: "하얀 벽", price: 120, pattern: "plain",
    colors: { wallLeft: "#f4f1ec", wallRight: "#e9e4dc", wallDot: "#e0dad1" } },
  { id: "mintStripes", name: "민트 줄무늬", price: 150, pattern: "stripes",
    colors: { wallLeft: "#d9eadf", wallRight: "#cadfd1", wallDot: "#bcd6c5" } },
  { id: "pinkDots", name: "분홍 점무늬", price: 150, pattern: "dots",
    colors: { wallLeft: "#f3dcd8", wallRight: "#ebcfca", wallDot: "#e0b7b0" } },
  { id: "navyPlain", name: "남색 벽", price: 180, pattern: "plain",
    colors: { wallLeft: "#4a5a7a", wallRight: "#3f4e6c", wallDot: "#56678a" } },
];

const FLOORS = [
  { id: "oak", name: "원목 마루", price: 0, pattern: "wood",
    colors: { floor: "#b5845a", floorLine: "#9c6d47" } },
  { id: "tatami", name: "다다미", price: 0, pattern: "tatami",
    colors: {} },
  { id: "darkWood", name: "짙은 마루", price: 0, pattern: "wood",
    colors: { floor: "#a97a52", floorLine: "#916443" } },
  { id: "checkTile", name: "체크 타일", price: 150, pattern: "tile",
    colors: { floor: "#efe9df", floorLine: "#c9bfb0" } },
  { id: "beigeCarpet", name: "베이지 카펫", price: 150, pattern: "carpet",
    colors: { floor: "#d8c7ad", floorLine: "#cbb89c" } },
  { id: "walnut", name: "월넛 마루", price: 180, pattern: "wood",
    colors: { floor: "#7d5638", floorLine: "#68462d" } },
];

// =============================================================
// rooms.js — 방 종류
// 방을 추가하고 싶으면 ROOMS 목록에 하나를 더 적으면 됩니다.
// =============================================================
//
// shape    : 방 모양. "box"(네모난 방) / "attic"(삼각 지붕 다락방) / "round"(원형 탑방) / "train"(기차 객실)
// width, depth : 바닥 크기 (기본 64 x 64)
// offset   : 화면에서 방 위치를 옮기는 값 [좌우, 위아래] (방이 가운데 오도록)
// price    : 방을 여는 가격 (0이면 처음부터 열려 있음)
// colors   : 이 방의 틀 색 (벽 윗면, 모서리, 걸레받이, 창틀 등)
// wallpaper: 기본 벽지 (아래 WALLPAPERS의 id)
// floor    : 기본 바닥 (아래 FLOORS의 id)
// decor    : 처음부터 벽에 걸려 있는 창문·시계 (꾸미기에서 옮기거나 보관함에 넣을 수 있음)
//            flip: true면 왼쪽 벽, 아니면 오른쪽 벽
// windows  : 옮길 수 없는 창문 (원형 탑방처럼 둥근 벽에 붙은 것). style은 "curtain"(커튼) / "shoji"(미닫이 창) / "round"(둥근 창) / "train"(기차 창)
//            wall은 "left"(왼쪽 벽) / "right"(오른쪽 벽) / "round"(둥근 벽)
//            네모 창은 벽을 따라 y1~y2, 높이 z1~z2 범위 / 둥근 창은 중심(cy, cz)과 반지름(r)
// clock    : 옮길 수 없는 벽시계 위치 [x, y, z] (둥근 벽용, 없으면 null)
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
    windows: [],
    clock: null,
    decor: [
      { id: "windowCurtain", x: 0, y: 9, z: 13, flip: true },
      { id: "wallClock", x: 3, y: 0, z: 28 },
    ],
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
    windows: [],
    clock: null,
    decor: [{ id: "windowShoji", x: 0, y: 11, z: 4, flip: true }],
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
    windows: [],
    clock: null,
    decor: [
      { id: "windowRound", x: 0, y: 21, z: 17, flip: true },
      { id: "wallClock", x: 0, y: 47, z: 9, flip: true },
    ],
    layout: [],
  },
  {
    id: "tower",
    name: "원형 탑방",
    shape: "round",
    price: 1500,
    wallHeight: 46,
    colors: {
      wallTop: "#a39a90",
      wallEdge: "#857b72",
      baseboard: "#857b72",
      floorEdge: "#6b4a33",
      windowFrame: "#7a5034",
    },
    wallpaper: "stoneBricks",
    floor: "darkWood",
    windows: [{ style: "curtain", wall: "round", y1: 22, y2: 40, z1: 18, z2: 36 }],
    clock: [28.6, 0.8, 35],
    layout: [],
  },
  {
    id: "train",
    name: "기차 객실",
    shape: "train",
    price: 1500,
    width: 64,
    depth: 28,
    wallHeight: 38,
    offset: [-18, 4],
    colors: {
      wallTop: "#2f5d50",
      wallEdge: "#24493f",
      baseboard: "#5a3b26",
      floorEdge: "#24493f",
      windowFrame: "#ece5d6",
    },
    wallpaper: "trainPanel",
    floor: "redCarpet",
    windows: [],
    clock: null,
    decor: [
      { id: "windowTrain", x: 5, y: 0, z: 10 },
      { id: "windowTrain", x: 25, y: 0, z: 10 },
      { id: "windowTrain", x: 45, y: 0, z: 10 },
    ],
    layout: [],
  },
];

// =============================================================
// 벽지와 바닥
// price가 0이면 처음부터 가지고 있는 기본 상품입니다.
// pattern(무늬) — 벽지: "dots" 점 / "stripes" 줄무늬 / "planks" 판자 / "beams" 나무 기둥
//                      "panel" 아래쪽 나무 판넬 / "bricks" 벽돌 / "plain" 무늬 없음
//                바닥: "wood" 나무 / "tatami" 다다미 / "tile" 체크 타일 / "carpet" 카펫
// colors: 벽지는 wallLeft(왼쪽 벽), wallRight(오른쪽 벽), wallDot(무늬)
//         바닥은 floor(바닥), floorLine(무늬)
// =============================================================

// ---- 같은 방 여러 개 ----
// 가진 방은 같은 모양의 방을 더 살 수 있음 (따로 꾸미는 방). id는 "원래방id~번호" (예: "studio~2"), 이름은 "원룸 2"
// 추가 방은 save.ownedRooms에 그 id로 들어가고, 배치·벽지·바닥도 그 id로 따로 저장됨
const ROOM_COPY_MAX = 3;          // 같은 방을 가질 수 있는 개수 (원래 방 포함)
const ROOM_COPY_FREE_PRICE = 500; // 원래 무료인 방(원룸)을 하나 더 살 때 가격. 나머지는 원래 가격

const roomCopyPrice = (base) => base.price || ROOM_COPY_FREE_PRICE;

// 추가 방 정보 (원래 방을 그대로 쓰고 id·이름·가격만 다름, 처음 배치는 비어 있음). 같은 id는 같은 객체를 돌려줌
const roomCopies = {};
function roomCopy(id) {
  if (roomCopies[id]) return roomCopies[id];
  const m = /^([a-zA-Z]+)~(\d+)$/.exec(String(id));
  const base = m && ROOMS.find((r) => r.id === m[1]);
  const no = m ? Number(m[2]) : 0;
  if (!base || no < 2 || no > ROOM_COPY_MAX) return null;
  return (roomCopies[id] = Object.assign({}, base, { id, name: `${base.name} ${no}`, base: base.id, copyNo: no, price: roomCopyPrice(base), layout: [] }));
}

// id로 방 찾기 (추가 방 포함)
const roomById = (id) => ROOMS.find((r) => r.id === id) || roomCopy(id);

// 원래 방 목록 사이사이에 가진 추가 방을 끼운 목록 (원룸, 원룸 2, 다다미방, …)
function roomList(owned) {
  const list = [];
  for (const r of ROOMS) {
    list.push(r);
    for (let n = 2; n <= ROOM_COPY_MAX; n++) {
      if (owned.includes(`${r.id}~${n}`)) list.push(roomCopy(`${r.id}~${n}`));
    }
  }
  return list;
}

const WALLPAPERS = [
  { id: "creamDots", name: "크림 점무늬", price: 0, pattern: "dots",
    colors: { wallLeft: "#eadcc6", wallRight: "#e0cfb5", wallDot: "#d6c3a6" } },
  { id: "plasterBeams", name: "회벽과 기둥", price: 0, pattern: "beams",
    colors: { wallLeft: "#efe4cc", wallRight: "#e5d8bc", wallDot: "#6e4a30" } },
  { id: "woodPlanks", name: "나무 판자", price: 0, pattern: "planks",
    colors: { wallLeft: "#dcc7a5", wallRight: "#cfb894", wallDot: "#c7ae88" } },
  { id: "stoneBricks", name: "돌 벽", price: 0, pattern: "bricks",
    colors: { wallLeft: "#d8d0c4", wallRight: "#cbc2b5", wallDot: "#b6ab9c" } },
  { id: "trainPanel", name: "객실 판넬", price: 0, pattern: "panel",
    colors: { wallLeft: "#efe6d2", wallRight: "#e5dbc5", wallDot: "#8a5a3c" } },
  { id: "whitePlain", name: "하얀 벽", price: 120, pattern: "plain",
    colors: { wallLeft: "#f4f1ec", wallRight: "#e9e4dc", wallDot: "#e0dad1" } },
  { id: "mintStripes", name: "민트 줄무늬", price: 150, pattern: "stripes",
    colors: { wallLeft: "#d9eadf", wallRight: "#cadfd1", wallDot: "#bcd6c5" } },
  { id: "pinkDots", name: "분홍 점무늬", price: 150, pattern: "dots",
    colors: { wallLeft: "#f3dcd8", wallRight: "#ebcfca", wallDot: "#e0b7b0" } },
  { id: "creamPanel", name: "크림 판넬", price: 150, pattern: "panel",
    colors: { wallLeft: "#f1e8d6", wallRight: "#e8dcc6", wallDot: "#b08a66" } },
  { id: "navyPlain", name: "남색 벽", price: 180, pattern: "plain",
    colors: { wallLeft: "#4a5a7a", wallRight: "#3f4e6c", wallDot: "#56678a" } },
  { id: "redBricks", name: "붉은 벽돌", price: 180, pattern: "bricks",
    colors: { wallLeft: "#c98c74", wallRight: "#bd806a", wallDot: "#a86a56" } },
];

const FLOORS = [
  { id: "oak", name: "원목 마루", price: 0, pattern: "wood",
    colors: { floor: "#b5845a", floorLine: "#9c6d47" } },
  { id: "tatami", name: "다다미", price: 0, pattern: "tatami",
    colors: {} },
  { id: "darkWood", name: "짙은 마루", price: 0, pattern: "wood",
    colors: { floor: "#a97a52", floorLine: "#916443" } },
  { id: "redCarpet", name: "붉은 카펫", price: 0, pattern: "carpet",
    colors: { floor: "#9a4a43", floorLine: "#87403a" } },
  { id: "checkTile", name: "체크 타일", price: 150, pattern: "tile",
    colors: { floor: "#efe9df", floorLine: "#c9bfb0" } },
  { id: "beigeCarpet", name: "베이지 카펫", price: 150, pattern: "carpet",
    colors: { floor: "#d8c7ad", floorLine: "#cbb89c" } },
  { id: "walnut", name: "월넛 마루", price: 180, pattern: "wood",
    colors: { floor: "#7d5638", floorLine: "#68462d" } },
];

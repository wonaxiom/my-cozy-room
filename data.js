// =============================================================
// data.js — 색상, 캐릭터, 가구 데이터
// 게임을 꾸미거나 무언가를 추가할 때는 주로 이 파일을 고치면 됩니다.
// =============================================================

// ---- 방 좌표 안내 -------------------------------------------------
// 방은 비스듬히 내려다보는 입체(아이소메트릭) 형태입니다.
//   x : 오른쪽 아래 방향 (0 = 왼쪽 벽)
//   y : 왼쪽 아래 방향   (0 = 오른쪽 벽)
//   z : 높이            (0 = 바닥)
// 바닥 크기는 64 x 64입니다. 방 종류는 rooms.js에 있습니다.

// ---- 색상표 ------------------------------------------------------
// 가구는 색 하나만 정하면 윗면은 밝게, 옆면은 어둡게 자동으로 칠해집니다.
// 게임 주인(나) 계정 번호. 주인만 쓰는 기능(생일 케이크 사기, 구글 캘린더)에 씀
const OWNER_ID = "f235ee74-5e77-4233-a222-de9ee3b65e6f";

const PALETTE = {
  // 배경
  bgDay: "#efe6d6",
  bgNight: "#2b2a36",

  // 방
  wallLeft: "#eadcc6",
  wallRight: "#e0cfb5",
  wallTop: "#f5ede1",
  wallEdge: "#c4ad8e",
  wallDot: "#d6c3a6",
  baseboard: "#b89a7a",
  floor: "#b5845a",
  floorLine: "#9c6d47",
  floorEdge: "#8a5f3e",
  windowFrame: "#f6f1e8",
  curtain: "#c9d6c0",
  curtainShade: "#aebf9f",

  // 가구
  wood: "#a8724a",
  woodDark: "#7a5034",
  woodLight: "#c99a6b",
  sheet: "#f3efe6",
  blanket: "#7fa3c4",
  pillow: "#fbf8f1",
  laptop: "#8d929a",
  screen: "#9fd3e6",
  metal: "#6b6f76",
  lampShade: "#f2c46d",     // 스탠드 켜짐
  lampShadeOff: "#c9b48a",  // 스탠드 꺼짐 (이름 뒤에 Off를 붙이면 꺼졌을 때 색)
  mug: "#e07a5f",
  chair: "#c98f5e",
  pot: "#c96f4a",
  leaf: "#5f9b5a",
  leafLight: "#7dbb6f",
  rug: "#d7a6a0",
  rugLight: "#e8c3bd",
  book1: "#c95d5d",
  book2: "#5d84c9",
  book3: "#e0b84f",
  picture: "#a7d0b8",
  clockFace: "#fbf8f1",

  // 다다미방
  tatami: "#cdc38c",
  tatamiLine: "#bfb47c",
  tatamiEdge: "#5f6e45",
  beam: "#6e4a30",
  shojiPaper: "#f7f1e1",
  teapot: "#5b7d6e",
  cup: "#f1ece0",
  cakePlate: "#f4f1ea",     // 생일 케이크 접시
  cakeBase: "#f6c9cf",      // 분홍 크림 케이크
  cakeCream: "#fffaf2",
  berry: "#e0505a",
  candle: "#8fb8e8",
  flame: "#ffd35a",
  flameOff: "#d8c9a0",      // 촛불 꺼짐
  petBed: "#c98b7a",        // 반려동물 침대 테두리
  petBedIn: "#f3e2cf",      // 반려동물 침대 속 쿠션
  rope: "#cfae7e",          // 캣타워 기둥 (삼줄)
  towerPad: "#a8927f",      // 캣타워 발판
  ballRed: "#e0505a",
  ballLine: "#f6e9d0",
  bowl: "#7ea6d8",
  kibble: "#b07a4a",        // 사료
  cushion: "#b4505a",
  cushionLight: "#c9666f",
  futonBase: "#f3efe6",
  futonQuilt: "#4d6d9a",
  futonQuiltLight: "#6b8bb8",
  paperLamp: "#f6e3b4",
  paperLampOff: "#d8ccb0",
  scrollPaper: "#efe6d0",
  scrollArt: "#9fb5a0",

  // 다락방
  roofInner: "#b98d62",
  roofLine: "#a57b53",
  roofEdge: "#6b4a33",
  roofTop: "#8a6244",

  // 원형 탑방 · 기차 객실
  ceiling: "#f3eee4",
  door: "#8a5a3c",
  doorGlass: "#bcd7e0",
  tie: "#5a4636",
  rail: "#8a8f96",
  underbody: "#2f3338",
  wheel: "#3d4248",
  seat: "#4f6d8f",
  seatBase: "#3b4f68",
  blanketRed: "#b5545a",
  brass: "#c9a24a",
  globe: "#5d8fb5",
  globeLand: "#7dab6a",
  velvet: "#7a4a6b",

  // 선반 소품
  book4: "#6f9a72",
  book5: "#8b6fa6",
  bookPage: "#e4d9c0",
  bookBand: "#efd27a",
  leafDark: "#4a7d47",
  potLight: "#d9876a",
  soil: "#5a3e2b",
  glass: "#cfe3e6",
  candle: "#f4ead4",
  flame: "#ffc861",
  suitcase: "#b8683f",
  suitcaseDark: "#7d4229",
  bag: "#c2a36b",
  bagDark: "#9a7d4c",

  // 크리스마스
  pine: "#3f7a4f",
  pineDark: "#2f5f3e",
  pineLight: "#5c9a63",
  gold: "#f2c94c",
  giftRed: "#d9534f",
  giftGreen: "#4f9a6a",
  ribbonGold: "#f2d36b",
  snow: "#f7f7f2",
  snowShade: "#dfe3ea",
  carrot: "#f08a3c",
  scarf: "#c94a4a",
  bulbR: "#ff6b6b",
  bulbY: "#ffd56b",
  bulbB: "#6bb8ff",
  bulbG: "#7be07b",
  wire: "#3c4a3a",
  ginger: "#b9773f",
  gingerDark: "#8d5528",
  icing: "#fff8ee",
  candy: "#e05a6a",
  candleRed: "#d9534f",
  xmasRug: "#b8463f",
  xmasRugLight: "#e7d7b9",
  xmasRugGreen: "#3f7a4f",

  // ver.세밀 전용 색
  rugDark: "#b98580",
  rugFringe: "#f3e6da",
  laptopKey: "#6f747c",
  laptopBack: "#a9aeb5",
  coffee: "#5b3a29",
  metalLight: "#8d929a",
  chairCushion: "#d17a6a",
  frameMat: "#f4efe4",
  sky: "#a9d3e8",
  hill: "#86b47a",
  hillDark: "#6a9a62",
  sun: "#f6d36b",
  blanketLight: "#9dbad6",
  sheetShade: "#ddd6c8",
  teapotDark: "#40594f",
  tea: "#a8b65a",
  tray: "#b98d5c",
  tassel: "#e6c26a",
  iron: "#3f3a36",
  scrollSilk: "#8b7a5a",
  scrollMoon: "#f3e3b0",
  ink: "#3a3633",
  seal: "#c0453b",
  velvetLight: "#94607f",
  velvetDark: "#5f3853",
  scope: "#3e4b66",
  seatDark: "#405a77",
  seatHead: "#e9e4d8",
  blanketStripe: "#efe1c4",
  flower: "#e8889a",

  // 캐릭터
  hair: "#4a3226",
  skin: "#f6d2b8",
  eye: "#2b2b2b",
  blush: "#f0a3a3",
  shirt: "#f2e3b3",
  pants: "#5b6b8c",
  shoes: "#3b3b3b",

  // 효과
  heart: "#e8676b",
  zzz: "#dfe6ff",
};

// ---- 캐릭터 도트 그림 -------------------------------------------
// 글자 한 칸 = 도트 한 칸. '.'은 빈칸입니다.
const CHAR_COLORS = {
  H: "hair",
  S: "skin",
  E: "eye",
  B: "blush",
  C: "shirt",
  P: "pants",
  F: "shoes",
};

const CHARACTER = {
  idle: [
    "...HHHH...",
    "..HHHHHH..",
    ".HHHHHHHH.",
    ".HSSSSSSH.",
    ".HSESSESH.",
    ".HBSSSSBH.",
    "..SSSSSS..",
    "...CCCC...",
    "..CCCCCC..",
    ".SCCCCCCS.",
    "..CCCCCC..",
    "..PPPPPP..",
    "..PP..PP..",
    "..FF..FF..",
  ],
  blink: [
    "...HHHH...",
    "..HHHHHH..",
    ".HHHHHHHH.",
    ".HSSSSSSH.",
    ".HSSSSSSH.",
    ".HBSSSSBH.",
    "..SSSSSS..",
    "...CCCC...",
    "..CCCCCC..",
    ".SCCCCCCS.",
    "..CCCCCC..",
    "..PPPPPP..",
    "..PP..PP..",
    "..FF..FF..",
  ],
  walk1: [
    "...HHHH...",
    "..HHHHHH..",
    ".HHHHHHHH.",
    ".HSSSSSSH.",
    ".HSESSESH.",
    ".HBSSSSBH.",
    "..SSSSSS..",
    "...CCCC...",
    "..CCCCCC..",
    ".SCCCCCCS.",
    "..CCCCCC..",
    "..PPPPPP..",
    ".PP....PP.",
    ".FF....FF.",
  ],
  walk2: [
    "...HHHH...",
    "..HHHHHH..",
    ".HHHHHHHH.",
    ".HSSSSSSH.",
    ".HSESSESH.",
    ".HBSSSSBH.",
    "..SSSSSS..",
    "...CCCC...",
    "..CCCCCC..",
    ".SCCCCCCS.",
    "..CCCCCC..",
    "...PPPP...",
    "...PPPP...",
    "...FFFF...",
  ],
  // ---- 앉은 자세 (GPT 그림을 도트로 옮김, 머리 7줄은 서 있을 때와 같음) ----
  // Q = 정강이 (긴 바지면 바지 색, 반바지·치마면 맨다리), R = 책, Z·z = 쿠키
  chairSit: ["...HHHH...", "..HHHHHH..", ".HHHHHHHH.", ".HSSSSSSH.", ".HSESSESH.", ".HBSSSSBH.", "..SSSSSS..",
    "...CCCC...", "..CCCCCC..", "..SSCCSS..", "..PPPPPP..", "..QQQQQQ..", "...FFFF..."],
  chairBack: ["...HHHH...", "..HHHHHH..", ".HHHHHHHH.", ".HSSSSSSH.", ".HSESSESH.", ".HBSSSSBH.", "..SSSSSS..",
    "...CCCC...", "..CCCCCC..", "..SCCCCS..", "..PPPPPP..", "..QQQQQQ..", "...FFFF..."],
  chairType: ["...HHHH...", "..HHHHHH..", ".HHHHHHHH.", ".HSSSSSSH.", ".HSESSESH.", ".HBSSSSBH.", "..SSSSSS..",
    "...CCCC...", "..SSCCSS..", "..CCCCCC..", "..PPPPPP..", "..QQQQQQ..", "...FFFF..."],
  sitFloor: ["...HHHH...", "..HHHHHH..", ".HHHHHHHH.", ".HSSSSSSH.", ".HSESSESH.", ".HBSSSSBH.", "..SSSSSS..",
    "...CCCC...", "..CCCCCC..", "..CCCCCC..", ".SPPPPPPS.", "..QQQQQQ..", "...FFFF..."],
  read: ["...HHHH...", "..HHHHHH..", ".HHHHHHHH.", ".HSSSSSSH.", ".HSESSESH.", ".HBSSSSBH.", "..SSSSSS..",
    "..CCCCCC..", "..RRRRRR..", "..SRRRRS..", "..PPPPPP..", "..QQQQQQ..", "...FFFF..."],
  snack: ["...HHHH...", "..HHHHHH..", ".HHHHHHHH.", ".HSSSSSSH.", ".HSESSESH.", ".HBSSSSBH.", "..SSSSSS..",
    "...CCCC...", "..SZzZZS..", "..CCCCCC..", "..PPPPPP..", "..QQQQQQ..", "...FFFF..."],
  // 잘 때 (베개 위 얼굴만)
  sleep: [
    "...HHHH...",
    "..HHHHHH..",
    ".HHHHHHHH.",
    ".HSSSSSSH.",
    ".HSSSSSSH.",
    ".HBSSSSBH.",
    "..SSSSSS..",
  ],
};

CHARACTER.sitChair = CHARACTER.sitFloor; // 방석·소파처럼 낮은 자리에 앉기
CHARACTER.type = CHARACTER.chairType;    // 방석에 앉아 타자

// ---- 캐릭터 그림 파일 (선택) --------------------------------------
// 캐릭터를 그림 파일로 바꾸고 싶을 때 사용합니다. null이면 위의 글자 그림을 씁니다.
// 동작 그림들을 가로로 나란히 붙인 PNG 한 장(스프라이트 시트)을 준비하세요.
// 예시:
// const CHARACTER_SHEET = {
//   image: "img/hero.png",
//   frameWidth: 16,    // 동작 하나의 가로 크기
//   frameHeight: 24,   // 동작 하나의 세로 크기
//   frames: { idle: 0, blink: 1, walk1: 2, walk2: 3, sleep: 4 }, // 왼쪽부터 몇 번째 칸인지 (0부터)
// };
const CHARACTER_SHEET = null;

// ---- 캐릭터 꾸미기 -----------------------------------------------
// 캐릭터는 위의 기본 그림에 머리, 눈, 표정, 옷을 차례로 얹어서 만듭니다.
const GENDERS = [
  { id: "female", name: "여자", hair: "long" },   // hair: 성별을 고르면 먼저 골라 두는 머리
  { id: "male", name: "남자", hair: "short" },
];

// 머리 모양: rows의 H가 머리카락이 되는 자리입니다. (.은 그대로 둠)
// extra는 머리 위로 더 올라가는 줄 (올림머리, 삐죽머리)
const HAIR_STYLES = [
  { id: "short", name: "짧은 머리", rows: [
    "...HHHH...",
    "..HHHHHH..",
    ".HHHHHHHH.",
    ".H......H.",
    ".H......H.",
    ".H......H.",
  ] },
  { id: "buzz", name: "스포츠", rows: [
    "...HHHH...",
    "..HHHHHH..",
    ".HHHHHHHH.",
  ] },
  { id: "bangs", name: "앞머리", rows: [
    "...HHHH...",
    "..HHHHHH..",
    ".HHHHHHHH.",
    ".HHHHHHHH.",
    ".H......H.",
    ".H......H.",
  ] },
  { id: "spiky", name: "삐죽머리", extra: ["..H.HH.H.."], rows: [
    "..HHHHHH..",
    ".HHHHHHHH.",
    ".HHHHHHHH.",
    ".H......H.",
  ] },
  { id: "bob", name: "단발", rows: [
    "...HHHH...",
    "..HHHHHH..",
    ".HHHHHHHH.",
    ".H......H.",
    ".H......H.",
    ".H......H.",
    ".H......H.",
  ] },
  { id: "long", name: "긴 머리", rows: [
    "...HHHH...",
    "..HHHHHH..",
    ".HHHHHHHH.",
    ".H......H.",
    ".H......H.",
    ".H......H.",
    ".H......H.",
    ".HH....HH.",
    ".H......H.",
  ] },
  { id: "ponytail", name: "포니테일", rows: [
    "...HHHH...",
    "..HHHHHH..",
    ".HHHHHHHHH",
    ".H......HH",
    ".H......HH",
    ".H.......H",
    ".........H",
  ] },
  { id: "pigtails", name: "양갈래", rows: [
    "...HHHH...",
    "..HHHHHH..",
    ".HHHHHHHH.",
    "HH......HH",
    "HH......HH",
    "HH......HH",
    "H........H",
  ] },
  { id: "bun", name: "올림머리", extra: ["....HH...."], rows: [
    "...HHHH...",
    "..HHHHHH..",
    ".HHHHHHHH.",
    ".H......H.",
    ".H......H.",
    ".H......H.",
  ] },
  { id: "curly", name: "곱슬", extra: ["..H.HH.H.."], rows: [
    "..HHHHHH..",
    ".HHHHHHHH.",
    ".HHHHHHHH.",
    ".HH....HH.",
    ".HH....HH.",
    ".H......H.",
  ] },
];

const HAIR_COLORS = [
  { id: "brown", name: "갈색", color: "#4a3226" },
  { id: "darkBrown", name: "짙은 갈색", color: "#33241c" },
  { id: "black", name: "검정", color: "#26211f" },
  { id: "blonde", name: "금발", color: "#d9b25c" },
  { id: "orange", name: "주황", color: "#d9823f" },
  { id: "red", name: "빨강", color: "#b5463b" },
  { id: "pink", name: "분홍", color: "#d98aa0" },
  { id: "purple", name: "보라", color: "#8a6bb5" },
  { id: "sky", name: "하늘", color: "#7fb2d9" },
  { id: "mint", name: "민트", color: "#7fc4a8" },
  { id: "silver", name: "은발", color: "#b9b4ae" },
  { id: "white", name: "흰색", color: "#ece8e2" },
];

const SKIN_TONES = [
  { id: "light", name: "밝은 피부", color: "#f6d2b8" },
  { id: "peach", name: "살구 피부", color: "#efc19e" },
  { id: "tan", name: "구릿빛 피부", color: "#d9a477" },
  { id: "brown", name: "갈색 피부", color: "#a8714d" },
];

const EYES = [
  { id: "basic", name: "기본 눈" },
  { id: "big", name: "큰 눈" },
  { id: "calm", name: "실눈" },
  { id: "glasses", name: "안경" },
  { id: "sunglasses", name: "선글라스" },
];

// 얼굴 크기: 대두는 머리를 키워 그림 (ver.세밀 1.25배, ver.하찮 4/3배)
const HEAD_SIZES = [
  { id: "normal", name: "보통" },
  { id: "big", name: "대두" },
];

const MOUTHS = [
  { id: "smile", name: "미소" },
  { id: "grin", name: "활짝 웃음" },
  { id: "neutral", name: "무표정" },
  { id: "wow", name: "놀람" },
];

// 상의: style은 "tee"(티셔츠) / "collar"(셔츠 깃) / "stripe"(줄무늬) / "hood"(후드)
// price가 0이면 처음부터 고를 수 있고, 나머지는 상점에서 삽니다.
const TOPS = [
  { id: "teeCream", name: "크림 티셔츠", price: 0, style: "tee", color: "#f2e3b3" },
  { id: "teeWhite", name: "흰 티셔츠", price: 0, style: "tee", color: "#f4f1ec" },
  { id: "teeSky", name: "하늘 티셔츠", price: 0, style: "tee", color: "#a9c8e8" },
  { id: "teePink", name: "분홍 티셔츠", price: 0, style: "tee", color: "#f2b8c6" },
  { id: "teeGreen", name: "연두 티셔츠", price: 0, style: "tee", color: "#bcdba0" },
  { id: "teeGray", name: "회색 티셔츠", price: 0, style: "tee", color: "#b8b3ad" },
  { id: "teeNavy", name: "남색 티셔츠", price: 0, style: "tee", color: "#4f5f86" },
  { id: "mint", name: "민트 셔츠", price: 80, style: "collar", color: "#a8d8c2" },
  { id: "stripe", name: "줄무늬 티", price: 100, style: "stripe", color: "#f4f1ec", stripe: "#5b7fb5" },
  { id: "pinkHoodie", name: "분홍 후드", price: 100, style: "hood", color: "#efb3c2" },
  { id: "blackKnit", name: "검정 니트", price: 120, style: "tee", color: "#3a3a3f" },
  { id: "raincoat", name: "노란 우비", price: 150, style: "hood", color: "#f2c84b" },
];

// 하의: type은 "pants"(바지) / "shorts"(반바지) / "skirt"(치마)
const BOTTOM_TYPES = [
  { id: "pants", name: "바지" },
  { id: "shorts", name: "반바지" },
  { id: "skirt", name: "치마" },
];

const BOTTOMS = [
  { id: "pantsNavy", name: "남색 바지", price: 0, type: "pants", color: "#5b6b8c" },
  { id: "pantsDenim", name: "청바지", price: 0, type: "pants", color: "#5d7ea8" },
  { id: "pantsBlack", name: "검정 바지", price: 0, type: "pants", color: "#3a3a40" },
  { id: "pantsBeige", name: "베이지 바지", price: 0, type: "pants", color: "#c8b28e" },
  { id: "pantsGray", name: "회색 바지", price: 0, type: "pants", color: "#7a7f88" },
  { id: "shortsNavy", name: "남색 반바지", price: 0, type: "shorts", color: "#4f5f86" },
  { id: "shortsBeige", name: "베이지 반바지", price: 0, type: "shorts", color: "#c8b28e" },
  { id: "skirtNavy", name: "남색 치마", price: 0, type: "skirt", color: "#4f5f86" },
  { id: "skirtPink", name: "분홍 치마", price: 0, type: "skirt", color: "#d98aa0" },
  { id: "skirtBlack", name: "검정 치마", price: 0, type: "skirt", color: "#3a3a40" },
  { id: "shortsGreen", name: "초록 반바지", price: 60, type: "shorts", color: "#6e9a5a" },
  { id: "skirtRed", name: "빨간 치마", price: 80, type: "skirt", color: "#b5463b" },
];

// ---- 사는 곳 (실제 날씨용) -----------------------------------------
// 고른 도시의 좌표로 날씨를 받아옵니다. 도시를 추가하려면 이름과 위도(lat)·경도(lon)를 적으세요.
// 장신구 (상점 '옷' 탭에서 사고, 시작 설정·캐릭터 변경에서 골라 씀)
// color: 기본 색, dark: 그늘·띠 색, light: 밝은 부분
// 아우터 (상의 위에 걸침. 상점 '옷 › 아우터'에서 사고 하나만 입음)
// kind: cardigan·jacket(긴소매, 앞이 열려 안의 상의가 보임), vest(소매 없음)
// art: GPT 옷 그림 이름 (outfit-art.js). 있으면 그 그림으로 몸통을 바꾸고, 없으면 상의 위에 색만 칠함
const OUTERS = [
  { id: "cardiganBeige", name: "카멜 가디건", price: 150, kind: "cardigan", color: "#c49a6c" },
  { id: "cardiganPink", name: "분홍 가디건", price: 150, kind: "cardigan", color: "#eab3c0" },
  { id: "denimJacket", name: "청재킷", price: 200, kind: "jacket", color: "#6f8fb8", art: "jacket" },
  { id: "blackJacket", name: "검정 재킷", price: 220, kind: "jacket", color: "#3e3e46", art: "jacket" },
  { id: "knitVest", name: "니트 조끼", price: 120, kind: "vest", color: "#b9a37a" },
  { id: "paddingVest", name: "패딩 조끼", price: 180, kind: "vest", color: "#7d9c8a" },
];

const ACCESSORIES = [
  { id: "cap", name: "야구 모자", price: 120, color: "#d9534f", dark: "#a83c39", light: "#ee8a86" },
  { id: "beanie", name: "비니", price: 120, color: "#e0b84f", dark: "#b8913a", light: "#f2d27e" },
  { id: "strawHat", name: "밀짚모자", price: 150, color: "#e8c983", dark: "#c0453b", light: "#f5e0a8" },
  { id: "headband", name: "헤어밴드", price: 80, color: "#f29bb5", dark: "#d06f8f", light: "#fbc3d4" },
  { id: "ribbon", name: "리본", price: 80, color: "#e05a6a", dark: "#b23f4e", light: "#f08c98" },
  { id: "hairpin", name: "머리핀", price: 60, color: "#f4cf5b", dark: "#c9a238", light: "#fff0a8" },
];

const CITIES = [
  { id: "seoul", name: "서울", lat: 37.57, lon: 126.98 },
  { id: "incheon", name: "인천", lat: 37.46, lon: 126.71 },
  { id: "suwon", name: "수원", lat: 37.26, lon: 127.03 },
  { id: "seongnam", name: "성남", lat: 37.42, lon: 127.13 },
  { id: "goyang", name: "고양", lat: 37.66, lon: 126.83 },
  { id: "yongin", name: "용인", lat: 37.24, lon: 127.18 },
  { id: "chuncheon", name: "춘천", lat: 37.88, lon: 127.73 },
  { id: "wonju", name: "원주", lat: 37.34, lon: 127.92 },
  { id: "gangneung", name: "강릉", lat: 37.75, lon: 128.88 },
  { id: "daejeon", name: "대전", lat: 36.35, lon: 127.38 },
  { id: "sejong", name: "세종", lat: 36.48, lon: 127.29 },
  { id: "cheongju", name: "청주", lat: 36.64, lon: 127.49 },
  { id: "cheonan", name: "천안", lat: 36.82, lon: 127.11 },
  { id: "jeonju", name: "전주", lat: 35.82, lon: 127.15 },
  { id: "gwangju", name: "광주", lat: 35.16, lon: 126.85 },
  { id: "mokpo", name: "목포", lat: 34.81, lon: 126.39 },
  { id: "yeosu", name: "여수", lat: 34.76, lon: 127.66 },
  { id: "daegu", name: "대구", lat: 35.87, lon: 128.6 },
  { id: "andong", name: "안동", lat: 36.57, lon: 128.73 },
  { id: "pohang", name: "포항", lat: 36.02, lon: 129.34 },
  { id: "busan", name: "부산", lat: 35.18, lon: 129.08 },
  { id: "ulsan", name: "울산", lat: 35.54, lon: 129.31 },
  { id: "changwon", name: "창원", lat: 35.23, lon: 128.68 },
  { id: "gimhae", name: "김해", lat: 35.23, lon: 128.89 },
  { id: "jeju", name: "제주", lat: 33.5, lon: 126.53 },
  { id: "seogwipo", name: "서귀포", lat: 33.25, lon: 126.56 },
];

// ---- 반려동물 -----------------------------------------------------
// K: 몸, D: 무늬·귀, E: 눈, N: 코. 그림은 오른쪽을 보고 있고, 왼쪽으로 갈 때는 뒤집힙니다.
const PET_FRAMES = {
  cat: {
    idle: [
      "......K.K",
      "K.....KKK",
      "K.....KEK",
      ".KKKKKKKN",
      "..KDKDKK.",
      "..K.K.K.K",
    ],
    walk1: [
      "......K.K",
      "K.....KKK",
      "K.....KEK",
      ".KKKKKKKN",
      "..KDKDKK.",
      "..K..K.K.",
    ],
    walk2: [
      "......K.K",
      "K.....KKK",
      "K.....KEK",
      ".KKKKKKKN",
      "..KDKDKK.",
      "...K.K..K",
    ],
    sleep: [
      ".........",
      ".........",
      "......K.K",
      "..KKKKKKK",
      ".KKDKDKKK",
      "KKKKKKKK.",
    ],
  },
  dog: {
    idle: [
      ".........",
      "K.....KKK",
      "K.....KEK",
      ".KKKKKDKN",
      "..KKKKKK.",
      "..K.K.K.K",
    ],
    walk1: [
      ".........",
      "K.....KKK",
      "K.....KEK",
      ".KKKKKDKN",
      "..KKKKKK.",
      "..K..K.K.",
    ],
    walk2: [
      ".........",
      "K.....KKK",
      "K.....KEK",
      ".KKKKKDKN",
      "..KKKKKK.",
      "...K.K..K",
    ],
    sleep: [
      ".........",
      ".........",
      "......KDK",
      "..KKKKKKN",
      ".KKKKKKKK",
      "KKKKKKKK.",
    ],
  },
};

const PETS = [
  { id: "cheeseCat", name: "치즈 고양이", kind: "cat", price: 300,
    colors: { K: "#e3a857", D: "#c98a3e", E: "#2b2b2b", N: "#e48a8a" } },
  { id: "blackCat", name: "검은 고양이", kind: "cat", price: 300,
    colors: { K: "#3a3a42", D: "#2a2a30", E: "#e8d36a", N: "#d88a9a" } },
  { id: "whiteDog", name: "하얀 강아지", kind: "dog", price: 350,
    colors: { K: "#ebe3d5", D: "#c9a27a", E: "#2b2b2b", N: "#3a3030" } },
  { id: "grayCat", name: "회색 고양이", kind: "cat", price: 300,
    colors: { K: "#9a9298", D: "#7b7379", E: "#2b2b2b", N: "#e48a8a" } },
  { id: "beagle", name: "갈색 강아지", kind: "dog", price: 350,
    colors: { K: "#bc8c74", D: "#8f6450", E: "#2b2b2b", N: "#3a3030" } },
];

const EFFECTS = {
  heart: [
    ".H.H.",
    "HHHHH",
    "HHHHH",
    ".HHH.",
    "..H..",
  ],
  zzz: [
    "ZZZZ",
    "..Z.",
    ".Z..",
    "ZZZZ",
  ],
};

// ---- 가구 목록 ---------------------------------------------------
// 여기에는 가구의 "모양"과 "가격"을 정의합니다. 산 가구는 꾸미기에서 직접 배치합니다.
//
// category: 상점 분류. "furniture"(가구) / "prop"(소품)
// price   : 가격 (코인). 1분에 2코인이 모이니 120코인이면 약 1시간입니다.
// parts   : [x, y, z, 가로(x방향), 세로(y방향), 높이, 색이름] 상자들을 순서대로 쌓습니다.
// type    : "floor"(바닥에 깔림, 밟고 지나감) / "wall"(벽에 걸림) / 생략 시 일반 가구
// light   : 클릭해서 켜고 끌 수 있는 조명
// surface : 윗면 높이. 이 값이 있으면 위에 작은 물건을 올릴 수 있습니다. (책상, 수납장 등)
// small   : 다른 가구 위에 올릴 수 있는 작은 물건 (스탠드, 화분 등)
// sleep   : 잠자는 가구. side는 잠들기 전 서는 위치, pillow는 베개 위치 (가구 기준)
// work    : 집중 타이머 중에 캐릭터가 서서 일하는 위치 (가구 기준)
//
// [그림 파일로 그리기]
// image   : 그림 파일 경로 (예: "img/plant.png"). 배경이 투명한 PNG를 쓰세요.
// size    : [가로(x방향), 세로(y방향), 높이] 바닥에서 차지하는 크기
// offset  : [좌우, 위아래] 그림 위치를 도트 단위로 살짝 조정 (선택)
// imageOff: 조명이 꺼졌을 때 쓸 그림 (선택)
// 그림의 가로 크기는 size의 '가로 + 세로'로 맞추면 바닥에 딱 맞습니다.
// 그림 파일을 못 찾으면 parts의 상자 모양으로 대신 그립니다.
// detail: "ver.세밀"로 볼 때 쓰는 더 세밀한 상자 목록 (없으면 parts를 그대로 씀)
// ---- 선반 소품을 만드는 도우미 ------------------------------------
// 도트 한 칸을 3등분한 단위(1/3)까지 쓸 수 있습니다.
const r3 = (v) => Math.round(v * 3) / 3;

// 세워 둔 책: 책등(제목 쪽) 위쪽에 금색 띠 한 줄, 위에서 보면 종이 면
// face: 책등이 보이는 쪽 ("y" = 앞쪽, "x" = 오른쪽 앞)
function book(x, y, z, w, d, h, color, face = "y") {
  const top = z + h, band = r3(z + h * 0.72);
  if (face === "y") {
    return [
      [x, y, z, w, d, h, color],
      [x + 1 / 3, y, top, Math.max(w - 2 / 3, 1 / 3), d - 1 / 3, 0.01, "bookPage"],
      [x, y + d, band, w, 0.01, 1 / 3, "bookBand"],
    ];
  }
  return [
    [x, y, z, w, d, h, color],
    [x, y + 1 / 3, top, w - 1 / 3, Math.max(d - 2 / 3, 1 / 3), 0.01, "bookPage"],
    [x + w, y, band, 0.01, d, 1 / 3, "bookBand"],
  ];
}

// 눕혀 둔 책: 옆면에 종이 결이 보임
function flatBook(x, y, z, w, d, color) {
  return [
    [x, y, z, w, d, 2 / 3, color],
    [x, y + d, z + 1 / 3, w - 1 / 3, 0.01, 1 / 3, "bookPage"],
    [x + w, y, z + 1 / 3, 0.01, d - 1 / 3, 1 / 3, "bookPage"],
  ];
}

// 작은 화분: 테두리 있는 화분 + 흙 + 잎 여러 장
function smallPlant(x, y, z) {
  return [
    [x, y, z, 8 / 3, 8 / 3, 2, "pot"],
    [x - 1 / 3, y - 1 / 3, z + 2, 10 / 3, 10 / 3, 2 / 3, "potLight"],
    [x, y, z + 8 / 3, 8 / 3, 8 / 3, 0.01, "soil"],
    [x + 1 / 3, y + 1 / 3, z + 8 / 3, 1, 1, 5 / 3, "leafDark"],
    [x + 2 / 3, y + 2 / 3, z + 8 / 3, 4 / 3, 4 / 3, 7 / 3, "leaf"],
    [x + 5 / 3, y, z + 3, 4 / 3, 1, 1, "leafLight"],
    [x - 1 / 3, y + 4 / 3, z + 10 / 3, 5 / 3, 1, 2 / 3, "leaf"],
    [x + 4 / 3, y + 5 / 3, z + 11 / 3, 1, 4 / 3, 1, "leafLight"],
    [x + 1, y + 1 / 3, z + 14 / 3, 1, 1, 2 / 3, "leafLight"],
  ];
}

// 작은 초 (유리병 안)
function jarCandle(x, y, z) {
  return [
    [x, y, z, 5 / 3, 5 / 3, 2, "glass"],
    [x + 1 / 3, y + 1 / 3, z, 1, 1, 5 / 3, "candle"],
    [x + 2 / 3, y + 2 / 3, z + 2, 1 / 3, 1 / 3, 2 / 3, "flame"],
  ];
}

// 둥근 덩어리 (얇은 판을 쌓아 공처럼): 가운데 (cx, cy), 바닥 높이 z, 반지름 r
function orb(cx, cy, z, r, color, step = 2 / 3) {
  const out = [];
  for (let t = 0; t < r * 2 - 0.01; t += step) {
    const mid = t + step / 2 - r;
    const half = r3(Math.sqrt(Math.max(0, r * r - mid * mid)));
    if (half <= 0) continue;
    out.push([cx - half, cy - half, z + t, half * 2, half * 2, step, color]);
  }
  return out;
}

// 원뿔 (트리): 바닥 반지름 r0에서 위로 갈수록 r1까지 좁아짐
function cone(cx, cy, z, h, r0, r1, color, step = 2 / 3) {
  const out = [];
  for (let t = 0; t < h - 0.01; t += step) {
    const half = r3(r0 + (r1 - r0) * (t / h));
    out.push([cx - half, cy - half, z + t, half * 2, half * 2, step, color]);
  }
  return out;
}

// 비스듬한 다리 (작은 상자를 조금씩 옮겨 쌓음): (x0, y0) 바닥에서 (x1, y1) 높이 z1까지
function slantLeg(x0, y0, x1, y1, z1, color, n = 6) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    out.push([r3(x0 + (x1 - x0) * t), r3(y0 + (y1 - y0) * t), r3((z1 * i) / n), 2 / 3, 2 / 3, r3(z1 / n) + 0.01, color]);
  }
  return out;
}

// 선물 상자: 리본이 지나가는 띠(x 방향 rx~rx+1, y 방향 ry~ry+1)로 상자를 나눠 겹치지 않게 쌓음
// (겹치는 상자는 돌렸을 때 그리는 순서가 꼬여서 리본이 깨져 보임). bow: 위에 올리는 리본 매듭
function giftBox(w, d, h, rx, ry, body, ribbon, bow, lift = 0, band = 1) {
  const out = [];
  const xs = [[0, rx], [rx, rx + band], [rx + band, w]], ys = [[0, ry], [ry, ry + band], [ry + band, d]];
  xs.forEach(([x1, x2], i) => ys.forEach(([y1, y2], j) => {
    const onBand = i === 1 || j === 1; // 리본 띠 (lift만큼 살짝 높여서 잘 보이게)
    if (x2 - x1 > 0 && y2 - y1 > 0) out.push([x1, y1, 0, x2 - x1, y2 - y1, onBand ? h + lift : h, onBand ? ribbon : body]);
  }));
  return out.concat(bow);
}

const FURNITURE = {
  // ---- 공용 ----
  rug: {
    size: [24, 20, 0.3], image: "img/furn/rug.png", imageSimple: "img/furn/s/rug.png", hires: true,
    name: "러그", type: "floor",
    category: "prop", price: 60,
  },
  desk: {
    size: [12.5, 20, 10], image: "img/furn/desk.png", imageSimple: "img/furn/s/desk.png", hires: true,
    name: "책상",
    category: "furniture", price: 150,
    surface: 10,
    // 예전 책상에 붙어 있던 소품의 자리 [id, x, y] (예전 저장을 옮길 때 씀)
    oldProps: [["laptopBasic", 2, 5], ["mug", 7, 2], ["notebook", 8, 15]],
    work: [15, 10],
  },
  // 책상 위 소품 (예전에는 책상에 붙어 있던 것). 책상처럼 위에 놓을 수 있는 가구에 올려 둠
  laptopBasic: {
    size: [7, 9, 6], image: "img/furn/laptopBasic.png", imageSimple: "img/furn/s/laptopBasic.png", hires: true,
    name: "노트북 (기본)",
    category: "prop", kind: "goods", price: 80,
    small: true,
  },
  mug: {
    size: [4, 3, 3], image: "img/furn/mug.png", imageSimple: "img/furn/s/mug.png", hires: true,
    name: "머그잔",
    category: "prop", kind: "goods", price: 20,
    small: true,
    steam: true, // 위로 김이 피어오름 (game.js drawEffects)
  },
  notebook: {
    size: [3, 3.3, 1], image: "img/furn/notebook.png", imageSimple: "img/furn/s/notebook.png", hires: true,
    name: "공책과 펜",
    category: "prop", kind: "goods", price: 15,
    small: true,
  },
  lamp: {
    size: [4, 4, 11], image: "img/furn/lamp.png", imageSimple: "img/furn/s/lamp.png", imageOff: "img/furn/lamp-off.png", imageSimpleOff: "img/furn/s/lamp-off.png", hires: true,
    name: "스탠드",
    category: "prop", price: 50,
    small: true,
    light: { x: 2, y: 2, z: 9, radius: 42 },
  },
  chair: {
    size: [7, 7, 12], image: "img/furn/chair.png", imageSimple: "img/furn/s/chair.png", hires: true,
    backClip: [0.41, 0, 1, 0.56], // 그림에서 등받이 칸 (뒷모습으로 앉으면 이 부분이 등을 가림)
    seat: { z: 6, back: "+x" },   // 앉는 높이, 등받이 쪽 (캐릭터가 앉을 때 씀)
    name: "의자",
    category: "furniture", price: 80,
  },
  plant: {
    size: [7.5, 7.5, 13], image: "img/furn/plant.png", imageSimple: "img/furn/s/plant.png", hires: true,
    name: "화분",
    category: "prop", price: 40,
    small: true,
  },


  // ---- 원룸 ----
  frame: {
    size: [10, 1, 10], image: "img/furn/frame.png", imageSimple: "img/furn/s/frame.png", hires: true, rightWallArt: true,
    name: "액자", type: "wall",
    category: "prop", price: 40,
  },
  shelf: {
    size: [18, 1, 7], image: "img/furn/shelf.png", imageSimple: "img/furn/s/shelf.png", hires: true, rightWallArt: true,
    name: "벽 선반", type: "wall",
    category: "prop", price: 70,
  },

  cabinet: {
    size: [16, 7.5, 15], image: "img/furn/cabinet.png", imageSimple: "img/furn/s/cabinet.png", hires: true,
    name: "수납장",
    category: "furniture", price: 140,
    surface: 10,
  },

  bed: {
    size: [24, 16, 15], image: "img/furn/bed.png", imageSimple: "img/furn/s/bed.png", hires: true,
    name: "침대",
    category: "furniture", price: 200,
    sleep: { side: [28, 8], pillow: [5.5, 8, 9] },
  },

  // ---- 다다미방 ----
  lowTable: {
    size: [14, 10, 10], image: "img/furn/lowTable.png", imageSimple: "img/furn/s/lowTable.png", hires: true,
    name: "좌탁",
    category: "furniture", price: 120,
    surface: 7.5,
    work: [7, 13],
  },
  // ---- 생일 케이크 (주인만 상점에서 살 수 있고, 친구에게 선물하면 받는 사람에게 축하 창이 뜸) ----
  birthdayCake: {
    size: [6, 6, 6], image: "img/furn/birthdayCake.png", imageSimple: "img/furn/s/birthdayCake.png", hires: true,
    name: "생일 케이크",
    category: "prop", kind: "goods", price: 100,
    ownerOnly: true, small: true,
    light: { x: 3, y: 3, z: 7, radius: 22 }, // 촛불
  },
  // ---- 반려동물 가구 (petUse: 반려동물이 하는 일, petZ: 올라가 앉는 높이) ----
  petBed: {
    name: "펫 쿠션 침대",
    category: "prop", kind: "pet", price: 80,
    petUse: "bed", petZ: 2.5,
    size: [9, 9, 4], image: "img/furn/petBed.png", imageSimple: "img/furn/s/petBed.png", hires: true,
  },
  catTower: {
    name: "캣타워",
    category: "prop", kind: "pet", price: 180,
    petUse: "tower", petKind: "cat", petZ: 18,
    size: [8, 8, 20], image: "img/furn/catTower.png", imageSimple: "img/furn/s/catTower.png", hires: true,
  },
  petBall: {
    name: "장난감 공",
    category: "prop", kind: "pet", price: 20,
    petUse: "ball",
    size: [2, 2, 2], image: "img/furn/petBall.png", imageSimple: "img/furn/s/petBall.png", hires: true,
  },
  petBowl: {
    name: "밥그릇",
    category: "prop", kind: "pet", price: 30,
    petUse: "bowl",
    size: [4, 4, 2], image: "img/furn/petBowl.png", imageSimple: "img/furn/s/petBowl.png", hires: true,
  },
  cushion: {
    size: [9, 9, 2], image: "img/furn/cushion.png", imageSimple: "img/furn/s/cushion.png", hires: true,
    name: "방석",
    category: "prop", price: 30,
  },
  futon: {
    size: [24, 14, 4], image: "img/furn/futon.png", imageSimple: "img/furn/s/futon.png", hires: true,
    name: "이불",
    category: "furniture", price: 150,
    sleep: { side: [27, 7], pillow: [5.5, 7, 4] },
  },
  andon: {
    size: [5, 5, 11], image: "img/furn/andon.png", imageSimple: "img/furn/s/andon.png", imageOff: "img/furn/andon-off.png", imageSimpleOff: "img/furn/s/andon-off.png", hires: true,
    name: "종이 등",
    category: "prop", price: 70,
    light: { x: 2.5, y: 2.5, z: 6, radius: 40 },
  },
  chest: {
    size: [14, 8, 19], image: "img/furn/chest.png", imageSimple: "img/furn/s/chest.png", hires: true,
    name: "서랍장",
    category: "furniture", price: 160,
    surface: 16,
  },
  scroll: {
    size: [11, 1, 22], image: "img/furn/scroll.png", imageSimple: "img/furn/s/scroll.png", hires: true, rightWallArt: true,
    name: "족자", type: "wall",
    category: "prop", price: 50,
  },

  // ---- 다락방 ----
  mattress: {
    size: [24, 16, 7], image: "img/furn/mattress.png", imageSimple: "img/furn/s/mattress.png", hires: true,
    name: "매트리스",
    category: "furniture", price: 120,
    sleep: { side: [28, 8], pillow: [5.5, 8, 7] },
  },
  bookcase: {
    size: [6, 12, 18], image: "img/furn/bookcase.png", imageSimple: "img/furn/s/bookcase.png", hires: true,
    name: "책장",
    category: "furniture", price: 180,
  },

  stool: {
    size: [6, 6, 6], image: "img/furn/stool.png", imageSimple: "img/furn/s/stool.png", hires: true,
    seat: { z: 6 },
    name: "보조 의자",
    category: "furniture", price: 60,
  },

  // ---- 크리스마스 (기간 한정: 11월 1일 ~ 1월 31일, 상점 '크리스마스' 탭) ----
  // twinkle: 켜 두면 bulb1~bulb4 색이 시간에 따라 돌아가며 반짝임
  xmasTree: {
    name: "크리스마스 트리",
    category: "xmas", price: 300,
    twinkle: true,
    light: { x: 6, y: 6, z: 14, radius: 46 },
    parts: [
      [3, 3, 0, 6, 6, 3, "giftRed"],
      [5, 5, 3, 2, 2, 2, "woodDark"],
      [0, 0, 5, 12, 12, 5, "pine"],
      [1.5, 1.5, 10, 9, 9, 5, "pine"],
      [3, 3, 15, 6, 6, 5, "pine"],
      [4.5, 4.5, 20, 3, 3, 3, "pine"],
      [5, 5, 23, 2, 2, 2, "gold"],
      [11, 3, 6, 1, 1, 1, "bulb1"], [11, 8, 8, 1, 1, 1, "bulb2"], [4, 11, 7, 1, 1, 1, "bulb3"], [8, 11, 9, 1, 1, 1, "bulb4"],
      [9.5, 5, 12, 1, 1, 1, "bulb2"], [5, 9.5, 13, 1, 1, 1, "bulb1"], [8, 6, 17, 1, 1, 1, "bulb3"], [5, 8, 18, 1, 1, 1, "bulb4"],
    ],
    detail: [
      [3, 3, 0, 6, 6, 3, "giftRed"],
      [3, 9, 1, 6, 0.01, 2 / 3, "ribbonGold"],
      [9, 3, 1, 0.01, 6, 2 / 3, "ribbonGold"],
      [5, 5, 3, 2, 2, 2, "woodDark"],
      ...cone(6, 6, 5, 6, 6, 3.4, "pine"),
      ...cone(6, 6, 10, 6, 4.8, 2.2, "pine"),
      ...cone(6, 6, 15, 6, 3.4, 1, "pine"),
      ...cone(6, 6, 20, 3, 1.6, 0.4, "pine"),
      [0, 12, 5, 12, 0.01, 2 / 3, "pineDark"],
      [12, 0, 5, 0.01, 12, 2 / 3, "pineDark"],
      [1.2, 10.8, 10, 9.6, 0.01, 2 / 3, "pineDark"],
      [10.8, 1.2, 10, 0.01, 9.6, 2 / 3, "pineDark"],
      [2.6, 9.4, 15, 6.8, 0.01, 2 / 3, "pineDark"],
      [9.4, 2.6, 15, 0.01, 6.8, 2 / 3, "pineDark"],
      [11.2, 3, 6.5, 1, 1, 1, "bulb1"], [10.5, 8, 7.2, 1, 1, 1, "bulb2"], [3.5, 11.2, 6.5, 1, 1, 1, "bulb3"], [8, 10.5, 7.2, 1, 1, 1, "bulb4"],
      [9.8, 4.5, 11.5, 1, 1, 1, "bulb2"], [4.5, 9.8, 11.5, 1, 1, 1, "bulb1"], [8.6, 8.6, 12.4, 1, 1, 1, "bulb3"],
      [8.3, 5, 16.2, 1, 1, 1, "bulb4"], [5, 8.3, 16.2, 1, 1, 1, "bulb2"], [7, 7, 20.3, 1, 1, 1, "bulb1"],
      [16 / 3, 16 / 3, 23, 4 / 3, 4 / 3, 2, "gold"],
      [14 / 3, 17 / 3, 23.5, 8 / 3, 2 / 3, 2 / 3, "gold"],
      [17 / 3, 14 / 3, 23.5, 2 / 3, 8 / 3, 2 / 3, "gold"],
    ],

  },
  giftRed: {
    name: "선물 상자 (빨강)",
    category: "xmas", price: 60,
    small: true,
    parts: giftBox(6, 6, 4, 2, 2, "giftRed", "ribbonGold", [[1.5, 1.5, 4.3, 3, 3, 1, "ribbonGold"]], 0.3, 2), // 하찮: 리본 띠 두 칸
    detail: giftBox(5, 5, 13 / 3, 2, 2, "giftRed", "ribbonGold", [
      [1, 1.5, 13 / 3, 1, 2, 1, "ribbonGold"],
      [3, 1.5, 13 / 3, 1, 2, 1, "ribbonGold"],
      [2, 2, 13 / 3, 1, 1, 4 / 3, "gold"],
    ]),
  },
  giftGreen: {
    name: "선물 상자 (초록)",
    category: "xmas", price: 60,
    small: true,
    parts: giftBox(6, 4, 3, 2, 1, "giftGreen", "giftRed", [[1, 0, 3, 3, 3, 1, "giftRed"]], 0.3),
    detail: giftBox(6, 4, 10 / 3, 2.5, 1.5, "giftGreen", "giftRed", [
      [1.5, 1, 10 / 3, 1, 2, 1, "giftRed"],
      [3.5, 1, 10 / 3, 1, 2, 1, "giftRed"],
      [2.5, 1.5, 10 / 3, 1, 1, 4 / 3, "candy"],
    ]),
  },
  snowman: {
    name: "눈사람 인형",
    category: "xmas", price: 90,
    parts: [
      [0, 0, 0, 7, 7, 6, "snow"],
      [1, 1, 6, 5, 5, 5, "snow"],
      [1, 1, 10, 5, 5, 1, "scarf"],
      [1.5, 1.5, 11, 4, 4, 1, "woodDark"],
      [2.5, 2.5, 12, 2, 2, 2, "woodDark"],
      [6, 3, 8, 1.5, 1, 1, "carrot"],
    ],
    detail: [
      ...orb(3.5, 3.5, 0, 3.5, "snow"),
      ...orb(3.5, 3.5, 6, 2.6, "snow"),
      [7, 3, 3, 0.01, 1, 2 / 3, "woodDark"],
      [7, 3, 1.5, 0.01, 1, 2 / 3, "woodDark"],
      [6, 2.4, 8.3, 0.01, 2 / 3, 2 / 3, "woodDark"],
      [6, 4.2, 8.3, 0.01, 2 / 3, 2 / 3, "woodDark"],
      [5.8, 3.2, 7.4, 2, 2 / 3, 2 / 3, "carrot"],
      [1.2, 1.2, 6, 4.6, 4.6, 1, "scarf"],
      [5.2, 1.2, 4.2, 1, 1.4, 2.5, "scarf"],
      [1.3, 1.3, 32 / 3, 4.4, 4.4, 2 / 3, "woodDark"],
      [2.1, 2.1, 34 / 3, 2.8, 2.8, 2.2, "woodDark"],
      [2.1, 2.1, 35 / 3, 2.8, 2.8, 2 / 3, "giftRed"],
    ],

  },
  stocking: {
    name: "양말 장식", type: "wall",
    category: "xmas", price: 50,
    parts: [
      [1, 0, 0, 3, 1, 6, "scarf"],
      [1, 0, 0, 5, 1, 2, "scarf"],
      [0.5, 0, 6, 4, 1.2, 2, "snow"],
    ],
    detail: [
      [2, 0, -1, 3, 2 / 3, 7, "scarf"],
      [2, 0, -1, 5.5, 2 / 3, 2.5, "scarf"],
      [6, 0, -0.5, 1, 2 / 3, 1.5, "scarf"],
      [2, 2 / 3, 1, 3, 0.01, 2 / 3, "snow"],
      [2, 2 / 3, 3, 3, 0.01, 2 / 3, "snow"],
      [1.5, 0, 6, 4, 1, 2, "snow"],
      [6, 2 / 3, -0.5, 1, 0.01, 1, "snowShade"],
      [3, 0, 8, 1 / 3, 1 / 3, 1.5, "ribbonGold"],
    ],
  },
  wreath: {
    name: "리스", type: "wall",
    category: "xmas", price: 70,
    parts: [
      [0, 0, 0, 10, 1, 2, "pine"],
      [0, 0, 8, 10, 1, 2, "pine"],
      [0, 0, 2, 2, 1, 6, "pine"],
      [8, 0, 2, 2, 1, 6, "pine"],
      [4, 0.5, 0, 2, 1, 2, "giftRed"],
    ],
    detail: [
      [2, 0, 0, 6, 1, 1.5, "pineDark"],
      [1, 0, 1, 8, 1, 1.5, "pine"],
      [1, 0, 7.5, 8, 1, 1.5, "pine"],
      [2, 0, 8.5, 6, 1, 1.5, "pineDark"],
      [0, 0, 2, 2, 1, 6, "pine"],
      [8, 0, 2, 2, 1, 6, "pineDark"],
      [1, 1, 3, 1, 0.01, 1, "pineLight"],
      [3, 1, 9, 1, 0.01, 1, "pineLight"],
      [8, 1, 6, 1, 0.01, 1, "pineLight"],
      [1.5, 1, 6, 2 / 3, 0.01, 2 / 3, "giftRed"],
      [6, 1, 9, 2 / 3, 0.01, 2 / 3, "giftRed"],
      [8.5, 1, 3, 2 / 3, 0.01, 2 / 3, "giftRed"],
      [3, 0.5, 0, 1.5, 1, 1.5, "giftRed"],
      [5.5, 0.5, 0, 1.5, 1, 1.5, "giftRed"],
      [4.5, 0.6, 0.3, 1, 1, 1, "scarf"],
      [4, 0.5, -1.5, 2 / 3, 1, 1.5, "giftRed"],
      [5.5, 0.5, -1.5, 2 / 3, 1, 1.5, "giftRed"],
    ],
  },
  garland: {
    name: "반짝이 전구 줄", type: "wall",
    category: "xmas", price: 80,
    twinkle: true,
    parts: [
      [0, 0, 2, 24, 0.5, 0.5, "wire"],
      [2, 0, 0.5, 1, 1, 1.5, "bulb1"], [6, 0, 0.5, 1, 1, 1.5, "bulb2"], [10, 0, 0.5, 1, 1, 1.5, "bulb3"],
      [14, 0, 0.5, 1, 1, 1.5, "bulb4"], [18, 0, 0.5, 1, 1, 1.5, "bulb1"], [22, 0, 0.5, 1, 1, 1.5, "bulb2"],
    ],
    detail: [
      [0, 0, 3, 2, 1 / 3, 1 / 3, "wire"], [2, 0, 8 / 3, 2, 1 / 3, 1 / 3, "wire"], [4, 0, 7 / 3, 2, 1 / 3, 1 / 3, "wire"],
      [6, 0, 7 / 3, 2, 1 / 3, 1 / 3, "wire"], [8, 0, 8 / 3, 2, 1 / 3, 1 / 3, "wire"], [10, 0, 3, 2, 1 / 3, 1 / 3, "wire"],
      [12, 0, 8 / 3, 2, 1 / 3, 1 / 3, "wire"], [14, 0, 7 / 3, 2, 1 / 3, 1 / 3, "wire"], [16, 0, 7 / 3, 2, 1 / 3, 1 / 3, "wire"],
      [18, 0, 8 / 3, 2, 1 / 3, 1 / 3, "wire"], [20, 0, 3, 2, 1 / 3, 1 / 3, "wire"], [22, 0, 8 / 3, 2, 1 / 3, 1 / 3, "wire"],
      ...[[1, "bulb1"], [4, "bulb2"], [7, "bulb3"], [10, "bulb4"], [13, "bulb1"], [16, "bulb2"], [19, "bulb3"], [22, "bulb4"]]
        .flatMap(([x, c]) => [[x, 0, 1.6, 2 / 3, 2 / 3, 2 / 3, "wire"], [x - 1 / 6, 0, 0.3, 1, 1, 4 / 3, c]]),
    ],
  },
  xmasRug: {
    name: "크리스마스 러그", type: "floor",
    category: "xmas", price: 90,
    parts: [
      [0, 0, 0, 22, 16, 0.5, "xmasRug"],
      [2, 2, 0.5, 18, 12, 0.5, "xmasRugLight"],
      [4, 4, 1, 14, 8, 0.01, "xmasRugGreen"],
    ],
    detail: [
      [0, 0, 0, 22, 16, 1 / 3, "xmasRug"],
      [1, 1, 1 / 3, 20, 14, 0.01, "xmasRugLight"],
      [2, 2, 1 / 3, 18, 12, 0.01, "xmasRug"],
      [3, 3, 1 / 3, 16, 10, 0.01, "xmasRugLight"],
      ...[5, 9, 13, 17].map((x) => [x, 6, 1 / 3, 2, 4, 0.01, "xmasRugGreen"]),
      ...[5, 9, 13, 17].map((x) => [x + 0.5, 7, 1 / 3, 1, 2, 0.01, "xmasRugLight"]),
      ...[1, 3, 5, 7, 9, 11, 13].map((y) => [0, y + 1, 1 / 3, 2 / 3, 1, 0.01, "snow"]),
      ...[1, 3, 5, 7, 9, 11, 13].map((y) => [64 / 3, y + 1, 1 / 3, 2 / 3, 1, 0.01, "snow"]),
    ],
  },
  candleSet: {
    name: "캔들", category: "xmas", price: 40,
    small: true,
    light: { x: 2.5, y: 2, z: 5, radius: 22 },
    parts: [
      [0, 0, 0, 5, 4, 1, "pine"],
      [0.5, 1, 1, 1.5, 1.5, 3, "candleRed"],
      [3, 1, 1, 1.5, 1.5, 4, "snow"],
      [1, 1.5, 4, 0.5, 0.5, 1, "lampShade"],
      [3.5, 1.5, 5, 0.5, 0.5, 1, "lampShade"],
    ],
    detail: [
      [0, 0, 0, 5, 4, 2 / 3, "pineDark"],
      [-1 / 3, -1 / 3, 1 / 3, 1, 1, 2 / 3, "pine"], [4, 3, 1 / 3, 1, 1, 2 / 3, "pine"], [4, -1 / 3, 1 / 3, 1, 1, 2 / 3, "pine"],
      [1, 3.5, 2 / 3, 2 / 3, 2 / 3, 2 / 3, "giftRed"], [2.5, -1 / 3, 2 / 3, 2 / 3, 2 / 3, 2 / 3, "giftRed"],
      [0.5, 1, 2 / 3, 1.5, 1.5, 3, "candleRed"],
      [3, 1, 2 / 3, 1.5, 1.5, 4, "snow"],
      [1.1, 1.6, 11 / 3, 1 / 3, 1 / 3, 1 / 3, "wire"], [3.6, 1.6, 14 / 3, 1 / 3, 1 / 3, 1 / 3, "wire"],
      [1, 1.5, 4, 2 / 3, 2 / 3, 1, "lampShade"],
      [3.5, 1.5, 5, 2 / 3, 2 / 3, 1, "lampShade"],
    ],
  },
  gingerHouse: {
    name: "진저브레드 하우스", category: "xmas", price: 70,
    small: true,
    parts: [
      [0, 0, 0, 6, 5, 4, "ginger"],
      [0, 0, 4, 6, 5, 1.5, "icing"],
      [0.5, 0.5, 5.5, 5, 4, 1.5, "ginger"],
      [2.5, 5, 0, 1.5, 0.01, 2.5, "gingerDark"],
    ],
    detail: [
      [0, 0, 0, 6, 5, 4, "ginger"],
      [2.3, 5, 0, 1.4, 0.01, 2.5, "gingerDark"],
      [0.7, 5, 2, 1, 0.01, 1, "ribbonGold"], [4.3, 5, 2, 1, 0.01, 1, "ribbonGold"],
      [6, 1, 2, 0.01, 1, 1, "ribbonGold"], [6, 3, 2, 0.01, 1, 1, "ribbonGold"],
      [-1 / 3, -1 / 3, 4, 20 / 3, 17 / 3, 2 / 3, "icing"],
      [0, 0, 14 / 3, 6, 5, 2 / 3, "ginger"],
      [1 / 3, 1 / 3, 16 / 3, 16 / 3, 13 / 3, 2 / 3, "icing"],
      [2 / 3, 2 / 3, 6, 14 / 3, 11 / 3, 2 / 3, "ginger"],
      [1, 1, 20 / 3, 4, 3, 2 / 3, "icing"],
      [1, 5, 4.4, 2 / 3, 0.01, 2 / 3, "candy"], [3, 5, 4.4, 2 / 3, 0.01, 2 / 3, "bulbG"], [5, 5, 4.4, 2 / 3, 0.01, 2 / 3, "candy"],
      [4, 2, 7, 2 / 3, 2 / 3, 2, "candy"],
    ],
  },

  // ---- 창문과 시계 (벽에 거는 장식) ----
  // decor: "window"(창문) / "clock"(시계) / "digital"(전자 시계), style: 창문 모양
  // parts는 벽에서 차지하는 크기(가로·높이)를 정하는 데 씁니다. 실제 모양은 game.js가 그립니다.
  windowCurtain: {
    name: "커튼 창문", type: "wall", decor: "window", style: "curtain",
    category: "prop", price: 120,
    parts: [[0, 0, 0, 34, 1, 27, "windowFrame"]],
  },
  windowShoji: {
    name: "미닫이 창", type: "wall", decor: "window", style: "shoji",
    category: "prop", price: 120,
    parts: [[0, 0, 0, 34, 1, 26, "windowFrame"]],
  },
  windowRound: {
    name: "둥근 창", type: "wall", decor: "window", style: "round",
    category: "prop", price: 100,
    parts: [[0, 0, 0, 22, 1, 22, "windowFrame"]],
  },
  windowTrain: {
    name: "기차 창", type: "wall", decor: "window", style: "train",
    category: "prop", price: 100,
    parts: [[0, 0, 0, 14, 1, 19, "windowFrame"]],
  },
  wallClock: {
    name: "벽시계", type: "wall", decor: "clock",
    category: "prop", price: 50,
    parts: [[0, 0, 0, 12, 1, 12, "woodDark"]],
  },
  digitalClock: {
    name: "전자 시계", type: "wall", decor: "digital",
    category: "prop", price: 70,
    parts: [[0, 0, 0, 16, 1, 9, "metal"]],
  },

  // ---- 원형 탑방 ----
  armchair: {
    size: [9, 9, 14], image: "img/furn/armchair.png", imageSimple: "img/furn/s/armchair.png", hires: true,
    frontClip: [[0, 0.45, 0.5, 1], [0, 0.72, 1, 1]], // 앞을 보고 앉으면 가까운 팔걸이·방석 앞쪽이 몸을 가림
    seat: { z: 6, back: "-x" },
    name: "안락의자",
    category: "furniture", price: 130,
  },
  globe: {
    size: [5.5, 5.5, 10], image: "img/furn/globe.png", imageSimple: "img/furn/s/globe.png", hires: true,
    name: "지구본",
    category: "prop", price: 70,
    small: true,
  },
  telescope: {
    size: [10, 6.5, 13], image: "img/furn/telescope.png", imageSimple: "img/furn/s/telescope.png", hires: true,
    name: "망원경",
    category: "prop", price: 80,
  },

  // ---- 기차 객실 ----
  trainSeat: {
    size: [9, 10, 19], image: "img/furn/trainSeat.png", imageSimple: "img/furn/s/trainSeat.png", hires: true,
    frontClip: [[0, 0.35, 0.3, 1], [0, 0.72, 1, 1]], // 앞을 보고 앉으면 가까운 팔걸이·방석 앞쪽이 몸을 가림
    seat: { z: 8, back: "-x" },
    name: "객실 좌석",
    category: "furniture", price: 100,
  },
  windowTable: {
    size: [8, 6, 14], image: "img/furn/windowTable.png", imageSimple: "img/furn/s/windowTable.png", hires: true,
    name: "창가 테이블",
    category: "furniture", price: 90,
    surface: 11,
    work: [4, 9],
  },
  berth: {
    size: [22, 10, 8], image: "img/furn/berth.png", imageSimple: "img/furn/s/berth.png", hires: true,
    name: "침대칸",
    category: "furniture", price: 180,
    sleep: { side: [25, 5], pillow: [4.5, 5, 7.5] },
  },
  luggageRack: {
    size: [18, 1, 5], image: "img/furn/luggageRack.png", imageSimple: "img/furn/s/luggageRack.png", hires: true, rightWallArt: true,
    name: "짐 선반",
    type: "wall",
    category: "prop", price: 60,
  },

};

// 잠자리 가구는 처음 방향에서 베개(머리)가 벽 쪽(화면 뒤)에 오도록 앞뒤를 뒤집어 둡니다.
// (모양은 베개가 앞쪽인 기준으로 적혀 있어서, 불러올 때 x 방향만 거울처럼 바꿈)
for (const f of Object.values(FURNITURE)) {
  if (!f.sleep || !f.parts) continue;
  const W = Math.min(...f.parts.map((q) => q[0])) + Math.max(...f.parts.map((q) => q[0] + q[3]));
  const flip = (q) => [W - q[0] - q[3], ...q.slice(1)];
  f.parts = f.parts.map(flip);
  if (f.detail) f.detail = f.detail.map(flip);
  f.sleep = { side: [W - f.sleep.side[0], f.sleep.side[1]], pillow: [W - f.sleep.pillow[0], ...f.sleep.pillow.slice(1)] };
}
// ---- GPT로 그린 가구 (그림 파일) ----------------------------------------
// hires: 그림 1픽셀 = 화면 1픽셀(1/3칸). 그림은 앞면이 왼쪽 아래를 보는 모습이고, 돌리면 좌우로 뒤집어 씀
// imageSimple: ver.하찮용 그림 (그림 1픽셀 = 1칸)
// size: [오른쪽 아래 방향 길이, 왼쪽 아래 방향 길이, 높이] (칸). 벽 장식은 [벽 따라 길이, 두께, 높이]
// seat.back: 등받이 쪽 (그림 가구는 앞면이 왼쪽 아래(+y)를 보므로 "-y")
// use: 캐릭터가 하는 일 (chair 앉기, snack 간식, read 책 읽기, water 물주기, lamp 조명 켜고 끄기)
Object.assign(FURNITURE, {
  bunkBed: { name: "2층 침대", category: "furniture", price: 320, size: [16, 24, 30], image: "img/furn/bunkBed.png", imageSimple: "img/furn/s/bunkBed.png", hires: true, sleep: { side: [20, 18], pillow: [9, 6, 4] } },
  pinkBed: { name: "분홍 침대", category: "furniture", price: 220, size: [16, 24, 12], image: "img/furn/pinkBed.png", imageSimple: "img/furn/s/pinkBed.png", hires: true, sleep: { side: [20, 18], pillow: [8, 4.5, 8] } },
  bunkBedWhite: { name: "하얀 2층 침대", category: "furniture", price: 340, size: [16, 24, 30], image: "img/furn/bunkBedWhite.png", imageSimple: "img/furn/s/bunkBedWhite.png", hires: true, sleep: { side: [20, 18], pillow: [9, 6, 4] } },
  fabricChair: { name: "패브릭 의자", category: "furniture", price: 150, size: [10, 10, 13], image: "img/furn/fabricChair.png", imageSimple: "img/furn/s/fabricChair.png", hires: true, seat: { z: 6, back: "-y" }, use: "chair" },
  sofa: { name: "3인 소파", category: "furniture", price: 260, size: [10, 24, 13], image: "img/furn/sofa.png", imageSimple: "img/furn/s/sofa.png", hires: true, seat: { z: 6, back: "-y" }, use: "chair" },
  officeChair: { name: "사무용 의자", category: "furniture", price: 110, size: [7, 7, 15], image: "img/furn/officeChair.png", imageSimple: "img/furn/s/officeChair.png", hires: true, seat: { z: 7, back: "-y" }, use: "chair" },
  woodTable: { name: "원목 테이블", category: "furniture", price: 140, size: [14, 16, 11], image: "img/furn/woodTable.png", imageSimple: "img/furn/s/woodTable.png", surface: 11, work: [16, 8], hires: true, use: "snack" },
  laptop: { name: "노트북", category: "prop", price: 90, size: [5, 5, 3], image: "img/furn/laptop.png", imageSimple: "img/furn/s/laptop.png", hires: true, small: true },
  fridge: { name: "냉장고", category: "furniture", price: 240, size: [9, 9, 24], image: "img/furn/fridge.png", imageSimple: "img/furn/s/fridge.png", imageOpen: "img/furn/fridge-open.png", imageSimpleOpen: "img/furn/s/fridge-open.png", hires: true, use: "snack" },
  tallBookcase: { name: "큰 책장", category: "furniture", price: 160, size: [6, 12, 22], image: "img/furn/tallBookcase.png", imageSimple: "img/furn/s/tallBookcase.png", hires: true, use: "read" },
  bookChest: { name: "책장 수납장", category: "furniture", price: 150, size: [6, 12, 18], image: "img/furn/bookChest.png", imageSimple: "img/furn/s/bookChest.png", hires: true, use: "read" },
  glassCabinet: { name: "유리 장식장", category: "furniture", price: 170, size: [6, 12, 22], image: "img/furn/glassCabinet.png", imageSimple: "img/furn/s/glassCabinet.png", hires: true },
  sideboard: { name: "낮은 수납장", category: "furniture", price: 140, size: [7, 22, 9], image: "img/furn/sideboard.png", imageSimple: "img/furn/s/sideboard.png", surface: 9, hires: true },
  fireplace: { name: "벽난로", category: "furniture", price: 380, size: [8, 16, 20], image: "img/furn/fireplace.png", imageOff: "img/furn/fireplace-off.png", imageSimple: "img/furn/s/fireplace.png", imageSimpleOff: "img/furn/s/fireplace-off.png", hires: true, light: { x: 4, y: 8, z: 4, radius: 46 } },
  checkRug: { name: "체크 러그", type: "floor", category: "prop", price: 70, size: [20, 20, 0.5], image: "img/furn/checkRug.png", imageSimple: "img/furn/s/checkRug.png", hires: true },
  greenRug: { name: "초록 체크 러그", type: "floor", category: "prop", price: 70, size: [20, 20, 0.5], image: "img/furn/greenRug.png", imageSimple: "img/furn/s/greenRug.png", hires: true },
  roundRug: { name: "둥근 러그", type: "floor", category: "prop", price: 80, size: [18, 18, 0.5], image: "img/furn/roundRug.png", imageSimple: "img/furn/s/roundRug.png", hires: true },
  deskClock: { name: "탁상 시계", category: "prop", price: 40, size: [5, 3, 4], image: "img/furn/deskClock.png", imageSimple: "img/furn/s/deskClock.png", hires: true, small: true },
  deskClockWhite: { name: "하얀 탁상 시계", category: "prop", price: 40, size: [5, 3, 4], image: "img/furn/deskClockWhite.png", imageSimple: "img/furn/s/deskClockWhite.png", hires: true, small: true },
  landscape: { name: "풍경 액자", type: "wall", category: "prop", price: 60, size: [12, 1, 11], image: "img/furn/landscape.png", imageSimple: "img/furn/s/landscape.png", hires: true },
  catFrame: { name: "고양이 액자", type: "wall", category: "prop", price: 50, size: [8, 1, 9], image: "img/furn/catFrame.png", imageSimple: "img/furn/s/catFrame.png", hires: true },
  photo1: { name: "사진", type: "wall", category: "prop", price: 20, size: [5, 1, 7], image: "img/furn/photo1.png", imageSimple: "img/furn/s/photo1.png", hires: true },
  photo2: { name: "사진 (분홍)", type: "wall", category: "prop", price: 20, size: [5, 1, 7], image: "img/furn/photo2.png", imageSimple: "img/furn/s/photo2.png", hires: true },
  squarePot: { name: "네모 화분", category: "prop", price: 40, size: [6, 6, 11], image: "img/furn/squarePot.png", imageSimple: "img/furn/s/squarePot.png", hires: true, small: true, use: "water" },
  bigPlant: { name: "큰 화분", category: "prop", price: 60, size: [7, 7, 15], image: "img/furn/bigPlant.png", imageSimple: "img/furn/s/bigPlant.png", hires: true, small: true, use: "water" },
  yellowFlower: { name: "노란 꽃병", category: "prop", price: 35, size: [4, 4, 8], image: "img/furn/yellowFlower.png", imageSimple: "img/furn/s/yellowFlower.png", hires: true, small: true, use: "water" },
  pinkFlower: { name: "분홍 꽃병", category: "prop", price: 35, size: [4, 4, 8], image: "img/furn/pinkFlower.png", imageSimple: "img/furn/s/pinkFlower.png", hires: true, small: true, use: "water" },
  diffuser: { name: "디퓨저", category: "prop", price: 30, size: [3, 3, 6], image: "img/furn/diffuser.png", imageSimple: "img/furn/s/diffuser.png", hires: true, small: true },
  tableLamp: { name: "테이블 램프", category: "prop", price: 60, size: [5, 5, 10], image: "img/furn/tableLamp.png", imageOff: "img/furn/tableLamp-off.png", imageSimple: "img/furn/s/tableLamp.png", imageSimpleOff: "img/furn/s/tableLamp-off.png", hires: true, small: true, light: { x: 2.5, y: 2.5, z: 8, radius: 40 }, use: "lamp" },
  floorLamp: { name: "플로어 램프", category: "prop", price: 80, size: [5, 5, 18], image: "img/furn/floorLamp.png", imageOff: "img/furn/floorLamp-off.png", imageSimple: "img/furn/s/floorLamp.png", imageSimpleOff: "img/furn/s/floorLamp-off.png", hires: true, light: { x: 2.5, y: 2.5, z: 15, radius: 46 }, use: "lamp" },
  moonLamp: { name: "달 무드등", category: "prop", price: 70, size: [5, 5, 8], image: "img/furn/moonLamp.png", imageOff: "img/furn/moonLamp-off.png", imageSimple: "img/furn/s/moonLamp.png", imageSimpleOff: "img/furn/s/moonLamp-off.png", hires: true, small: true, light: { x: 2.5, y: 2.5, z: 5, radius: 36 }, use: "lamp" },
  snowGlobe: { name: "스노볼", category: "xmas", price: 60, size: [5, 5, 7], image: "img/furn/snowGlobe.png", imageSimple: "img/furn/s/snowGlobe.png", hires: true, small: true },
  reindeer: { name: "순록 인형", category: "xmas", price: 90, size: [7, 5, 12], image: "img/furn/reindeer.png", imageSimple: "img/furn/s/reindeer.png", hires: true },
  lowBed: { name: "낮은 침대", category: "furniture", price: 200, size: [16, 24, 7], image: "img/furn/lowBed.png", imageSimple: "img/furn/s/lowBed.png", hires: true, sleep: { side: [20, 18], pillow: [8, 19, 5] } },
  kotatsu: { name: "코타츠", category: "furniture", price: 220, size: [16, 16, 9], image: "img/furn/kotatsu.png", imageSimple: "img/furn/s/kotatsu.png", surface: 9, work: [18, 8], hires: true, use: "snack" },
  shojiScreen: { name: "장지 칸막이", category: "furniture", price: 90, size: [2, 10, 22], image: "img/furn/shojiScreen.png", imageSimple: "img/furn/s/shojiScreen.png", hires: true },
  paperLantern: { name: "종이 초롱", category: "prop", price: 60, size: [5, 5, 12], image: "img/furn/paperLantern.png", imageSimple: "img/furn/s/paperLantern.png", hires: true, small: true, light: { x: 2.5, y: 2.5, z: 7, radius: 36 } },
  squareLamp: { name: "사각 등", category: "prop", price: 70, size: [6, 6, 15], image: "img/furn/squareLamp.png", imageSimple: "img/furn/s/squareLamp.png", hires: true, light: { x: 3, y: 3, z: 9, radius: 40 }, use: "lamp" },
  bonsai: { name: "분재", category: "prop", price: 90, size: [8, 8, 12], image: "img/furn/bonsai.png", imageSimple: "img/furn/s/bonsai.png", hires: true, use: "water" },
  stoneLantern: { name: "석등", category: "prop", price: 120, size: [7, 7, 17], image: "img/furn/stoneLantern.png", imageSimple: "img/furn/s/stoneLantern.png", hires: true, light: { x: 3.5, y: 3.5, z: 11, radius: 36 } },
  tsukubai: { name: "돌 물그릇", category: "prop", price: 150, size: [16, 16, 8], image: "img/furn/tsukubai.png", imageSimple: "img/furn/s/tsukubai.png", hires: true },
  sakuraVase: { name: "벚꽃 꽃병", category: "prop", price: 50, size: [5, 5, 12], image: "img/furn/sakuraVase.png", imageSimple: "img/furn/s/sakuraVase.png", hires: true, small: true, use: "water" },
  fusuma: { name: "미닫이문", type: "wall", floorWall: true, category: "prop", price: 120, size: [18, 1, 28], image: "img/furn/fusuma.png", imageSimple: "img/furn/s/fusuma.png", hires: true },
  noren: { name: "노렌", type: "wall", category: "prop", price: 80, size: [14, 1, 13], image: "img/furn/noren.png", imageSimple: "img/furn/s/noren.png", hires: true },
});

// 크리스마스 트리는 둥글어서 어느 쪽으로 돌려도 장식이 보여야 함: 앞면 장식(전구, 가지 그림자, 리본)을
// 가운데를 기준으로 반대편에도 붙입니다. (전구 색은 조금씩 바꿔서)
{
  const t = FURNITURE.xmasTree, W = 12;
  const back = (q) => {
    const [x, y, z, w, d, h, c] = q;
    const color = c.startsWith("bulb") ? "bulb" + (((Number(c.slice(4)) + 1) % 4) + 1) : c;
    return [W - x - w, W - y - d, z, w, d, h, color];
  };
  const decor = (q) => q[6].startsWith("bulb") || q[6] === "pineDark" || q[6] === "ribbonGold";
  t.parts = [...t.parts, ...t.parts.filter(decor).map(back)];
  t.detail = [...t.detail, ...t.detail.filter(decor).map(back)];
}

// ---- 엔티크 가구 (GPT 그림) ----
Object.assign(FURNITURE, {
  canopyBed: { name: "캐노피 침대", category: "furniture", price: 360, style: "antique", size: [24, 16, 30], image: "img/furn/canopyBed.png", imageSimple: "img/furn/s/canopyBed.png", hires: true, sleep: { side: [12, 20], pillow: [19, 8, 8] } },
  chesterfield: { name: "체스터필드 소파", category: "furniture", price: 280, style: "antique", size: [10, 22, 12], image: "img/furn/chesterfield.png", imageSimple: "img/furn/s/chesterfield.png", hires: true, seat: { z: 6, back: "-y" }, use: "chair" },
  rockingChair: { name: "흔들의자", category: "furniture", price: 170, style: "antique", size: [9, 9, 16], image: "img/furn/rockingChair.png", imageSimple: "img/furn/s/rockingChair.png", hires: true, rock: true, seat: { z: 6, back: "-y" }, use: "chair" },
  teaTable: { name: "티테이블", category: "furniture", price: 150, style: "antique", size: [10, 10, 12], image: "img/furn/teaTable.png", imageSimple: "img/furn/s/teaTable.png", surface: 12, hires: true, use: "snack" },
  vanity: { name: "화장대", category: "furniture", price: 220, style: "antique", size: [9, 16, 20], image: "img/furn/vanity.png", imageSimple: "img/furn/s/vanity.png", hires: true },
  rolltopDesk: { name: "롤톱 책상", category: "furniture", price: 240, style: "antique", size: [8, 16, 15], image: "img/furn/rolltopDesk.png", imageSimple: "img/furn/s/rolltopDesk.png", work: [10, 8], hires: true, use: "read" },
  grandfatherClock: { name: "괘종시계", category: "furniture", price: 200, style: "antique", size: [6, 6, 26], image: "img/furn/grandfatherClock.png", imageSimple: "img/furn/s/grandfatherClock.png", hires: true },
  wardrobe: { name: "엔티크 옷장", category: "furniture", price: 260, style: "antique", size: [8, 16, 25], image: "img/furn/wardrobe.png", imageSimple: "img/furn/s/wardrobe.png", hires: true },
  piano: { name: "피아노", category: "furniture", price: 400, style: "antique", size: [9, 18, 17], image: "img/furn/piano.png", imageSimple: "img/furn/s/piano.png", hires: true },
  gramophone: { name: "축음기", category: "prop", price: 160, kind: "goods", size: [7, 7, 15], image: "img/furn/gramophone.png", imageSimple: "img/furn/s/gramophone.png", hires: true },
  candelabra: { name: "촛대", category: "prop", price: 90, kind: "light", size: [5, 5, 16], image: "img/furn/candelabra.png", imageOff: "img/furn/candelabra-off.png", imageSimple: "img/furn/s/candelabra.png", imageSimpleOff: "img/furn/s/candelabra-off.png", hires: true, light: { x: 2.5, y: 2.5, z: 14, radius: 40 }, use: "lamp" },
  persianRug: { name: "페르시안 러그", type: "floor", category: "prop", price: 120, kind: "rug", size: [20, 24, 0.5], image: "img/furn/persianRug.png", imageSimple: "img/furn/s/persianRug.png", hires: true },
  goldMirror: { name: "금테 벽거울", type: "wall", category: "prop", price: 100, kind: "wall", size: [9, 1, 14], image: "img/furn/goldMirror.png", imageSimple: "img/furn/s/goldMirror.png", hires: true },
  birdcage: { name: "새장", category: "prop", price: 110, kind: "goods", size: [6, 6, 16], image: "img/furn/birdcage.png", imageSimple: "img/furn/s/birdcage.png", hires: true },
  trunk: { name: "가죽 트렁크", category: "prop", price: 90, kind: "goods", size: [9, 12, 8], image: "img/furn/trunk.png", imageSimple: "img/furn/s/trunk.png", surface: 8, hires: true },
});

// ---- 침대 반대 방향 그림 (돌리기 3·4번째 방향: 베개가 앞쪽) ----
// ver.하찮은 imageSimpleBack. (캐노피 침대는 아래 엔티크 가구와 함께 따로 넣음)
["bed", "futon", "mattress", "berth", "lowBed", "pinkBed", "bunkBed", "bunkBedWhite"].forEach((id) => {
  FURNITURE[id].imageBack = `img/furn/${id}Back.png`;
  FURNITURE[id].imageSimpleBack = `img/furn/s/${id}Back.png`;
});
// 뒤쪽 그림에서 앞에 선 머리판 (0~1 비율 다각형). 누운 캐릭터 위에 다시 그려 머리가 머리판 뒤에 있게
FURNITURE.bed.backFront = [[0.458, 0.526], [0.906, 0.244], [1, 0.27], [1, 1], [0.458, 1]];
FURNITURE.pinkBed.backFront = [[0, 0.36], [0.104, 0.32], [0.458, 0.563], [0.458, 1], [0, 1]];

// ---- 의자·소파·롤톱 책상 반대 방향 그림 (GPT, 세밀). 하찮 그림이 오면 imageSimpleBack 추가 ----
// backClipBack: 뒤쪽 그림에서 앞에 선 등받이 칸 (뒷모습으로 앉은 몸을 가림)
["armchair", "sofa", "chesterfield", "fabricChair", "officeChair", "trainSeat", "rolltopDesk"].forEach((id) => {
  FURNITURE[id].imageBack = `img/furn/${id}Back.png`;
});
// 수납 가구 9종: 반대 방향은 나무 뒷판이 보임 (앞면은 벽 쪽)
["cabinet", "chest", "bookcase", "tallBookcase", "bookChest", "glassCabinet", "sideboard", "fridge", "wardrobe"].forEach((id) => {
  FURNITURE[id].imageBack = `img/furn/${id}Back.png`;
});
// 엔티크 가구 4종과 캐노피 침대 (캐노피는 세 번째 시도에서 베개가 맞게 옴)
["fireplace", "vanity", "grandfatherClock", "piano", "canopyBed"].forEach((id) => {
  FURNITURE[id].imageBack = `img/furn/${id}Back.png`;
});
Object.assign(FURNITURE.armchair, { backClipBack: [0, 0, 1, 0.62] });
Object.assign(FURNITURE.sofa, { backClipBack: [0, 0, 1, 0.62] });
Object.assign(FURNITURE.chesterfield, { backClipBack: [0, 0, 1, 0.62] });
Object.assign(FURNITURE.fabricChair, { backClipBack: [0, 0, 1, 0.62] });
Object.assign(FURNITURE.officeChair, { backClipBack: [0, 0, 1, 0.55] });
Object.assign(FURNITURE.trainSeat, { backClipBack: [0, 0, 1, 0.62] });

// ---- 앞뒤 모양이 같은 탁자: 반대 방향도 같은 그림 (돌리면 앉아서 일하는 자리가 반대편으로 바뀜) ----
["desk", "windowTable", "woodTable", "lowTable", "kotatsu"].forEach((id) => {
  FURNITURE[id].imageBack = FURNITURE[id].image;
  FURNITURE[id].imageSimpleBack = FURNITURE[id].imageSimple;
});

// ---- 의자 반대 방향 그림 (돌리기 3·4번째 방향) ----
FURNITURE.chair.imageBack = "img/furn/chairBack.png";         // 앞을 보고 앉음 (등받이가 뒤)
FURNITURE.chair.imageSimpleBack = "img/furn/s/chairBack.png";
FURNITURE.rockingChair.imageBack = "img/furn/rockingChairBack.png"; // 뒷모습으로 앉음
FURNITURE.rockingChair.imageSimpleBack = "img/furn/s/rockingChairBack.png";
FURNITURE.rockingChair.backClipBack = [0, 0, 0.6, 0.7];        // 뒤쪽 그림에서 앞에 선 등받이 칸 (앉은 몸을 가림)

// ---- 상점 세부 분류 ----------------------------------------------------
// 가구는 스타일(style), 소품은 종류(kind)로 나눕니다. 상점 탭 아래 버튼으로 골라 볼 수 있어요.
// 새 가구를 추가할 때는 가구에 style: "antique"처럼 직접 적거나, 아래 표에 이름(id)을 넣으면 됩니다.
const FURNITURE_STYLES = [
  { id: "natural", name: "내추럴" },
  { id: "modern", name: "모던" },
  { id: "antique", name: "엔티크" },
  { id: "japanese", name: "일본풍" },
];
const PROP_KINDS = [
  { id: "pet", name: "반려동물" },
  { id: "light", name: "조명" },
  { id: "plant", name: "식물" },
  { id: "rug", name: "러그·방석" },
  { id: "wall", name: "벽 장식" },
  { id: "window", name: "창문" },
  { id: "goods", name: "잡화" },
];
const SHOP_TAGS = {
  style: {
    natural: ["desk", "chair", "cabinet", "bed", "stool", "bookcase", "windowTable", "mattress", "woodTable", "tallBookcase", "bookChest", "sideboard", "pinkBed", "bunkBed", "bunkBedWhite"],
    modern: ["officeChair", "fridge", "sofa", "fabricChair", "trainSeat", "berth"],
    antique: ["armchair", "chest", "glassCabinet", "fireplace"],
    japanese: ["lowTable", "futon", "lowBed", "kotatsu", "shojiScreen"],
  },
  kind: {
    light: ["lamp", "andon", "tableLamp", "floorLamp", "moonLamp", "paperLantern", "squareLamp", "stoneLantern"],
    plant: ["plant", "squarePot", "bigPlant", "yellowFlower", "pinkFlower", "bonsai", "sakuraVase", "tsukubai"],
    rug: ["rug", "checkRug", "greenRug", "roundRug", "cushion"],
    wall: ["frame", "shelf", "scroll", "wallClock", "digitalClock", "landscape", "catFrame", "photo1", "photo2", "fusuma", "noren", "luggageRack"],
    window: ["windowCurtain", "windowShoji", "windowRound", "windowTrain"],
    goods: ["laptopBasic", "mug", "notebook", "laptop", "deskClock", "deskClockWhite", "diffuser", "globe", "telescope"],
  },
};
for (const [field, groups] of Object.entries(SHOP_TAGS)) {
  for (const [tag, ids] of Object.entries(groups)) for (const id of ids) if (FURNITURE[id] && !FURNITURE[id][field]) FURNITURE[id][field] = tag;
}

// ---- 색상 변형 가구 ----------------------------------------------------
// 같은 가구의 색만 바꾼 그림(img/furn/<id>_<색>.png, art-src/tools/recolor_variants.py로 만듦)
// 색마다 따로 된 가구(<id>_<색>)로 등록해서 보관함·배치·저장은 그대로 씀. 상점에서는 원래 가구 카드에서 색을 고름
const COLOR_VARIANTS = {
  sofa: [["base", "크림", "#f3e6d2"], ["navy", "네이비", "#4f6a9a"], ["sage", "세이지", "#9db58e"], ["gray", "그레이", "#9a9aa2"], ["pink", "핑크", "#eab4bc"]],
  bed: [["base", "블루", "#8fb3e3"], ["pink", "핑크", "#f0a8b8"], ["mint", "민트", "#8fd0b8"], ["yellow", "옐로", "#f0d27a"], ["gray", "그레이", "#a9adb5"]],
  armchair: [["base", "퍼플", "#a7639a"], ["brown", "브라운", "#9a6444"], ["green", "그린", "#6f9a66"], ["navy", "네이비", "#4f6390"], ["mustard", "머스터드", "#d9aa45"]],
};
for (const [id, list] of Object.entries(COLOR_VARIANTS)) {
  const base = FURNITURE[id];
  base.colors = list.map(([c, name, hex]) => ({ id: c === "base" ? id : `${id}_${c}`, name, hex }));
  for (const [c, name] of list) {
    if (c === "base") continue;
    const v = Object.assign({}, base, {
      variantOf: id, colorName: name, colors: undefined,
      image: base.image.replace(/\.png$/, `_${c}.png`),
      imageSimple: base.imageSimple && base.imageSimple.replace(/\.png$/, `_${c}.png`),
    });
    if (base.imageBack) v.imageBack = base.imageBack.replace(/\.png$/, `_${c}.png`);
    if (base.imageSimpleBack) v.imageSimpleBack = base.imageSimpleBack.replace(/\.png$/, `_${c}.png`);
    FURNITURE[`${id}_${c}`] = v;
  }
}

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
  { id: "spiky", name: "삐죽머리", extra: ["..H..H..H."], rows: [
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
  { id: "curly", name: "곱슬", rows: [
    "..HHHHHH..",
    ".HHHHHHHH.",
    "HHHHHHHHHH",
    "HH......HH",
    "H........H",
    "H........H",
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
const FURNITURE = {
  // ---- 공용 ----
  rug: {
    name: "러그", type: "floor",
    category: "prop", price: 60,
    parts: [
      [0, 0, 0, 24, 20, 0.5, "rug"],
      [3, 3, 0.5, 18, 14, 0.5, "rugLight"],
    ],
  },
  desk: {
    name: "책상",
    category: "furniture", price: 150,
    surface: 16,
    work: [15, 10],
    parts: [
      [0, 0, 0, 2, 2, 14, "woodDark"],
      [10, 0, 0, 2, 2, 14, "woodDark"],
      [0, 18, 0, 2, 2, 14, "woodDark"],
      [10, 18, 0, 2, 2, 14, "woodDark"],
      [0, 0, 14, 12, 20, 2, "wood"],
      [3, 5, 16, 6, 9, 1, "laptop"],
      [2, 5, 17, 1, 9, 6, "screen"],
      [7, 2, 16, 2, 2, 3, "mug"],
    ],
  },
  lamp: {
    name: "스탠드",
    category: "prop", price: 50,
    small: true,
    light: { x: 2, y: 2, z: 9, radius: 42 },
    parts: [
      [0, 0, 0, 4, 4, 1, "metal"],
      [1.5, 1.5, 1, 1, 1, 8, "metal"],
      [0, 0, 8, 4, 4, 3, "lampShade"],
    ],
  },
  chair: {
    name: "의자",
    category: "furniture", price: 80,
    parts: [
      [0, 6, 0, 1, 1, 7, "woodDark"],
      [6, 6, 0, 1, 1, 7, "woodDark"],
      [6, 0, 0, 1, 1, 7, "woodDark"],
      [0, 0, 7, 7, 7, 1, "chair"],
      [6, 0, 8, 1, 7, 7, "chair"],
    ],
  },
  plant: {
    name: "화분",
    category: "prop", price: 40,
    small: true,
    image: "img/plant.png",
    size: [8, 8, 14],
    parts: [
      [1, 1, 0, 6, 6, 6, "pot"],
      [2, 2, 6, 4, 4, 4, "leaf"],
      [1, 4, 8, 3, 3, 3, "leaf"],
      [3, 1, 9, 3, 3, 4, "leafLight"],
    ],
  },

  // ---- 원룸 ----
  frame: {
    name: "액자", type: "wall",
    category: "prop", price: 40,
    parts: [
      [0, 0, 0, 10, 1, 10, "woodDark"],
      [1, 0.5, 1, 8, 1, 8, "picture"],
    ],
  },
  shelf: {
    name: "벽 선반", type: "wall",
    category: "prop", price: 70,
    parts: [
      [0, 0, 0, 18, 5, 1, "wood"],
      [2, 0, 1, 2, 4, 7, "book1"],
      [4, 0, 1, 2, 4, 6, "book2"],
      [6, 0, 1, 2, 4, 7, "book3"],
      [12, 1, 1, 3, 3, 3, "leafLight"],
    ],
  },
  cabinet: {
    name: "수납장",
    category: "furniture", price: 140,
    surface: 10,
    parts: [
      [0, 0, 0, 16, 7, 10, "woodLight"],
      [2, 2, 10, 3, 3, 3, "pot"],
      [2, 2, 13, 3, 3, 3, "leaf"],
      [9, 1, 10, 5, 4, 1, "book2"],
      [9, 1, 11, 5, 4, 1, "book3"],
    ],
  },
  bed: {
    name: "침대",
    category: "furniture", price: 200,
    sleep: { side: [-4, 8], pillow: [18.5, 8, 9] },
    parts: [
      [0, 0, 0, 24, 16, 5, "wood"],
      [0, 0, 0, 2, 16, 8, "woodDark"],
      [2, 1, 5, 20, 14, 3, "sheet"],
      [16, 3, 8, 5, 10, 2, "pillow"],
      [2, 1, 8, 13, 14, 1, "blanket"],
      [22, 0, 0, 2, 16, 14, "woodDark"],
    ],
  },

  // ---- 다다미방 ----
  lowTable: {
    name: "좌탁",
    category: "furniture", price: 120,
    surface: 7.5,
    work: [7, 13],
    parts: [
      [1, 1, 0, 1.5, 1.5, 6, "woodDark"],
      [11.5, 1, 0, 1.5, 1.5, 6, "woodDark"],
      [1, 7.5, 0, 1.5, 1.5, 6, "woodDark"],
      [11.5, 7.5, 0, 1.5, 1.5, 6, "woodDark"],
      [0, 0, 6, 14, 10, 1.5, "woodDark"],
      [4, 3, 7.5, 3, 3, 3, "teapot"],
      [9, 3, 7.5, 1.5, 1.5, 1.5, "cup"],
      [9, 6, 7.5, 1.5, 1.5, 1.5, "cup"],
    ],
  },
  cushion: {
    name: "방석",
    category: "prop", price: 30,
    parts: [
      [0, 0, 0, 9, 9, 1.5, "cushion"],
      [1, 1, 1.5, 7, 7, 0.5, "cushionLight"],
    ],
  },
  futon: {
    name: "이불",
    category: "furniture", price: 150,
    sleep: { side: [-3, 7], pillow: [18.5, 7, 4] },
    parts: [
      [0, 0, 0, 24, 14, 2, "futonBase"],
      [16, 3, 2, 5, 8, 2, "pillow"],
      [1, 0.5, 2, 15, 13, 1.5, "futonQuilt"],
      [1, 0.5, 3.5, 15, 2, 0.1, "futonQuiltLight"],
    ],
  },
  andon: {
    name: "종이 등",
    category: "prop", price: 70,
    light: { x: 2.5, y: 2.5, z: 6, radius: 40 },
    parts: [
      [0, 0, 0, 5, 5, 1, "woodDark"],
      [0.5, 0.5, 1, 4, 4, 9, "paperLamp"],
      [0, 0, 10, 5, 5, 1, "woodDark"],
    ],
  },
  chest: {
    name: "서랍장",
    category: "furniture", price: 160,
    surface: 16,
    parts: [
      [0, 0, 0, 14, 7, 16, "woodLight"],
      [1, 7, 1, 12, 0.5, 4, "wood"],
      [1, 7, 6, 12, 0.5, 4, "wood"],
      [1, 7, 11, 12, 0.5, 4, "wood"],
      [3, 2, 16, 4, 3, 2, "teapot"],
    ],
  },
  scroll: {
    name: "족자", type: "wall",
    category: "prop", price: 50,
    parts: [
      [0, 0, 0, 10, 1, 20, "scrollPaper"],
      [2, 0.5, 6, 6, 1, 10, "scrollArt"],
      [-1, 0, 20, 12, 1.5, 1.5, "woodDark"],
      [-1, 0, -1, 12, 1.5, 1.5, "woodDark"],
    ],
  },

  // ---- 다락방 ----
  mattress: {
    name: "매트리스",
    category: "furniture", price: 120,
    sleep: { side: [-4, 8], pillow: [18.5, 8, 7] },
    parts: [
      [0, 0, 0, 24, 16, 3, "wood"],
      [1, 1, 3, 22, 14, 2, "sheet"],
      [16, 3, 5, 5, 10, 2, "pillow"],
      [1, 1, 5, 14, 14, 1, "blanket"],
    ],
  },
  bookcase: {
    name: "책장",
    category: "furniture", price: 180,
    parts: [
      [0, 0, 0, 6, 12, 18, "wood"],
      [5.5, 1, 1, 0.5, 10, 16, "woodDark"],
      [4, 1.5, 2, 2, 2, 6, "book1"],
      [4, 3.5, 2, 2, 2, 5, "book3"],
      [4, 6, 2, 2, 3, 6, "book2"],
      [4, 1.5, 10, 2, 3, 6, "book2"],
      [4, 5, 10, 2, 2, 5, "book1"],
      [4, 8, 10, 2, 2, 6, "book3"],
    ],
  },
  stool: {
    name: "보조 의자",
    category: "furniture", price: 60,
    parts: [
      [0, 0, 0, 6, 6, 5, "cushion"],
      [0, 0, 5, 6, 6, 1, "cushionLight"],
    ],
  },

  // ---- 창문과 시계 (벽에 거는 장식) ----
  // decor: "window"(창문) / "clock"(시계), style: 창문 모양
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
    parts: [[0, 0, 0, 10, 1, 10, "woodDark"]],
  },

  // ---- 원형 탑방 ----
  armchair: {
    name: "안락의자",
    category: "furniture", price: 130,
    parts: [
      [0, 0, 0, 9, 9, 5, "velvet"],
      [0, 0, 5, 2.5, 9, 9, "velvet"],
      [0, 0, 5, 9, 1.5, 4, "velvet"],
      [0, 7.5, 5, 9, 1.5, 4, "velvet"],
    ],
  },
  globe: {
    name: "지구본",
    category: "prop", price: 70,
    small: true,
    parts: [
      [1.5, 1.5, 0, 3, 3, 1, "woodDark"],
      [2.5, 2.5, 1, 1, 1, 4, "brass"],
      [0.5, 0.5, 5, 5, 5, 5, "globe"],
      [1.5, 0.5, 7, 3, 2, 2, "globeLand"],
    ],
  },
  telescope: {
    name: "망원경",
    category: "prop", price: 80,
    parts: [
      [1, 1, 0, 1, 1, 10, "woodDark"],
      [6, 1, 0, 1, 1, 10, "woodDark"],
      [3.5, 6, 0, 1, 1, 10, "woodDark"],
      [0, 2.5, 10, 10, 2.5, 2.5, "brass"],
    ],
  },

  // ---- 기차 객실 ----
  trainSeat: {
    name: "객실 좌석",
    category: "furniture", price: 100,
    parts: [
      [0, 0, 0, 9, 10, 6, "seatBase"],
      [0, 0, 6, 9, 10, 2, "seat"],
      [0, 0, 8, 2.5, 10, 11, "seat"],
    ],
  },
  windowTable: {
    name: "창가 테이블",
    category: "furniture", price: 90,
    surface: 11,
    work: [4, 9],
    parts: [
      [3, 2, 0, 1.5, 1.5, 10, "metal"],
      [0, 0, 10, 8, 6, 1, "woodLight"],
    ],
  },
  berth: {
    name: "침대칸",
    category: "furniture", price: 180,
    sleep: { side: [-3, 5], pillow: [17.5, 5, 7.5] },
    parts: [
      [0, 0, 0, 22, 10, 4, "woodDark"],
      [1, 1, 4, 20, 8, 2, "sheet"],
      [15, 2, 6, 5, 6, 1.5, "pillow"],
      [1, 1, 6, 13, 8, 1, "blanketRed"],
    ],
  },
  luggageRack: {
    name: "짐 선반",
    type: "wall",
    category: "prop", price: 60,
    parts: [
      [0, 0, 0, 18, 6, 1, "metal"],
      [2, 0, 1, 5, 4, 4, "book1"],
      [9, 0, 1, 6, 4, 3, "book3"],
    ],
  },
};

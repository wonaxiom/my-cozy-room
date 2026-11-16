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

// 비스듬한 다리 (작은 상자를 조금씩 옮겨 쌓음): (x0, y0) 바닥에서 (x1, y1) 높이 z1까지
function slantLeg(x0, y0, x1, y1, z1, color, n = 6) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    out.push([r3(x0 + (x1 - x0) * t), r3(y0 + (y1 - y0) * t), r3((z1 * i) / n), 2 / 3, 2 / 3, r3(z1 / n) + 0.01, color]);
  }
  return out;
}

const FURNITURE = {
  // ---- 공용 ----
  rug: {
    name: "러그", type: "floor",
    category: "prop", price: 60,
    parts: [
      [0, 0, 0, 24, 20, 0.5, "rug"],
      [3, 3, 0.5, 18, 14, 0.5, "rugLight"],
    ],
    detail: [
      [0, 0, 0, 24, 20, 1 / 3, "rug"],
      [1, 1, 1 / 3, 22, 18, 0.01, "rugDark"],
      [2, 2, 1 / 3, 20, 16, 0.01, "rugLight"],
      [3, 3, 1 / 3, 18, 14, 0.01, "rug"],
      [9, 7, 1 / 3, 6, 6, 0.01, "rugDark"],
      [10, 8, 1 / 3, 4, 4, 0.01, "rugLight"],
      [11, 9, 1 / 3, 2, 2, 0.01, "rugDark"],
      [5, 5, 1 / 3, 2, 2, 0.01, "rugDark"],
      [17, 5, 1 / 3, 2, 2, 0.01, "rugDark"],
      [5, 13, 1 / 3, 2, 2, 0.01, "rugDark"],
      [17, 13, 1 / 3, 2, 2, 0.01, "rugDark"],
      ...[1, 3, 5, 7, 9, 11, 13, 15, 17].map((y) => [0, y, 1 / 3, 2 / 3, 1, 0.01, "rugFringe"]),
      ...[1, 3, 5, 7, 9, 11, 13, 15, 17].map((y) => [70 / 3, y, 1 / 3, 2 / 3, 1, 0.01, "rugFringe"]),
    ],
  },
  desk: {
    name: "책상",
    category: "furniture", price: 150,
    surface: 10,
    work: [15, 10],
    parts: [
      [0, 0, 0, 2, 2, 8.5, "woodDark"],
      [10, 0, 0, 2, 2, 8.5, "woodDark"],
      [0, 18, 0, 2, 2, 8.5, "woodDark"],
      [10, 18, 0, 2, 2, 8.5, "woodDark"],
      [0, 0, 8.5, 12, 20, 1.5, "wood"],
      [3, 5, 10, 6, 9, 1, "laptop"],
      [2, 5, 11, 1, 9, 6, "screen"],
      [7, 2, 10, 2, 2, 3, "mug"],
    ],
    detail: [
      [0, 0, 0, 4 / 3, 4 / 3, 8.5, "woodDark"],
      [32 / 3, 0, 0, 4 / 3, 4 / 3, 8.5, "woodDark"],
      [0, 56 / 3, 0, 4 / 3, 4 / 3, 8.5, "woodDark"],
      [32 / 3, 56 / 3, 0, 4 / 3, 4 / 3, 8.5, "woodDark"],
      [1 / 3, 1 / 3, 7, 34 / 3, 58 / 3, 1.5, "woodDark"],
      [12, 5, 22 / 3, 0.01, 10, 1, "woodLight"],
      [12, 29 / 3, 23 / 3, 1 / 3, 2 / 3, 1 / 3, "brass"],
      [0, 0, 8.5, 12, 20, 1.5, "wood"],
      [1 / 3, 1 / 3, 10, 34 / 3, 58 / 3, 0.01, "woodLight"],
      [2 / 3, 2 / 3, 10, 32 / 3, 56 / 3, 0.01, "wood"],
      // 노트북
      [3, 5, 10, 6, 9, 1 / 3, "laptop"],
      [11 / 3, 17 / 3, 31 / 3, 13 / 3, 23 / 3, 0.01, "laptopKey"],
      [19 / 3, 26 / 3, 31 / 3, 2, 5 / 3, 0.01, "laptop"],
      [2, 5, 31 / 3, 2 / 3, 9, 6, "laptopBack"],
      [8 / 3, 16 / 3, 32 / 3, 0.01, 25 / 3, 16 / 3, "screen"],
      [8 / 3, 19 / 3, 13, 0.01, 4 / 3, 2, "laptopBack"],
      // 머그잔
      [7, 2, 10, 2, 2, 7 / 3, "mug"],
      [22 / 3, 7 / 3, 37 / 3, 4 / 3, 4 / 3, 0.01, "coffee"],
      [9, 8 / 3, 32 / 3, 2 / 3, 2 / 3, 1, "mug"],
      // 공책과 펜
      [8, 15, 10, 3, 10 / 3, 1 / 3, "book2"],
      [25 / 3, 46 / 3, 31 / 3, 7 / 3, 3, 0.01, "bookPage"],
      [26 / 3, 16, 32 / 3, 2, 1 / 3, 1 / 3, "book1"],
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
    detail: [
      [0, 0, 0, 4, 4, 2 / 3, "metal"],
      [1 / 3, 1 / 3, 2 / 3, 10 / 3, 10 / 3, 1 / 3, "metalLight"],
      [5 / 3, 5 / 3, 1, 2 / 3, 2 / 3, 7, "metal"],
      [4 / 3, 4 / 3, 22 / 3, 4 / 3, 4 / 3, 2 / 3, "metalLight"],
      [0, 0, 8, 4, 4, 2, "lampShade"],
      [1 / 3, 1 / 3, 10, 10 / 3, 10 / 3, 2 / 3, "lampShade"],
      [2 / 3, 2 / 3, 32 / 3, 8 / 3, 8 / 3, 1 / 3, "lampShade"],
      [0, 4, 25 / 3, 4, 0.01, 2 / 3, "lampShadeOff"],
      [4, 0, 25 / 3, 0.01, 4, 2 / 3, "lampShadeOff"],
      [3, 3, 6, 1 / 3, 1 / 3, 2, "metalLight"],
    ],
  },
  chair: {
    name: "의자",
    category: "furniture", price: 80,
    parts: [
      [0, 0, 0, 1, 1, 5, "woodDark"],
      [0, 6, 0, 1, 1, 5, "woodDark"],
      [6, 6, 0, 1, 1, 5, "woodDark"],
      [6, 0, 0, 1, 1, 5, "woodDark"],
      [0, 0, 5, 7, 7, 1, "chair"],
      [6, 0, 6, 1, 7, 6, "chair"],
    ],
    detail: [
      [0, 0, 0, 2 / 3, 2 / 3, 5, "woodDark"],
      [0, 19 / 3, 0, 2 / 3, 2 / 3, 5, "woodDark"],
      [19 / 3, 19 / 3, 0, 2 / 3, 2 / 3, 5, "woodDark"],
      [19 / 3, 0, 0, 2 / 3, 2 / 3, 5, "woodDark"],
      [2 / 3, 19 / 3, 2, 17 / 3, 1 / 3, 2 / 3, "woodDark"],
      [19 / 3, 2 / 3, 2, 1 / 3, 17 / 3, 2 / 3, "woodDark"],
      [0, 0, 5, 7, 7, 2 / 3, "chair"],
      [1 / 3, 1 / 3, 17 / 3, 17 / 3, 19 / 3, 2 / 3, "chairCushion"],
      [6, 0, 17 / 3, 1, 2 / 3, 19 / 3, "chair"],
      [6, 19 / 3, 17 / 3, 1, 2 / 3, 19 / 3, "chair"],
      [6, 7 / 3, 17 / 3, 2 / 3, 2 / 3, 5, "chair"],
      [6, 13 / 3, 17 / 3, 2 / 3, 2 / 3, 5, "chair"],
      [6, 0, 32 / 3, 1, 7, 4 / 3, "chair"],
    ],
  },
  plant: {
    name: "화분",
    category: "prop", price: 40,
    small: true,
    parts: [
      [1, 1, 0, 6, 6, 6, "pot"],
      [2, 2, 6, 4, 4, 4, "leaf"],
      [1, 4, 8, 3, 3, 3, "leaf"],
      [3, 1, 9, 3, 3, 4, "leafLight"],
    ],
    detail: [
      [2 / 3, 2 / 3, 0, 20 / 3, 20 / 3, 2 / 3, "potLight"],
      [1, 1, 2 / 3, 6, 6, 5, "pot"],
      [2 / 3, 2 / 3, 17 / 3, 20 / 3, 20 / 3, 1, "potLight"],
      [1, 1, 20 / 3, 6, 6, 0.01, "soil"],
      [11 / 3, 11 / 3, 20 / 3, 2 / 3, 2 / 3, 3, "leafDark"],
      [2, 2, 8, 4, 4, 2, "leafDark"],
      [1, 3, 9, 3, 3, 5 / 3, "leaf"],
      [4, 1, 29 / 3, 3, 3, 5 / 3, "leaf"],
      [1 / 3, 13 / 3, 25 / 3, 2, 2, 1, "leafLight"],
      [17 / 3, 4, 26 / 3, 2, 2, 1, "leaf"],
      [3, 4, 32 / 3, 3, 3, 2, "leafLight"],
      [2, 2, 35 / 3, 2, 2, 5 / 3, "leaf"],
      [3, 3, 12, 2, 2, 4 / 3, "leafLight"],
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
    detail: [
      [0, 0, 0, 10, 2 / 3, 10, "woodDark"],
      [1 / 3, 2 / 3, 1 / 3, 28 / 3, 0.01, 28 / 3, "wood"],
      [2 / 3, 2 / 3, 2 / 3, 26 / 3, 0.01, 26 / 3, "frameMat"],
      [4 / 3, 2 / 3, 4 / 3, 22 / 3, 0.01, 22 / 3, "sky"],
      [7, 2 / 3, 6, 4 / 3, 0.01, 4 / 3, "sun"],
      [4 / 3, 2 / 3, 4 / 3, 22 / 3, 0.01, 3, "hill"],
      [3, 2 / 3, 13 / 3, 3, 0.01, 1, "hill"],
      [11 / 3, 2 / 3, 16 / 3, 5 / 3, 0.01, 2 / 3, "hill"],
      [4 / 3, 2 / 3, 4 / 3, 22 / 3, 0.01, 1, "hillDark"],
      [19 / 3, 2 / 3, 7 / 3, 2, 0.01, 1, "hillDark"],
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
    detail: [
      [2, 0, -3, 1, 4, 3, "woodDark"],
      [15, 0, -3, 1, 4, 3, "woodDark"],
      [0, 0, 0, 18, 5, 1, "wood"],
      ...book(1, 2 / 3, 1, 4 / 3, 11 / 3, 19 / 3, "book1"),
      ...book(8 / 3, 2 / 3, 1, 1, 11 / 3, 16 / 3, "book4"),
      ...book(4, 2 / 3, 1, 5 / 3, 11 / 3, 6, "book2"),
      ...book(6, 1, 1, 1, 10 / 3, 14 / 3, "book5"),
      ...flatBook(23 / 3, 1, 1, 3, 10 / 3, "book3"),
      ...flatBook(8, 4 / 3, 5 / 3, 7 / 3, 8 / 3, "book1"),
      ...smallPlant(35 / 3, 4 / 3, 1),
      ...jarCandle(15, 5 / 3, 1),
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
    detail: [
      [0, 0, 0, 16, 7, 10, "woodLight"],
      [1, 7, 1, 20 / 3, 0.01, 8, "wood"],
      [25 / 3, 7, 1, 20 / 3, 0.01, 8, "wood"],
      [4 / 3, 7, 4 / 3, 6, 0.01, 22 / 3, "woodLight"],
      [26 / 3, 7, 4 / 3, 6, 0.01, 22 / 3, "woodLight"],
      [19 / 3, 7, 4, 2 / 3, 1 / 3, 4 / 3, "brass"],
      [9, 7, 4, 2 / 3, 1 / 3, 4 / 3, "brass"],
      ...smallPlant(2, 2, 10),
      ...flatBook(9, 1, 10, 5, 4, "book2"),
      ...flatBook(28 / 3, 4 / 3, 32 / 3, 13 / 3, 10 / 3, "book3"),
      ...flatBook(29 / 3, 5 / 3, 34 / 3, 11 / 3, 8 / 3, "book4"),
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
    detail: [
      [2, 0, 0, 1, 1, 1, "woodDark"],
      [21, 0, 0, 1, 1, 1, "woodDark"],
      [2, 15, 0, 1, 1, 1, "woodDark"],
      [21, 15, 0, 1, 1, 1, "woodDark"],
      [2, 0, 1, 20, 16, 4, "wood"],
      [2, 16, 4, 20, 0.01, 2 / 3, "woodLight"],
      [0, 0, 0, 2, 16, 8, "woodDark"],
      [0, 0, 8, 2, 16, 2 / 3, "wood"],
      [2, 1 / 3, 5, 20, 46 / 3, 3, "sheet"],
      [2, 47 / 3, 6, 20, 0.01, 2 / 3, "sheetShade"],
      [16, 3, 8, 5, 10, 5 / 3, "pillow"],
      [17, 4, 29 / 3, 3, 8, 1 / 3, "pillow"],
      [16, 13, 26 / 3, 5, 0.01, 2 / 3, "sheetShade"],
      [2, 0, 13 / 3, 12, 16, 14 / 3, "blanket"],
      [14, 0, 13 / 3, 4 / 3, 16, 5, "blanketLight"],
      [5, 0, 9, 1, 16, 0.01, "blanketLight"],
      [9, 0, 9, 1, 16, 0.01, "blanketLight"],
      [5, 16, 13 / 3, 2 / 3, 0.01, 14 / 3, "blanketLight"],
      [9, 16, 13 / 3, 2 / 3, 0.01, 14 / 3, "blanketLight"],
      [22, 0, 0, 2, 16, 14, "woodDark"],
      [22, 0, 14, 2, 16, 2 / 3, "wood"],
      [24, 1, 4, 0.01, 14, 8, "wood"],
      [24, 2, 5, 0.01, 12, 6, "woodDark"],
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
    detail: [
      [1, 1, 0, 1.5, 1.5, 6, "woodDark"],
      [11.5, 1, 0, 1.5, 1.5, 6, "woodDark"],
      [1, 7.5, 0, 1.5, 1.5, 6, "woodDark"],
      [11.5, 7.5, 0, 1.5, 1.5, 6, "woodDark"],
      [1, 1, 5, 12, 8, 1, "beam"],
      [0, 0, 6, 14, 10, 1.5, "woodDark"],
      [1 / 3, 1 / 3, 7.5, 40 / 3, 28 / 3, 0.01, "wood"],
      [3, 2, 7.5, 8, 6, 1 / 3, "tray"],
      // 찻주전자
      [4, 3, 23 / 3, 3, 3, 2, "teapot"],
      [14 / 3, 11 / 3, 29 / 3, 5 / 3, 5 / 3, 1 / 3, "teapot"],
      [16 / 3, 13 / 3, 10, 1 / 3, 1 / 3, 1 / 3, "teapotDark"],
      [7, 13 / 3, 8.5, 1, 2 / 3, 2 / 3, "teapot"],
      [4, 6, 9, 3, 0.01, 2 / 3, "teapotDark"],
      // 찻잔
      [9, 3, 23 / 3, 5 / 3, 5 / 3, 4 / 3, "cup"],
      [28 / 3, 10 / 3, 9, 1, 1, 0.01, "tea"],
      [9, 6, 23 / 3, 5 / 3, 5 / 3, 4 / 3, "cup"],
      [28 / 3, 19 / 3, 9, 1, 1, 0.01, "tea"],
    ],
  },
  cushion: {
    name: "방석",
    category: "prop", price: 30,
    parts: [
      [0, 0, 0, 9, 9, 1.5, "cushion"],
      [1, 1, 1.5, 7, 7, 0.5, "cushionLight"],
    ],
    detail: [
      [0, 0, 0, 9, 9, 4 / 3, "cushion"],
      [1 / 3, 1 / 3, 4 / 3, 25 / 3, 25 / 3, 1 / 3, "cushionLight"],
      [1, 1, 5 / 3, 7, 7, 0.01, "cushion"],
      [4 / 3, 4 / 3, 5 / 3, 19 / 3, 19 / 3, 0.01, "cushionLight"],
      [4, 4, 5 / 3, 1, 1, 1 / 3, "cushion"],
      [0, 0, 4 / 3, 2 / 3, 2 / 3, 1 / 3, "tassel"],
      [25 / 3, 0, 4 / 3, 2 / 3, 2 / 3, 1 / 3, "tassel"],
      [0, 25 / 3, 4 / 3, 2 / 3, 2 / 3, 1 / 3, "tassel"],
      [25 / 3, 25 / 3, 4 / 3, 2 / 3, 2 / 3, 1 / 3, "tassel"],
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
    detail: [
      [0, 0, 0, 24, 14, 2, "futonBase"],
      [0, 14, 2 / 3, 24, 0.01, 2 / 3, "sheetShade"],
      [16, 3, 2, 5, 8, 2, "pillow"],
      [18, 3, 4, 1, 8, 0.01, "futonQuilt"],
      [18, 11, 2, 1, 0.01, 2, "futonQuilt"],
      [1, 0.5, 2, 13, 13, 1.5, "futonQuilt"],
      ...[2, 6, 10].flatMap((x) => [1.5, 5.5, 9.5].map((y) => [x, y, 3.5, 2, 2, 0.01, "futonQuiltLight"])),
      ...[4, 8, 12].flatMap((x) => [3.5, 7.5].map((y) => [x, y, 3.5, 1, 1, 0.01, "futonQuiltLight"])),
      [14, 0.5, 2, 2, 13, 1.75, "futonBase"],
      [14, 13.5, 2, 2, 0.01, 1.75, "sheetShade"],
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
    detail: [
      [0, 0, 0, 5, 5, 2 / 3, "woodDark"],
      [0, 0, 2 / 3, 2 / 3, 2 / 3, 29 / 3, "woodDark"],
      [1 / 3, 1 / 3, 1, 13 / 3, 13 / 3, 28 / 3, "paperLamp"],
      [1 / 3, 14 / 3, 4, 13 / 3, 0.01, 2 / 3, "woodDark"],
      [1 / 3, 14 / 3, 7, 13 / 3, 0.01, 2 / 3, "woodDark"],
      [14 / 3, 1 / 3, 4, 0.01, 13 / 3, 2 / 3, "woodDark"],
      [14 / 3, 1 / 3, 7, 0.01, 13 / 3, 2 / 3, "woodDark"],
      [13 / 3, 0, 2 / 3, 2 / 3, 2 / 3, 29 / 3, "woodDark"],
      [0, 13 / 3, 2 / 3, 2 / 3, 2 / 3, 29 / 3, "woodDark"],
      [13 / 3, 13 / 3, 2 / 3, 2 / 3, 2 / 3, 29 / 3, "woodDark"],
      [0, 0, 31 / 3, 5, 5, 2 / 3, "woodDark"],
      [2 / 3, 2 / 3, 11, 11 / 3, 11 / 3, 0.01, "paperLamp"],
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
    detail: [
      [0, 0, 0, 14, 7, 2 / 3, "wood"],
      [0, 0, 2 / 3, 14, 7, 46 / 3, "woodLight"],
      [1, 7, 4 / 3, 12, 1 / 3, 13 / 3, "wood"],
      [1, 7, 6, 12, 1 / 3, 13 / 3, "wood"],
      [1, 7, 32 / 3, 12, 1 / 3, 13 / 3, "wood"],
      ...[10 / 3, 8, 37 / 3].flatMap((z) => [
        [3, 22 / 3, z, 2, 1 / 3, 2 / 3, "woodDark"],
        [9, 22 / 3, z, 2, 1 / 3, 2 / 3, "woodDark"],
      ]),
      [20 / 3, 22 / 3, 7, 2 / 3, 0.01, 2 / 3, "brass"],
      [0, 7, 15, 1, 0.01, 1, "iron"],
      [13, 7, 15, 1, 0.01, 1, "iron"],
      // 찻주전자와 찻잔
      [3, 2, 16, 3, 3, 2, "teapot"],
      [11 / 3, 8 / 3, 18, 5 / 3, 5 / 3, 1 / 3, "teapot"],
      [13 / 3, 10 / 3, 55 / 3, 1 / 3, 1 / 3, 1 / 3, "teapotDark"],
      [6, 10 / 3, 50 / 3, 1, 2 / 3, 2 / 3, "teapot"],
      [8, 2, 16, 5 / 3, 5 / 3, 4 / 3, "cup"],
      [25 / 3, 7 / 3, 52 / 3, 1, 1, 0.01, "tea"],
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
    detail: [
      [0, 0, 0, 10, 2 / 3, 20, "scrollSilk"],
      [1, 2 / 3, 2, 8, 0.01, 16, "scrollPaper"],
      [6, 2 / 3, 13, 4 / 3, 0.01, 4 / 3, "scrollMoon"],
      [2, 2 / 3, 4, 6, 0.01, 2, "scrollArt"],
      [3, 2 / 3, 6, 3, 0.01, 2, "scrollArt"],
      [11 / 3, 2 / 3, 8, 5 / 3, 0.01, 1, "scrollArt"],
      [2, 2 / 3, 4, 6, 0.01, 2 / 3, "hillDark"],
      [2, 2 / 3, 15, 1 / 3, 0.01, 1, "ink"],
      [2, 2 / 3, 41 / 3, 1 / 3, 0.01, 2 / 3, "ink"],
      [2, 2 / 3, 37 / 3, 1 / 3, 0.01, 2 / 3, "ink"],
      [8 / 3, 2 / 3, 44 / 3, 1 / 3, 0.01, 2 / 3, "ink"],
      [8 / 3, 2 / 3, 13, 1 / 3, 0.01, 1, "ink"],
      [8 / 3, 2 / 3, 11, 2 / 3, 0.01, 2 / 3, "seal"],
      [14 / 3, 0, 20, 2 / 3, 1 / 3, 7 / 3, "tie"],
      [-1, 0, 20, 12, 1.5, 1.5, "woodDark"],
      [-1, 0, 20, 2 / 3, 1.5, 1.5, "brass"],
      [31 / 3, 0, 20, 2 / 3, 1.5, 1.5, "brass"],
      [-1, 0, -1, 12, 1.5, 1.5, "woodDark"],
      [-1, 0, -1, 2 / 3, 1.5, 1.5, "brass"],
      [31 / 3, 0, -1, 2 / 3, 1.5, 1.5, "brass"],
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
    detail: [
      [0, 0, 0, 24, 16, 3, "wood"],
      [0, 16, 2, 24, 0.01, 2 / 3, "woodDark"],
      [6, 16, 0, 1, 0.01, 2, "woodDark"],
      [23 / 2, 16, 0, 1, 0.01, 2, "woodDark"],
      [17, 16, 0, 1, 0.01, 2, "woodDark"],
      [24, 0, 2, 0.01, 16, 2 / 3, "woodDark"],
      [24, 7.5, 0, 0.01, 1, 2, "woodDark"],
      [1, 1, 3, 22, 14, 2, "sheet"],
      [1, 15, 4, 22, 0.01, 2 / 3, "sheetShade"],
      [16, 3, 5, 5, 10, 5 / 3, "pillow"],
      [17, 4, 20 / 3, 3, 8, 1 / 3, "pillow"],
      [1, 1 / 2, 4, 12, 15, 1, "blanket"],
      [13, 1 / 2, 4, 2, 15, 4 / 3, "blanketLight"],
      [4, 1 / 2, 5, 1, 15, 0.01, "blanketLight"],
      [8, 1 / 2, 5, 1, 15, 0.01, "blanketLight"],
      [4, 31 / 2, 4, 2 / 3, 0.01, 1, "blanketLight"],
      [8, 31 / 2, 4, 2 / 3, 0.01, 1, "blanketLight"],
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
    detail: [
      [0, 0, 0, 1, 12, 18, "woodDark"],
      [0, 0, 0, 6, 1, 18, "wood"],
      [0, 0, 0, 6, 12, 4 / 3, "wood"],
      // 아래 칸
      ...book(5 / 3, 4 / 3, 4 / 3, 11 / 3, 4 / 3, 6, "book1", "x"),
      ...book(5 / 3, 3, 4 / 3, 11 / 3, 1, 16 / 3, "book3", "x"),
      ...book(5 / 3, 13 / 3, 4 / 3, 11 / 3, 5 / 3, 19 / 3, "book2", "x"),
      ...book(5 / 3, 19 / 3, 4 / 3, 11 / 3, 1, 5, "book4", "x"),
      ...flatBook(2, 23 / 3, 4 / 3, 10 / 3, 3, "book5"),
      ...flatBook(7 / 3, 8, 2, 3, 8 / 3, "book1"),
      ...flatBook(2, 23 / 3, 8 / 3, 10 / 3, 3, "book3"),
      [1, 1, 26 / 3, 5, 10, 2 / 3, "wood"], // 가운데 칸막이 (아래 칸 책 다음에 그려야 앞에 보임)
      // 위 칸
      ...book(5 / 3, 4 / 3, 28 / 3, 11 / 3, 5 / 3, 6, "book2", "x"),
      ...book(5 / 3, 10 / 3, 28 / 3, 11 / 3, 1, 17 / 3, "book5", "x"),
      ...book(5 / 3, 14 / 3, 28 / 3, 11 / 3, 4 / 3, 19 / 3, "book1", "x"),
      ...book(5 / 3, 19 / 3, 28 / 3, 11 / 3, 1, 5, "book3", "x"),
      ...smallPlant(7 / 3, 25 / 3, 28 / 3),
      [0, 11, 0, 6, 1, 18, "wood"],
      [0, 0, 17, 6, 12, 1, "wood"],
    ],
  },

  stool: {
    name: "보조 의자",
    category: "furniture", price: 60,
    parts: [
      [0, 0, 0, 6, 6, 5, "cushion"],
      [0, 0, 5, 6, 6, 1, "cushionLight"],
    ],
    detail: [
      ...[[1 / 3, 1 / 3], [5, 1 / 3], [1 / 3, 5], [5, 5]].map(([x, y]) => [x, y, 0, 2 / 3, 2 / 3, 4, "woodDark"]),
      [1 / 3, 17 / 3 - 1 / 3, 4 / 3, 16 / 3, 1 / 3, 2 / 3, "woodDark"],
      [17 / 3 - 1 / 3, 1 / 3, 4 / 3, 1 / 3, 16 / 3, 2 / 3, "woodDark"],
      [0, 0, 4, 6, 6, 2 / 3, "wood"],
      [1 / 3, 1 / 3, 14 / 3, 16 / 3, 16 / 3, 1, "cushion"],
      [2 / 3, 2 / 3, 17 / 3, 14 / 3, 14 / 3, 1 / 3, "cushionLight"],
      [8 / 3, 8 / 3, 6, 2 / 3, 2 / 3, 0.01, "cushion"],
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
    name: "안락의자",
    category: "furniture", price: 130,
    parts: [
      [0, 0, 0, 9, 9, 5, "velvet"],
      [0, 0, 5, 2.5, 9, 9, "velvet"],
      [2.5, 0, 5, 6.5, 1.5, 4, "velvet"], // 팔걸이는 등받이 앞에서 시작 (겹치면 등받이 위에 그려짐)
      [2.5, 7.5, 5, 6.5, 1.5, 4, "velvet"],
    ],
    detail: [
      ...[[1 / 3, 1 / 3], [23 / 3, 1 / 3], [1 / 3, 23 / 3], [23 / 3, 23 / 3]].map(([x, y]) => [x, y, 0, 1, 1, 1, "woodDark"]),
      [0, 0, 1, 9, 9, 4, "velvet"],
      [0, 9, 14 / 3, 9, 0.01, 2 / 3, "velvetDark"],
      [9, 0, 14 / 3, 0.01, 9, 2 / 3, "velvetDark"],
      [0, 0, 5, 2.5, 9, 9, "velvet"],
      [1 / 3, 1 / 3, 14, 2, 25 / 3, 1 / 3, "velvet"],
      [2.5, 1.5, 6, 2 / 3, 6, 6, "velvetLight"],
      ...[3, 4.5, 6].flatMap((y) => [[19 / 6, y, 9, 0.01, 1 / 3, 1 / 3, "velvetDark"], [19 / 6, y, 7, 0.01, 1 / 3, 1 / 3, "velvetDark"]]),
      [2.5, 1.5, 5, 6.5, 6, 1, "velvetLight"],
      [2.5, 0, 5, 6.5, 1.5, 4, "velvet"],
      [2.5, 0, 9, 6.5, 1.5, 1 / 3, "velvetLight"],
      [9, 1 / 3, 17 / 3, 0.01, 5 / 6, 8 / 3, "velvetDark"],
      [2.5, 7.5, 5, 6.5, 1.5, 4, "velvet"],
      [2.5, 7.5, 9, 6.5, 1.5, 1 / 3, "velvetLight"],
      [9, 23 / 3, 17 / 3, 0.01, 5 / 6, 8 / 3, "velvetDark"],
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
    detail: [
      [1.5, 1.5, 0, 3, 3, 2 / 3, "woodDark"],
      [5 / 3, 5 / 3, 2 / 3, 8 / 3, 8 / 3, 1 / 3, "wood"],
      [8 / 3, 8 / 3, 1, 2 / 3, 2 / 3, 11 / 3, "brass"],
      [5 / 3, 5 / 3, 14 / 3, 8 / 3, 8 / 3, 2 / 3, "globe"],
      [1, 1, 16 / 3, 4, 4, 2 / 3, "globe"],
      [0.5, 0.5, 6, 5, 5, 8 / 3, "globe"],
      [1, 1, 26 / 3, 4, 4, 2 / 3, "globe"],
      [5 / 3, 5 / 3, 28 / 3, 8 / 3, 8 / 3, 2 / 3, "globe"],
      [2, 5.5, 19 / 3, 5 / 3, 0.01, 5 / 3, "globeLand"],
      [4, 5.5, 22 / 3, 2 / 3, 0.01, 1, "globeLand"],
      [5.5, 1.5, 20 / 3, 0.01, 4 / 3, 2, "globeLand"],
      [5.5, 10 / 3, 6, 0.01, 1, 1, "globeLand"],
      [2, 2, 10, 4 / 3, 1, 0.01, "globeLand"],
      [0.5, 5.5, 43 / 6, 5, 0.01, 2 / 3, "brass"],
      [5.5, 0.5, 43 / 6, 0.01, 5, 2 / 3, "brass"],
      [8 / 3, 8 / 3, 10, 2 / 3, 2 / 3, 1 / 3, "brass"],
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
    detail: [
      ...slantLeg(1, 1, 3.5, 2.5, 10, "woodDark"),
      ...slantLeg(6, 1, 4.33, 2.5, 10, "woodDark"),
      [10 / 3, 7 / 3, 29 / 3, 4 / 3, 4 / 3, 1, "brass"],
      [0, 3, 11, 1, 4 / 3, 4 / 3, "brass"],
      [1, 8 / 3, 31 / 3, 7, 2, 2, "scope"],
      [7 / 2, 7 / 3, 10, 2 / 3, 8 / 3, 8 / 3, "brass"],
      [4, 10 / 3, 37 / 3, 3, 2 / 3, 2 / 3, "scope"],
      [8, 7 / 3, 10, 2, 8 / 3, 8 / 3, "scope"],
      [8, 7 / 3, 10, 1 / 3, 8 / 3, 8 / 3, "brass"],
      [10, 8 / 3, 31 / 3, 0.01, 2, 2, "glass"],
      ...slantLeg(3.5, 6, 3.83, 3.17, 10, "woodDark"),
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
    detail: [
      ...[[1 / 3, 1 / 3], [23 / 3, 1 / 3], [1 / 3, 26 / 3], [23 / 3, 26 / 3]].map(([x, y]) => [x, y, 0, 1, 1, 1, "metal"]),
      [0, 0, 1, 9, 10, 5, "seatBase"],
      [0, 10, 5, 9, 0.01, 2 / 3, "metal"],
      [0, 0, 6, 2.5, 10, 11, "seat"],
      [1 / 3, 2, 17, 2, 6, 2, "seatHead"],
      [2.5, 0, 9, 0.01, 10, 2 / 3, "seatDark"],
      [2.5, 0, 13, 0.01, 10, 2 / 3, "seatDark"],
      [2.5, 10 / 3, 8, 0.01, 1 / 3, 9, "seatDark"],
      [2.5, 20 / 3, 8, 0.01, 1 / 3, 9, "seatDark"],
      [2.5, 0, 6, 6.5, 10, 2, "seat"],
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
    detail: [
      [7 / 3, 4 / 3, 0, 8 / 3, 8 / 3, 1 / 3, "metal"],
      [3, 2, 1 / 3, 1.5, 1.5, 29 / 3, "metal"],
      [8 / 3, 5 / 3, 28 / 3, 7 / 3, 7 / 3, 2 / 3, "metalLight"],
      [0, 0, 10, 8, 6, 1, "woodLight"],
      [0, 6, 10, 8, 0.01, 2 / 3, "wood"],
      [8, 0, 10, 0.01, 6, 2 / 3, "wood"],
      [2 / 3, 2 / 3, 11, 1, 1, 5 / 3, "glass"],
      [1, 1, 38 / 3, 1 / 3, 1 / 3, 1, "leaf"],
      [2 / 3, 2 / 3, 41 / 3, 1, 1, 2 / 3, "flower"],
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
    detail: [
      [0, 0, 0, 22, 10, 4, "woodDark"],
      [1, 10, 1, 9, 0.01, 2, "wood"],
      [12, 10, 1, 9, 0.01, 2, "wood"],
      [1, 1, 4, 20, 8, 2, "sheet"],
      [1, 9, 5, 20, 0.01, 2 / 3, "sheetShade"],
      [15, 2, 6, 5, 6, 1.5, "pillow"],
      [16, 3, 7.5, 3, 4, 1 / 3, "pillow"],
      [1, 2 / 3, 14 / 3, 13, 26 / 3, 7 / 3, "blanketRed"],
      [4, 2 / 3, 7, 1, 26 / 3, 0.01, "blanketStripe"],
      [10, 2 / 3, 7, 1, 26 / 3, 0.01, "blanketStripe"],
      [4, 28 / 3, 14 / 3, 2 / 3, 0.01, 7 / 3, "blanketStripe"],
      [10, 28 / 3, 14 / 3, 2 / 3, 0.01, 7 / 3, "blanketStripe"],
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
    detail: [
      [1, 0, -3, 2 / 3, 5, 3, "metal"],
      [49 / 3, 0, -3, 2 / 3, 5, 3, "metal"],
      [0, 0, 0, 18, 6, 2 / 3, "metal"],
      [0, 5, 2 / 3, 18, 1 / 3, 2 / 3, "rail"],
      // 여행 가방
      [4 / 3, 2 / 3, 2 / 3, 6, 13 / 3, 11 / 3, "suitcase"],
      [4 / 3, 5, 5 / 3, 6, 0.01, 2 / 3, "suitcaseDark"],
      [3, 2 / 3, 2 / 3, 1 / 3, 13 / 3, 11 / 3, "suitcaseDark"],
      [17 / 3, 2 / 3, 2 / 3, 1 / 3, 13 / 3, 11 / 3, "suitcaseDark"],
      [11 / 3, 7 / 3, 13 / 3, 5 / 3, 2 / 3, 2 / 3, "suitcaseDark"],
      [3, 5, 2, 1 / 3, 0.01, 1, "brass"],
      [17 / 3, 5, 2, 1 / 3, 0.01, 1, "brass"],
      // 천 가방
      [28 / 3, 1, 2 / 3, 17 / 3, 11 / 3, 8 / 3, "bag"],
      [29 / 3, 1 / 3 + 1, 10 / 3, 5, 3, 1 / 3, "bag"],
      [28 / 3, 14 / 3, 7 / 3, 17 / 3, 0.01, 2 / 3, "bagDark"],
      [11, 7 / 3, 11 / 3, 1 / 3, 1 / 3, 1, "bagDark"],
      [13, 7 / 3, 11 / 3, 1 / 3, 1 / 3, 1, "bagDark"],
      [11, 7 / 3, 14 / 3, 7 / 3, 1 / 3, 1 / 3, "bagDark"],
    ],
  },

};

// =============================================================
// game.js — 게임 동작 (그리기, 캐릭터 움직임, 클릭, 항상 위 창)
// =============================================================

// ---- 기본 설정 ---------------------------------------------------
const W = 160;          // 게임 화면 가로 (도트)
const H = 128;          // 게임 화면 세로 (도트)
const OX = 80;          // 방 안쪽 모서리의 화면 위치
const OY = 52;
const ROOM = 64;        // 바닥 크기
const FPS = 30;         // 초당 화면 갱신 수 (낮을수록 컴퓨터가 편함)
const WALK_SPEED = 9;   // 걷는 속도

// 시간대별 하늘 색 [위, 아래]과 방 어둡기
const SKY = {
  dawn: ["#f2b8a2", "#fbe2c6"],
  day: ["#8ec5e8", "#d4ecf7"],
  evening: ["#e5866a", "#f5c07a"],
  night: ["#18223f", "#2f3b66"],
};
const DARKNESS = { dawn: 0.15, day: 0, evening: 0.2, night: 0.5 };

// 날씨: 이름과 방이 더 어두워지는 정도
const WEATHER_NAMES = { clear: "맑음", cloudy: "흐림", rain: "비", snow: "눈" };
const WEATHER_DARK = { clear: 0, cloudy: 0.05, rain: 0.12, snow: 0.04 };

// 테스트용: 주소 뒤에 ?hour=21 을 붙이면 밤 9시처럼 보입니다.
// ?weather=rain 처럼 붙이면 날씨를 고정합니다. (clear, cloudy, rain, snow)
// ?room=attic 처럼 붙이면 해당 방으로 시작합니다.
const params = new URLSearchParams(location.search);
const TEST_HOUR = params.has("hour") ? Number(params.get("hour")) : null;
// ?month=7 처럼 붙이면 그 달처럼 보입니다. (기간 한정 상점 탭 확인용, 1~12)
const TEST_MONTH = params.has("month") ? Number(params.get("month")) : null;

// ---- 화면 준비 ---------------------------------------------------
const app = document.getElementById("app");
const appHome = document.getElementById("app-home");
const placeholder = document.getElementById("pip-placeholder");
const view = document.getElementById("game");
const clockText = document.getElementById("clock");
const coinText = document.getElementById("coins");
const pipBtn = document.getElementById("pip-btn");
const pipNote = document.getElementById("pip-note");
const roomName = document.getElementById("room-name");
const vctx = view.getContext("2d");

// 작은 해상도로 그린 뒤 크게 확대해서 도트 느낌을 냅니다.
// 화면은 3배 촘촘하게 그립니다. (도트 한 칸 = 3×3, 안경테처럼 가는 선은 그 1/3 굵기로)
const RES = 3;
const buf = document.createElement("canvas");
buf.width = W * RES;
buf.height = H * RES;
let ctx = buf.getContext("2d"); // 미리보기를 그릴 때 잠시 바뀝니다.

const shade = document.createElement("canvas");
shade.width = W * RES;
shade.height = H * RES;
const sctx = shade.getContext("2d");

let save = Save.load(); // 친구 방을 구경하는 동안에는 잠시 친구의 공개 정보로 바뀝니다.
let visiting = null;    // 친구 방 구경 중이면 { id, name }
let ownSave = null;     // 구경하는 동안 맡겨 둔 내 저장 데이터
// 실시간 접속: 캐릭터가 새로 움직이기 시작하면 friends.js가 다른 화면에 알립니다.
const Net = { onHeroMove: null, onGuestMove: null };
let time = 0; // 게임 시작 후 흐른 시간(초)

// ---- 시간 --------------------------------------------------------
function now() {
  const d = new Date();
  if (TEST_HOUR !== null) d.setHours(TEST_HOUR);
  if (TEST_MONTH !== null) d.setMonth(TEST_MONTH - 1, 15);
  return d;
}

function hourNow() {
  const d = now();
  return d.getHours() + d.getMinutes() / 60;
}

function phaseOf(h) {
  if (h >= 5 && h < 7) return "dawn";
  if (h >= 7 && h < 17) return "day";
  if (h >= 17 && h < 19) return "evening";
  return "night";
}

// ---- 날씨 --------------------------------------------------------
// 사는 곳을 골랐으면 그 도시의 실제 날씨를, 아니면 3시간마다 바뀌는 무작위 날씨를 씁니다.
let weather = "clear";
const WEATHER_KEY = "cozyroom-weather";
const WEATHER_REFRESH = 30 * 60 * 1000; // 30분마다 새로 받아오기
let realWeather = null; // { city, kind, at }
try { realWeather = JSON.parse(localStorage.getItem(WEATHER_KEY)); } catch (e) { realWeather = null; }

function myCity() {
  return CITIES.find((c) => c.id === (save.profile && save.profile.city)) || null;
}

// 날씨 코드(WMO)를 게임 날씨로 바꿉니다.
function weatherFromCode(code) {
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) return "rain";
  if (code >= 2) return "cloudy"; // 구름 많음, 흐림, 안개
  return "clear";
}

async function refreshWeather(force) {
  const city = myCity();
  if (!city) return;
  if (!force && realWeather && realWeather.city === city.id && Date.now() - realWeather.at < WEATHER_REFRESH) return;
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=weather_code`;
    const res = await fetch(url);
    const json = await res.json();
    realWeather = { city: city.id, kind: weatherFromCode(json.current.weather_code), at: Date.now() };
    localStorage.setItem(WEATHER_KEY, JSON.stringify(realWeather));
  } catch (e) {
    // 받아오지 못하면 무작위 날씨로 대신합니다.
  }
}

// 실제 날씨 (3시간 넘게 못 받아왔으면 쓰지 않음)
function cityWeather() {
  const city = myCity();
  if (!city || !realWeather || realWeather.city !== city.id) return null;
  if (Date.now() - realWeather.at > 3 * 60 * 60 * 1000) return null;
  return realWeather.kind;
}

setInterval(() => refreshWeather(), 5 * 60 * 1000);

function weatherNow() {
  if (params.has("weather")) return params.get("weather");
  const real = cityWeather();
  if (real) return real;
  const d = now();
  const localHours = (d.getTime() - d.getTimezoneOffset() * 60000) / 3600000;
  const block = Math.floor(localHours / 3);
  const x = Math.sin(block * 12.9898) * 43758.5453;
  const r = x - Math.floor(x);
  if ([11, 0, 1].includes(d.getMonth())) {
    return r < 0.2 ? "snow" : r < 0.28 ? "rain" : r < 0.5 ? "cloudy" : "clear"; // 12~2월
  }
  return r < 0.2 ? "rain" : r < 0.45 ? "cloudy" : "clear";
}

function darknessOf(phase) {
  return Math.min(0.6, DARKNESS[phase] + WEATHER_DARK[weather]);
}

function isSleepTime(h) {
  return h >= 23 || h < 7;
}

// ---- 현재 방 -----------------------------------------------------
let room = null;     // 지금 보고 있는 방 (rooms.js의 ROOMS 중 하나)
let items = [];      // 이 방에 놓인 가구들
let floorItems = [], wallItems = [], objects = [], blockers = [];

// ---- 색 도우미 ---------------------------------------------------
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// 두 색을 섞어서 "#rrggbb"로 (다시 섞을 수 있게)
function mixHex(a, b, t) {
  const pa = hexToRgb(a), pb = hexToRgb(b);
  return "#" + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, "0")).join("");
}

function mixColor(a, b, t) {
  const pa = hexToRgb(a), pb = hexToRgb(b);
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

// 색 이름 → 실제 색 (방마다 바꾼 색이 있으면 그 색을 씁니다)
let activeColors = {}; // 지금 방의 틀 색 + 벽지 + 바닥 색
function colorOf(key) {
  return activeColors[key] || PALETTE[key] || key;
}

let shadeCache = {};
function shadeOf(key, amount) {
  const id = key + amount;
  if (!shadeCache[id]) {
    const base = colorOf(key);
    shadeCache[id] = base.startsWith("#")
      ? mixColor(base, amount > 0 ? "#ffffff" : "#000000", Math.abs(amount))
      : base;
  }
  return shadeCache[id];
}

// ---- 입체 그리기 도우미 ------------------------------------------
// 방 좌표(x, y, z)를 화면 좌표로 바꿉니다.
let viewOX = OX, viewOY = OY; // 미리보기를 그릴 때 잠시 바뀝니다.
// 방과 가구를 조금 작게 그려서 캐릭터가 상대적으로 커 보이게 합니다. (ver.하찮·세밀 모두 같은 크기)
// (캐릭터 도트는 크기를 바꾸면 고르지 않게 깨지므로, 대신 방 쪽을 줄임)
const WORLD_SCALE = 0.8;
let WS = 1;
function project(x, y, z) {
  return { x: viewOX + (x - y) * WS, y: viewOY + ((x + y) / 2 - z) * WS };
}

// 다각형을 도트 경계가 또렷하게 칠합니다.
// ver.세밀에서는 1/3칸 단위로 칠해서 경계가 더 매끄럽습니다.
function fillPoly(c, pts, color) {
  const u = typeof artStyle !== "undefined" && artStyle === "detail" ? 1 / RES : 1;
  let minY = Infinity, maxY = -Infinity;
  for (const p of pts) { minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); }
  c.fillStyle = color;
  for (let row = Math.floor(minY / u); row < Math.ceil(maxY / u); row++) {
    const yc = (row + 0.5) * u;
    const xs = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      if ((a.y <= yc && b.y > yc) || (b.y <= yc && a.y > yc)) {
        xs.push(a.x + ((yc - a.y) / (b.y - a.y)) * (b.x - a.x));
      }
    }
    xs.sort((p, q) => p - q);
    for (let i = 0; i + 1 < xs.length; i += 2) {
      const x1 = Math.ceil(xs[i] / u - 0.5), x2 = Math.ceil(xs[i + 1] / u - 0.5);
      if (x2 > x1) c.fillRect(x1 * u, row * u, (x2 - x1) * u, u);
    }
  }
}

// 방 좌표로 된 점 목록을 다각형으로 칠하기
function poly(points, color) {
  fillPoly(ctx, points.map((p) => project(...p)), colorOf(color));
}

function quad(a, b, c2, d, color) {
  poly([a, b, c2, d], color);
}

// 상자 하나 그리기. 윗면은 밝게, 오른쪽 면은 어둡게.
// color 대신 { top, left, right }로 면마다 색을 정할 수도 있습니다.
function box(x, y, z, w, d, h, color) {
  const faces = typeof color === "object"
    ? { top: colorOf(color.top), left: colorOf(color.left), right: colorOf(color.right) }
    : { top: shadeOf(color, 0.15), left: colorOf(color), right: shadeOf(color, -0.18) };
  quad([x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h], faces.left);
  quad([x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h], faces.right);
  quad([x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h], faces.top);
}

// 왼쪽 벽(x = 0) 위의 사각형
function wallLeftRect(y1, y2, z1, z2, color) {
  quad([0, y1, z1], [0, y2, z1], [0, y2, z2], [0, y1, z2], color);
}

// 오른쪽 벽(y = 0) 위의 사각형
function wallRightRect(x1, x2, z1, z2, color) {
  quad([x1, 0, z1], [x2, 0, z1], [x2, 0, z2], [x1, 0, z2], color);
}

function dot(x, y, z, color) {
  const p = project(x, y, z);
  ctx.fillStyle = colorOf(color);
  ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
}

// 바닥이나 벽 위의 직선 (점을 촘촘히 찍어서)
function line(a, b, color) {
  const len = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]), Math.abs(b[2] - a[2]));
  const steps = Math.max(1, Math.ceil(len * 2));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    dot(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, color);
  }
}

// plain: 하트·Zzz 같은 효과는 ver.세밀에서도 원래 도트 그대로
function drawSprite(rows, x, y, colors, flip, plain = false) {
  if (artStyle === "detail" && !plain) {
    drawSpriteDetail(rows, x, y, colors, flip);
    return;
  }
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let c = 0; c < row.length; c++) {
      const key = colors[row[c]];
      if (!key) continue;
      ctx.fillStyle = colorOf(key);
      ctx.fillRect(x + (flip ? row.length - 1 - c : c), y + r, 1, 1);
    }
  }
}

// ---- ver.세밀 글자 그림 (캐릭터, 반려동물, 효과) --------------------
// 글자 그림을 3배로 키우면서(Scale3x) 비스듬한 모서리를 둥글게 다듬고,
// 테두리 음영·윗부분 윤기·눈 반짝임·얇은 입을 더합니다.
// 한 번 만든 그림은 기억해 두고 다시 씁니다.
const spriteCache = new Map();

function drawSpriteDetail(rows, x, y, colors, flip) {
  const key = rows.join("/") + "|" + Object.entries(colors).map(([k, v]) => k + colorOf(v)).join(",") + (flip ? "|f" : "");
  let canvas = spriteCache.get(key);
  if (!canvas) {
    if (spriteCache.size > 300) spriteCache.clear();
    canvas = renderSpriteDetail(rows, colors, flip);
    spriteCache.set(key, canvas);
  }
  ctx.drawImage(canvas, x - 1 / 3, y - 1 / 3, canvas.width / 3, canvas.height / 3);
}

// Scale3x: 글자 그림 한 칸을 3×3칸으로 (모서리를 대각선으로 이어 줌)
// 둥글게 다듬는 건 머리카락(H)·피부(S)·털(K)·코(N)만. 옷과 신발은 각진 모양 그대로.
const SMOOTH = "HSKN";
function scale3x(grid) {
  const h = grid.length, w = grid[0].length;
  const at = (r, c) => (r < 0 || c < 0 || r >= h || c >= w ? "." : grid[r][c]);
  const out = Array.from({ length: h * 3 }, () => new Array(w * 3).fill("."));
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const A = at(r - 1, c - 1), B = at(r - 1, c), C = at(r - 1, c + 1);
      const D = at(r, c - 1), E = at(r, c), F = at(r, c + 1);
      const G = at(r + 1, c - 1), H = at(r + 1, c), I = at(r + 1, c + 1);
      let e = [E, E, E, E, E, E, E, E, E];
      if (B !== H && D !== F && (E === "." || SMOOTH.includes(E))) {
        e = [
          D === B ? D : E,
          (D === B && E !== C) || (B === F && E !== A) ? B : E,
          B === F ? F : E,
          (D === B && E !== G) || (D === H && E !== A) ? D : E,
          E,
          (B === F && E !== I) || (H === F && E !== C) ? F : E,
          D === H ? D : E,
          (D === H && E !== I) || (H === F && E !== G) ? H : E,
          H === F ? F : E,
        ];
      }
      for (let i = 0; i < 9; i++) {
        const v = e[i] === "." || SMOOTH.includes(e[i]) ? e[i] : E; // 옷 색이 번져 나오지 않게
        out[r * 3 + Math.floor(i / 3)][c * 3 + (i % 3)] = v;
      }
    }
  }
  return out;
}

// 얼굴 부분(눈·입·볼)은 키우기 전 칸 단위로 따로 그림
const FACE_KEYS = "EBMO";

// ver.세밀 캐릭터 몸 (목 아래 7줄): 글자 그림 대신 1/3칸 단위로 직접 그립니다.
// 글자 그림에서 옷 모양(줄무늬·후드·카라), 하의(바지·반바지·치마), 동작(가만히·걷기1·걷기2)을 읽어 옵니다.
function heroBodyDetail(body) {
  const W = 30, H = 21;
  const g = Array.from({ length: H }, () => new Array(W).fill("."));
  const fill = (x1, y1, x2, y2, ch) => {
    for (let y = y1; y < y2; y++) for (let x = x1; x < x2; x++) g[y][x] = ch;
  };
  const hood = body[0][2] === "C";
  const collar = body[0].includes("W");
  const stripe = body[1].includes("D") || body[3].includes("D");
  const skirt = body[5] === ".PPPPPPPP.";
  const shorts = body[5].includes("S");
  const pose = body[6] === ".FF....FF." ? "apart" : body[6] === "...FFFF..." ? "together" : "stand";

  // 하의
  if (skirt) {
    fill(9, 12, 21, 13, "P");
    fill(8, 13, 22, 15, "P");
    fill(7, 15, 23, 17, "P");
  } else {
    fill(9, 12, 21, 14, "P");
  }
  const legs = pose === "apart" ? [[7, 13], [17, 23]] : pose === "together" ? [[10, 14], [16, 20]] : [[9, 14], [16, 21]];
  for (const [x1, x2] of legs) {
    if (skirt) fill(x1 + 1, 17, x2 - 1, 18, "S");
    else if (shorts) { fill(x1, 14, x2, 16, "P"); fill(x1 + 1, 16, x2 - 1, 18, "S"); }
    else fill(x1, 14, x2, 18, "P");
    fill(x1 - 1, 18, x2, 21, "F"); // 신발 (앞코가 조금 더 넓게)
  }

  // 상의
  fill(12, 0, 18, 2, "S");                 // 목
  fill(9, 1, 21, 2, "C");
  fill(8, 2, 22, 12, "C");                 // 몸통
  fill(5, 3, 8, 6, "C"); fill(22, 3, 25, 6, "C");   // 소매
  fill(6, 2, 8, 3, "C"); fill(22, 2, 24, 3, "C");
  fill(5, 6, 7, 11, "S"); fill(23, 6, 25, 11, "S"); // 팔과 손
  if (stripe) {
    for (const y of [4, 7, 10]) fill(8, y, 22, y + 1, "D");
    fill(5, 4, 8, 5, "D"); fill(22, 4, 25, 5, "D");
  }
  if (hood) { fill(9, 0, 12, 2, "C"); fill(18, 0, 21, 2, "C"); }
  if (collar) { fill(11, 1, 13, 3, "W"); fill(17, 1, 19, 3, "W"); }
  return g;
}

function renderSpriteDetail(rows, colors, flip) {
  const h = rows.length, w = rows[0].length;
  // 얼굴 칸은 주변 피부(S)로 바꿔서 키운 뒤 따로 그림
  const skin = colors.S ? "S" : colors.K ? "K" : null; // 얼굴 바탕 (사람은 피부, 반려동물은 털)
  const grid = rows.map((r) => r.split("").map((ch) => (FACE_KEYS.includes(ch) && colors[ch] && skin ? skin : ch)));
  // 캐릭터(사람)는 머리만 키우고 몸은 따로 그림
  const person = colors.S && colors.C && w === 10 && h >= 14;
  const big = person
    ? scale3x(grid.slice(0, h - 7)).concat(heroBodyDetail(rows.slice(h - 7)))
    : scale3x(grid);
  const H = h * 3, W = w * 3;
  const c = document.createElement("canvas");
  c.width = W + 2; // 외곽선 자리 (위아래 좌우 1칸씩)
  c.height = H + 2;
  const g = c.getContext("2d");
  const empty = (r, cc) => r < 0 || cc < 0 || r >= H || cc >= W || !colors[big[r][cc]];
  const px = (r, cc, color) => {
    g.fillStyle = color;
    g.fillRect((flip ? W - 1 - cc : cc) + 1, r + 1, 1, 1);
  };
  // 외곽선: 그림 바로 바깥 칸을 진하게
  for (let r = -1; r <= H; r++) {
    for (let cc = -1; cc <= W; cc++) {
      if (!empty(r, cc)) continue;
      if (!empty(r - 1, cc) || !empty(r + 1, cc) || !empty(r, cc - 1) || !empty(r, cc + 1)) px(r, cc, OUTLINE);
    }
  }
  const SHINY = "HK"; // 윗부분에 윤기가 도는 부분 (머리카락, 반려동물 털)
  for (let r = 0; r < H; r++) {
    for (let cc = 0; cc < W; cc++) {
      const k = big[r][cc];
      if (!colors[k]) continue;
      let color = colorOf(colors[k]);
      if (!color.startsWith("#")) { px(r, cc, color); continue; }
      const below = empty(r + 1, cc) || big[r + 1][cc] !== k;
      const above = empty(r - 1, cc) || big[r - 1][cc] !== k;
      const limb = person && k === "S" && r >= (h - 7) * 3; // 가는 팔다리는 옆 음영을 빼서 칙칙하지 않게
      const side = !limb && (empty(r, cc - 1) || empty(r, cc + 1));
      if (empty(r + 1, cc) || (side && !empty(r + 1, cc))) color = mixColor(color, "#000000", side ? 0.22 : 0.18);
      else if (below) color = mixColor(color, "#000000", 0.12);
      else if (above && SHINY.includes(k)) color = mixColor(color, "#ffffff", 0.22);
      px(r, cc, color);
    }
  }
  // 머리카락 결: 윤기 아래쪽에 짧은 밝은 줄
  for (let r = 1; r < H - 1; r++) {
    for (let cc = 1; cc < W - 1; cc++) {
      if (big[r][cc] === "H" && big[r - 1][cc] === "H" && big[r - 2] && big[r - 2][cc] !== "H" && cc % 4 === 1 && colors.H) {
        px(r, cc, mixColor(colorOf(colors.H), "#ffffff", 0.3));
      }
    }
  }
  // 얼굴 (눈, 볼, 입)
  const cell = (r, cc) => (r >= 0 && r < h && cc >= 0 && cc < w ? rows[r][cc] : ".");
  for (let r = 0; r < h; r++) {
    for (let cc = 0; cc < w; cc++) {
      const k = rows[r][cc];
      if (!FACE_KEYS.includes(k) || !colors[k]) continue;
      const color = colorOf(colors[k]);
      const x0 = cc * 3, y0 = r * 3;
      if (k === "E") {
        const wide = cell(r, cc - 1) === "E" || cell(r, cc + 1) === "E";
        if (wide) {
          for (let i = 0; i < 3; i++) px(y0 + 1, x0 + i, color); // 가늘게 뜬 눈
        } else {
          const tall = cell(r + 1, cc) === "E", top = cell(r - 1, cc) !== "E";
          for (let j = 0; j < 3; j++) for (let i = 0; i < 2; i++) px(y0 + j, x0 + (cc < w / 2 ? 1 : 0) + i, color);
          if (top) px(y0, x0 + (cc < w / 2 ? 1 : 0), "#ffffff"); // 반짝임
          if (tall) continue;
        }
      } else if (k === "B") {
        px(y0 + 1, x0, color); px(y0 + 1, x0 + 1, color); px(y0 + 1, x0 + 2, color);
      } else if (k === "M") {
        const left = cell(r, cc - 1) !== "M", right = cell(r, cc + 1) !== "M";
        for (let i = 0; i < 3; i++) px(y0 + 1, x0 + i, color);
        if (left) px(y0, x0, color);
        if (right) px(y0, x0 + 2, color);
      } else if (k === "O") {
        const L = cell(r, cc - 1) !== "O", R = cell(r, cc + 1) !== "O", T = cell(r - 1, cc) !== "O", Bt = cell(r + 1, cc) !== "O";
        for (let j = 0; j < 3; j++) {
          for (let i = 0; i < 3; i++) {
            const corner = ((T && j === 0) || (Bt && j === 2)) && ((L && i === 0) || (R && i === 2));
            if (!corner) px(y0 + j, x0 + i, color);
          }
        }
      }
    }
  }
  return c;
}

// ---- 그림 파일 불러오기 -------------------------------------------
const images = {};

function loadImage(src) {
  if (!src || images[src]) return;
  const img = new Image();
  img.onload = () => { img.ready = true; };
  img.onerror = () => { console.warn("그림 파일을 찾을 수 없어요: " + src); };
  img.src = src;
  images[src] = img;
}

function readyImage(src) {
  const img = src && images[src];
  return img && img.ready ? img : null;
}

Object.values(FURNITURE).forEach((f) => { loadImage(f.image); loadImage(f.imageOff); });
if (CHARACTER_SHEET) loadImage(CHARACTER_SHEET.image);

// 가구에 쓸 그림 (없거나 아직 못 불러왔으면 null → 상자로 그림)
function itemImage(item) {
  if (item.light && !isLit(item) && item.imageOff) {
    return readyImage(item.imageOff) || readyImage(item.image);
  }
  return readyImage(item.image);
}

// 그림을 놓을 위치: 그림 맨 아래 = 가구 바닥의 가장 앞 모서리
function imageRect(item, img) {
  const [w, d] = turned(item, item.size);
  const left = project(item.x, item.y + d, item.z).x;
  const bottom = project(item.x + w, item.y + d, item.z).y;
  const [ox, oy] = item.offset || [0, 0];
  return { x: Math.round(left + ox), y: Math.round(bottom - img.height + oy), w: img.width, h: img.height };
}

// ---- 그림 스타일 ---------------------------------------------------
// "simple" = ver.하찮 (기본), "detail" = ver.세밀 (data.js의 detail 상자를 씀)
// 보는 사람 기기에만 저장합니다. (친구 방에 놀러 가도 내가 고른 스타일로 보임)
const ART_KEY = "cozyroom-art";
let artStyle = "simple";
try { artStyle = localStorage.getItem(ART_KEY) === "detail" ? "detail" : "simple"; } catch (e) { /* 저장소를 못 쓰면 기본 */ }

const artBtn = document.getElementById("art-btn");
function showArtStyle() {
  artBtn.textContent = artStyle === "detail" ? "ver.세밀" : "ver.하찮";
}
showArtStyle();
artBtn.addEventListener("click", () => {
  artStyle = artStyle === "detail" ? "simple" : "detail";
  try { localStorage.setItem(ART_KEY, artStyle); } catch (e) { /* 이번에만 적용 */ }
  showArtStyle();
  setOrigin(room);
  afterLayoutChange();
  renderBag();
  if (!shopEl.hidden) renderShop();
  toast(artStyle === "detail" ? "ver.세밀로 볼게요." : "ver.하찮으로 볼게요.");
});

// 상자 목록 (parts가 없으면 size 크기의 상자 하나)
function rawParts(item) {
  if (artStyle === "detail" && item.detail) return item.detail;
  if (item.parts) return item.parts;
  if (item.size) return [[0, 0, 0, item.size[0], item.size[1], item.size[2] || 10, "wood"]];
  return [];
}

// ---- 가구 방향 ----------------------------------------------------
// 벽 가구: flip이 켜져 있으면 왼쪽 벽 (가로·세로를 바꿔서 그림)
// 바닥 가구: rot 0~3 (90도씩 돌린 횟수). 예전 저장의 flip은 rot 1로 읽습니다.
function rotOf(item) {
  return item.type === "wall" ? 0 : (item.rot || 0) & 3;
}

// 가로·세로가 바뀌었는지
function swapped(item) {
  return item.type === "wall" ? !!item.flip : rotOf(item) % 2 === 1;
}

// 원래 방향일 때 가구가 차지하는 범위 (돌리는 기준, 그림 스타일과 상관없이 parts 기준)
function baseSpan(item) {
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  const simple = item.parts || [[0, 0, 0, item.size[0], item.size[1], item.size[2] || 10]];
  for (const [dx, dy, , w, d] of simple) {
    x1 = Math.min(x1, dx); y1 = Math.min(y1, dy);
    x2 = Math.max(x2, dx + w); y2 = Math.max(y2, dy + d);
  }
  return { W: x1 + x2, D: y1 + y2 };
}

// 가구 안의 한 점(x, y)을 돌린 방향에 맞게 옮깁니다.
function rotPoint(item, x, y) {
  const r = rotOf(item);
  if (!r) return [x, y];
  const { W, D } = baseSpan(item);
  if (r === 1) return [D - y, x];
  if (r === 2) return [W - x, D - y];
  return [y, W - x];
}

function partsOf(item) {
  const wall = item.type === "wall";
  const r = rotOf(item);
  const key = `${item.id}|${wall ? (item.flip ? "L" : "R") : r}|${artStyle}`;
  if (!turnedParts.has(key)) {
    let parts = rawParts(item);
    if (wall && item.flip) {
      parts = parts.map(([dx, dy, dz, w, d, h, c]) => [dy, dx, dz, d, w, h, c]);
    } else if (r) {
      parts = parts.map(([dx, dy, dz, w, d, h, c]) => {
        const [ax, ay] = rotPoint(item, dx, dy);
        const [bx, by] = rotPoint(item, dx + w, dy + d);
        return [Math.min(ax, bx), Math.min(ay, by), dz, Math.abs(bx - ax), Math.abs(by - ay), h, c];
      });
    }
    turnedParts.set(key, depthSort(parts));
  }
  return turnedParts.get(key);
}

// 방향·스타일별 상자 목록 (그릴 때마다 다시 계산하지 않게 기억)
const turnedParts = new Map();

// 상자 그리는 순서 정하기: 뒤(또는 아래)에 있는 상자를 먼저.
// 가구를 돌리면 원래 순서로는 앞뒤가 바뀌어 보여서 다시 정합니다.
// 화면에서 겹치는데 앞뒤가 분명하지 않은 상자끼리는 data.js에 적힌 순서를 따릅니다.
function depthSort(parts) {
  const n = parts.length;
  const behind = (a, b) => // a가 b보다 확실히 뒤(또는 아래)에 있는지
    a[0] + a[3] <= b[0] || a[1] + a[4] <= b[1] || a[2] + a[5] <= b[2];
  // 화면에서 차지하는 범위 (겹치지 않는 상자끼리는 순서를 따지지 않음)
  const scr = parts.map(([x, y, z, w, d, h]) => ({
    x1: x - y - d, x2: x + w - y, y1: (x + y) / 2 - z - h, y2: (x + w + y + d) / 2 - z,
  }));
  const meet = (a, b) => a.x1 < b.x2 - 0.01 && b.x1 < a.x2 - 0.01 && a.y1 < b.y2 - 0.01 && b.y1 < a.y2 - 0.01;
  const before = parts.map(() => []); // before[j]: j보다 먼저 그려야 할 상자들
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j || !meet(scr[i], scr[j])) continue;
      const ij = behind(parts[i], parts[j]), ji = behind(parts[j], parts[i]);
      if (ij && !ji) before[j].push(i);
      else if (!ij && !ji && i < j) before[j].push(i); // 앞뒤가 분명하지 않으면 적힌 순서대로
    }
  }
  const done = new Array(n).fill(false);
  const out = [];
  while (out.length < n) {
    let pick = -1;
    for (let j = 0; j < n && pick < 0; j++) {
      if (!done[j] && before[j].every((i) => done[i])) pick = j;
    }
    if (pick < 0) pick = done.indexOf(false); // 순서가 꼬이면 적힌 순서대로
    done[pick] = true;
    out.push(parts[pick]);
  }
  return out;
}

// ---- 가구 정보 계산 ----------------------------------------------
// 크기 값 (가로·세로가 바뀌었으면 서로 바꿈)
function turned(item, v) {
  return swapped(item) ? [v[1], v[0], ...v.slice(2)] : v;
}

// 가구 안의 자리 (베개, 서는 곳 등)를 돌린 방향에 맞게
function turnedPoint(item, v) {
  if (item.type === "wall") return turned(item, v);
  return [...rotPoint(item, v[0], v[1]), ...v.slice(2)];
}

// 바닥에서 차지하는 영역
function footprint(item) {
  if (item.size && !item.parts) {
    const [w, d] = turned(item, item.size);
    return { x: item.x, y: item.y, w, d };
  }
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  for (const [dx, dy, , w, d] of partsOf(item)) {
    x1 = Math.min(x1, dx); y1 = Math.min(y1, dy);
    x2 = Math.max(x2, dx + w); y2 = Math.max(y2, dy + d);
  }
  return { x: item.x + x1, y: item.y + y1, w: x2 - x1, d: y2 - y1 };
}

// 화면에서 차지하는 영역 (클릭 판정용)
function screenBounds(item) {
  const img = itemImage(item);
  if (img) return imageRect(item, img);
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  for (const [dx, dy, dz, w, d, h] of partsOf(item)) {
    for (const cx of [0, w]) for (const cy of [0, d]) for (const cz of [0, h]) {
      const p = project(item.x + dx + cx, item.y + dy + cy, item.z + dz + cz);
      x1 = Math.min(x1, p.x); y1 = Math.min(y1, p.y);
      x2 = Math.max(x2, p.x); y2 = Math.max(y2, p.y);
    }
  }
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

// 그림 가구: 방향을 돌렸으면 좌우를 뒤집어 그립니다.
function drawMirrored(item, img, r) {
  if (!swapped(item)) {
    ctx.drawImage(img, r.x, r.y);
    return;
  }
  ctx.save();
  ctx.translate(r.x * 2 + r.w, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(img, r.x, r.y);
  ctx.restore();
}

// 창문·시계 장식: 걸린 벽과 위치에 맞춰 그립니다.
let currentPhase = "day";
function drawDecor(item) {
  const wall = wallOf(item);
  const a0 = wall === "right" ? item.x : item.y, z0 = item.z;
  if (item.decor === "clock") {
    drawClockOnWall(wall, a0 + 6, z0 + 6);
    return;
  }
  if (item.decor === "digital") {
    drawDigitalClockOnWall(wall, a0 + 8, z0 + 4.5);
    return;
  }
  const win = { wall, style: item.style, closed: item.closed };
  if (item.style === "curtain") Object.assign(win, { y1: a0 + 5, y2: a0 + 29, z1: z0 + 3, z2: z0 + 23 });
  else if (item.style === "shoji") Object.assign(win, { y1: a0 + 1, y2: a0 + 33, z1: z0 + 2, z2: z0 + 26 });
  else if (item.style === "round") Object.assign(win, { cy: a0 + 11, cz: z0 + 11, r: 9 });
  else Object.assign(win, { y1: a0 + 1, y2: a0 + 13, z1: z0 + 2, z2: z0 + 16 });
  if (item.style === "round") drawRoundWindow(win, currentPhase);
  else if (item.style === "shoji") drawShojiWindow(win, currentPhase);
  else if (item.style === "train") drawTrainWindow(win, currentPhase);
  else drawCurtainWindow(win, currentPhase);
}

// 커튼 창문이 하나 이상 있고 모두 닫혀 있는지
function curtainsAllClosed() {
  const curtains = items.filter((f) => f.decor === "window" && f.style === "curtain");
  return curtains.length > 0 && curtains.every((f) => f.closed);
}

function drawItem(item) {
  if (item.decor) {
    drawDecor(item);
    return;
  }
  const img = itemImage(item);
  if (img) {
    drawMirrored(item, img, imageRect(item, img));
    return;
  }
  if (artStyle === "detail") drawItemOutline(item);
  for (const [dx, dy, dz, w, d, h, color] of partsOf(item)) {
    let key = color;
    if (item.light && !isLit(item) && PALETTE[key + "Off"]) key += "Off";
    if (item.twinkle && key.startsWith("bulb")) key = twinkleColor(key);
    box(item.x + dx, item.y + dy, item.z + dz, w, d, h, key);
  }
}

// 반짝이는 전구: bulb1~bulb4가 시간에 따라 빨강·노랑·파랑·초록을 돌아가며 바뀜
const BULBS = ["bulbR", "bulbY", "bulbB", "bulbG"];
function twinkleColor(key) {
  const n = Number(key.slice(4)) || 0;
  return BULBS[(n + Math.floor(time * 1.5)) % BULBS.length];
}

// ver.세밀 외곽선: 가구 모양 전체를 1/3칸씩 상하좌우로 밀어 진한 색으로 먼저 칠하고,
// 그 위에 가구를 그리면 테두리만 남습니다.
const OUTLINE = "#3a2a24";
function drawItemOutline(item) {
  const u = 1 / RES;
  const shapes = [];
  for (const [dx, dy, dz, w, d, h] of partsOf(item)) {
    if (w < 0.05 || d < 0.05) continue; // 면에 붙인 얇은 무늬는 빼기
    const x = item.x + dx, y = item.y + dy, z = item.z + dz;
    shapes.push([
      [x, y, z + h], [x + w, y, z + h], [x + w, y, z],
      [x + w, y + d, z], [x, y + d, z], [x, y + d, z + h],
    ].map((q) => project(...q)));
  }
  for (const [ox, oy] of [[u, 0], [-u, 0], [0, u], [0, -u]]) {
    for (const pts of shapes) fillPoly(ctx, pts.map((p) => ({ x: p.x + ox, y: p.y + oy })), OUTLINE);
  }
}

// ---- 방 바꾸기 ---------------------------------------------------
function setRoom(id) {
  room = ROOMS.find((r) => r.id === id) || ROOMS[0];
  setOrigin(room);
  applyStyle();
  // 직접 꾸민 배치가 있으면 그것을, 없으면 처음 배치를 씁니다.
  let placed = (save.layouts && save.layouts[room.id]) || room.layout;
  // 처음 한 번: 방에 원래 있던 창문·시계를 벽 장식으로 걸어 둠 (예전 저장 데이터도)
  save.decorDone = save.decorDone || {};
  const addDecor = !save.decorDone[room.id] && room.decor && room.decor.length;
  if (addDecor) placed = placed.concat(room.decor);
  items = placed.filter((p) => FURNITURE[p.id]).map(makeItem);
  const settled = settleItems();
  refreshItems();
  if ((addDecor || settled) && !visiting && ownsRoom()) {
    save.decorDone[room.id] = true;
    saveLayout({ auto: true }); // 앱을 열 때 하는 정리
  }
  if (typeof setEditing === "function") setEditing(editing);
  roomName.textContent = room.name;
  const moved = save.roomId !== room.id;
  save.roomId = room.id;
  Save.save(save, { auto: !moved });
  placeHeroInRoom();
  placePet();
  for (const w of walkers.values()) placeWalker(w);
  updateLock();
}

// 방마다 화면 가운데에 오도록 위치를 옮깁니다. (rooms.js의 offset)
function setOrigin(r) {
  viewOX = OX + ((r.offset && r.offset[0]) || 0);
  viewOY = OY + ((r.offset && r.offset[1]) || 0);
  WS = WORLD_SCALE;
  if (WS !== 1) {
    // 방 가운데가 같은 자리에 오도록 (가운데를 기준으로 줄임)
    const cx = (r.width || ROOM) / 2, cy = (r.depth || ROOM) / 2, cz = (r.wallHeight || 44) / 3;
    viewOX += (cx - cy) * (1 - WS);
    viewOY += ((cx + cy) / 2 - cz) * (1 - WS);
  }
}

// ---- 벽지 · 바닥 -------------------------------------------------
let previewStyle = null; // 상점 미리보기용으로 잠시 바꾸는 벽지·바닥

// 방에 적용된 벽지와 바닥
function currentStyle(r = room) {
  const chosen = (save.roomStyles && save.roomStyles[r.id]) || {};
  const pick = Object.assign({}, chosen, previewStyle || {});
  return {
    wall: WALLPAPERS.find((w) => w.id === pick.wall) || WALLPAPERS.find((w) => w.id === r.wallpaper),
    floor: FLOORS.find((f) => f.id === pick.floor) || FLOORS.find((f) => f.id === r.floor),
  };
}

function applyStyle() {
  const st = currentStyle();
  activeColors = Object.assign({}, room.colors, st.wall.colors, st.floor.colors);
  shadeCache = {};
}

function ownsStyle(style) {
  return style.price === 0 || save.ownedStyles.includes(style.id);
}

// ---- 방 잠금 -----------------------------------------------------
function ownsRoom(r = room) {
  return !r.price || save.ownedRooms.includes(r.id);
}

const lockEl = document.getElementById("locked");
function updateLock() {
  const locked = !ownsRoom();
  lockEl.hidden = !locked;
  editBtn.disabled = locked;
  if (locked) {
    if (editing) setEditing(false);
    document.getElementById("lock-name").textContent = room.name;
    document.getElementById("lock-price").textContent = `${room.price.toLocaleString()}코인으로 열 수 있어요`;
    const btn = document.getElementById("lock-buy");
    btn.disabled = save.coins < room.price;
    btn.textContent = save.coins < room.price ? "코인 부족" : "열기";
  }
}

function buyRoom(r) {
  if (ownsRoom(r) || save.coins < r.price) return;
  save.coins -= r.price;
  save.ownedRooms.push(r.id);
  Save.save(save);
  updateCoins();
  setRoom(r.id);
  toast(`${r.name}이 열렸어요. 상점에서 가구를 사서 꾸며 보세요.`);
}

// 위에 올린 작은 물건을 받침 가구의 윗면 높이에 맞춥니다.
// (가구 높이를 바꾼 뒤 예전 저장 데이터의 물건이 뜨거나 묻히지 않게) 바뀐 게 있으면 true
function settleItems() {
  let changed = false;
  for (const it of items) {
    if (it.type || !it.small || it.z <= 0) continue;
    const base = items.find((o) => o !== it && !o.type && !o.small && o.surface && o.z === 0 && centerOn(it, o));
    if (!base || it.z === base.surface) continue;
    it.z = base.surface;
    changed = true;
  }
  return changed;
}

// 조명은 하나씩 따로 켜고 끕니다. (off가 정해지지 않은 예전 조명은 예전 전체 스위치를 따름)
function isLit(item) {
  if (!item.light) return false;
  return typeof item.off === "boolean" ? !item.off : save.lampOn !== false;
}

// 조명을 켜고 끈 시간대 표시 (예: "2026-11-16 밤"). 같은 시간대에는 캐릭터가 다시 건드리지 않음
function lightPeriod() {
  const d = now(), h = hourNow();
  const night = phaseOf(h) === "night" || phaseOf(h) === "evening";
  if (night && h < 12) d.setDate(d.getDate() - 1); // 새벽은 전날 밤으로
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} ${night ? "밤" : "낮"}`;
}

function toggleLight(item, auto = false) {
  item.off = isLit(item);
  item.lightAt = lightPeriod(); // 사람이든 캐릭터든 이 시간대에 이미 만졌음
  saveLayout({ auto }); // 캐릭터가 켜고 끈 것은 자동 저장
}

function makeItem(p) {
  const f = FURNITURE[p.id];
  const wall = f.type === "wall";
  const rot = wall ? 0 : p.rot != null ? p.rot : p.flip ? 1 : 0; // 예전 저장은 flip
  return Object.assign({}, f, { id: p.id, x: p.x, y: p.y, z: p.z, flip: wall && !!p.flip, rot, closed: !!p.closed, off: p.off, lightAt: p.lightAt });
}

function refreshItems() {
  floorItems = items.filter((f) => f.type === "floor");
  wallItems = items.filter((f) => f.type === "wall");
  objects = items.filter((f) => !f.type);
  blockers = objects.filter((f) => f.z === 0).map(footprint);
}

function saveLayout(opts) {
  save.layouts = save.layouts || {};
  save.layouts[room.id] = items.map((f) => ({
    id: f.id, x: f.x, y: f.y, z: f.z,
    flip: (f.type === "wall" && f.flip) || undefined,
    rot: rotOf(f) || undefined,
    closed: f.closed || undefined,
    off: typeof f.off === "boolean" ? f.off : undefined, // 조명 켜짐·꺼짐
    lightAt: f.lightAt || undefined,                      // 조명을 마지막으로 만진 시간대
  }));
  Save.save(save, opts);
}

function changeRoom(step) {
  const i = ROOMS.indexOf(room);
  setRoom(ROOMS[(i + step + ROOMS.length) % ROOMS.length].id);
}

document.getElementById("room-prev").addEventListener("click", () => changeRoom(-1));
document.getElementById("room-next").addEventListener("click", () => changeRoom(1));

// ---- 방 모양 -----------------------------------------------------
const RW = () => room.width || ROOM;  // 바닥 가로 길이 (x 방향)
const RD = () => room.depth || ROOM;  // 바닥 세로 길이 (y 방향)
const RC = ROOM / 2;                  // 원형 방의 중심 위치이자 반지름

// 바닥 안쪽인지 (m: 가장자리에서 띄울 거리)
function insideFloor(x, y, m = 0) {
  if (room.shape === "round") return Math.hypot(x - RC, y - RC) <= RC - m;
  return x >= m && y >= m && x <= RW() - m && y <= RD() - m;
}

// 바닥 테두리 점들
function floorOutline() {
  if (room.shape === "round") {
    const pts = [];
    for (let i = 0; i < 48; i++) {
      const t = (i / 48) * Math.PI * 2;
      pts.push([RC + Math.cos(t) * RC, RC + Math.sin(t) * RC, 0]);
    }
    return pts;
  }
  return [[0, 0, 0], [RW(), 0, 0], [RW(), RD(), 0], [0, RD(), 0]];
}

// 다락방 지붕 높이 (y 위치에 따라)
function roofZ(y) {
  const k = room.kneeHeight, p = room.peakHeight, half = ROOM / 2;
  const t = y <= half ? y / half : (ROOM - y) / half;
  return k + (p - k) * t;
}

function leftWallTop(y) {
  return room.shape === "attic" ? roofZ(y) : room.wallHeight;
}

function rightWallTop() {
  return room.shape === "attic" ? room.kneeHeight : room.wallHeight;
}

// ---- 벽면 --------------------------------------------------------
// 벽 위의 위치를 (a: 벽을 따라간 거리, z: 높이)로 나타냅니다.
//   "left"  : 왼쪽 벽 (x = 0), a = y
//   "right" : 오른쪽 벽 (y = 0), a = x
//   "round" : 원형 방의 둥근 벽, a = 왼쪽 끝부터 잰 둘레 길이
const ROUND_START = Math.PI * 0.75;  // 둥근 벽이 시작하는 각도 (왼쪽 끝)
const ROUND_LEN = Math.PI * RC;      // 둥근 벽 길이 (반원)

function roundPoint(a, z, r = RC) {
  const t = ROUND_START + a / RC;
  return [RC + Math.cos(t) * r, RC + Math.sin(t) * r, z];
}

function surfacePoint(wall, a, z) {
  if (wall === "right") return [a, 0, z];
  if (wall === "round") return roundPoint(a, z, RC - 0.05);
  return [0, a, z];
}

function wallLength(wall) {
  if (wall === "right") return RW();
  if (wall === "round") return ROUND_LEN;
  return RD();
}

function wallTopAt(wall, a) {
  if (wall === "left") return leftWallTop(a);
  if (wall === "right") return rightWallTop();
  return room.wallHeight;
}

function wallsOfRoom() {
  return room.shape === "round" ? ["round"] : ["left", "right"];
}

// 벽 위의 사각형 (벽 높이를 넘는 부분은 잘라냄, 둥근 벽은 잘게 나눠 그림)
function surfaceRect(wall, a1, a2, z1, z2, color) {
  if (a2 <= a1) return;
  let step = a2 - a1;
  if (wall === "round") step = 2;
  else if (wall === "left" && room.shape === "attic") step = 4;
  for (let a = a1; a < a2 - 1e-6; a += step) {
    const b = Math.min(a2, a + step);
    const t1 = Math.min(z2, wallTopAt(wall, a)), t2 = Math.min(z2, wallTopAt(wall, b));
    if (t1 <= z1 && t2 <= z1) continue;
    poly([
      surfacePoint(wall, a, z1), surfacePoint(wall, b, z1),
      surfacePoint(wall, b, Math.max(z1, t2)), surfacePoint(wall, a, Math.max(z1, t1)),
    ], color);
  }
}

// 예전 이름 (왼쪽·오른쪽 벽 전용)
function wallLeftRect(y1, y2, z1, z2, color) { surfaceRect("left", y1, y2, z1, z2, color); }
function wallRightRect(x1, x2, z1, z2, color) { surfaceRect("right", x1, x2, z1, z2, color); }

// ---- 방 껍데기 (벽, 바닥) ----------------------------------------
function drawShell() {
  if (room.shape === "attic") drawAtticShell();
  else if (room.shape === "round") drawRoundShell();
  else {
    if (room.shape === "train") drawTrainUnder();
    drawBoxShell();
  }
}

// 방 앞쪽에 그리는 것 (가구보다 나중에)
function drawFront() {
  if (room.shape === "attic") drawAtticFront();
  if (room.shape === "train") drawTrainCeiling();
}

function drawBoxShell() {
  const wh = room.wallHeight, w = RW(), d = RD();
  box(-4, -4, -5, 4, d + 4, wh + 5, { top: "wallTop", left: "wallEdge", right: "wallLeft" });
  box(0, -4, -5, w, 4, wh + 5, { top: "wallTop", left: "wallRight", right: "wallEdge" });
  box(0, 0, -5, w, d, 5, { top: "floor", left: "floorEdge", right: "floorEdge" });
}

function drawRoundShell() {
  const h = room.wallHeight, n = 48;
  // 둥근 벽 (왼쪽에서 오른쪽으로 갈수록 조금씩 어두워짐)
  for (let i = 0; i < n; i++) {
    const a = (ROUND_LEN * i) / n, b = (ROUND_LEN * (i + 1)) / n;
    poly([roundPoint(a, -5), roundPoint(b, -5), roundPoint(b, h), roundPoint(a, h)],
      mixColor(colorOf("wallLeft"), colorOf("wallRight"), i / (n - 1)));
    poly([roundPoint(a, h), roundPoint(b, h), roundPoint(b, h, RC + 4), roundPoint(a, h, RC + 4)], "wallTop");
  }
  for (const a of [0, ROUND_LEN]) {
    poly([roundPoint(a, -5), roundPoint(a, -5, RC + 4), roundPoint(a, h, RC + 4), roundPoint(a, h)], "wallEdge");
  }
  // 바닥 앞쪽 두께와 윗면
  for (let i = 0; i < n; i++) {
    const t1 = ROUND_START + Math.PI + (Math.PI * i) / n, t2 = ROUND_START + Math.PI + (Math.PI * (i + 1)) / n;
    const p = (t, z) => [RC + Math.cos(t) * RC, RC + Math.sin(t) * RC, z];
    poly([p(t1, 0), p(t2, 0), p(t2, -5), p(t1, -5)], "floorEdge");
  }
  poly(floorOutline(), "floor");
}

function drawAtticShell() {
  const k = room.kneeHeight, p = room.peakHeight, half = ROOM / 2, end = ROOM + 2;

  // 박공벽(왼쪽 삼각 벽): 윗면 테두리, 앞쪽 단면, 안쪽 면
  quad([-4, 0, k], [0, 0, k], [0, half, p], [-4, half, p], "wallTop");
  quad([-4, half, p], [0, half, p], [0, ROOM, k], [-4, ROOM, k], "wallTop");
  quad([-4, ROOM, -5], [0, ROOM, -5], [0, ROOM, k], [-4, ROOM, k], "wallEdge");
  poly([[0, 0, -5], [0, 0, k], [0, half, p], [0, ROOM, k], [0, ROOM, -5]], "wallLeft");

  // 낮은 벽(오른쪽)과 지붕 안쪽
  box(0, -4, -5, ROOM, 4, k + 5, { top: "roofEdge", left: "wallRight", right: "wallEdge" });
  quad([0, 0, k], [end, 0, k], [end, half, p], [0, half, p], "roofInner");
  for (let i = 1; i < 6; i++) {
    const y = (half * i) / 6;
    line([0, y, roofZ(y)], [end, y, roofZ(y)], "roofLine");
  }

  // 바닥
  box(0, 0, -5, ROOM, ROOM, 5, { top: "floor", left: "floorEdge", right: "floorEdge" });
}

// 지붕 끝 단면 (방 앞쪽을 가리지 않도록 뒤쪽 지붕만 그립니다)
function drawAtticFront() {
  const k = room.kneeHeight, p = room.peakHeight, half = ROOM / 2, end = ROOM + 2, t = 4;
  const len = Math.hypot(half, p - k);
  const ny = ((p - k) / len) * t, nz = (half / len) * t;
  quad([0, half, p], [end, half, p], [end, half - ny, p + nz], [0, half - ny, p + nz], "roofTop");
  quad([end, 0, k], [end, -ny, k + nz], [end, half - ny, p + nz], [end, half, p], "roofEdge");
}

// 기차: 레일, 차체 아래, 바퀴
function drawTrainUnder() {
  const w = RW(), d = RD();
  for (let x = -10; x < w + 12; x += 6) box(x, -3, -16, 2.5, d + 6, 1, "tie");
  box(-12, 3, -15, w + 26, 1.5, 1.5, "rail");
  box(-12, d - 4.5, -15, w + 26, 1.5, 1.5, "rail");
  box(6, 4, -12, w - 12, d - 8, 7, "underbody");
  for (const cx of [12, 20, w - 20, w - 12]) {
    const pts = [];
    for (let i = 0; i < 16; i++) {
      const t = (i / 16) * Math.PI * 2;
      pts.push([cx + Math.cos(t) * 3.5, d - 3.9, -11 + Math.sin(t) * 3.5]);
    }
    poly(pts, "wheel");
  }
}

// 기차: 둥근 천장 (뒤쪽 벽 위로 휘어지는 부분만)
function drawTrainCeiling() {
  const w = RW() + 2, h = room.wallHeight, n = 6;
  const arc = (i, grow = 0) => {
    const t = (i / n) * (Math.PI / 2);
    return [10 - (10 + grow) * Math.cos(t), h + (7 + grow) * Math.sin(t)];
  };
  for (let i = 0; i < n; i++) {
    const [y1, z1] = arc(i), [y2, z2] = arc(i + 1);
    quad([0, y1, z1], [w, y1, z1], [w, y2, z2], [0, y2, z2], shadeOf("ceiling", -0.03 * (n - i)));
  }
  const cap = [];
  for (let i = 0; i <= n; i++) cap.push([w, ...arc(i)]);
  for (let i = n; i >= 0; i--) cap.push([w, ...arc(i, 3)]);
  poly(cap, "wallTop");
}

// 기차: 끝 벽의 문
function drawTrainDoor() {
  surfaceRect("left", 8, 20, 0, 28, "woodDark");
  surfaceRect("left", 9, 19, 1, 27, "door");
  surfaceRect("left", 11, 17, 16, 24, "doorGlass");
  surfaceRect("left", 16, 17.5, 12, 13, "metal");
}

// ---- 벽과 바닥 무늬 ----------------------------------------------
function drawWallPattern() {
  const pattern = currentStyle().wall.pattern;
  const zMax = room.peakHeight || room.wallHeight;
  for (const wall of wallsOfRoom()) {
    const len = wallLength(wall);
    const top = (a) => wallTopAt(wall, a);
    const pt = (a, z) => surfacePoint(wall, a, z);
    if (pattern === "dots") {
      for (let a = 4; a < len; a += 6) {
        for (let z = 6; z < top(a) - 2; z += 6) dot(...pt(a, z), "wallDot");
      }
    } else if (pattern === "stripes") {
      for (let a = 2; a < len; a += 6) surfaceRect(wall, a, a + 2, 0, 99, "wallDot");
    } else if (pattern === "planks") {
      for (let a = 6; a < len; a += 6) line(pt(a, 0), pt(a, top(a)), "wallDot");
    } else if (pattern === "beams") {
      // 나무 기둥과 가로 들보 (들보는 벽이 충분히 높은 곳에만)
      const posts = [0, len - 2];
      if (len > 50) posts.push(len / 2 - 1);
      for (const a of posts) surfaceRect(wall, a, a + 2, 0, 99, "wallDot");
      for (let a = 0; a < len; a += 2) {
        const b = Math.min(len, a + 2);
        if (top(a) >= 34 && top(b) >= 34) surfaceRect(wall, a, b, 32, 34, "wallDot");
      }
    } else if (pattern === "panel") {
      // 아래쪽 나무 판넬
      surfaceRect(wall, 0, len, 0, 12, "wallDot");
      for (let a = 8; a < len; a += 8) surfaceRect(wall, a - 0.5, a, 2, 11, "woodDark");
      surfaceRect(wall, 0, len, 12, 13, "woodDark");
    } else if (pattern === "bricks") {
      for (let z = 4, row = 0; z < zMax; z += 4, row++) {
        for (let a = 0; a < len; a += 0.5) if (z < top(a)) dot(...pt(a, z), "wallDot");
        for (let a = row % 2 ? 4 : 0; a < len; a += 8) if (z < top(a)) line(pt(a, z - 4), pt(a, z), "wallDot");
      }
    }
    if (pattern !== "panel") surfaceRect(wall, 0, len, 0, 3, "baseboard");
  }
  if (room.shape === "train") drawTrainDoor();
}

function drawFloorPattern() {
  const pattern = currentStyle().floor.pattern;
  const w = RW(), d = RD();
  // 바닥 모양 밖으로 무늬가 넘치지 않게
  ctx.save();
  ctx.beginPath();
  floorOutline().forEach((q, i) => {
    const p = project(...q);
    if (i) ctx.lineTo(p.x, p.y);
    else ctx.moveTo(p.x, p.y);
  });
  ctx.closePath();
  ctx.clip();

  if (pattern === "tatami") {
    // 다다미 4장 + 2장씩 엇갈린 배치
    const mats = [
      [0, 0, 32, 16], [0, 16, 32, 16],
      [32, 0, 16, 32], [48, 0, 16, 32],
      [0, 32, 16, 32], [16, 32, 16, 32],
      [32, 32, 32, 16], [32, 48, 32, 16],
    ];
    for (const [x, y, mw, md] of mats) {
      quad([x, y, 0], [x + mw, y, 0], [x + mw, y + md, 0], [x, y + md, 0], "tatami");
      // 짚 무늬
      if (mw > md) for (let yy = y + 2; yy < y + md - 1; yy += 2) line([x + 1, yy, 0], [x + mw - 1, yy, 0], "tatamiLine");
      else for (let xx = x + 2; xx < x + mw - 1; xx += 2) line([xx, y + 1, 0], [xx, y + md - 1, 0], "tatamiLine");
      // 긴 쪽 테두리
      if (mw > md) {
        line([x, y, 0], [x + mw, y, 0], "tatamiEdge");
        line([x, y + md - 0.5, 0], [x + mw, y + md - 0.5, 0], "tatamiEdge");
      } else {
        line([x, y, 0], [x, y + md, 0], "tatamiEdge");
        line([x + mw - 0.5, y, 0], [x + mw - 0.5, y + md, 0], "tatamiEdge");
      }
    }
  } else if (pattern === "tile") {
    // 체크 타일
    for (let x = 0; x < w; x += 8) {
      for (let y = 0; y < d; y += 8) {
        if ((x + y) / 8 % 2) quad([x, y, 0], [x + 8, y, 0], [x + 8, y + 8, 0], [x, y + 8, 0], "floorLine");
      }
    }
  } else if (pattern === "carpet") {
    // 카펫 결
    for (let x = 2; x < w; x += 4) {
      for (let y = (x / 4) % 2 ? 2 : 4; y < d; y += 4) dot(x, y, 0, "floorLine");
    }
  } else {
    // 나무 바닥
    for (let y = 6, row = 0; y < d; y += 6, row++) {
      line([0, y, 0], [w, y, 0], "floorLine");
      for (let x = row % 2 ? 12 : 0; x < w; x += 24) line([x, y - 6, 0], [x, y, 0], "floorLine");
    }
  }
  ctx.restore();
}

// ---- 창문 --------------------------------------------------------
// 창문 위치는 벽 위의 (a, z) 좌표로 정합니다. y1~y2가 가로(a), z1~z2가 높이입니다.
// wall: "left"(왼쪽 벽, 기본) / "right"(오른쪽 벽) / "round"(둥근 벽)

// 창문 모양에 따라 높이 z에서 하늘이 보이는 범위 [a1, a2]
function windowSpan(win, z) {
  if (win.style === "round") {
    const dz = z - win.cz;
    if (Math.abs(dz) >= win.r) return null;
    const w = Math.sqrt(win.r * win.r - dz * dz);
    return [win.cy - w, win.cy + w];
  }
  if (z < win.sz1 || z >= win.sz2) return null;
  return [win.sy1, win.sy2];
}

// 하늘 영역 안에서만 칠하는 사각형
function skyRect(win, y1, y2, z1, z2, color) {
  for (let z = Math.floor(z1); z < z2; z++) {
    const span = windowSpan(win, z + 0.5);
    if (!span) continue;
    const a = Math.max(y1, span[0]), b = Math.min(y2, span[1]);
    if (b > a) surfaceRect(win.wall, a, b, z, z + 1, color);
  }
}

function drawSky(win, phase, yMin, yMax, zMin, zMax) {
  let [top, bottom] = SKY[phase];
  // 흐리거나 비·눈이 오면 하늘이 회색빛으로
  const grey = { cloudy: 0.45, rain: 0.65, snow: 0.5 }[weather];
  if (grey) {
    const g = phase === "night" ? "#2a2f3a" : "#a7b0ba";
    top = mixHex(top, g, grey);
    bottom = mixHex(bottom, g, grey);
  }
  for (let z = Math.floor(zMin); z < zMax; z++) {
    skyRect(win, yMin, yMax, z, z + 1, mixColor(bottom, top, (z - zMin) / Math.max(1, zMax - zMin - 1)));
  }
  const fy = (f) => yMin + (yMax - yMin) * f;
  const fz = (f) => zMin + (zMax - zMin) * f;

  if (phase === "night" && weather === "clear") {
    const stars = [[0.15, 0.7], [0.35, 0.5], [0.5, 0.75], [0.7, 0.4], [0.25, 0.2], [0.65, 0.15], [0.45, 0.3], [0.85, 0.65]];
    stars.forEach(([sy, sz], i) => {
      const span = windowSpan(win, fz(sz));
      if (!span || fy(sy) < span[0] || fy(sy) > span[1]) return;
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(time * 1.5 + i * 1.7);
      dot(...surfacePoint(win.wall, fy(sy), fz(sz)), "#fff6d5");
    });
    ctx.globalAlpha = 1;
    skyRect(win, fy(0.15), fy(0.15) + 3, fz(0.72), fz(0.72) + 3, "#f4efd2");
  } else if (phase !== "night") {
    // 흘러가는 구름 (기차 창문에서는 빠르게, 흐린 날은 회색 구름이 더 많이)
    ctx.globalAlpha = 0.85;
    const speed = win.scenery ? 5 : 1.2;
    const range = yMax - yMin + 12;
    const cloud = weather === "clear" ? "#ffffff" : weather === "rain" ? "#c3c8cf" : "#e2e5e9";
    const clouds = weather === "clear" ? [[0, 0.55], [range / 2, 0.2]] : [[0, 0.6], [range / 3, 0.25], [(range * 2) / 3, 0.75]];
    clouds.forEach(([offset, cz], i) => {
      const cy = yMax + 6 - ((time * speed + offset) % range);
      if (artStyle === "detail") {
        drawCloudDetail(win, cy - 3, fz(cz), cloud, i);
        return;
      }
      skyRect(win, cy - 6, cy, fz(cz), fz(cz) + 2, cloud);
      skyRect(win, cy - 4, cy - 1, fz(cz) + 2, fz(cz) + 3, cloud);
    });
    ctx.globalAlpha = 1;
  }
  if (win.scenery) drawScenery(win, phase, yMin, yMax, zMin, zMax);
  drawPrecipitation(win, phase, yMin, yMax, zMin, zMax);
}

// ver.세밀 구름: 동그란 덩어리 여러 개를 1/3칸 단위로 칠하고,
// 윗부분은 밝게, 아랫부분은 그늘지게 그립니다. (가운데 a, 바닥 높이 z)
const CLOUD_SHAPES = [
  [[-3.6, 0.9, 1.5], [-1.4, 1.5, 2.1], [1.2, 1.3, 1.9], [3.3, 0.8, 1.4]],
  [[-2.8, 0.8, 1.4], [-0.5, 1.6, 2.2], [2.2, 1, 1.6]],
  [[-3.2, 0.7, 1.3], [-1.2, 1.2, 1.8], [1, 1.7, 2], [3.2, 0.9, 1.4]],
];

function drawCloudDetail(win, ca, cz, color, index) {
  const blobs = CLOUD_SHAPES[index % CLOUD_SHAPES.length].map(([a, z, r]) => [a * 1.2, z * 1.2, r * 1.2]);
  const light = mixColor(color, "#ffffff", 0.7);          // 햇빛 받는 윗부분
  const body = mixColor(color, "#c9d6e3", 0.35);          // 몸통
  const shade = mixColor(color, "#8f9db0", 0.42);         // 아래 그늘
  const u = 1 / 3;
  const colorAt = (a, z) => {
    if (z < 0) return null; // 구름 바닥은 평평하게
    let inside = null;
    for (const [ba, bz, r] of blobs) {
      const d = Math.hypot(a - ba, z - bz);
      if (d <= r) {
        const edge = r - d < 0.6 && z > bz; // 덩어리 위쪽 가장자리
        if (!inside || edge) inside = edge ? "light" : inside || "main";
        if (edge) break;
      }
    }
    if (!inside) return null;
    if (z < 0.6) return shade;
    return inside === "light" ? light : body;
  };
  for (let z = 0; z < 5; z += u) {
    const span = windowSpan(win, cz + z + u / 2);
    if (!span) continue;
    let runStart = null, runColor = null;
    for (let a = -6.5; a <= 6.5 + u; a += u) {
      const c = a <= 6.5 ? colorAt(a + u / 2, z + u / 2) : null;
      if (c !== runColor) {
        if (runColor) {
          const a1 = Math.max(ca + runStart, span[0]), a2 = Math.min(ca + a, span[1]);
          if (a2 > a1) surfaceRect(win.wall, a1, a2, cz + z, cz + z + u, runColor);
        }
        runStart = a;
        runColor = c;
      }
    }
  }
}

// 비나 눈 (창문 안쪽에만)
function drawPrecipitation(win, phase, yMin, yMax, zMin, zMax) {
  if (weather !== "rain" && weather !== "snow") return;
  const w = yMax - yMin, h = zMax - zMin;
  const count = Math.max(3, Math.round(w / 2.5));
  ctx.globalAlpha = weather === "rain" ? 0.85 : 0.9;
  for (let i = 0; i < count; i++) {
    if (weather === "rain") {
      const a = yMin + ((i * 7.3) % w);
      const z = zMax - ((time * 30 + i * 5.1) % h);
      skyRect(win, a, a + 0.5, z - 3, z, phase === "night" ? "#8a97b0" : "#f4f7fb");
    } else {
      const a = yMin + (((i * 5.7 + Math.sin(time + i) * 1.5) % w) + w) % w;
      const z = zMax - ((time * 4 + i * 3.3) % h);
      skyRect(win, a, a + 1, z - 1, z, "#ffffff");
    }
  }
  ctx.globalAlpha = 1;
}

// 기차 창밖 풍경: 먼 산은 천천히, 언덕과 전봇대는 빠르게 지나갑니다.
function drawScenery(win, phase, aMin, aMax, zMin, zMax) {
  const night = phase === "night";
  const farColor = night ? "#2a3548" : phase === "evening" ? "#a08c78" : "#a9cbb0";
  const nearColor = night ? "#1c2533" : phase === "evening" ? "#6f7458" : "#7aa86a";
  const h = zMax - zMin;
  for (let a = Math.floor(aMin); a < aMax; a++) {
    const u = a + time * 2;
    skyRect(win, a, a + 1, zMin, zMin + h * (0.38 + 0.1 * Math.sin(u * 0.15) + 0.05 * Math.sin(u * 0.41)), farColor);
    const v = a + time * 9;
    skyRect(win, a, a + 1, zMin, zMin + h * (0.18 + 0.07 * Math.sin(v * 0.23)), nearColor);
  }
  // 전봇대 (창문끼리 이어지도록 벽 전체 기준 위치로 계산)
  const gap = 40, shift = time * 18;
  for (let k = Math.floor((aMin + shift) / gap); k <= Math.ceil((aMax + shift) / gap); k++) {
    const pa = k * gap - shift;
    if (pa < aMin - 1 || pa > aMax) continue;
    skyRect(win, pa, pa + 1, zMin, zMax - 1, night ? "#151b26" : "#5b4a3e");
    skyRect(win, pa - 1.5, pa + 2.5, zMax - 3, zMax - 2.5, night ? "#151b26" : "#5b4a3e");
  }
}

function windowsOf(r = room) {
  return (r.windows || []).map((w) => Object.assign({ wall: "left" }, w));
}

// 창틀 밑의 창턱 (평평한 벽에만)
function windowSill(win, depth) {
  const { y1, y2, z1 } = win;
  if (win.wall === "left") box(0, y1 - 1, z1 - 2, depth, y2 - y1 + 2, 2, "windowFrame");
  else if (win.wall === "right") box(y1 - 1, 0, z1 - 2, y2 - y1 + 2, depth, 2, "windowFrame");
}

function drawWindow(phase) {
  for (const win of windowsOf()) {
    if (win.style === "round") drawRoundWindow(win, phase);
    else if (win.style === "shoji") drawShojiWindow(win, phase);
    else if (win.style === "train") drawTrainWindow(win, phase);
    else drawCurtainWindow(win, phase);
  }
}

function drawCurtainWindow(win, phase) {
  const { y1, y2, z1, z2, wall } = win;
  const mid = (y1 + y2) / 2, midZ = (z1 + z2) / 2;

  // 커튼을 닫았으면 창 전체를 커튼이 가림
  if (win.closed) {
    surfaceRect(wall, y1 - 1, y2 + 1, z1 - 2, z1, "windowFrame"); // 창턱 자리
    surfaceRect(wall, y1 - 4, y2 + 4, z1 - 3, z2 + 3, "curtain");
    for (let a = y1 - 2; a < y2 + 3; a += 3) surfaceRect(wall, a, a + 1, z1 - 3, z2 + 3, "curtainShade");
    surfaceRect(wall, mid - 0.5, mid + 0.5, z1 - 3, z2 + 3, "curtainShade");
    surfaceRect(wall, y1 - 5, y2 + 5, z2 + 3, z2 + 4, "woodDark");
    return;
  }

  // 커튼과 커튼봉
  surfaceRect(wall, y1 - 5, y2 + 5, z2 + 3, z2 + 4, "woodDark");
  surfaceRect(wall, y1 - 4, y1, z1 - 3, z2 + 3, "curtain");
  surfaceRect(wall, y2, y2 + 4, z1 - 3, z2 + 3, "curtain");
  surfaceRect(wall, y1 - 2, y1 - 1, z1 - 3, z2 + 3, "curtainShade");
  surfaceRect(wall, y2 + 2, y2 + 3, z1 - 3, z2 + 3, "curtainShade");

  // 창틀과 하늘
  surfaceRect(wall, y1, y2, z1, z2, "windowFrame");
  const sky = { wall, sy1: y1 + 2, sy2: y2 - 2, sz1: z1 + 2, sz2: z2 - 2 };
  drawSky(sky, phase, sky.sy1, sky.sy2, sky.sz1, sky.sz2);

  // 창살과 창턱
  surfaceRect(wall, mid - 0.5, mid + 0.5, z1, z2, "windowFrame");
  surfaceRect(wall, y1, y2, midZ - 0.5, midZ + 0.5, "windowFrame");
  windowSill(win, 3);
}

// 미닫이 창: 왼쪽 절반은 열려 있고, 오른쪽 절반은 창호지
function drawShojiWindow(win, phase) {
  const { y1, y2, z1, z2, wall } = win;
  const mid = (y1 + y2) / 2;
  surfaceRect(wall, y1, y2, z1, z2, "windowFrame");

  // 열린 쪽 (하늘)
  const sky = { wall, sy1: mid + 1, sy2: y2 - 1.5, sz1: z1 + 1.5, sz2: z2 - 1.5 };
  drawSky(sky, phase, sky.sy1, sky.sy2, sky.sz1, sky.sz2);

  // 창호지 쪽 (시간에 따라 비치는 빛이 달라짐)
  const glow = { dawn: "#f6e3cf", day: "#f7f1e1", evening: "#f3d9b0", night: "#b9b7c2" }[phase];
  surfaceRect(wall, y1 + 1.5, mid, z1 + 1.5, z2 - 1.5, glow);
  for (let y = y1 + 1.5 + 4; y < mid - 0.5; y += 4) surfaceRect(wall, y - 0.5, y, z1 + 1.5, z2 - 1.5, "windowFrame");
  for (let z = z1 + 1.5 + 5; z < z2 - 2; z += 5) surfaceRect(wall, y1 + 1.5, mid, z - 0.5, z, "windowFrame");
  surfaceRect(wall, mid - 0.5, mid + 1, z1, z2, "windowFrame");
  windowSill(win, 2);
}

// 기차 창문: 위에 짧은 커튼, 창밖으로 풍경이 지나감
function drawTrainWindow(win, phase) {
  const { y1, y2, z1, z2, wall } = win;
  surfaceRect(wall, y1, y2, z1, z2, "windowFrame");
  const sky = { wall, scenery: true, sy1: y1 + 1.5, sy2: y2 - 1.5, sz1: z1 + 1.5, sz2: z2 - 1.5 };
  drawSky(sky, phase, sky.sy1, sky.sy2, sky.sz1, sky.sz2);
  surfaceRect(wall, y1 - 1, y2 + 1, z2 - 0.5, z2 + 2.5, "curtain");
  for (let a = y1; a < y2; a += 3) surfaceRect(wall, a + 1, a + 1.5, z2 - 0.5, z2 + 2.5, "curtainShade");
  windowSill(win, 2);
}

function drawRoundWindow(win, phase) {
  const { cy, cz, r, wall } = win;
  const circle = (rad) => {
    const pts = [];
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * Math.PI * 2;
      pts.push(surfacePoint(wall, cy + Math.cos(a) * rad, cz + Math.sin(a) * rad));
    }
    return pts;
  };
  poly(circle(r + 2), "windowFrame");
  drawSky(win, phase, cy - r, cy + r, cz - r, cz + r);
  // 창살 (십자)
  skyRect(win, cy - 0.5, cy + 0.5, cz - r, cz + r, "windowFrame");
  skyRect(win, cy - r, cy + r, cz - 0.5, cz + 0.5, "windowFrame");
}

// 실제 시간을 가리키는 벽시계
function drawClock() {
  if (!room.clock) return;
  // 둥근 벽의 고정 시계: 그 자리의 벽 위치(a)를 구해서 벽면에 그림
  const [x, y, z] = room.clock;
  let t = Math.atan2(y - RC, x - RC) - ROUND_START;
  while (t < 0) t += Math.PI * 2;
  drawClockOnWall("round", t * RC, z);
}

// 벽시계: 도트 한 칸의 1/3 크기 점으로 정교하게 그립니다.
const CLOCK = {
  rim: "#6b4630",      // 바깥 테
  rimLight: "#a8774f", // 안쪽 밝은 테
  face: "#fbf8f1",     // 시계판
  tick: "#b8aea2",     // 작은 눈금
  mark: "#3a3632",     // 큰 눈금 (12·3·6·9)
  hand: "#2f2b28",     // 시침·분침
  second: "#d0573f",   // 초침
};

// 벽면 위에 시계를 그립니다. (벽 방향에 맞춰 비스듬하게 보임)
// 화면의 작은 점(1/3칸)마다 "벽 위의 어느 위치인지"를 거꾸로 계산해서,
// 그 위치가 시계판·눈금·바늘 중 어디인지에 따라 색을 칠합니다.
function drawClockOnWall(wall, ca, cz) {
  const R = 6; // 반지름 (벽 위 칸 수)
  const c = project(...surfacePoint(wall, ca, cz));
  const n = project(...surfacePoint(wall, ca + 0.5, cz));
  // 벽을 따라 1칸 갈 때 화면에서 움직이는 양 (높이 1칸은 화면 위로 1칸)
  const ex = (n.x - c.x) * 2, ey = (n.y - c.y) * 2;
  const faceRight = ex > 0 ? 1 : -1; // 보는 사람 기준 오른쪽이 벽의 +방향인지

  const d = now();
  const sec = d.getSeconds();
  const min = d.getMinutes() + sec / 60;
  const hour = (d.getHours() % 12) + min / 60;
  const hands = [
    { angle: (hour / 12) * Math.PI * 2, len: 2.7, half: 0.36, color: CLOCK.hand },
    { angle: (min / 60) * Math.PI * 2, len: 4.2, half: 0.2, color: CLOCK.hand },
    { angle: (sec / 60) * Math.PI * 2, len: 4.5, half: 0.17, color: CLOCK.second },
  ];
  // (h, v): 시계판 위 위치 (h는 오른쪽, v는 위쪽이 +)
  const onHand = (h, v, k) => {
    const dx = Math.sin(k.angle), dy = Math.cos(k.angle);
    const along = h * dx + v * dy;
    if (along < -0.3 || along > k.len) return false;
    return Math.abs(h * dy - v * dx) <= k.half;
  };

  const u = 1 / 3;
  const spanX = Math.abs(ex) * R + 1, spanY = Math.abs(ey) * R + R * WS + 1;
  const x0 = Math.floor((c.x - spanX) * 3), x1 = Math.ceil((c.x + spanX) * 3);
  const y0 = Math.floor((c.y - spanY) * 3), y1 = Math.ceil((c.y + spanY) * 3);
  for (let py = y0; py < y1; py++) {
    for (let px = x0; px < x1; px++) {
      const sx = (px + 0.5) / 3 - c.x, sy = (py + 0.5) / 3 - c.y;
      const da = sx / ex;          // 벽을 따라 떨어진 거리
      const v = (da * ey - sy) / WS; // 위로 떨어진 거리 (방을 줄여 그릴 때도 같은 모양)
      const h = da * faceRight;
      const r = Math.hypot(h, v);
      if (r > R) continue;
      let color;
      if (r > R - 0.55) color = CLOCK.rim;
      else if (r > R - 0.9) color = CLOCK.rimLight;
      else if (r < 0.4) color = CLOCK.second;               // 가운데 축
      else if (onHand(h, v, hands[2])) color = CLOCK.second;
      else if (onHand(h, v, hands[1]) || onHand(h, v, hands[0])) color = CLOCK.hand;
      else {
        color = CLOCK.face;
        // 눈금: 바깥쪽 고리에서 30도마다
        const ang = Math.atan2(h, v);
        const step = Math.PI / 6;
        const k = Math.round(ang / step);
        const off = Math.abs(ang - k * step) * r;
        const major = ((k % 3) + 3) % 3 === 0;
        if (r > R - (major ? 2.1 : 1.6) && r < R - 1.0 && off < (major ? 0.32 : 0.2)) color = major ? CLOCK.mark : CLOCK.tick;
      }
      ctx.fillStyle = color;
      ctx.fillRect(px * u, py * u, u, u);
    }
  }
}

// 벽면 위의 작은 점(1/3칸)마다 color(h, v)를 물어서 칠합니다.
// h: 보는 사람 기준 오른쪽(+), v: 위쪽(+) — 벽 위 칸 단위. 빈칸이면 null.
function paintOnWall(wall, ca, cz, halfA, halfZ, color) {
  const c = project(...surfacePoint(wall, ca, cz));
  const n = project(...surfacePoint(wall, ca + 0.5, cz));
  const ex = (n.x - c.x) * 2, ey = (n.y - c.y) * 2;
  const faceRight = ex > 0 ? 1 : -1;
  const u = 1 / 3;
  const spanX = Math.abs(ex) * halfA + 1, spanY = Math.abs(ey) * halfA + halfZ * WS + 1;
  const x0 = Math.floor((c.x - spanX) * 3), x1 = Math.ceil((c.x + spanX) * 3);
  const y0 = Math.floor((c.y - spanY) * 3), y1 = Math.ceil((c.y + spanY) * 3);
  for (let py = y0; py < y1; py++) {
    for (let px = x0; px < x1; px++) {
      const sx = (px + 0.5) / 3 - c.x, sy = (py + 0.5) / 3 - c.y;
      const da = sx / ex;
      const col = color(da * faceRight, (da * ey - sy) / WS);
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(px * u, py * u, u, u);
    }
  }
}

// 전자 시계: 7칸짜리 숫자 조각으로 24시간 HH:MM, 콜론은 1초마다 깜빡임
const DIGITAL = {
  case: "#2f3136",
  caseLight: "#4a4d54",
  screen: "#141619",
  on: "#ff7a45",
  off: "#1f1716",
};
// 숫자별로 켜지는 조각 (a 위, b 오른쪽 위, c 오른쪽 아래, d 아래, e 왼쪽 아래, f 왼쪽 위, g 가운데)
const SEGMENTS = ["abcdef", "bc", "abged", "abgcd", "fgbc", "afgcd", "afgedc", "abc", "abcdefg", "abcdfg"];

function segmentAt(h, v) {
  const w = 1.9, top = 2, t = 0.45;
  const inH = (a, b) => h >= a && h <= b, inV = (a, b) => v >= a && v <= b;
  if (inV(top - t, top) && inH(-w / 2 + t / 2, w / 2 - t / 2)) return "a";
  if (inV(-top, -top + t) && inH(-w / 2 + t / 2, w / 2 - t / 2)) return "d";
  if (inV(-t / 2, t / 2) && inH(-w / 2 + t / 2, w / 2 - t / 2)) return "g";
  if (inH(w / 2 - t, w / 2)) return inV(0.15, top - 0.2) ? "b" : inV(-top + 0.2, -0.15) ? "c" : null;
  if (inH(-w / 2, -w / 2 + t)) return inV(0.15, top - 0.2) ? "f" : inV(-top + 0.2, -0.15) ? "e" : null;
  return null;
}

function drawDigitalClockOnWall(wall, ca, cz) {
  const d = now();
  const text = String(d.getHours()).padStart(2, "0") + String(d.getMinutes()).padStart(2, "0");
  const colon = d.getSeconds() % 2 === 0;
  const digitX = [-4.6, -2.1, 2.1, 4.6];
  paintOnWall(wall, ca, cz, 8, 4.5, (h, v) => {
    if (Math.abs(h) > 8 || Math.abs(v) > 4.5) return null;
    if (Math.abs(h) > 7.3 || Math.abs(v) > 3.8) return v > 3.8 ? DIGITAL.caseLight : DIGITAL.case;
    // 숫자
    for (let i = 0; i < 4; i++) {
      const seg = segmentAt(h - digitX[i], v);
      if (seg) return SEGMENTS[+text[i]].includes(seg) ? DIGITAL.on : DIGITAL.off;
    }
    // 콜론
    if (Math.abs(h) < 0.3 && (Math.abs(v - 0.9) < 0.3 || Math.abs(v + 0.9) < 0.3)) return colon ? DIGITAL.on : DIGITAL.off;
    return DIGITAL.screen;
  });
}

function drawClockAt(c) {
  const u = 1 / 3;
  const R = 18; // 반지름 (1/3칸 단위, 도트 6칸)
  const cx = Math.round(c.x * 3) / 3, cy = Math.round(c.y * 3) / 3;
  const dot = (x, y, color, w = 1, h = 1) => {
    ctx.fillStyle = color;
    ctx.fillRect(cx + x * u, cy + y * u, w * u, h * u);
  };

  // 테두리와 시계판
  for (let y = -R; y <= R; y++) {
    for (let x = -R; x <= R; x++) {
      const d = Math.hypot(x + 0.5, y + 0.5);
      if (d > R) continue;
      dot(x, y, d > R - 1.6 ? CLOCK.rim : d > R - 2.6 ? CLOCK.rimLight : CLOCK.face);
    }
  }

  // 눈금 12개 (12·3·6·9는 굵게)
  for (let h = 0; h < 12; h++) {
    const a = (h / 12) * Math.PI * 2;
    const major = h % 3 === 0;
    const len = major ? 3 : 1.5;
    for (let t = 0; t < len; t += 0.5) {
      const r = R - 3.5 - t;
      const x = Math.round(Math.sin(a) * r - 0.5), y = Math.round(-Math.cos(a) * r - 0.5);
      dot(x, y, major ? CLOCK.mark : CLOCK.tick);
    }
  }

  // 바늘
  const d = now();
  const sec = d.getSeconds();
  const min = d.getMinutes() + sec / 60;
  const hour = (d.getHours() % 12) + min / 60;
  const hand = (angle, len, color, thick) => {
    for (let t = 0; t <= len; t += 0.5) {
      const x = Math.round(Math.sin(angle) * t - 0.5), y = Math.round(-Math.cos(angle) * t - 0.5);
      dot(x, y, color, thick, thick);
    }
  };
  hand((hour / 12) * Math.PI * 2, 8, CLOCK.hand, 2);     // 시침: 짧고 굵게
  hand((min / 60) * Math.PI * 2, 12.5, CLOCK.hand, 1);   // 분침: 길고 가늘게
  hand((sec / 60) * Math.PI * 2, 13.5, CLOCK.second, 1); // 초침: 빨간색
  dot(-1, -1, CLOCK.second, 2, 2);                        // 가운데 축
}

// 시간대에 따라 방을 어둡게 하고, 조명 빛을 비춥니다.
function drawLighting(phase) {
  // 낮에 커튼을 모두 닫으면 조금 어두워짐
  const dark = Math.min(0.6, darknessOf(phase) + (phase !== "night" && curtainsAllClosed() ? 0.15 : 0));
  const lights = items.filter((f) => f.light && isLit(f));
  const lightPos = (f) => {
    const [lx, ly, lz] = turnedPoint(f, [f.light.x, f.light.y, f.light.z]);
    return project(f.x + lx, f.y + ly, f.z + lz);
  };

  // source-atop: 방이 그려진 부분에만 적용
  ctx.globalCompositeOperation = "source-atop";
  if (dark > 0) {
    sctx.setTransform(RES, 0, 0, RES, 0, 0);
    sctx.clearRect(0, 0, W, H);
    sctx.globalCompositeOperation = "source-over";
    sctx.fillStyle = `rgba(20, 26, 51, ${dark})`;
    sctx.fillRect(0, 0, W, H);
    sctx.globalCompositeOperation = "destination-out";
    for (const f of lights) {
      const p = lightPos(f), r = f.light.radius * WS;
      const g = sctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      g.addColorStop(0, "rgba(0,0,0,0.9)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      sctx.fillStyle = g;
      sctx.fillRect(0, 0, W, H);
    }
    sctx.globalCompositeOperation = "source-over";
    ctx.drawImage(shade, 0, 0, W, H);
  }
  for (const f of lights) {
    const p = lightPos(f), r = f.light.radius * WS;
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
    g.addColorStop(0, `rgba(255, 190, 110, ${dark > 0 ? 0.25 : 0.1})`);
    g.addColorStop(1, "rgba(255, 190, 110, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.globalCompositeOperation = "source-over";
}

// ---- 캐릭터 ------------------------------------------------------
const hero = {
  x: 32,
  y: 52,
  dir: 1,
  mode: "idle",   // idle(가만히) / walk(걷기) / toBed(자러 가기) / sleep(자기) / read(책 읽기) / snack(간식) / work(집중)
  timer: 2,
  target: null,
  walkT: 0,
  blinkT: 3,
  jumpT: 0,
  heartT: 0,
};

// 가구에 부딪히지 않는 곳인지 확인
function isFree(x, y) {
  if (!insideFloor(x, y, 4)) return false;
  return !blockers.some((b) => x > b.x - 2.5 && x < b.x + b.w + 2.5 && y > b.y - 2.5 && y < b.y + b.d + 2.5);
}

function pathIsFree(x1, y1, x2, y2) {
  const steps = Math.ceil(Math.hypot(x2 - x1, y2 - y1));
  for (let i = 0; i <= steps; i++) {
    const t = steps ? i / steps : 0;
    if (!isFree(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t)) return false;
  }
  return true;
}

function pickTarget() {
  for (let i = 0; i < 30; i++) {
    const x = 4 + Math.random() * (RW() - 8);
    const y = 4 + Math.random() * (RD() - 8);
    if (pathIsFree(hero.x, hero.y, x, y)) return { x, y };
  }
  return null;
}

// ---- 잠자리 ------------------------------------------------------
function bedItem() {
  return items.find((f) => f.sleep);
}

function pillowPos() {
  const b = bedItem();
  const [px, py, pz] = turnedPoint(b, b.sleep.pillow);
  return [b.x + px, b.y + py, b.z + pz];
}

// 잠들기 전 서는 자리 (막혀 있으면 잠자리 주변의 빈 곳)
function bedSide() {
  const b = bedItem();
  return spotNear(b, turnedPoint(b, b.sleep.side));
}

// 가구 옆에 설 자리 (정해 둔 자리가 막혀 있으면 가구 주변의 빈 곳)
function spotNear(b, offset) {
  const x = b.x + offset[0], y = b.y + offset[1];
  if (isFree(x, y)) return { x, y };
  const f = footprint(b);
  for (let t = 0.5, n = 0; n < 9; n++, t = 0.5 + (n % 2 ? 1 : -1) * Math.ceil(n / 2) / 8) {
    for (const [cx, cy] of [
      [f.x - 3, f.y + f.d * t], [f.x + f.w + 3, f.y + f.d * t],
      [f.x + f.w * t, f.y + f.d + 3], [f.x + f.w * t, f.y - 3],
    ]) {
      if (isFree(cx, cy)) return { x: cx, y: cy };
    }
  }
  return { x, y };
}

// ---- 책상 (집중 타이머) -------------------------------------------
// 집중하는 동안 캐릭터가 가서 일할 가구 (data.js에서 work가 있는 가구)
function workItem() {
  return items.find((f) => f.work && f.z === 0);
}

function isFocusing() {
  return typeof Focus !== "undefined" && Focus.isFocusing() && ownsRoom();
}

// 방을 바꾸면 빈 바닥에 캐릭터를 세웁니다.
function placeHeroInRoom() {
  for (let i = 0; i < 200; i++) {
    const x = 6 + Math.random() * (RW() - 12);
    const y = RD() * 0.45 + Math.random() * (RD() * 0.55 - 6);
    if (isFree(x, y)) { hero.x = x; hero.y = y; break; }
  }
  if (hero.mode === "walk") { hero.mode = "idle"; hero.timer = 1; }
  fixSleep();
}

// 잠자리가 없어졌으면 깨우고, 있으면 그쪽으로 다시 가게 합니다.
function fixSleep() {
  if (hero.mode !== "sleep" && hero.mode !== "toBed") return;
  if (!bedItem()) {
    hero.mode = "idle";
    hero.timer = 1;
  } else if (hero.mode === "toBed") {
    hero.target = bedSide();
  }
}

// 캐릭터 상태 (다른 화면에 보낼 때)
function moveState(c) {
  return {
    x: Math.round(c.x * 10) / 10,
    y: Math.round(c.y * 10) / 10,
    mode: c.mode,
    tx: c.target ? c.target.x : null,
    ty: c.target ? c.target.y : null,
  };
}

let heroRemote = false; // 친구 방에서 방 주인이 접속해 있으면, 주인 화면이 보내는 움직임을 따라감
function setHeroRemote(on) {
  heroRemote = on;
}

// 다른 화면에서 온 움직임 적용
function applyMove(c, m) {
  c.x = m.x;
  c.y = m.y;
  c.mode = m.mode || "idle";
  c.target = m.tx != null ? { x: m.tx, y: m.ty } : null;
  if (!c.target && ["walk", "toBed", "toWork"].includes(c.mode)) c.mode = "idle";
}

// 목적지까지 걷기만 (스스로 정하지 않음)
function walkOnly(c, dt) {
  if (!c.target || !["walk", "toBed", "toWork"].includes(c.mode)) return;
  const dx = c.target.x - c.x, dy = c.target.y - c.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 0.3) {
    c.x = c.target.x;
    c.y = c.target.y;
    c.mode = c.mode === "toBed" ? "sleep" : c.mode === "toWork" ? "work" : "idle";
    return;
  }
  const step = Math.min(dist, WALK_SPEED * dt);
  c.x += (dx / dist) * step;
  c.y += (dy / dist) * step;
  if (Math.abs(dx - dy) > 0.01) c.dir = Math.sign(dx - dy);
  c.walkT += dt;
}

function updateHero(dt, h) {
  if (visiting && heroRemote) {
    hero.heartT = Math.max(0, hero.heartT - dt);
    hero.jumpT = Math.max(0, hero.jumpT - dt);
    hero.blinkT -= dt;
    if (hero.blinkT < -0.15) hero.blinkT = 2 + Math.random() * 3;
    walkOnly(hero, dt);
    return;
  }
  const before = JSON.stringify([hero.mode, hero.target]);
  updateHeroLocal(dt, h);
  // 내 방에서 캐릭터가 새로 움직이기 시작하면 놀러 온 친구 화면에도 알림
  if (!visiting && Net.onHeroMove && JSON.stringify([hero.mode, hero.target]) !== before) Net.onHeroMove(moveState(hero));
}

// ---- 가구 쓰기 (상호작용) ------------------------------------------
// 가구 이름 → 하는 일. read: 책 읽기, snack: 간식, sit: 방석에 앉기, look: 구경(뒷모습),
// water: 화분에 물 주기, lamp: 조명 켜고 끄기
const INTERACT = {
  bookcase: "read", shelf: "read",
  lowTable: "snack", windowTable: "snack", chest: "snack",
  cushion: "sit",
  chair: "chair", stool: "chair", armchair: "chair", trainSeat: "chair",
  windowCurtain: "look", windowShoji: "look", windowRound: "look", windowTrain: "look", telescope: "look", globe: "look",
  plant: "water",
  lamp: "lamp", andon: "lamp",
};
const USE_MODES = ["read", "snack", "look", "water", "lamp", "sitChair"];
const USE_TIME = { read: [10, 18], snack: [8, 12], look: [6, 10], water: [3, 4], lamp: [1.2, 1.2], sitChair: [8, 14] };

// 의자에 앉았을 때 바라보는 쪽 (등받이 반대쪽). 화면에서 오른쪽이면 1, 왼쪽이면 -1
function seatFacing(item) {
  const back = item.seat && item.seat.back;
  if (!back) return 0;
  let [vx, vy] = back === "+x" ? [-1, 0] : [1, 0]; // 등받이 반대 방향
  for (let r = rotOf(item); r > 0; r--) [vx, vy] = [-vy, vx];
  const sdx = vx - vy;
  return Math.abs(sdx) > 0.01 ? Math.sign(sdx) : 0;
}

// 가구 앞에 설 자리 (벽 장식은 벽에서 조금 떨어진 곳, 방석은 그 위)
function useSpot(item, act) {
  if (item.type === "wall") {
    const wall = wallOf(item);
    if (wall === "round") return null;
    const e = wallExtent(item), a = (wall === "right" ? item.x : item.y) + (e.a1 + e.a2) / 2;
    const spot = wall === "right" ? { x: a, y: 7 } : { x: 7, y: a };
    return isFree(spot.x, spot.y) ? spot : null;
  }
  const f = footprint(item);
  if (act === "sit" || act === "chair") return { x: f.x + f.w / 2, y: f.y + f.d / 2 };
  const sides = [
    { x: f.x + f.w / 2, y: f.y + f.d + 3.5 }, { x: f.x + f.w + 3.5, y: f.y + f.d / 2 },
    { x: f.x + f.w / 2, y: f.y - 3.5 }, { x: f.x - 3.5, y: f.y + f.d / 2 },
  ];
  return sides.find((p) => isFree(p.x, p.y)) || null;
}

function pickInteraction(h) {
  const night = phaseOf(h) === "night" || phaseOf(h) === "evening";
  const plans = [];
  for (const item of items) {
    const act = INTERACT[item.id];
    if (!act) continue;
    // 조명: 저녁에 한 번 켜러, 아침에 한 번 끄러 감. 이 시간대에 이미 켜고 끈 조명(직접 만진 것 포함)은 그대로 둠
    if (act === "lamp" && (night === isLit(item) || item.lightAt === lightPeriod())) continue;
    if (act === "snack" && item.z > 0) continue;
    const spot = useSpot(item, act);
    if (spot) plans.push({ item, act, spot });
  }
  // 조명은 먼저 (어두워졌는데 꺼져 있으면 바로 켜러 감)
  const lamp = plans.find((p) => p.act === "lamp");
  if (lamp) return lamp;
  return plans.length ? plans[Math.floor(Math.random() * plans.length)] : null;
}

function startUse() {
  const plan = hero.use;
  if (!plan || !items.includes(plan.item)) { endUse(); return; }
  let mode = plan.act;
  if (mode === "sit") {
    hero.seat = plan.item; // 방석 위에 앉음 (방석을 그린 다음 캐릭터를 그림)
    mode = Math.random() < 0.6 ? "read" : "snack";
  } else if (mode === "chair") {
    hero.seat = plan.item; // 의자에 앉아 쉬기
    mode = "sitChair";
  }
  hero.mode = mode;
  const [a, b] = USE_TIME[mode];
  hero.actT = a + Math.random() * (b - a);
  // 가구 쪽을 바라보기
  const c = plan.item.type === "wall" ? useSpot(plan.item, mode) : null;
  const f = footprint(plan.item);
  const sdx = c ? 0 : (f.x + f.w / 2 - hero.x) - (f.y + f.d / 2 - hero.y);
  if (Math.abs(sdx) > 0.5) hero.dir = Math.sign(sdx);
  if (mode === "sitChair" && seatFacing(plan.item)) hero.dir = seatFacing(plan.item);
  if (mode === "lamp") toggleLight(plan.item, true);
}

function endUse() {
  stopUse();
  hero.mode = "idle";
  hero.timer = 2 + Math.random() * 3;
}

// 다른 일(잠, 집중, 클릭)로 가구 쓰기를 멈출 때
function stopUse() {
  hero.use = null;
  hero.seat = null;
}

function updateHeroLocal(dt, h) {
  hero.heartT = Math.max(0, hero.heartT - dt);
  hero.jumpT = Math.max(0, hero.jumpT - dt);
  hero.blinkT -= dt;
  if (hero.blinkT < -0.15) hero.blinkT = 2 + Math.random() * 3;

  // 집중 중이면 책상으로 (잠보다 먼저)
  const desk = isFocusing() ? workItem() : null;
  if (desk && hero.mode !== "work" && hero.mode !== "toWork") {
    if (hero.mode === "sleep") Object.assign(hero, bedSide());
    stopUse();
    hero.mode = "toWork";
    // 책상 가까이에 의자가 있으면 의자에 앉아서, 없으면 책상 옆 바닥에서
    const df = footprint(desk);
    const chair = items.find((o) => o.seat && o.seat.back && o.z === 0 && (() => {
      const f = footprint(o);
      return Math.hypot(f.x + f.w / 2 - (df.x + df.w / 2), f.y + f.d / 2 - (df.y + df.d / 2)) < 16;
    })());
    hero.workSeat = chair || null;
    if (chair) { const f = footprint(chair); hero.target = { x: f.x + f.w / 2, y: f.y + f.d / 2 }; }
    else hero.target = spotNear(desk, turnedPoint(desk, desk.work));
  }
  if (!desk && (hero.mode === "work" || hero.mode === "toWork")) {
    hero.seat = null;
    hero.workSeat = null;
    hero.mode = "idle";
    hero.timer = 1;
  }

  // 밤에는 잠자리로, 아침에는 일어나기
  const sleepy = isSleepTime(h) && !desk;
  if (sleepy && bedItem() && hero.mode !== "sleep" && hero.mode !== "toBed") {
    stopUse();
    hero.mode = "toBed";
    hero.target = bedSide();
  }
  if (!sleepy && (hero.mode === "sleep" || hero.mode === "toBed")) {
    if (hero.mode === "sleep") Object.assign(hero, bedSide());
    hero.mode = "idle";
    hero.timer = 2;
  }

  hero.waveT = Math.max(0, (hero.waveT || 0) - dt);
  if (USE_MODES.includes(hero.mode)) {
    // 가구 쓰기: 정해 둔 시간이 지나면 다시 돌아다님
    hero.actT -= dt;
    if (hero.actT <= 0) endUse();
  } else if (hero.mode === "idle") {
    hero.timer -= dt;
    if (hero.timer <= 0 && Math.random() < 0.4) {
      // 가끔 방에 놓인 가구로 가서 씀 (책장에서 책 읽기, 창밖 보기 등)
      const plan = pickInteraction(h);
      if (plan) {
        hero.use = plan;
        hero.target = plan.spot;
        hero.mode = "toUse";
        return;
      }
    }
    if (hero.timer <= 0) {
      const t = Math.random() < 0.7 ? pickTarget() : null;
      if (t) {
        hero.target = t;
        hero.mode = "walk";
      } else {
        hero.timer = 2 + Math.random() * 3;
      }
    }
  } else if (hero.mode === "walk" || hero.mode === "toBed" || hero.mode === "toWork" || hero.mode === "toUse") {
    const dx = hero.target.x - hero.x, dy = hero.target.y - hero.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.3) {
      hero.x = hero.target.x;
      hero.y = hero.target.y;
      if (hero.mode === "toUse") {
        startUse();
      } else if (hero.mode === "toBed") {
        hero.mode = "sleep";
      } else if (hero.mode === "toWork") {
        // 책상 쪽을 바라보고 일하기
        hero.mode = "work";
        if (hero.workSeat && items.includes(hero.workSeat)) hero.seat = hero.workSeat;
        const f = footprint(desk);
        const sdx = (f.x + f.w / 2 - hero.x) - (f.y + f.d / 2 - hero.y);
        if (Math.abs(sdx) > 0.01) hero.dir = Math.sign(sdx);
      } else {
        hero.mode = "idle";
        hero.timer = 2 + Math.random() * 4;
      }
    } else {
      const step = Math.min(dist, WALK_SPEED * dt);
      hero.x += (dx / dist) * step;
      hero.y += (dy / dist) * step;
      const screenDx = dx - dy;
      if (Math.abs(screenDx) > 0.01) hero.dir = Math.sign(screenDx);
      hero.walkT += dt;
    }
  }
}

function heroScreen() {
  // 의자에 앉아 있으면 앉는 자리 높이만큼 올려서 그림
  const z = hero.seat && hero.seat.seat ? hero.seat.z + hero.seat.seat.z : 0;
  const p = project(hero.x, hero.y, z);
  return { x: Math.round(p.x), y: Math.round(p.y) };
}

// ---- 캐릭터 꾸미기 ----
// 예전 저장 데이터(옷 한 벌 방식)를 새 방식(상의·하의)으로 바꿔 줍니다.
const OLD_OUTFIT_BOTTOM = {
  basic: "pantsNavy", mint: "pantsGray", pinkHoodie: "pantsNavy",
  stripe: "pantsBlack", blackKnit: "pantsBeige", raincoat: "pantsDenim",
};

function normLook(look = {}) {
  const l = Object.assign({
    gender: "female", hair: "short", hairColor: "brown", skin: "light", eyes: "basic", mouth: "smile",
  }, look);
  if (!l.top) l.top = TOPS.some((t) => t.id === l.outfit) ? l.outfit : "teeCream";
  if (!l.bottom) l.bottom = OLD_OUTFIT_BOTTOM[l.outfit] || "pantsNavy";
  delete l.outfit;
  return l;
}
save.look = normLook(save.look);

const findBy = (list, id) => list.find((x) => x.id === id) || list[0];

// 기본 그림에 머리, 눈, 표정, 옷을 얹어서 캐릭터 그림을 만듭니다.
function heroRows(name, lookIn = save.look) {
  const look = normLook(lookIn);
  const base = CHARACTER[name] || CHARACTER.idle;
  const headOnly = name === "sleep";
  const closed = name === "blink" || name === "sleep";
  // 원래 그림의 머리카락·눈·볼은 지우고 맨얼굴에서 시작
  const rows = base.map((r) => r.replace(/[HEB]/g, "S").split(""));
  const put = (r, c, ch) => { if (rows[r] && c >= 0 && c < rows[r].length) rows[r][c] = ch; };

  // 볼터치
  if (look.gender === "female") { put(5, 2, "B"); put(5, 7, "B"); }

  // 눈 (안경·선글라스는 머리카락 위에 따로 그림)
  if (look.eyes === "calm") {
    for (const c of [2, 3, 6, 7]) put(4, c, "E");
  } else if (!closed && look.eyes !== "sunglasses") {
    put(4, 3, "E"); put(4, 6, "E");
    if (look.eyes === "big") { put(3, 3, "E"); put(3, 6, "E"); }
  }

  // 표정 (잘 때는 입을 다뭄)
  if (!headOnly) {
    if (look.mouth === "smile") { put(5, 4, "M"); put(5, 5, "M"); }
    else if (look.mouth === "grin") { for (let c = 3; c <= 6; c++) put(5, c, "M"); }
    else if (look.mouth === "wow") { put(5, 4, "O"); put(5, 5, "O"); put(6, 4, "O"); put(6, 5, "O"); }
  }

  // 머리카락
  const hair = findBy(HAIR_STYLES, look.hair);
  hair.rows.forEach((pat, r) => {
    for (let c = 0; c < pat.length; c++) if (pat[c] === "H") put(r, c, "H");
  });

  // 장신구 (머리카락 위에)
  const recolorRow = (r, from, to) => { if (rows[r]) rows[r] = rows[r].map((ch) => (ch === from ? to : ch)); };
  if (look.acc === "cap" || look.acc === "beanie" || look.acc === "strawHat") {
    recolorRow(0, "H", "X"); recolorRow(1, "H", "X");
    if (look.acc === "beanie") recolorRow(2, "H", "Y");
    else for (let c = look.acc === "strawHat" ? 0 : 1; c <= 9; c++) put(2, c, "Y"); // 챙
  } else if (look.acc === "headband") {
    recolorRow(2, "H", "X");
  } else if (look.acc === "ribbon") {
    put(0, 7, "X"); put(0, 9, "X"); put(0, 8, "Y");
  } else if (look.acc === "hairpin") {
    put(3, 1, "X");
  }

  // 옷
  if (!headOnly) {
    const top = findBy(TOPS, look.top);
    if (top.style === "stripe") for (const r of [8, 10]) rows[r] = rows[r].map((ch) => (ch === "C" ? "D" : ch));
    if (top.style === "hood") { put(7, 2, "C"); put(7, 7, "C"); }
    if (top.style === "collar") { put(7, 3, "W"); put(7, 6, "W"); }
    const bottom = findBy(BOTTOMS, look.bottom);
    if (bottom.type === "shorts") rows[12] = rows[12].map((ch) => (ch === "P" ? "S" : ch));
    if (bottom.type === "skirt") rows[12] = ".PPPPPPPP.".split("");
  }

  const out = rows.map((r) => r.join(""));
  return hair.extra ? [...hair.extra, ...out] : out;
}

function heroColors(lookIn = save.look) {
  const look = normLook(lookIn);
  const acc = ACCESSORIES.find((a) => a.id === look.acc);
  const top = findBy(TOPS, look.top);
  return {
    H: findBy(HAIR_COLORS, look.hairColor).color,
    S: findBy(SKIN_TONES, look.skin).color,
    E: "#2b2b2b",
    B: "#f0a3a3",
    C: top.color,
    D: top.stripe || top.color,
    W: "#fbf8f1",
    P: findBy(BOTTOMS, look.bottom).color,
    F: "#3b3b3b",
    G: "#8c7462",   // 안경테
    L: "#cfe5f2",   // 안경 렌즈
    K: "#1f1f24",
    X: acc ? acc.color : "#000",   // 장신구
    Y: acc ? acc.dark : "#000",
    M: "#c76b6b",
    O: "#8a3b3b",
  };
}

// 가지고 있는 옷인지 (무료 옷은 항상)
function ownsCloth(item) {
  return item.price === 0 || save.outfits.includes(item.id);
}

// 캐릭터 크기 (그림 파일이 있으면 그 크기, 없으면 글자 그림 크기)
function heroSize() {
  if (useHeroArt()) return { w: 8, h: 12 }; // ver.세밀 캐릭터 그림 (24×36 픽셀 = 8×12칸)
  if (readyImage(CHARACTER_SHEET && CHARACTER_SHEET.image)) {
    return { w: CHARACTER_SHEET.frameWidth, h: CHARACTER_SHEET.frameHeight };
  }
  const rows = heroRows("idle");
  return { w: rows[0].length, h: rows.length };
}

// 안경·선글라스: 도트 한 칸의 1/3 굵기로 그립니다. (left, faceTop: 캐릭터 그림 왼쪽 위, 얼굴 첫 줄)
const EYEWEAR = {
  glasses: { frame: "#2b2b2b", lens: "#d6ecf7", glint: "#ffffff" },
  sunglasses: { frame: "#1a1a1e", lens: "#26262c", glint: "#ffffff" },
};

function drawEyewear(look, left, faceTop) {
  const kind = EYEWEAR[look && look.eyes];
  if (!kind) return;
  const u = 1 / 3;
  const rect = (x, y, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(left + x * u, faceTop + y * u, w * u, h * u);
  };
  const y = 11; // 테 윗줄 (눈이 있는 줄(12~14)을 렌즈가 가리도록)
  for (const x0 of [5, 17]) {
    rect(x0, y, 8, 5, kind.frame);          // 테
    rect(x0 + 1, y + 1, 6, 3, kind.lens);   // 렌즈
    rect(x0 + 3, y + 1, 1, 1, kind.glint);  // 사선 반사광
    rect(x0 + 2, y + 2, 1, 1, kind.glint);
    if (kind === EYEWEAR.sunglasses) rect(x0 + 4, y + 1, 1, 1, kind.glint);
  }
  rect(13, y + 1, 4, 1, kind.frame);        // 코다리
  rect(3, y + 1, 2, 1, kind.frame);         // 안경다리
  rect(25, y + 1, 2, 1, kind.frame);
}

// ---- ver.세밀 캐릭터 (hero-art.js의 그림) ----
// 그림의 머리·피부·상의·하의 색을 고른 색으로 바꿔 칠합니다. (밝고 어두운 차이는 그대로)
function useHeroArt() {
  return artStyle === "detail" && typeof HERO_ART !== "undefined";
}

function hexToHsl(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}

function hslToHex(h, s, l) {
  const f = (n) => {
    const k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l);
    const v = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(v * 255).toString(16).padStart(2, "0");
  };
  return "#" + f(0) + f(8) + f(4);
}

const clamp01 = (v) => Math.max(0, Math.min(1, v));
function recolor(orig, base, target) {
  const [, s0, l0] = hexToHsl(orig), [, sb, lb] = hexToHsl(base), [ht, st, lt] = hexToHsl(target);
  return hslToHex(ht, clamp01(st + (s0 - sb) * 0.5), clamp01(lt + (l0 - lb)));
}

// 눈 위치 (안경을 그릴 자리): 눈 색 칸을 좌우로 묶은 상자들
function heroArtEyes(rows) {
  const pts = [];
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    const p = HERO_ART.palette[ch];
    if (p && p[1] === "eye") pts.push([x, y]);
  }));
  pts.sort((a, b) => a[0] - b[0]);
  const boxes = [];
  for (const [x, y] of pts) {
    const last = boxes[boxes.length - 1];
    if (last && x <= last.x2 + 2) Object.assign(last, { x2: Math.max(last.x2, x), y1: Math.min(last.y1, y), y2: Math.max(last.y2, y) });
    else boxes.push({ x1: x, x2: x, y1: y, y2: y });
  }
  return boxes;
}

// ver.세밀 하의 모양: 바지 그림을 반바지(무릎 아래 맨다리)나 치마(허리에서 퍼짐)로 바꿈
function drawBottomArt(look, rows, w, h, px, colors) {
  const type = findBy(BOTTOMS, look.bottom).type;
  if (type !== "shorts" && type !== "skirt") return;
  const partAt = (x, y) => { const p = HERO_ART.palette[(rows[y] || "")[x]]; return p ? p[1] : null; };
  let y1 = h, y2 = -1;
  const span = {};
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (partAt(x, y) !== "bottom") continue;
      y1 = Math.min(y1, y); y2 = Math.max(y2, y);
      const sp = span[y] || (span[y] = [x, x]);
      sp[0] = Math.min(sp[0], x); sp[1] = Math.max(sp[1], x);
    }
  }
  if (y2 < 0) return;
  const skin = colors.S, skinShade = mixColor(colors.S, "#000000", 0.12);
  const cut = y1 + Math.max(2, Math.round((y2 - y1 + 1) * (type === "shorts" ? 0.45 : 0.6)));
  // 바지 아랫부분 → 맨다리
  for (let y = cut; y <= y2; y++) {
    for (let x = 0; x < w; x++) {
      if (partAt(x, y) !== "bottom") continue;
      const edge = partAt(x + 1, y) !== "bottom";
      px(x, y, edge ? skinShade : skin);
    }
  }
  if (type === "shorts") {
    const sp = span[cut - 1];
    if (sp) for (let x = sp[0]; x <= sp[1]; x++) if (partAt(x, cut - 1) === "bottom") px(x, cut - 1, mixColor(colors.P, "#000000", 0.18)); // 밑단
    return;
  }
  // 치마: 허리에서 아래로 갈수록 한 칸씩 넓어짐, 다리 사이도 채움
  const top = span[y1];
  const hem = mixColor(colors.P, "#000000", 0.2), light = mixColor(colors.P, "#ffffff", 0.18);
  const filled = new Set();
  for (let y = y1; y < cut + 1; y++) {
    const grow = Math.floor((y - y1) / 2);
    const x1 = top[0] - grow, x2 = top[1] + grow;
    for (let x = x1; x <= x2; x++) {
      px(x, y, y === cut ? hem : x === x1 ? light : x === x2 ? hem : colors.P);
      filled.add(y * w + x);
    }
  }
  // 새로 넓어진 치마 바깥에 외곽선
  for (const k of filled) {
    const x = k % w, y = Math.floor(k / w);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1]]) {
      const nx = x + dx, ny = y + dy;
      if (!filled.has(ny * w + nx) && !partAt(nx, ny)) px(nx, ny, OUTLINE);
    }
  }
}

// ver.세밀 얼굴: 눈 모양(큰 눈·실눈), 입 모양, 성별(여자는 속눈썹과 볼터치)
// 그림마다 눈 위치를 찾아 그 자리를 기준으로 그립니다. (뒷모습·잠자기는 건너뜀)
const FACE = { eye: "#2a2530", mouth: "#b85a5a", open: "#7a2e35", teeth: "#ffffff", blush: "#f4a3a3" };
function drawFaceArt(look, rows, frame, set, px, colors) {
  if (frame === "back" || frame === "sleep") return;
  const closed = frame === "blink";
  const boxes = heroArtEyes(closed ? set.idle : rows);
  if (!boxes.length) return;
  const side = SIDE_FRAMES.includes(frame);
  const skin = colors.S;
  // 눈 모양 (안경·선글라스는 따로 그림)
  if (!closed) {
    for (const b of boxes) {
      if (look.eyes === "big") {
        for (let x = b.x1; x <= b.x2; x++) px(x, b.y1 - 1, FACE.eye);
        px(b.x2, b.y1 + 1, "#ffffff");
      } else if (look.eyes === "calm") {
        const mid = Math.floor((b.y1 + b.y2) / 2);
        for (let y = b.y1; y <= b.y2; y++) for (let x = b.x1; x <= b.x2; x++) px(x, y, skin);
        for (let x = b.x1; x <= b.x2; x++) px(x, mid + (x === b.x1 || x === b.x2 ? 0 : 1), FACE.eye);
      }
    }
  }
  const bottom = Math.max(...boxes.map((b) => b.y2));
  // 여자: 눈꼬리 속눈썹, 볼터치
  if (look.gender === "female") {
    if (!closed && look.eyes !== "calm" && look.gender !== "female") { // 여자 그림은 원래 속눈썹이 있음
      const outer = boxes.length > 1 ? [[boxes[0], -1], [boxes[boxes.length - 1], 1]] : [[boxes[0], 1]];
      for (const [b, d] of outer) px(d < 0 ? b.x1 - 1 : b.x2 + 1, b.y1 - (look.eyes === "big" ? 1 : 0), FACE.eye);
    }
    // 볼터치는 눈 바깥쪽 아래
    const outerX = boxes.length > 1 ? [boxes[0].x1 - 1, boxes[boxes.length - 1].x2] : [boxes[0].x2];
    for (const x of outerX) { px(x, bottom + 1, FACE.blush); px(x + 1, bottom + 1, FACE.blush); }
  }
  // 입: 두 눈 사이 아래 (옆모습은 눈 바로 아래 조금 앞)
  const mx = boxes.length > 1 ? Math.round((boxes[0].x2 + boxes[boxes.length - 1].x1) / 2) : boxes[0].x1;
  const my = bottom + 2;
  const mouth = look.mouth || "smile";
  if (mouth === "smile") {
    px(mx - 1, my - 1, FACE.mouth); px(mx, my, FACE.mouth); px(mx + 1, my - 1, FACE.mouth);
  } else if (mouth === "grin") {
    for (let x = mx - 1; x <= mx + 1; x++) px(x, my - 1, FACE.mouth);
    px(mx, my, FACE.open); px(mx - 1, my, FACE.mouth); px(mx + 1, my, FACE.mouth);
  } else if (mouth === "neutral") {
    px(mx - 1, my - 1, FACE.mouth); px(mx, my - 1, FACE.mouth);
  } else if (mouth === "wow") {
    px(mx, my - 1, FACE.open); px(mx, my, FACE.open); px(mx - 1, my - 1, FACE.open); px(mx - 1, my, FACE.open);
  }
}

// ver.세밀 장신구: 그림마다 머리카락 범위를 찾아 그 위에 그립니다. (옆모습은 오른쪽을 봄)
const SIDE_FRAMES = ["walk1", "walk2", "walk3", "walk4", "walk5", "walk6", "walk7", "walk8", "sitChair", "type", "water", "switch"];
function drawAccessoryArt(look, rows, frame, w, h, px) {
  const acc = ACCESSORIES.find((a) => a.id === look.acc);
  if (!acc) return;
  // 머리카락 범위 (윗부분)
  let x1 = w, x2 = -1, y1 = h;
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    const p = HERO_ART.palette[ch];
    if (p && p[1] === "hair" && y < h * 0.45) { x1 = Math.min(x1, x); x2 = Math.max(x2, x); y1 = Math.min(y1, y); }
  }));
  if (x2 < 0) return;
  if (frame === "sleep") y1 = Math.max(y1, 0);
  const side = SIDE_FRAMES.includes(frame);
  const cx = (x1 + x2 + 1) / 2, half = (x2 - x1 + 1) / 2;
  const isHair = (x, y) => { const p = HERO_ART.palette[(rows[y] || "")[x]]; return p && (p[1] === "hair" || p[1] === "keep"); };
  const over = new Map(); // 새로 칠할 칸 (외곽선을 두르기 위해 모아 둠)
  const set = (x, y, c) => { if (x >= 0 && y >= 0 && x < w && y < h) over.set(y * w + x, c); };
  const dome = (top, bottom, extra, color, lightRows) => {
    for (let y = top; y <= bottom; y++) {
      for (let x = Math.floor(x1 - extra); x <= Math.ceil(x2 + extra); x++) {
        const dx = (x + 0.5 - cx) / (half + extra), dy = (y + 0.5 - bottom - 0.5) / (bottom - top + 1.5);
        if (dx * dx + dy * dy <= 1) set(x, y, y < top + lightRows && Math.abs(x + 0.5 - cx) < half * 0.6 ? acc.light : color);
      }
    }
  };
  if (acc.id === "cap") {
    dome(y1 - 1, y1 + 5, 0.5, acc.color, 2);
    for (let x = x1; x <= x2; x++) set(x, y1 + 5, acc.dark);
    if (side) for (let x = Math.round(cx); x <= x2 + 4; x++) { set(x, y1 + 6, acc.dark); }
    else for (let x = x1 + 3; x <= x2 - 3; x++) set(x, y1 + 6, acc.dark);
    set(Math.round(cx), y1 - 1, acc.dark);
  } else if (acc.id === "beanie") {
    dome(y1 - 1, y1 + 7, 0.8, acc.color, 2);
    for (let x = Math.floor(x1 - 1); x <= x2 + 1; x++) {
      for (const y of [y1 + 6, y1 + 7]) if (over.has(y * w + x)) set(x, y, x % 2 ? acc.dark : acc.light);
    }
    for (let y = y1 - 4; y <= y1 - 1; y++) for (let x = Math.round(cx) - 2; x <= Math.round(cx) + 1; x++) {
      if (Math.hypot(x + 0.5 - cx, y + 0.5 - (y1 - 2)) <= 2.1) set(x, y, acc.light);
    }
  } else if (acc.id === "strawHat") {
    dome(y1 - 2, y1 + 4, -1, acc.color, 2);
    for (let x = Math.round(cx - half + 1); x <= Math.round(cx + half - 2); x++) set(x, y1 + 3, acc.dark); // 띠
    for (let y = y1 + 4; y <= y1 + 6; y++) {
      for (let x = Math.floor(x1 - 4); x <= Math.ceil(x2 + 4); x++) {
        const dx = (x + 0.5 - cx) / (half + 4.5), dy = (y + 0.5 - (y1 + 5)) / 1.6;
        if (dx * dx + dy * dy <= 1) set(x, y, y === y1 + 4 ? acc.light : acc.color);
      }
    }
  } else if (acc.id === "headband") {
    for (let x = x1; x <= x2; x++) {
      const y = Math.round(y1 + 4 + Math.abs(x + 0.5 - cx) * 0.3);
      for (const yy of [y, y + 1]) if (isHair(x, yy)) set(x, yy, yy === y ? acc.light : acc.color);
    }
  } else if (acc.id === "ribbon") {
    const bx = side ? Math.round(x1 + 4) : Math.round(x2 - 4), by = y1 + 1;
    for (const [dx, dy, c] of [[-3, -1, "c"], [-2, -1, "c"], [-3, 0, "c"], [-2, 0, "l"], [-1, 0, "d"], [-3, 1, "c"], [-2, 1, "c"],
      [1, -1, "c"], [2, -1, "c"], [1, 0, "l"], [2, 0, "c"], [1, 1, "c"], [2, 1, "c"], [0, 0, "d"], [0, 1, "d"], [-1, 2, "d"], [1, 2, "d"]]) {
      set(bx + dx, by + dy, c === "c" ? acc.color : c === "l" ? acc.light : acc.dark);
    }
  } else if (acc.id === "hairpin") {
    const y = y1 + 10, xs = side ? [x2 - 7, x2 - 6, x2 - 5, x2 - 4] : [x1 + 3, x1 + 4, x1 + 5, x1 + 6];
    xs.forEach((x, i) => set(x, y - (i > 1 ? 1 : 0), i === 0 ? acc.light : acc.color));
  }
  // 외곽선: 새로 칠한 칸 바로 바깥의 빈칸
  const empty = (x, y) => x < 0 || y < 0 || x >= w || y >= h || !HERO_ART.palette[(rows[y] || "")[x]];
  for (const k of over.keys()) {
    const x = k % w, y = Math.floor(k / w);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (ny >= 0 && ny < h && nx >= 0 && nx < w && !over.has(ny * w + nx) && empty(nx, ny)) px(nx, ny, OUTLINE);
    }
  }
  for (const [k, c] of over) px(k % w, Math.floor(k / w), c);
}

const heroArtCache = new Map();

// 줄인 표기 풀기: "12." = "." 12개
function unRle(row) {
  let out = "";
  for (let i = 0; i < row.length;) {
    let n = "";
    while (row[i] >= "0" && row[i] <= "9") n += row[i++];
    out += row[i++].repeat(n ? Number(n) : 1);
  }
  return out;
}

// 성별·머리 모양별 그림 묶음 (처음 쓸 때 한 번만 풀어 둠). "=이름"은 같은 그림을 가리킴
const heroArtSets = new Map();
function heroArtSet(gender, hair) {
  const key = gender + "|" + hair;
  if (heroArtSets.has(key)) return heroArtSets.get(key);
  const styles = HERO_ART.genders[gender].styles;
  const raw = styles[hair] || styles.short;
  const set = {};
  for (const [f, v] of Object.entries(raw)) if (typeof v !== "string") set[f] = v.map(unRle);
  for (const [f, v] of Object.entries(raw)) if (typeof v === "string") set[f] = set[v.slice(1)];
  heroArtSets.set(key, set);
  return set;
}
function heroArtCanvas(name, lookIn, flip) {
  const look = normLook(lookIn);
  const gender = look.gender === "female" ? "female" : "male";
  const hair = look.hair;
  const set = heroArtSet(gender, hair);
  const frame = set[name] ? name : "idle";
  const colors = heroColors(look);
  const key = [gender, hair, frame, colors.H, colors.S, colors.C, colors.P, look.eyes, look.mouth, look.bottom, look.acc, flip].join("|");
  if (heroArtCache.has(key)) return heroArtCache.get(key);
  if (heroArtCache.size > 200) heroArtCache.clear();
  const rows = set[frame];
  const w = Math.max(...rows.map((r) => r.length)), h = rows.length;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");
  const target = { hair: colors.H, skin: colors.S, top: colors.C, bottom: colors.P };
  const px = (x, y, color) => {
    g.fillStyle = color;
    g.fillRect(flip ? w - 1 - x : x, y, 1, 1);
  };
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    const p = HERO_ART.palette[ch];
    if (!p) return;
    const [orig, part] = p;
    px(x, y, target[part] ? recolor(orig, HERO_ART.genders[gender].base[part] || orig, target[part]) : orig);
  }));
  if (gender === "male") drawBottomArt(look, rows, w, h, px, colors); // 여자 그림은 원래 치마
  drawFaceArt(look, rows, frame, set, px, colors);
  drawAccessoryArt(look, rows, frame, w, h, px);
  // 안경·선글라스: 눈 자리에 테와 렌즈 (눈 감은 그림은 뜬 그림의 눈 자리를 씀)
  const kind = EYEWEAR[look.eyes];
  if (kind) {
    const eyeRows = frame === "blink" || frame === "sleep" ? set.idle : rows; // 잠자기는 눈 감은 그림의 윗부분
    const boxes = heroArtEyes(eyeRows);
    for (const b of boxes) {
      for (let y = b.y1 - 1; y <= b.y2 + 1; y++) {
        for (let x = b.x1 - 1; x <= b.x2 + 1; x++) {
          const edge = y === b.y1 - 1 || y === b.y2 + 1 || x === b.x1 - 1 || x === b.x2 + 1;
          px(x, y, edge ? kind.frame : kind.lens);
        }
      }
      px(b.x1, b.y1, kind.glint);
    }
    for (let i = 0; i + 1 < boxes.length; i++) {
      for (let x = boxes[i].x2 + 2; x < boxes[i + 1].x1 - 1; x++) px(x, boxes[i].y1, kind.frame); // 코다리
    }
  }
  heroArtCache.set(key, c);
  return c;
}

// 동작 이름(idle, blink, walk1, walk2, sleep)에 맞는 그림을 그립니다.
// centerX: 가운데 위치, bottomY: 발(맨 아래) 위치
function drawHeroFrame(name, centerX, bottomY, flip, look) {
  if (useHeroArt()) {
    const c = heroArtCanvas(name, look || save.look, flip);
    ctx.drawImage(c, centerX - c.width / 6, bottomY - c.height / 3, c.width / 3, c.height / 3);
    return;
  }
  const img = readyImage(CHARACTER_SHEET && CHARACTER_SHEET.image);
  if (img) {
    const fw = CHARACTER_SHEET.frameWidth, fh = CHARACTER_SHEET.frameHeight;
    const index = CHARACTER_SHEET.frames[name] ?? 0;
    const x = centerX - Math.floor(fw / 2), y = bottomY - fh;
    ctx.save();
    if (flip) {
      ctx.translate(x * 2 + fw, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(img, index * fw, 0, fw, fh, x, y, fw, fh);
    ctx.restore();
    return;
  }
  const rows = heroRows(name, look);
  const left = centerX - Math.floor(rows[0].length / 2), top = bottomY - rows.length;
  drawSprite(rows, left, top, heroColors(look), flip);
  const extra = rows.length - (CHARACTER[name] || CHARACTER.idle).length; // 머리 위로 더 올라간 줄
  drawEyewear(normLook(look || save.look), left, top + extra);
}

// 걷는 그림 순서: ver.세밀은 4장을 이어서, ver.하찮은 두 발 그림 사이에 가만히 그림
function walkFrame(t) {
  if (useHeroArt()) return "walk" + (1 + (Math.floor(t * 12) % 8)); // ver.세밀: 8장을 이어서
  const cycle = ["walk1", "idle", "walk2", "idle"];
  return cycle[Math.floor(t * 8) % cycle.length];
}

function drawHero() {
  if (hero.mode === "sleep") return; // 잘 때는 잠자리 위에 따로 그림

  let frame = "idle";
  if (hero.mode === "walk" || hero.mode === "toBed" || hero.mode === "toWork" || hero.mode === "toUse") {
    frame = walkFrame(hero.walkT);
  } else if (hero.waveT > 0) {
    frame = Math.floor(hero.waveT * 6) % 2 ? "wave1" : "wave2";
  } else if (hero.mode === "work") {
    frame = hero.seat ? "type" : "work"; // 의자가 있으면 의자에 앉아 타자, 없으면 바닥에서 노트북
  } else if (hero.mode === "read" || hero.mode === "snack") {
    frame = hero.mode; // ver.세밀: 앉아서 책·간식 (ver.하찮은 가만히 그림)
  } else if (hero.mode === "sitChair") {
    frame = "sitChair";
  } else if (hero.mode === "look") {
    frame = "back"; // 창밖·망원경·지구본을 바라보는 뒷모습
  } else if (hero.mode === "lamp") {
    frame = "switch"; // 손을 뻗어 스위치 누르기
  } else if (hero.mode === "water") {
    frame = "water"; // 물뿌리개로 물 주기
  } else if (hero.blinkT < 0) {
    frame = "blink";
  } else if (Math.floor(time / 0.9) % 2) {
    frame = "breathe"; // 가만히 있을 때 숨쉬기 (ver.하찮은 가만히 그림)
  }

  const p = heroScreen();
  const jump = hero.jumpT > 0 ? Math.round(Math.sin((1 - hero.jumpT / 0.35) * Math.PI) * 4) : 0;
  ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
  ctx.fillRect(p.x - 4, p.y - 1, 8, 2); // 그림자
  drawHeroFrame(frame, p.x, p.y - jump, hero.dir < 0);
  if (!useHeroArt() && (hero.mode === "read" || hero.mode === "snack")) drawActivityIcon(p);
}

// ver.하찮: 책 읽기·간식 먹기 중이면 머리 위에 작은 그림
function drawActivityIcon(p) {
  const y = p.y - heroSize().h - 6;
  if (hero.mode === "read") {
    ctx.fillStyle = colorOf("book2"); ctx.fillRect(p.x - 3, y, 3, 4);
    ctx.fillStyle = colorOf("book1"); ctx.fillRect(p.x, y, 3, 4);
    ctx.fillStyle = "#fbf8f1"; ctx.fillRect(p.x - 2, y + 1, 1, 2); ctx.fillRect(p.x + 1, y + 1, 1, 2);
  } else {
    ctx.fillStyle = "#c98a4b"; ctx.fillRect(p.x - 2, y, 4, 4);
    ctx.fillStyle = "#6e4a2d"; ctx.fillRect(p.x - 1, y + 1, 1, 1); ctx.fillRect(p.x + 1, y + 2, 1, 1);
  }
}

function drawSleeper() {
  if (hero.mode !== "sleep") return;
  const p = project(...pillowPos());
  drawHeroFrame("sleep", Math.round(p.x), Math.round(p.y), false);
}

// ---- 반려동물 ----------------------------------------------------
const pet = { x: 20, y: 50, dir: 1, mode: "idle", timer: 1, target: null, walkT: 0, heartT: 0, jumpT: 0 };
const PET_SPEED = 10;

function petDef() {
  return PETS.find((p) => p.id === save.pet) || null;
}

function petVisible() {
  return !!petDef() && ownsRoom();
}

function placePet() {
  for (let i = 0; i < 200; i++) {
    const x = 6 + Math.random() * (RW() - 12);
    const y = 6 + Math.random() * (RD() - 12);
    if (isFree(x, y) && Math.hypot(x - hero.x, y - hero.y) > 6) { pet.x = x; pet.y = y; break; }
  }
  pet.mode = "idle";
  pet.timer = 1;
}

// 반려동물이 갈 곳: 절반쯤은 캐릭터 근처, 나머지는 아무 데나
function petTarget() {
  for (let i = 0; i < 20; i++) {
    let x, y;
    if (Math.random() < 0.5) {
      const a = Math.random() * Math.PI * 2;
      x = hero.x + Math.cos(a) * 6;
      y = hero.y + Math.sin(a) * 6;
    } else {
      x = 4 + Math.random() * (RW() - 8);
      y = 4 + Math.random() * (RD() - 8);
    }
    if (pathIsFree(pet.x, pet.y, x, y)) return { x, y };
  }
  return null;
}

function updatePet(dt, h) {
  if (!petVisible()) return;
  pet.heartT = Math.max(0, pet.heartT - dt);
  pet.jumpT = Math.max(0, pet.jumpT - dt);
  if (pet.mode === "idle") {
    pet.timer -= dt;
    if (pet.timer <= 0) {
      if (isSleepTime(h) || Math.random() < 0.2) {
        pet.mode = "sleep"; // 낮잠 (밤에는 계속 잠)
        pet.timer = 8 + Math.random() * 12;
      } else {
        const t = petTarget();
        if (t) { pet.target = t; pet.mode = "walk"; } else pet.timer = 2;
      }
    }
  } else if (pet.mode === "sleep") {
    pet.timer -= dt;
    if (pet.timer <= 0) {
      if (isSleepTime(h)) pet.timer = 10;
      else { pet.mode = "idle"; pet.timer = 1; }
    }
  } else if (pet.mode === "walk") {
    const dx = pet.target.x - pet.x, dy = pet.target.y - pet.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.3) {
      pet.mode = "idle";
      pet.timer = 1.5 + Math.random() * 3;
    } else {
      const step = Math.min(dist, PET_SPEED * dt);
      pet.x += (dx / dist) * step;
      pet.y += (dy / dist) * step;
      if (Math.abs(dx - dy) > 0.01) pet.dir = Math.sign(dx - dy);
      pet.walkT += dt;
    }
  }
}

function petScreen() {
  const p = project(pet.x, pet.y, 0);
  return { x: Math.round(p.x), y: Math.round(p.y) };
}

function petRows() {
  const frames = PET_FRAMES[petDef().kind];
  if (pet.mode === "sleep") return frames.sleep;
  if (pet.mode === "walk") return [frames.walk1, frames.idle, frames.walk2, frames.idle][Math.floor(pet.walkT * 10) % 4];
  return frames.idle;
}

// ---- ver.세밀 반려동물 (pet-art.js의 그림, 털 색은 반려동물마다 바꿔 칠함) ----
const petArtCache = new Map();
function petArtCanvas(pd, frame, flip) {
  const key = pd.id + "|" + frame + "|" + flip;
  if (petArtCache.has(key)) return petArtCache.get(key);
  const rows = PET_ART.frames[pd.kind][frame].map(unRle);
  const w = rows[0].length, h = rows.length;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    const p = PET_ART.palette[ch];
    if (!p) return;
    g.fillStyle = p[1] === "fur" ? recolor(p[0], PET_ART.base[pd.kind], pd.colors.K) : p[0];
    g.fillRect(flip ? w - 1 - x : x, y, 1, 1);
  }));
  petArtCache.set(key, c);
  return c;
}

function petArtFrame() {
  if (pet.mode === "sleep") return "sleep";
  if (pet.mode === "walk") return Math.floor(pet.walkT * 6) % 2 ? "walk1" : "walk2";
  return "sit";
}

const usePetArt = () => artStyle === "detail" && typeof PET_ART !== "undefined";

function drawPet() {
  const p = petScreen();
  if (usePetArt()) {
    const c = petArtCanvas(petDef(), petArtFrame(), pet.dir < 0);
    const jump = pet.jumpT > 0 ? Math.round(Math.sin((1 - pet.jumpT / 0.3) * Math.PI) * 3) : 0;
    ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
    ctx.fillRect(p.x - 4, p.y - 1, 8, 1);
    ctx.drawImage(c, p.x - c.width / 6, p.y - c.height / 3 - jump, c.width / 3, c.height / 3);
    return;
  }
  const rows = petRows();
  const jump = pet.jumpT > 0 ? Math.round(Math.sin((1 - pet.jumpT / 0.3) * Math.PI) * 3) : 0;
  ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
  ctx.fillRect(p.x - 4, p.y - 1, 8, 1);
  drawSprite(rows, p.x - 4, p.y - rows.length - jump, petDef().colors, pet.dir < 0);
}

// ---- 놀러 간 내 캐릭터 (친구 방 구경 중) ---------------------------
const guest = { x: 30, y: 40, dir: 1, mode: "idle", timer: 1, target: null, walkT: 0, blinkT: 2, heartT: 0, jumpT: 0 };

function guestVisible() {
  return !!visiting && !!ownSave;
}

function placeGuest() {
  for (let i = 0; i < 200; i++) {
    const x = 6 + Math.random() * (RW() - 12);
    const y = 6 + Math.random() * (RD() - 12);
    if (isFree(x, y) && Math.hypot(x - hero.x, y - hero.y) > 8) { guest.x = x; guest.y = y; break; }
  }
  Object.assign(guest, { mode: "idle", timer: 1, heartT: 0, jumpT: 0 });
}

// 갈 곳: 절반쯤은 친구 캐릭터 옆, 나머지는 아무 데나
function guestTarget() {
  for (let i = 0; i < 20; i++) {
    let x, y;
    if (Math.random() < 0.5 && hero.mode !== "sleep") {
      const a = Math.random() * Math.PI * 2;
      x = hero.x + Math.cos(a) * 7;
      y = hero.y + Math.sin(a) * 7;
    } else {
      x = 4 + Math.random() * (RW() - 8);
      y = 4 + Math.random() * (RD() - 8);
    }
    if (pathIsFree(guest.x, guest.y, x, y)) return { x, y };
  }
  return null;
}

function updateGuest(dt) {
  if (!guestVisible()) return;
  guest.heartT = Math.max(0, guest.heartT - dt);
  guest.jumpT = Math.max(0, guest.jumpT - dt);
  guest.blinkT -= dt;
  if (guest.blinkT < -0.15) guest.blinkT = 2 + Math.random() * 3;
  if (guest.mode === "idle") {
    guest.timer -= dt;
    if (guest.timer <= 0) {
      const t = Math.random() < 0.75 ? guestTarget() : null;
      if (t) {
        guest.target = t;
        guest.mode = "walk";
        if (Net.onGuestMove) Net.onGuestMove(moveState(guest));
      } else {
        guest.timer = 2 + Math.random() * 2;
      }
    }
  } else if (guest.mode === "walk") {
    const dx = guest.target.x - guest.x, dy = guest.target.y - guest.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.3) {
      guest.mode = "idle";
      guest.target = null;
      guest.timer = 2 + Math.random() * 4;
    } else {
      const step = Math.min(dist, WALK_SPEED * dt);
      guest.x += (dx / dist) * step;
      guest.y += (dy / dist) * step;
      if (Math.abs(dx - dy) > 0.01) guest.dir = Math.sign(dx - dy);
      guest.walkT += dt;
    }
  }
}

function guestScreen() {
  const p = project(guest.x, guest.y, 0);
  return { x: Math.round(p.x), y: Math.round(p.y) };
}

function drawGuest() {
  drawPerson(guest, ownSave.look);
}

// ---- 같은 방에 있는 다른 사람들 (실시간 접속) -----------------------
// 내 방에 놀러 온 친구, 또는 함께 같은 친구 방에 놀러 온 다른 친구
const walkers = new Map(); // id → 캐릭터

function myUserId() {
  return typeof Friends !== "undefined" ? Friends.myId() : null;
}

// 지금 보고 있는 방의 주인
function hereOwner() {
  return visiting ? visiting.id : myUserId();
}

function walkerVisible(w) {
  return w.place === hereOwner() && (visiting || w.roomId === room.id);
}

function placeWalker(w) {
  for (let i = 0; i < 200; i++) {
    const x = 6 + Math.random() * (RW() - 12);
    const y = 6 + Math.random() * (RD() - 12);
    if (isFree(x, y)) { w.x = x; w.y = y; break; }
  }
  w.mode = "idle";
  w.target = null;
}

// place(방 주인)에 있는 사람 목록을 맞춤 (새로 온 사람은 추가, 나간 사람은 지움)
function setWalkers(place, list) {
  const ids = new Set(list.map((p) => p.id));
  for (const [id, w] of walkers) if (w.place === place && !ids.has(id)) walkers.delete(id);
  for (const p of list) {
    let w = walkers.get(p.id);
    if (!w) {
      w = { id: p.id, x: 30, y: 40, dir: 1, mode: "idle", target: null, walkT: 0, blinkT: 2, heartT: 0, jumpT: 0 };
      walkers.set(p.id, w);
      placeWalker(w);
    }
    Object.assign(w, { name: p.name, look: normLook(p.look || {}), place, roomId: p.roomId });
  }
}

function clearWalkers(place) {
  for (const [id, w] of walkers) if (w.place === place) walkers.delete(id);
}

function moveWalker(id, m) {
  const w = walkers.get(id);
  if (w) applyMove(w, m);
}

function updateWalkers(dt) {
  for (const w of walkers.values()) {
    w.heartT = Math.max(0, w.heartT - dt);
    w.jumpT = Math.max(0, w.jumpT - dt);
    w.blinkT -= dt;
    if (w.blinkT < -0.15) w.blinkT = 2 + Math.random() * 3;
    walkOnly(w, dt);
  }
}

// 사람 캐릭터 그리기 (놀러 간 나, 다른 방문자)
function drawPerson(c, look) {
  let frame = "idle";
  if (c.mode === "walk") frame = walkFrame(c.walkT);
  else if (c.blinkT < 0) frame = "blink";
  const p = project(c.x, c.y, 0);
  const x = Math.round(p.x), y = Math.round(p.y);
  const jump = c.jumpT > 0 ? Math.round(Math.sin((1 - c.jumpT / 0.35) * Math.PI) * 4) : 0;
  ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
  ctx.fillRect(x - 4, y - 1, 8, 2);
  drawHeroFrame(frame, x, y - jump, c.dir < 0, look);
}

function personBounds(c, look) {
  const p = project(c.x, c.y, 0);
  const h = heroRows("idle", look).length;
  return { x: Math.round(p.x) - 5, y: Math.round(p.y) - h - 1, w: 10, h: h + 1 };
}

function guestBounds() {
  const p = guestScreen();
  const h = heroRows("idle", ownSave.look).length;
  return { x: p.x - 5, y: p.y - h - 1, w: 10, h: h + 1 };
}

function petBounds() {
  const p = petScreen();
  return { x: p.x - 5, y: p.y - 8, w: 10, h: 9 };
}

// 가구와 캐릭터를 뒤에서 앞 순서로 그립니다.
let drawOrder = []; // 그려진 순서 (클릭한 가구를 찾을 때 사용)
function drawObjects() {
  drawOrder = [];
  // 옮기는 중인 가구(와 그 위의 물건)는 맨 마지막에 그려서 가려지지 않게 합니다.
  const lifted = drag && !drag.wall ? [drag.item, ...drag.carried.map((c) => c.o)] : [];
  const list = objects.filter((item) => !lifted.includes(item)).map((item) => ({ fp: footprint(item), draw: () => {
    drawItem(item);
    drawOrder.push(item);
    if (item.sleep) drawSleeper();
    if (hero.seat === item && ownsRoom()) drawHero(); // 방석 위에 앉은 캐릭터
  } }));
  if (hero.mode !== "sleep" && !(hero.seat && items.includes(hero.seat)) && ownsRoom()) {
    list.push({ fp: { x: hero.x - 1.5, y: hero.y - 1.5, w: 3, d: 3 }, draw: drawHero });
  }
  if (guestVisible()) {
    list.push({ fp: { x: guest.x - 1.5, y: guest.y - 1.5, w: 3, d: 3 }, draw: drawGuest });
  }
  for (const w of walkers.values()) {
    if (walkerVisible(w)) list.push({ fp: { x: w.x - 1.5, y: w.y - 1.5, w: 3, d: 3 }, draw: () => drawPerson(w, w.look) });
  }
  if (petVisible()) {
    list.push({ fp: { x: pet.x - 1, y: pet.y - 1, w: 2, d: 2 }, draw: drawPet });
  }

  const behind = (a, b) => a.x + a.w <= b.x || a.y + a.d <= b.y;
  const rest = list.slice();
  while (rest.length) {
    let idx = rest.findIndex((it) => !rest.some((o) => o !== it && behind(o.fp, it.fp) && !behind(it.fp, o.fp)));
    if (idx < 0) idx = 0;
    rest.splice(idx, 1)[0].draw();
  }

  if (drag && !drag.wall) drawEditMarker("drag");
  for (const item of lifted) {
    drawItem(item);
    drawOrder.push(item);
    if (item.sleep) drawSleeper();
    if (!drag.valid) tintItem(item, "rgba(230, 70, 70, 0.45)");
  }
}

// 가구 모양 그대로 색을 덧입힙니다. (놓을 수 없을 때 빨갛게)
const tintCanvas = document.createElement("canvas");
function tintItem(item, color) {
  const img = itemImage(item);
  if (img) {
    const r = imageRect(item, img);
    tintCanvas.width = img.width;
    tintCanvas.height = img.height;
    const t = tintCanvas.getContext("2d");
    t.drawImage(img, 0, 0);
    t.globalCompositeOperation = "source-atop";
    t.fillStyle = color;
    t.fillRect(0, 0, img.width, img.height);
    drawMirrored(item, tintCanvas, r);
    return;
  }
  for (const [dx, dy, dz, w, d, h] of partsOf(item)) {
    const x = item.x + dx, y = item.y + dy, z = item.z + dz;
    const outline = [
      [x, y, z + h], [x + w, y, z + h], [x + w, y, z],
      [x + w, y + d, z], [x, y + d, z], [x, y + d, z + h],
    ];
    fillPoly(ctx, outline.map((q) => project(...q)), color);
  }
}

// 하트, Zzz 같은 효과 (조명 위에 그려서 잘 보이게)
function drawEffects() {
  // 화분에 물 주기: 잎 위로 물방울이 떨어짐
  if (hero.mode === "water" && hero.use && items.includes(hero.use.item)) {
    const f = footprint(hero.use.item);
    const top = project(f.x + f.w / 2, f.y + f.d / 2, hero.use.item.z + itemHeight(hero.use.item));
    ctx.fillStyle = "#8fc8f0";
    for (let i = 0; i < 3; i++) {
      const t = (time * 1.6 + i / 3) % 1;
      ctx.fillRect(Math.round(top.x - 2 + i * 2), Math.round(top.y - 6 + t * 7), 1 / 3 * 2, 1);
    }
  }
  if (hero.mode === "sleep") {
    const base = project(...pillowPos());
    for (let i = 0; i < 2; i++) {
      const p = (time * 0.4 + i * 0.5) % 1;
      ctx.globalAlpha = 1 - p;
      drawSprite(EFFECTS.zzz, Math.round(base.x + 5 + p * 6), Math.round(base.y - 12 - p * 12), { Z: "zzz" }, false, true);
    }
    ctx.globalAlpha = 1;
  }
  if (hero.mode === "work") {
    // 일하는 중: 머리 위에 점 세 개가 차례로 깜빡임
    const p = heroScreen();
    const n = Math.floor(time * 2) % 4;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = colorOf("eye");
      ctx.fillRect(p.x - 3 + i * 3, p.y - heroSize().h - 4, 1, 1);
    }
  }
  for (const w of walkers.values()) {
    if (!walkerVisible(w) || w.heartT <= 0) continue;
    const b = personBounds(w, w.look);
    ctx.globalAlpha = Math.min(1, w.heartT * 2);
    drawSprite(EFFECTS.heart, b.x + 3, Math.round(b.y - 6 - (1.2 - w.heartT) * 6), { H: "heart" }, false, true);
    ctx.globalAlpha = 1;
  }
  if (guestVisible()) {
    // 내 캐릭터 머리 위에 작은 표시 (친구 방에서 나를 찾기 쉽게)
    const p = guestScreen();
    const top = p.y - heroRows("idle", ownSave.look).length - 4;
    ctx.fillStyle = "#e8b84a";
    ctx.fillRect(p.x - 1, top, 3, 1);
    ctx.fillRect(p.x, top + 1, 1, 1);
    if (guest.heartT > 0) {
      ctx.globalAlpha = Math.min(1, guest.heartT * 2);
      drawSprite(EFFECTS.heart, p.x - 2, Math.round(top - 7 - (1.2 - guest.heartT) * 6), { H: "heart" }, false, true);
      ctx.globalAlpha = 1;
    }
  }
  if (petVisible() && pet.heartT > 0) {
    const p = petScreen();
    ctx.globalAlpha = Math.min(1, pet.heartT * 2);
    drawSprite(EFFECTS.heart, p.x - 2, Math.round(p.y - 14 - (1.2 - pet.heartT) * 6), { H: "heart" }, false, true);
    ctx.globalAlpha = 1;
  }
  if (hero.heartT > 0) {
    const p = heroScreen();
    const rise = (1.2 - hero.heartT) * 6;
    ctx.globalAlpha = Math.min(1, hero.heartT * 2);
    drawSprite(EFFECTS.heart, p.x - 2, Math.round(p.y - heroSize().h - 8 - rise), { H: "heart" }, false, true);
    ctx.globalAlpha = 1;
  }
}

// ---- 클릭 --------------------------------------------------------
function toGamePos(e) {
  // 작은 창에서는 화면 비율을 유지한 채 가운데 놓이므로 그만큼 보정합니다.
  const r = view.getBoundingClientRect();
  const scale = Math.min(r.width / view.width, r.height / view.height);
  const w = view.width * scale, h = view.height * scale;
  const left = r.left + (r.width - w) / 2, top = r.top + (r.height - h) / 2;
  return {
    x: ((e.clientX - left) / w) * W,
    y: ((e.clientY - top) / h) * H,
  };
}

function inside(p, b) {
  return p.x >= b.x && p.x < b.x + b.w && p.y >= b.y && p.y < b.y + b.h;
}

function heroBounds() {
  const p = heroScreen();
  const s = heroSize();
  return { x: p.x - s.w / 2, y: p.y - s.h - 1, w: s.w, h: s.h + 1 };
}

// 클릭한 곳의 커튼 창문
function curtainAt(p) {
  return wallItems.find((f) => f.decor === "window" && f.style === "curtain" && hitItem(f, p)) || null;
}

function lampItem(p) {
  return items.find((f) => f.light && inside(p, screenBounds(f)));
}

view.addEventListener("click", (e) => {
  if (editing) return;
  const p = toGamePos(e);
  for (const w of walkers.values()) {
    if (walkerVisible(w) && inside(p, personBounds(w, w.look))) {
      w.heartT = 1.2;
      w.jumpT = 0.35;
      return;
    }
  }
  if (guestVisible() && inside(p, guestBounds())) {
    guest.heartT = 1.2;
    guest.jumpT = 0.35;
    return;
  }
  if (petVisible() && inside(p, petBounds())) {
    pet.heartT = 1.2;
    pet.jumpT = 0.3;
    if (pet.mode === "sleep") { pet.mode = "idle"; pet.timer = 2; } // 쓰다듬으면 깸
    return;
  }
  if (hero.mode !== "sleep" && inside(p, heroBounds())) {
    hero.heartT = 1.2;
    hero.jumpT = 0.35;
    hero.waveT = 1.4; // 손 흔들기
    if (USE_MODES.includes(hero.mode) || hero.mode === "toUse") endUse();
    return;
  }
  const curtain = curtainAt(p);
  if (curtain && !visiting) {
    curtain.closed = !curtain.closed;
    saveLayout();
    return;
  }
  const lit = lampItem(p);
  if (lit && !visiting) toggleLight(lit); // 누른 조명만 켜고 끔
});

view.addEventListener("pointermove", (e) => {
  const p = toGamePos(e);
  if (editing) {
    if (drag) {
      moveDrag(p);
      editBar.classList.toggle("drop", isOverBag(e));
    } else {
      hoverItem = itemAt(p);
    }
    view.style.cursor = drag ? "grabbing" : hoverItem ? "grab" : "default";
    return;
  }
  const hit = (hero.mode !== "sleep" && inside(p, heroBounds())) || (petVisible() && inside(p, petBounds()))
    || (guestVisible() && inside(p, guestBounds())) || (!visiting && (lampItem(p) || curtainAt(p)));
  view.style.cursor = hit ? "pointer" : "default";
});

view.addEventListener("pointerdown", (e) => {
  if (!editing) return;
  const p = toGamePos(e);
  const item = itemAt(p);
  if (!item) return;
  select(item);
  startDrag(item, p);
  view.setPointerCapture(e.pointerId);
  e.preventDefault();
});

view.addEventListener("pointerup", (e) => { if (drag) endDrag(e); });
view.addEventListener("pointercancel", () => { if (drag) endDrag(null); });
view.addEventListener("pointerleave", () => { if (!drag) hoverItem = null; });

// ---- 꾸미기 (가구 옮기기) ------------------------------------------
const GRID = 2;          // 가구가 움직이는 칸 크기
let editing = false;     // 꾸미기 중인지
let drag = null;         // 옮기는 중인 가구 정보
let hoverItem = null;    // 마우스가 올라가 있는 가구
const editBtn = document.getElementById("edit-btn");
const editBar = document.getElementById("edit-bar");
const bagEl = document.getElementById("inventory");

function setEditing(on) {
  editing = on;
  drag = null;
  hoverItem = null;
  editBtn.textContent = on ? "완료" : "꾸미기";
  editBtn.classList.toggle("active", on);
  editBar.hidden = !on;
  if (typeof select === "function") select(null);
  editBar.classList.remove("drop");
  view.style.cursor = "default";
  if (on) {
    closeShop();
    if (typeof Focus !== "undefined") Focus.close();
    if (typeof Friends !== "undefined") Friends.close();
    renderBag();
  }
}

editBtn.addEventListener("click", () => setEditing(!editing));

const snap = (v) => Math.round(v / GRID) * GRID;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// 화면 좌표 → 바닥 좌표 (높이 z 기준)
function unproject(sx, sy, z) {
  const a = (sx - viewOX) / WS, b = 2 * ((sy - viewOY) / WS + z);
  return { x: (a + b) / 2, y: (b - a) / 2 };
}

// 화면 좌표 → 벽 위 좌표 (오른쪽 벽: x·z, 왼쪽 벽: y·z)
function unprojectWall(sx, sy, wall) {
  if (wall === "right") {
    const x = (sx - viewOX) / WS;
    return { a: x, z: x / 2 - (sy - viewOY) / WS };
  }
  const y = (viewOX - sx) / WS;
  return { a: y, z: y / 2 - (sy - viewOY) / WS };
}

// 벽 가구가 걸린 벽 (flip이면 왼쪽 벽)
function wallOf(item) {
  return item.flip ? "left" : "right";
}

// 벽 가구가 벽에서 차지하는 범위 (가로 a1~a2, 높이 z1~z2, 가구 기준)
function wallExtent(item) {
  const wall = wallOf(item);
  let a1 = Infinity, a2 = -Infinity, z1 = Infinity, z2 = -Infinity;
  for (const [dx, dy, dz, w, d, h] of partsOf(item)) {
    const a = wall === "right" ? dx : dy, len = wall === "right" ? w : d;
    a1 = Math.min(a1, a); a2 = Math.max(a2, a + len);
    z1 = Math.min(z1, dz); z2 = Math.max(z2, dz + h);
  }
  return { a1, a2, z1, z2 };
}

function itemHeight(item) {
  if (item.size && itemImage(item)) return item.size[2] || 10;
  return Math.max(...partsOf(item).map((p) => p[2] + p[5]));
}

function overlaps(a, b) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.d && b.y < a.y + a.d;
}

// o의 가운데가 base 위에 있는지
function centerOn(o, base) {
  const f = footprint(o), b = footprint(base);
  const cx = f.x + f.w / 2, cy = f.y + f.d / 2;
  return cx >= b.x && cx <= b.x + b.w && cy >= b.y && cy <= b.y + b.d;
}

function pointInPoly(p, pts) {
  let hit = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[i], b = pts[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) hit = !hit;
  }
  return hit;
}

// 화면의 한 점이 가구 위에 있는지 (상자 모양 그대로 판정)
function hitItem(item, p) {
  if (itemImage(item)) return inside(p, screenBounds(item));
  return partsOf(item).some(([dx, dy, dz, w, d, h]) => {
    const x = item.x + dx, y = item.y + dy, z = item.z + dz;
    const outline = [
      [x, y, z + h], [x + w, y, z + h], [x + w, y, z],
      [x + w, y + d, z], [x, y + d, z], [x, y + d, z + h],
    ];
    return pointInPoly(p, outline.map((q) => project(...q)));
  });
}

// 앞에 있는 가구부터 찾습니다.
function itemAt(p) {
  const order = [...drawOrder].reverse().concat([...wallItems].reverse(), [...floorItems].reverse());
  return order.find((it) => hitItem(it, p)) || null;
}

// 벽 위에서 가구가 차지하는 사각형 (가로 a, 높이 z)
function wallRect(item) {
  const e = wallExtent(item), a = wallOf(item) === "right" ? item.x : item.y;
  return { a1: a + e.a1, a2: a + e.a2, z1: item.z + e.z1, z2: item.z + e.z2 };
}

// 벽에서 비워 둬야 하는 곳 (창문, 시계, 기차 문)
function wallObstacles(wall) {
  const list = [];
  for (const win of windowsOf()) {
    if (win.wall !== wall) continue;
    if (win.style === "round") list.push({ a1: win.cy - win.r - 3, a2: win.cy + win.r + 3, z1: win.cz - win.r - 3, z2: win.cz + win.r + 3 });
    else if (win.style === "curtain") list.push({ a1: win.y1 - 6, a2: win.y2 + 6, z1: win.z1 - 3, z2: win.z2 + 5 });
    else list.push({ a1: win.y1 - 1, a2: win.y2 + 1, z1: win.z1 - 2, z2: win.z2 + 3 });
  }
  if (room.clock) {
    const [cx, cy, cz] = room.clock;
    const onRight = cy === 0;
    if ((wall === "right") === onRight) {
      const a = onRight ? cx : cy;
      list.push({ a1: a - 7, a2: a + 7, z1: cz - 7, z2: cz + 7 });
    }
  }
  if (room.shape === "train" && wall === "left") list.push({ a1: 7, a2: 21, z1: 0, z2: 29 });
  return list;
}

function rectsOverlap(p, q) {
  return p.a1 < q.a2 && q.a1 < p.a2 && p.z1 < q.z2 && q.z1 < p.z2;
}

// 벽 가구를 지금 위치에 걸 수 있는지
function wallValid(item) {
  const wall = wallOf(item), r = wallRect(item);
  if (wall === "round") return false; // 둥근 벽에는 걸 수 없음
  if (r.a1 < 1 || r.a2 > wallLength(wall) - 1 || r.z1 < 3) return false;
  const top = wall === "right" ? rightWallTop() : Math.min(leftWallTop(r.a1), leftWallTop(r.a2));
  if (r.z2 > top - 1) return false;
  if (wallObstacles(wall).some((o) => rectsOverlap(r, o))) return false;
  return !wallItems.some((o) => o !== item && wallOf(o) === wall && rectsOverlap(r, wallRect(o)));
}

// 바닥 가구를 지금 위치에 놓을 수 있는지 (ignore: 함께 옮기는 물건)
// pad: 다른 가구와 띄울 간격 (자동으로 놓을 때 너무 붙지 않게)
function floorValid(item, ignore = [], pad = 0) {
  const fp = footprint(item);
  const corners = [[fp.x, fp.y], [fp.x + fp.w, fp.y], [fp.x, fp.y + fp.d], [fp.x + fp.w, fp.y + fp.d]];
  if (!corners.every(([x, y]) => insideFloor(x, y))) return false;
  if (item.type === "floor") return true;
  const others = objects.filter((o) => o !== item && o.z === 0 && !ignore.includes(o));
  const area = { x: fp.x - pad, y: fp.y - pad, w: fp.w + pad * 2, d: fp.d + pad * 2 };
  if (others.some((o) => overlaps(area, footprint(o)))) return false;
  // 다락방: 낮은 지붕에 닿으면 안 됨
  if (room.shape === "attic" && itemHeight(item) > Math.min(roofZ(fp.y), roofZ(fp.y + fp.d))) return false;
  return true;
}

function startDrag(item, p) {
  const wall = item.type === "wall" ? wallOf(item) : null;
  const fp = footprint(item);
  // 위에 올려진 물건은 함께 옮깁니다.
  const carried = item.surface
    ? objects.filter((o) => o !== item && Math.abs(o.z - (item.z + item.surface)) < 0.01 && centerOn(o, item))
    : [];
  drag = {
    item,
    wall,
    start: wall ? unprojectWall(p.x, p.y, wall) : unproject(p.x, p.y, item.z),
    orig: { x: item.x, y: item.y, z: item.z },
    rel: { x: fp.x - item.x, y: fp.y - item.y, w: fp.w, d: fp.d },
    carried: carried.map((o) => ({ o, dx: o.x - item.x, dy: o.y - item.y, dz: o.z - item.z, orig: { x: o.x, y: o.y, z: o.z } })),
    valid: true,
  };
}

function moveDrag(p) {
  const { item, orig } = drag;

  // 벽에 거는 가구
  if (drag.wall) {
    const cur = unprojectWall(p.x, p.y, drag.wall);
    const e = wallExtent(item);
    const da = cur.a - drag.start.a;
    const top = drag.wall === "right" ? rightWallTop() : (room.wallHeight || room.peakHeight);
    item.z = clamp(snap(orig.z + cur.z - drag.start.z), 3 - e.z1, top - e.z2 - 1);
    const len = wallLength(drag.wall);
    if (drag.wall === "right") item.x = clamp(snap(orig.x + da), 1 - e.a1, len - e.a2 - 1);
    else item.y = clamp(snap(orig.y + da), 1 - e.a1, len - e.a2 - 1);
    drag.valid = wallValid(item);
    return;
  }

  // 바닥에 놓는 가구
  const cur = unproject(p.x, p.y, orig.z);
  const r = drag.rel;
  item.x = clamp(snap(orig.x + cur.x - drag.start.x), -r.x, RW() - r.x - r.w);
  item.y = clamp(snap(orig.y + cur.y - drag.start.y), -r.y, RD() - r.y - r.d);

  if (item.type === "floor") {
    drag.valid = true;
  } else {
    const carriedSet = drag.carried.map((c) => c.o);
    const support = item.small && objects.find((o) => o !== item && o.surface && !carriedSet.includes(o) && centerOn(item, o));
    if (support) {
      item.z = support.z + support.surface;
      drag.valid = true;
    } else {
      item.z = 0;
      drag.valid = floorValid(item, carriedSet);
    }
  }
  for (const c of drag.carried) {
    c.o.x = item.x + c.dx;
    c.o.y = item.y + c.dy;
    c.o.z = item.z + c.dz;
  }
}

function endDrag(e) {
  editBar.classList.remove("drop");

  // 보관함 위에 놓으면 다시 보관함으로
  if (e && isOverBag(e)) {
    Object.assign(drag.item, drag.orig);
    for (const c of drag.carried) Object.assign(c.o, c.orig);
    const item = drag.item;
    drag = null;
    storeItem(item);
    return;
  }

  if (!drag.valid) {
    Object.assign(drag.item, drag.orig);
    for (const c of drag.carried) Object.assign(c.o, c.orig);
  } else {
    saveLayout();
  }
  drag = null;
  afterLayoutChange();
}

// 가구 위에 올려 둔 물건들
function itemsOn(item) {
  if (!item.surface) return [];
  return objects.filter((o) => o !== item && Math.abs(o.z - (item.z + item.surface)) < 0.01 && centerOn(o, item));
}

// 보관함에 넣기 (위에 올린 물건도 함께)
function storeItem(item) {
  const back = [item, ...itemsOn(item)];
  items = items.filter((it) => !back.includes(it));
  back.forEach((it) => addToBag(it.id));
  if (selected && back.includes(selected)) select(null);
  saveLayout();
  afterLayoutChange();
  renderBag();
  toast(back.length > 1 ? "올려 둔 물건과 함께 보관함에 넣었어요." : "보관함에 넣었어요.");
}

// 방향 돌리기 (누를 때마다 시계 방향으로 90도씩, 네 번이면 처음으로)
// 위에 올린 물건도 함께 돌아갑니다.
function rotateItem(item) {
  if (item.type === "wall") {
    toast("벽에 건 물건은 벽을 따라 옮겨 주세요.");
    return;
  }
  const carried = itemsOn(item);
  const before = [item, ...carried].map((o) => ({ o, x: o.x, y: o.y, rot: o.rot }));
  const f = footprint(item);
  const centers = carried.map((o) => {
    const g = footprint(o);
    return [g.x + g.w / 2, g.y + g.d / 2];
  });
  const restore = () => before.forEach((b) => Object.assign(b.o, { x: b.x, y: b.y, rot: b.rot }));

  item.rot = (rotOf(item) + 1) % 4;
  const g = footprint(item);
  // 가운데를 유지하는 자리부터, 안 되면 모서리를 맞춘 자리로
  const cx = f.x + f.w / 2, cy = f.y + f.d / 2;
  const ox = item.x - g.x, oy = item.y - g.y; // 가구 기준점과 영역 모서리의 차이
  const tries = [
    [Math.round((cx - g.w / 2) / GRID) * GRID + ox, Math.round((cy - g.d / 2) / GRID) * GRID + oy],
    [f.x + ox, f.y + oy],
    [f.x + f.w - g.w + ox, f.y + oy],
    [f.x + ox, f.y + f.d - g.d + oy],
    [f.x + f.w - g.w + ox, f.y + f.d - g.d + oy],
  ];
  const place = ([x, y]) => {
    item.x = x;
    item.y = y;
    const n = footprint(item);
    carried.forEach((o, i) => {
      // 옛 영역 안의 위치를 90도 돌려서 새 영역에 옮김
      const [px, py] = centers[i];
      const nx = n.x + (f.y + f.d - py), ny = n.y + (px - f.x);
      o.rot = (rotOf(o) + 1) % 4;
      const h = footprint(o);
      o.x += nx - (h.x + h.w / 2);
      o.y += ny - (h.y + h.d / 2);
    });
    return item.z > 0 || floorValid(item, carried);
  };
  for (const t of tries) {
    if (place(t)) {
      saveLayout();
      afterLayoutChange();
      return;
    }
    restore();
    item.rot = (rotOf(item) + 1) % 4;
  }
  restore();
  toast("돌릴 공간이 없어요. 주변을 조금 비워 주세요.");
}

// ---- 선택한 가구 (꾸미기 중) ----
let selected = null;
const selBar = document.getElementById("sel-bar");
const editHint = document.querySelector(".edit-hint");

function select(item) {
  selected = item;
  selBar.hidden = !item;
  editHint.hidden = !!item;
  if (item) document.getElementById("sel-name").textContent = item.name;
}

document.getElementById("sel-rotate").addEventListener("click", () => selected && rotateItem(selected));
document.getElementById("sel-store").addEventListener("click", () => selected && storeItem(selected));
document.getElementById("sel-cancel").addEventListener("click", () => select(null));

// R 키로도 방향 돌리기
function onKey(e) {
  if (e.key === "Escape" && !confirmEl.hidden) { closeConfirm(); return; }
  if (!editing || e.target.tagName === "INPUT") return;
  if ((e.key === "r" || e.key === "R") && selected) rotateItem(selected);
}
document.addEventListener("keydown", onKey);

// ver.세밀: 방 전체(벽·바닥과 밖으로 튀어나온 것) 바깥에 굵은 외곽선
const silhouette = document.createElement("canvas");
function drawSceneOutline() {
  silhouette.width = buf.width;
  silhouette.height = buf.height;
  const g = silhouette.getContext("2d");
  g.drawImage(buf, 0, 0);
  g.globalCompositeOperation = "source-in";
  g.fillStyle = OUTLINE;
  g.fillRect(0, 0, silhouette.width, silhouette.height);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "destination-over"; // 이미 그린 것 뒤에만
  for (const [x, y] of [[2, 0], [-2, 0], [0, 2], [0, -2], [1, 1], [-1, 1], [1, -1], [-1, -1]]) ctx.drawImage(silhouette, x, y);
  ctx.restore();
}

// 배치가 바뀐 뒤: 정보 다시 계산하고 캐릭터가 갇히지 않게
function afterLayoutChange() {
  refreshItems();
  if (hero.use || hero.seat) endUse(); // 쓰던 가구가 옮겨졌을 수 있음
  if (hero.mode === "work" || hero.mode === "toWork") hero.mode = "idle"; // 책상이 옮겨졌을 수 있음
  if (hero.mode !== "sleep" && !isFree(hero.x, hero.y)) placeHeroInRoom();
  if (hero.mode === "walk") { hero.mode = "idle"; hero.timer = 1; }
  fixSleep();
}

// 옮기는 가구의 자리 표시 (초록: 놓을 수 있음, 빨강: 놓을 수 없음)
// layer: "under"(가구 밑) / "over"(가구 위) / "drag"(옮기는 중)
function drawEditMarker(layer) {
  if (!editing) return;
  const target = drag ? drag.item : hoverItem || selected;
  if (!target) return;
  if (drag) {
    if (layer !== "drag") return;
  } else {
    const isUpper = target.type !== "wall" && target.z > 0;
    if (layer === "drag" || (layer === "over") !== isUpper) return;
  }

  const color = drag
    ? (drag.valid ? "rgba(110, 200, 120, 0.5)" : "rgba(230, 80, 80, 0.55)")
    : "rgba(255, 255, 255, 0.45)";
  let pts;
  if (target.type === "wall") {
    const e = wallExtent(target), z1 = target.z + e.z1 - 1, z2 = target.z + e.z2 + 1;
    if (wallOf(target) === "right") {
      const a1 = target.x + e.a1 - 1, a2 = target.x + e.a2 + 1;
      pts = [[a1, 0, z1], [a2, 0, z1], [a2, 0, z2], [a1, 0, z2]];
    } else {
      const a1 = target.y + e.a1 - 1, a2 = target.y + e.a2 + 1;
      pts = [[0, a1, z1], [0, a2, z1], [0, a2, z2], [0, a1, z2]];
    }
  } else {
    // 가구보다 한 칸 넓게 표시해서 가장자리가 보이게 합니다.
    const f = footprint(target), z = target.z;
    const x1 = f.x - 1, y1 = f.y - 1, x2 = f.x + f.w + 1, y2 = f.y + f.d + 1;
    pts = [[x1, y1, z], [x2, y1, z], [x2, y2, z], [x1, y2, z]];
  }
  fillPoly(ctx, pts.map((q) => project(...q)), color);
}

// 처음 시작할 방 (주소에 ?room=이 있으면 그 방)
setRoom(params.get("room") || save.roomId);

// ---- 보관함 --------------------------------------------------------
function addToBag(id) {
  save.inventory[id] = (save.inventory[id] || 0) + 1;
  Save.save(save);
}

function isOverBag(e) {
  if (editBar.hidden) return false;
  const r = editBar.getBoundingClientRect();
  return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
}

// 보관함에서 꺼내 빈자리에 놓기
function takeFromBag(id) {
  const item = makeItem({ id, x: 0, y: 0, z: 0 });
  if (!findSpot(item)) {
    toast(item.type === "wall" && room.shape === "round"
      ? "둥근 벽에는 걸 수 없어요. 다른 방에서 써 주세요."
      : "놓을 자리가 없어요. 가구를 옮겨서 자리를 만들어 주세요.");
    return;
  }
  items.push(item);
  save.inventory[id] -= 1;
  if (save.inventory[id] <= 0) delete save.inventory[id];
  saveLayout();
  afterLayoutChange();
  renderBag();
  hoverItem = item; // 새로 놓은 가구를 잠깐 표시
}

// 빈자리 찾기 (바닥은 방 가운데부터, 벽은 높은 곳부터)
function findSpot(item) {
  if (item.type === "wall") {
    if (room.shape === "round") return false;
    const walls = room.shape === "attic" ? ["left"] : ["right", "left"];
    for (const wall of walls) {
      item.flip = wall === "left";
      // 눈높이(24)부터 아래로, 그다음 위로 찾아봅니다.
      const heights = [];
      for (let z = 24; z >= 6; z -= GRID) heights.push(z);
      for (let z = 26; z <= 40; z += GRID) heights.push(z);
      for (const z of heights) {
        for (let a = 2; a < wallLength(wall); a += GRID) {
          item.x = wall === "right" ? a : 0;
          item.y = wall === "right" ? 0 : a;
          item.z = z;
          if (wallValid(item)) return true;
        }
      }
    }
    return false;
  }
  item.z = 0;
  const spots = [];
  for (let x = 0; x <= RW(); x += GRID) for (let y = 0; y <= RD(); y += GRID) spots.push([x, y]);
  const cx = RW() * 0.45, cy = RD() * 0.55;
  spots.sort((p, q) => Math.hypot(p[0] - cx, p[1] - cy) - Math.hypot(q[0] - cx, q[1] - cy));
  for (const pad of [3, 0]) {
    for (const [x, y] of spots) {
      item.x = x;
      item.y = y;
      if (floorValid(item, [], pad)) return true;
    }
  }
  return false;
}

function renderBag() {
  bagEl.innerHTML = "";
  const ids = Object.keys(save.inventory).filter((id) => save.inventory[id] > 0 && FURNITURE[id]);
  if (!ids.length) {
    const p = document.createElement("p");
    p.className = "empty";
    p.textContent = "보관함이 비어 있어요. 상점에서 가구를 사 보세요.";
    bagEl.append(p);
    return;
  }
  for (const id of ids) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "bag-item";
    btn.title = FURNITURE[id].name + " 꺼내기";
    btn.append(makePreview(id));
    const name = document.createElement("span");
    name.textContent = FURNITURE[id].name;
    btn.append(name);
    if (save.inventory[id] > 1) {
      const n = document.createElement("span");
      n.className = "count";
      n.textContent = save.inventory[id];
      btn.append(n);
    }
    btn.addEventListener("click", () => takeFromBag(id));
    bagEl.append(btn);
  }
}

// 가구 미리보기 그림 (상점, 보관함에서 사용)
// 가구 크기에 맞춘 작은 캔버스에 그리고, 화면에서는 같은 칸 크기로 확대해 보여줍니다.
function makePreview(id) {
  const item = makeItem({ id, x: 0, y: 0, z: 0 });
  const prev = { ctx, viewOX, viewOY, WS };
  viewOX = OX;
  viewOY = OY;
  WS = 1; // 미리보기는 원래 크기로
  const b = screenBounds(item);
  const size = Math.ceil(Math.max(b.w + 4, b.h + 4, 18)); // 작은 물건이 너무 커지지 않게 최소 크기
  const c = document.createElement("canvas");
  c.width = size * RES;
  c.height = size * RES;
  c.className = "preview";
  ctx = c.getContext("2d");
  ctx.setTransform(RES, 0, 0, RES, 0, 0); // 게임 화면과 같은 정교함
  ctx.imageSmoothingEnabled = false;
  viewOX += Math.round(size / 2 - (b.x + b.w / 2));
  viewOY += Math.round(size / 2 - (b.y + b.h / 2));
  drawItem(item);
  ({ ctx, viewOX, viewOY, WS } = prev);
  return c;
}

// ---- 상점 --------------------------------------------------------
const shopEl = document.getElementById("shop");
const shopList = document.getElementById("shop-list");
const shopBtn = document.getElementById("shop-btn");
let shopCategory = "furniture";

// 받침 있는 글자면 "을", 없으면 "를"
function withObject(word) {
  const c = word.charCodeAt(word.length - 1);
  if (c < 0xac00 || c > 0xd7a3) return word + "을(를)";
  return word + ((c - 0xac00) % 28 ? "을" : "를");
}

// 가지고 있는 개수 (보관함 + 모든 방에 놓인 것)
function ownedCount(id) {
  let n = save.inventory[id] || 0;
  for (const r of ROOMS) {
    const list = r.id === room.id ? items : (save.layouts[r.id] || r.layout);
    n += list.filter((p) => p.id === id).length;
  }
  return n;
}

function openShop() {
  if (editing) setEditing(false);
  if (typeof Friends !== "undefined") Friends.close();
  if (typeof Focus !== "undefined") Focus.close();
  shopEl.hidden = false;
  shopBtn.classList.add("active");
  renderShop();
}

function closeShop() {
  shopEl.hidden = true;
  shopBtn.classList.remove("active");
}

// 방 전체 미리보기 (벽지·바닥·방 상품용)
function makeRoomPreview(r, style) {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  c.className = "room-preview";
  const prev = { ctx, viewOX, viewOY, WS, room, activeColors, shadeCache, previewStyle };
  ctx = c.getContext("2d");
  room = r;
  setOrigin(r);
  previewStyle = style || null;
  applyStyle();
  drawShell();
  drawWallPattern();
  drawFloorPattern();
  drawWindow("day");
  drawFront();
  ({ ctx, viewOX, viewOY, WS, room, activeColors, shadeCache, previewStyle } = prev);
  return c;
}

function makeCard(preview, title, metaHtml, button) {
  const card = document.createElement("div");
  card.className = "card";
  const name = document.createElement("div");
  name.className = "card-name";
  name.textContent = title;
  const meta = document.createElement("div");
  meta.className = "card-meta";
  meta.innerHTML = metaHtml;
  card.append(preview, name, meta, button);
  return card;
}

function makeButton(label, onClick, disabled) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = label;
  btn.disabled = !!disabled;
  if (onClick) btn.addEventListener("click", onClick);
  return btn;
}

const priceHtml = (n) => (n ? `<span class="price"><i class="coin"></i>${n.toLocaleString()}</span>` : "<span>기본</span>");

// 벽지·바닥 상품
function renderStyles(kind) {
  const list = kind === "wall" ? WALLPAPERS : FLOORS;
  const now = currentStyle()[kind];
  for (const st of list) {
    let btn;
    if (!ownsStyle(st)) {
      btn = makeButton("구매", () => confirmBuy(st.name, st.price, makeRoomPreview(room, { [kind]: st.id }), () => buyStyle(kind, st)));
      btn.dataset.price = st.price;
    } else if (now.id === st.id) {
      btn = makeButton("사용 중", null, true);
    } else {
      btn = makeButton("적용", () => useStyle(kind, st));
    }
    const owned = ownsStyle(st) && st.price ? "<span>보유</span>" : "";
    shopList.append(makeCard(makeRoomPreview(room, { [kind]: st.id }), st.name, priceHtml(st.price) + owned, btn));
  }
}

function useStyle(kind, st) {
  save.roomStyles[room.id] = Object.assign({}, save.roomStyles[room.id], { [kind]: st.id });
  Save.save(save);
  applyStyle();
  renderShop();
}

function buyStyle(kind, st) {
  if (save.coins < st.price) return;
  save.coins -= st.price;
  save.ownedStyles.push(st.id);
  updateCoins();
  useStyle(kind, st);
  toast(`${withObject(st.name)} 샀어요. ${room.name}에 적용했어요.`);
}

// 방 상품
function renderRooms() {
  for (const r of ROOMS) {
    let btn;
    if (!ownsRoom(r)) {
      btn = makeButton("구매", () => confirmBuy(r.name, r.price, makeRoomPreview(r), () => { buyRoom(r); renderShop(); }, "열까요?"));
      btn.dataset.price = r.price;
    } else if (r.id === room.id) {
      btn = makeButton("지금 방", null, true);
    } else {
      btn = makeButton("가 보기", () => { setRoom(r.id); renderShop(); });
    }
    const meta = ownsRoom(r) ? (r.price ? "<span>보유</span>" : "<span>기본</span>") : priceHtml(r.price);
    shopList.append(makeCard(makeRoomPreview(r), r.name, meta, btn));
  }
}

// 글자 그림 미리보기 (캐릭터, 반려동물)
function makeSpritePreview(rows, colors, flip = false, look = null) {
  const size = Math.max(rows[0].length, rows.length) + 3; // 작은 그림은 더 크게 보이도록
  const c = document.createElement("canvas");
  c.width = size * RES;
  c.height = size * RES;
  c.className = "preview";
  const prev = ctx;
  ctx = c.getContext("2d");
  ctx.setTransform(RES, 0, 0, RES, 0, 0);
  const left = Math.floor((size - rows[0].length) / 2), top = size - rows.length - 1;
  drawSprite(rows, left, top, colors, flip);
  if (look) drawEyewear(normLook(look), left, top + rows.length - CHARACTER.idle.length);
  ctx = prev;
  return c;
}

// 캐릭터 미리보기 (안경까지)
// 반려동물 미리보기 (상점, 구매 확인)
function makePetPreview(pd) {
  if (usePetArt()) {
    const art = petArtCanvas(pd, "sit", false);
    const size = 12;
    const c = document.createElement("canvas");
    c.width = size * RES;
    c.height = size * RES;
    c.className = "preview";
    c.getContext("2d").drawImage(art, Math.floor((c.width - art.width) / 2), c.height - art.height - RES);
    return c;
  }
  return makeSpritePreview(PET_FRAMES[pd.kind].idle, pd.colors);
}

function makeHeroPreview(look = save.look) {
  if (useHeroArt()) {
    const art = heroArtCanvas("idle", look, false);
    const size = 17;
    const c = document.createElement("canvas");
    c.width = size * RES;
    c.height = size * RES;
    c.className = "preview";
    c.getContext("2d").drawImage(art, Math.floor((c.width - art.width) / 2), c.height - art.height - RES);
    return c;
  }
  return makeSpritePreview(heroRows("idle", look), heroColors(look), false, look);
}

function sectionTitle(text) {
  const h = document.createElement("div");
  h.className = "shop-section";
  h.textContent = text;
  shopList.append(h);
}

function setLook(change) {
  save.look = Object.assign({}, save.look, change);
  Save.save(save);
  renderShop();
}

// 옷 탭: 상점에서 파는 상의·하의 (머리·얼굴·기본 옷은 "내 정보"에서)
function renderLook() {
  const note = document.createElement("div");
  note.className = "shop-section";
  note.textContent = "머리, 얼굴, 기본 옷은 오른쪽 위 '내 정보'에서 바꿀 수 있어요.";
  shopList.append(note);
  for (const [title, list, key] of [["상의", TOPS, "top"], ["하의", BOTTOMS, "bottom"]]) {
    sectionTitle(title);
    for (const item of list.filter((x) => x.price > 0)) {
      const look = Object.assign({}, save.look, { [key]: item.id });
      const owned = ownsCloth(item);
      const on = save.look[key] === item.id;
      let btn;
      if (!owned) {
        btn = makeButton("구매", () => confirmBuy(item.name, item.price, makeHeroPreview(look), () => {
          if (save.coins < item.price) return;
          save.coins -= item.price;
          save.outfits.push(item.id);
          updateCoins();
          setLook({ [key]: item.id });
          toast(`${withObject(item.name)} 샀어요.`);
        }));
        btn.dataset.price = item.price;
      } else {
        btn = makeButton(on ? "입는 중" : "입기", on ? null : () => setLook({ [key]: item.id }), on);
      }
      shopList.append(makeCard(makeHeroPreview(look), item.name,
        priceHtml(item.price) + (owned ? "<span>보유</span>" : ""), btn));
    }
  }
  // 장신구: 하나만 쓸 수 있고, 다시 누르면 벗음
  sectionTitle("장신구");
  for (const item of ACCESSORIES) {
    const look = Object.assign({}, save.look, { acc: item.id });
    const owned = save.outfits.includes(item.id);
    const on = save.look.acc === item.id;
    let btn;
    if (!owned) {
      btn = makeButton("구매", () => confirmBuy(item.name, item.price, makeHeroPreview(look), () => {
        if (save.coins < item.price) return;
        save.coins -= item.price;
        save.outfits.push(item.id);
        updateCoins();
        setLook({ acc: item.id });
        toast(`${withObject(item.name)} 샀어요.`);
      }));
      btn.dataset.price = item.price;
    } else {
      btn = makeButton(on ? "벗기" : "쓰기", () => setLook({ acc: on ? null : item.id }));
    }
    shopList.append(makeCard(makeHeroPreview(look), item.name,
      priceHtml(item.price) + (owned ? (on ? "<span>쓰는 중</span>" : "<span>보유</span>") : ""), btn));
  }
}

// 친구 탭: 반려동물
function renderPets() {
  for (const pd of PETS) {
    const owned = save.pets.includes(pd.id);
    const on = save.pet === pd.id;
    let btn;
    if (!owned) {
      btn = makeButton("데려오기", () => confirmBuy(pd.name, pd.price, makePetPreview(pd), () => {
        if (save.coins < pd.price) return;
        save.coins -= pd.price;
        save.pets.push(pd.id);
        save.pet = pd.id;
        Save.save(save);
        updateCoins();
        placePet();
        renderShop();
        toast(`${pd.name}${(pd.name.charCodeAt(pd.name.length - 1) - 0xac00) % 28 ? "이" : "가"} 함께하게 됐어요. 클릭하면 반가워해요.`);
      }, "데려올까요?"));
      btn.dataset.price = pd.price;
    } else if (on) {
      btn = makeButton("쉬게 하기", () => { save.pet = null; Save.save(save); renderShop(); });
    } else {
      btn = makeButton("함께하기", () => { save.pet = pd.id; Save.save(save); placePet(); renderShop(); });
    }
    const meta = owned ? (on ? "<span>함께하는 중</span>" : "<span>보유</span>") : priceHtml(pd.price);
    shopList.append(makeCard(makePetPreview(pd), pd.name, meta, btn));
  }
}

// 기간 한정 탭: 크리스마스는 11월 1일 ~ 1월 31일 (산 물건은 기간이 끝나도 계속 씀)
function isXmasSeason() {
  const m = now().getMonth(); // 0 = 1월
  return m === 10 || m === 11 || m === 0;
}

function renderShop() {
  const xmasTab = shopEl.querySelector('.tab[data-cat="xmas"]');
  xmasTab.hidden = !isXmasSeason();
  if (xmasTab.hidden && shopCategory === "xmas") shopCategory = "furniture";
  shopEl.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.cat === shopCategory));
  shopList.innerHTML = "";
  shopList.classList.toggle("wide", ["wall", "floor", "room"].includes(shopCategory));
  if (shopCategory === "look") {
    renderLook();
    updateShopButtons();
    return;
  }
  if (shopCategory === "pet") {
    renderPets();
    updateShopButtons();
    return;
  }
  if (shopCategory === "wall" || shopCategory === "floor") {
    renderStyles(shopCategory);
    updateShopButtons();
    return;
  }
  if (shopCategory === "room") {
    renderRooms();
    updateShopButtons();
    return;
  }
  if (shopCategory === "xmas") {
    const note = document.createElement("div");
    note.className = "shop-section";
    note.textContent = "기간 한정 · 1월 31일까지 살 수 있어요. 산 물건은 기간이 끝나도 계속 쓸 수 있어요.";
    shopList.append(note);
  }
  const entries = Object.entries(FURNITURE)
    .filter(([, f]) => f.category === shopCategory && f.price != null)
    .sort((a, b) => a[1].price - b[1].price);
  for (const [id, f] of entries) {
    const card = document.createElement("div");
    card.className = "card";
    card.append(makePreview(id));
    const name = document.createElement("div");
    name.className = "card-name";
    name.textContent = f.name;
    const meta = document.createElement("div");
    meta.className = "card-meta";
    const owned = ownedCount(id);
    meta.innerHTML = `<span class="price"><i class="coin"></i>${f.price}</span>` + (owned ? `<span>보유 ${owned}</span>` : "");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.price = f.price;
    btn.addEventListener("click", () => confirmBuy(f.name, f.price, makePreview(id), () => buy(id)));
    card.append(name, meta, btn);
    shopList.append(card);
  }
  updateShopButtons();
}

function updateShopButtons() {
  if (lockEl && !lockEl.hidden) updateLock();
  shopList.querySelectorAll("button[data-price]").forEach((btn) => {
    const enough = save.coins >= Number(btn.dataset.price);
    btn.disabled = !enough;
    btn.textContent = enough ? "구매" : "코인 부족";
  });
}

// ---- 구매 확인 창 ----
// 실수로 사지 않게 "○○을 N코인에 살까요?"를 한 번 물어봅니다.
const confirmEl = document.getElementById("confirm");
let confirmYes = null;

function confirmBuy(name, price, preview, onYes, ask = "살까요?") {
  if (save.coins < price) return;
  document.getElementById("confirm-text").textContent = `${withObject(name)} ${ask}`;
  document.getElementById("confirm-coins").textContent =
    `${price.toLocaleString()}코인 · 사고 나면 ${(save.coins - price).toLocaleString()}코인 남아요`;
  const box = document.getElementById("confirm-preview");
  box.innerHTML = "";
  if (preview) box.append(preview);
  confirmYes = onYes;
  confirmEl.hidden = false;
  document.getElementById("confirm-yes").focus();
}

function closeConfirm() {
  confirmEl.hidden = true;
  confirmYes = null;
}

document.getElementById("confirm-yes").addEventListener("click", () => {
  const run = confirmYes;
  closeConfirm();
  if (run) run();
});
document.getElementById("confirm-no").addEventListener("click", closeConfirm);
confirmEl.addEventListener("click", (e) => { if (e.target === confirmEl) closeConfirm(); }); // 바깥 누르면 취소

function buy(id) {
  const f = FURNITURE[id];
  if (save.coins < f.price) return;
  save.coins -= f.price;
  addToBag(id);
  updateCoins();
  renderShop();
  toast(`${withObject(f.name)} 샀어요. 꾸미기에서 꺼내 놓을 수 있어요.`);
}

shopBtn.addEventListener("click", () => (shopEl.hidden ? openShop() : closeShop()));
document.getElementById("lock-buy").addEventListener("click", () => {
  const r = room;
  confirmBuy(r.name, r.price, makeRoomPreview(r), () => buyRoom(r), "열까요?");
});
document.getElementById("shop-close").addEventListener("click", closeShop);
shopEl.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => {
  shopCategory = t.dataset.cat;
  renderShop();
}));

// ---- 코인 --------------------------------------------------------
const COINS_PER_MINUTE = 2;      // 1분에 받는 코인
const OFFLINE_MAX_MINUTES = 180; // 꺼져 있을 때 최대 몇 분치까지 쌓이는지
const coinPop = document.getElementById("coin-pop");

function updateCoins(gained) {
  coinText.textContent = save.coins.toLocaleString();
  if (gained) {
    coinPop.textContent = "+" + gained;
    coinPop.classList.remove("show");
    void coinPop.offsetWidth; // 애니메이션 다시 시작
    coinPop.classList.add("show");
  }
  updateShopButtons();
}

// 지난번 계산 이후 흐른 시간만큼 코인을 줍니다.
// 2분 넘게 소식이 없었으면 꺼져 있던 것으로 보고 최대 180분까지만 쳐 줍니다.
function earn() {
  if (visiting) return; // 친구 방 구경 중에는 멈춤 (돌아오면 그동안의 코인이 한꺼번에 들어옴)
  if (typeof Focus !== "undefined") Focus.update();
  const nowMs = Date.now();
  const gap = Math.max(0, nowMs - save.lastSeen);
  const offline = gap > 2 * 60 * 1000;
  save.carryMs += offline ? Math.min(gap, OFFLINE_MAX_MINUTES * 60 * 1000) : gap;
  const minutes = Math.floor(save.carryMs / 60000);
  save.carryMs -= minutes * 60000;
  save.lastSeen = nowMs;
  if (minutes > 0) {
    const gained = minutes * COINS_PER_MINUTE;
    save.coins += gained;
    updateCoins(gained);
    if (offline) toast(`자리를 비운 동안 ${gained}코인이 모였어요.`);
  }
  Save.save(save, { auto: true }); // 코인이 쌓이는 것은 자동 저장
}

// 테스트용: 주소 뒤에 ?coins=1000 을 붙이면 코인이 그 값으로 바뀝니다.
if (params.has("coins")) {
  save.coins = Number(params.get("coins")) || 0;
  Save.save(save);
}

// ---- 알림 --------------------------------------------------------
const toastEl = document.getElementById("toast");
let toastTimer = null;
function toast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 3000);
}

updateCoins();
earn();
setInterval(earn, 5000);
document.addEventListener("visibilitychange", earn);
window.addEventListener("pagehide", earn);

// ---- 친구 방 구경 ------------------------------------------------
// 친구의 공개 정보(방 배치, 캐릭터, 반려동물, 사는 곳)로 잠시 방을 바꿔 그립니다.
// 구경하는 동안에는 저장·코인·타이머가 멈추고, 돌아오면 내 데이터로 되돌아갑니다.
function visitSave(snap) {
  const roomId = ROOMS.some((r) => r.id === snap.roomId) ? snap.roomId : "studio";
  return Object.assign(Save.defaults(), {
    roomId,
    ownedRooms: [roomId],
    layouts: { [roomId]: Array.isArray(snap.layout) ? snap.layout : [] },
    roomStyles: { [roomId]: snap.styles || {} },
    lampOn: snap.lampOn !== false,
    look: snap.look || {},
    pet: snap.pet || null,
    pets: snap.pet ? [snap.pet] : [],
    profile: { name: snap.name || "", city: snap.city || null },
    timer: snap.timer || { length: 25, mode: null, endAt: 0, remain: 0 },
    profileDone: true,
    decorDone: { [roomId]: true }, // 친구 방은 친구가 꾸민 그대로
  });
}

function startVisit(friend, snap) {
  if (!visiting) ownSave = save;
  setEditing(false);
  closeShop();
  if (typeof Focus !== "undefined") Focus.close();
  Save.locked = true; // 구경하는 동안 내 저장 데이터를 건드리지 않게
  visiting = { id: friend.id, name: friend.name };
  save = visitSave(snap || {});
  save.look = normLook(save.look);
  document.body.classList.add("visiting");
  document.getElementById("visit-name").textContent = `${friend.name || "친구"}의 방`;
  document.getElementById("title").textContent = `${friend.name || "친구"}의 방 · 구경 중`;
  setRoom(save.roomId);
  placeGuest();
  refreshWeather(true);
  toast(`${friend.name || "친구"}님 방에 놀러 왔어요. 노란 표시가 있는 캐릭터가 나예요.`);
}

function endVisit() {
  if (!visiting) return;
  save = ownSave;
  ownSave = null;
  visiting = null;
  Save.locked = false;
  document.body.classList.remove("visiting");
  const myName = save.profile && save.profile.name;
  document.getElementById("title").textContent = myName ? `${myName}의 방` : "My Cozy Room";
  setRoom(save.roomId);
  refreshWeather(true);
  updateCoins();
  earn();
}

// ---- 항상 위에 띄우기 (Document Picture-in-Picture) ---------------
let pipWin = null;

function updatePipButton() {
  pipBtn.textContent = pipWin ? "돌아가기" : "위에 띄우기";
}

async function togglePip() {
  if (pipWin) {
    pipWin.close();
    return;
  }
  if (!("documentPictureInPicture" in window)) {
    pipNote.textContent = "이 브라우저는 '항상 위' 창을 지원하지 않아요. 최신 크롬이나 엣지에서 열어 주세요.";
    return;
  }

  try {
    pipWin = await documentPictureInPicture.requestWindow({ width: 380, height: Math.round(380 * H / W) });
  } catch (err) {
    pipNote.textContent = "작은 창을 열지 못했어요. 브라우저 설정을 확인해 주세요.";
    return;
  }

  // 스타일을 작은 창으로 복사
  for (const sheet of document.styleSheets) {
    try {
      const style = pipWin.document.createElement("style");
      style.textContent = [...sheet.cssRules].map((r) => r.cssText).join("\n");
      pipWin.document.head.appendChild(style);
    } catch (e) {
      const link = pipWin.document.createElement("link");
      link.rel = "stylesheet";
      link.href = sheet.href;
      pipWin.document.head.appendChild(link);
    }
  }

  pipWin.document.title = "My Cozy Room";
  pipWin.document.addEventListener("keydown", onKey);
  pipWin.document.body.classList.add("pip");
  pipWin.document.body.append(app);
  placeholder.hidden = false;
  pipNote.textContent = "";
  updatePipButton();
  startLoop();

  // 작은 창이 닫히면 원래 자리로 돌아오기
  pipWin.addEventListener("pagehide", () => {
    appHome.prepend(app);
    placeholder.hidden = true;
    pipWin = null;
    updatePipButton();
    startLoop();
  });
}

pipBtn.addEventListener("click", togglePip);

// ---- 게임 루프 ---------------------------------------------------
let lastTick = performance.now();
let loopToken = 0;

function tick(dt) {
  time += dt;
  weather = weatherNow();
  if (typeof Focus !== "undefined") Focus.update();
  const h = hourNow();
  const phase = phaseOf(h);

  updateHero(dt, h);
  updatePet(dt, h);
  updateGuest(dt);
  updateWalkers(dt);

  currentPhase = phase;
  ctx.setTransform(RES, 0, 0, RES, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, W, H);
  drawShell();
  drawWallPattern();
  drawFloorPattern();
  drawWindow(phase);
  drawClock();
  floorItems.forEach(drawItem);
  drawEditMarker("under");
  wallItems.forEach(drawItem);
  if (drag && drag.wall) {
    drawEditMarker("drag");
    if (!drag.valid) tintItem(drag.item, "rgba(230, 70, 70, 0.45)");
  }
  drawObjects();
  drawEditMarker("over");
  drawFront();
  drawLighting(phase);
  if (artStyle === "detail") drawSceneOutline();
  drawEffects();

  // 배경색도 시간에 따라 조금씩 바뀝니다.
  const bg = mixColor(PALETTE.bgDay, PALETTE.bgNight, DARKNESS[phase] * 2);
  vctx.fillStyle = bg;
  // 작은 창에서 남는 공간도 방 배경색으로 (빈 띠가 보이지 않게)
  if (pipWin && pipWin.document.body.style.background !== bg) pipWin.document.body.style.background = bg;
  vctx.fillRect(0, 0, view.width, view.height);
  vctx.imageSmoothingEnabled = false;
  vctx.drawImage(buf, 0, 0, view.width, view.height);

  const d = now();
  const city = cityWeather() && myCity();
  const label = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
    + (city ? ` · ${city.name} ${WEATHER_NAMES[weather]}` : weather !== "clear" ? ` · ${WEATHER_NAMES[weather]}` : "");
  if (clockText.textContent !== label) clockText.textContent = label;
}

// 작은 창이 열려 있으면 그 창 기준으로 화면을 갱신합니다.
// (원래 탭이 최소화되어도 멈추지 않도록)
function startLoop() {
  const token = ++loopToken;
  const step = () => {
    if (token !== loopToken) return;
    const t = performance.now();
    if (t - lastTick >= 1000 / FPS - 1) {
      tick(Math.min(0.1, (t - lastTick) / 1000));
      lastTick = t;
    }
    (pipWin || window).requestAnimationFrame(step);
  };
  (pipWin || window).requestAnimationFrame(step);
}

startLoop();

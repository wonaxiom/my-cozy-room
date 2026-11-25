// =============================================================
// cafe.js — 카페 운영 미니게임 (타이쿤)
// 카운터 너머로 손님이 들어와 주문하면, 컵을 꺼내고 머신으로 에스프레소를 내리고
// 재료를 넣어 만든 뒤 손님을 눌러 건네줍니다.
// 빨리 주면 팁, 오래 기다리게 하면 덜 내고, 시간이 다 되면 화내며 나갑니다.
// 실수(화나서 나간 손님, 잘못 건넨 음료)가 쌓이면 영업이 일찍 끝납니다(게임 오버).
// 판 매출은 코인으로 받고(하루 상한), 코인으로 메뉴와 장비를 늘립니다.
// =============================================================

const CAFE_ROUND_SECONDS = 90;  // 한 판 영업 시간
const CAFE_SEATS = 3;           // 카운터 앞에 설 수 있는 손님 수
// 난이도: 손님이 기다리는 시간(초), 빨리 건넸을 때 받는 팁, 하루에 받을 수 있는 코인(난이도마다 따로),
// 실수할 수 있는 횟수(lives번 실수하면 게임 오버). 영업 전 화면에서 고름
const CAFE_MODES = [
  { id: "normal", name: "보통", patience: 45, tip: 2, dailyMax: 80, lives: 3 },
  { id: "hard", name: "어려움", patience: 35, tip: 3, dailyMax: 100, lives: 3 },
];
const CAFE_SHOT_SECONDS = [2.0, 1.3, 0.7]; // 커피 머신 단계별 에스프레소 내리는 시간
// 기다림이 얼마나 남았을 때 건넸는지에 따라: 넉넉하면 팁, 조금 남았으면 덜 냄
const CAFE_TIP_OVER = 0.6;      // 기다림이 60% 넘게 남으면 팁 (팁 크기는 CAFE_MODES)
const CAFE_LATE_UNDER = 0.3;    // 기다림이 30% 아래로 남으면 덜 냄
const CAFE_LATE_CUT = 2;

// 재료 (카운터 순서대로, 그림은 img/cafe/재료id.png). drop은 넣을 때 떨어지는 방울 색
const CAFE_INGREDIENTS = [
  { id: "shot", name: "에스프레소", drop: "#4a2e20" },
  { id: "water", name: "물", drop: "#a9cbe0" },
  { id: "milk", name: "우유", drop: "#f4efe4" },
  { id: "vanilla", name: "바닐라", drop: "#efd9a0" },
  { id: "choco", name: "초코", drop: "#6b3f2a" },
  { id: "matcha", name: "녹차", drop: "#8fb36a" },
  { id: "whip", name: "휘핑크림", drop: "#fffaf0" }, // 병 줄이 아니라 작업대 앞쪽에 놓임 (B.whip)
];

// 메뉴: recipe는 넣어야 할 재료 (순서는 상관없음), unlock이 있으면 그 메뉴를 사야 나옴
// whip이 있으면 가끔 휘핑크림을 올려 달라는 주문이 나옴 (그림 hot-메뉴-whip.png)
const CAFE_MENU = [
  { id: "americano", name: "아메리카노", price: 4, recipe: ["shot", "water"] },
  { id: "latte", name: "카페라떼", price: 5, recipe: ["shot", "milk"] },
  { id: "vanilla", name: "바닐라 라떼", price: 6, recipe: ["shot", "milk", "vanilla"], unlock: 80 },
  { id: "choco", name: "초코 라떼", price: 6, recipe: ["choco", "milk"], unlock: 120, whip: true },
  { id: "matcha", name: "녹차 라떼", price: 7, recipe: ["matcha", "milk"], unlock: 160, whip: true },
];
// 게임 오버 표시: 문구, 보여 주는 시간(밀리초). 글자가 왼쪽부터 하나씩 튀어 오름
const CAFE_OVER_TEXT = "Game Over";
const CAFE_OVER_MS = 2200;
const CAFE_WHIP_CHANCE = 0.4;   // 휘핑크림을 올릴 수 있는 메뉴에서 휘핑크림까지 주문할 확률
const CAFE_WHIP_PRICE = 1;      // 휘핑크림 값

// 특별 손님: 외형이 정해진 손님 (그림 img/cafe/guest-id.png). 손님이 올 때 chance 확률로 이 손님이 옴 (같은 손님은 한 번에 한 명)
// tipMul: 빨리 건넸을 때 팁 배수, midTip: 기다림이 30~60% 남았을 때도 기본 팁을 줌, patienceMul: 기다리는 시간 배수
const CAFE_GUESTS = [
  { id: "rich", name: "큰손 손님", chance: 0.12, tipMul: 3, midTip: true, patienceMul: 1, hello: "팁은 두둑이 줄게요" },
  { id: "rush", name: "급한 손님", chance: 0.15, tipMul: 1, midTip: false, patienceMul: 0.6, hello: "빨리 좀 주세요!" },
];

// 장비 업그레이드: level은 지금 단계, prices는 다음 단계로 올리는 가격
// 일일 랭킹: 난이도마다 하루(한국 날짜) 최고 매출을 영문 3글자 이름으로 올림. 서버 함수는 Supabase의 cafe_daily_ranking
// 그날 1위는 한국 시각 24시가 지나면 코인을 받음 (서버 claim_cafe_rewards의 금액과 같아야 함)
const CAFE_RANK_PRIZE = { normal: 25, hard: 50 };
const CAFE_RANK_SHOW = 10;       // 랭킹에 보여 주는 순위 수
const CAFE_RANK_MAX_SCORE = 1000; // 서버가 받는 가장 높은 점수
const CAFE_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const CAFE_UPGRADES = [
  { id: "machine", name: "커피 머신", desc: "에스프레소를 더 빨리 내려요", prices: [150, 300] },
  { id: "chair", name: "푹신한 의자", desc: "손님이 더 오래 기다려 줘요", prices: [200] },
  { id: "sign", name: "예쁜 간판", desc: "손님이 더 자주 와요", prices: [250] },
];

const Cafe = (() => {
  const $ = (id) => document.getElementById(id) || app.querySelector("#" + id);
  const panel = $("cafe");
  const openBtn = $("cafe-btn");
  const body = $("cafe-body");
  const statusEl = $("cafe-status");

  // ---- 저장 데이터 ----
  // 예전 저장에 없는 값만 채움 (같은 객체를 계속 써야 산 것이 저장됨)
  function data() {
    const c = save.cafe || (save.cafe = {});
    const base = { machine: 0, chair: 0, sign: 0, served: 0, best: 0 };
    for (const k in base) if (typeof c[k] !== "number") c[k] = base[k];
    if (!Array.isArray(c.menu)) c.menu = [];
    if (!c.daily) c.daily = {};
    if (!CAFE_MODES.some((m) => m.id === c.mode)) c.mode = CAFE_MODES[0].id;
    return c;
  }

  function today() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  // 오늘 받은 카페 코인 (난이도마다 따로 셈). 예전 저장(coins가 숫자)은 보통으로 봄
  function daily() {
    const c = data();
    if (c.daily.date !== today()) c.daily = { date: today(), coins: {} };
    if (typeof c.daily.coins !== "object" || !c.daily.coins) c.daily.coins = { normal: c.daily.coins || 0 };
    return c.daily;
  }
  const todayCoins = (id) => daily().coins[id] || 0;

  const menuOpen = () => CAFE_MENU.filter((m) => !m.unlock || data().menu.includes(m.id));
  const ingredientOpen = () => CAFE_INGREDIENTS.filter((g) => menuOpen().some((m) => m.recipe.includes(g.id) || (g.id === "whip" && m.whip)));
  const whipOpen = () => menuOpen().some((m) => m.whip);
  const shotSeconds = () => CAFE_SHOT_SECONDS[data().machine] || CAFE_SHOT_SECONDS[0];
  const mode = () => CAFE_MODES.find((m) => m.id === data().mode);
  const patience = () => mode().patience * (data().chair ? 1.3 : 1);
  const spawnGap = () => (data().sign ? [3.5, 6] : [5, 8]);
  const ingName = (id) => (CAFE_INGREDIENTS.find((g) => g.id === id) || {}).name;

  // ---- 그림 (img/cafe/, 정리 스크립트: art-src/tools/cafe_proc.py) ----
  // 그림 크기 [가로, 세로] (도트)
  const ART_SIZE = { hot: [25, 27], ice: [22, 30], ingredient: [20, 28], upgrade: [43, 45] };
  const WHIP_ART = CAFE_MENU.filter((m) => m.whip).map((m) => m.id); // 휘핑크림 올린 컵 그림이 있는 음료
  const GUEST_ART_H = 54; // 특별 손님 그림에서 모자를 뺀 키 (도트). 손님 키 GUEST_H에 맞춰 같은 배율로 키움

  // 목록·버튼용 <img>
  function art(file, size, scale) {
    const img = document.createElement("img");
    img.src = `img/cafe/${file}.png`;
    img.width = size[0] * scale;
    img.height = size[1] * scale;
    img.alt = "";
    img.className = "cafe-art";
    img.draggable = false;
    return img;
  }
  const cupArt = (temp, drink, scale) => art(`${temp}-${drink}`, ART_SIZE[temp], scale);

  // 캔버스용 그림 (처음 쓸 때 한 번 불러 둠)
  const SCENE_ART = ["bg", "counter", "tray", "hole", "heart", "angry", "brew-bg", "ticket", "brew-machine1", "brew-machine2", "brew-machine3",
    ...CAFE_GUESTS.map((k) => `guest-${k.id}`)];
  const MAKING = ["shot", "water", "milk"]; // 만드는 중인 컵 그림 (hot-shot.png 처럼)
  const images = {};
  function img(file) {
    if (!images[file]) {
      const i = new Image();
      i.src = `img/cafe/${file}.png`;
      images[file] = i;
    }
    const i = images[file];
    return i.complete && i.naturalWidth ? i : null;
  }

  // 지금 넣은 재료에 맞는 컵 그림: 완성 음료, 아니면 만드는 중(에스프레소만·물만·우유만), 아니면 가장 가까운 음료
  // 휘핑크림은 음료를 정할 때 빼고 봄 (휘핑 그림은 cupFile에서 붙임)
  function drinkOf(adds) {
    adds = adds.filter((x) => x !== "whip");
    const exact = CAFE_MENU.find((m) => sameRecipe(m.recipe, adds));
    if (exact) return exact.id;
    if (adds.length === 1 && MAKING.includes(adds[0])) return adds[0];
    if (adds.includes("matcha")) return "matcha";
    if (adds.includes("choco")) return "choco";
    if (adds.includes("vanilla") && (adds.includes("shot") || adds.includes("milk"))) return "vanilla";
    if (adds.includes("shot") && adds.includes("milk")) return "latte";
    if (adds.includes("shot")) return "shot";
    if (adds.includes("milk")) return "milk";
    if (adds.includes("water")) return "water";
    return "empty";
  }

  function sameRecipe(a, b) {
    return a.length === b.length && [...a].sort().join() === [...b].sort().join();
  }

  // 손님이 주문한 재료와 값 (휘핑크림 주문이면 휘핑크림까지)
  const orderRecipe = (g) => (g.whip ? [...g.menu.recipe, "whip"] : g.menu.recipe);
  const orderPrice = (g) => g.menu.price + (g.whip ? CAFE_WHIP_PRICE : 0);
  const orderFile = (g) => `${g.temp}-${g.menu.id}${g.whip ? "-whip" : ""}`;

  // ---- 손님 ----
  const pick = (list) => list[Math.floor(Math.random() * list.length)];

  function randomLook() {
    return {
      gender: Math.random() < 0.5 ? "female" : "male",
      hair: pick(HAIR_STYLES).id,
      hairColor: pick(HAIR_COLORS).id,
      skin: pick(SKIN_TONES).id,
      eyes: Math.random() < 0.7 ? "basic" : pick(EYES).id,
      mouth: pick(["smile", "grin", "smile", "neutral"]),
      head: "normal",
      top: pick(TOPS).id,
      bottom: pick(BOTTOMS).id,
    };
  }

  // =============================================================
  // 가게 화면 (캔버스) — 두 곳을 오가며 영업
  //   주문 화면: 가게 안(손님), 카운터의 픽업대와 버리는 구멍
  //   제작 화면: 바리스타 작업 공간 (그림을 2배로 키워 그림). 주문서, 컵, 재료 병, 커피 머신, 쟁반, 버리는 구멍
  // 좌표는 280 × 200 도트 기준(제작 화면 안은 140 × 100 칸, 한 칸 = 2도트)이고,
  // 캔버스는 다시 2배로 그려서 글자가 또렷하게 보이게 함
  // =============================================================
  const W = 280, H = 200, PX = 2, U = 2;
  const COUNTER_Y = 120;   // 주문 화면 카운터 윗선 (손님 다리는 이 아래로 가려짐)
  const BASE_Y = 187;      // 주문 화면 카운터 위 물건의 바닥선
  const DOOR_X = 20;       // 손님이 드나드는 문 가운데 (배경 그림의 문)
  const SPOTS = [104, 162, 220]; // 손님이 서는 자리 (가운데 x)
  const FEET_Y = 130;      // 손님 발 위치 (발은 카운터에 가려짐)
  const GUEST_H = 70;      // 손님 키
  const WALK = 55;         // 걷는 속도 (도트/초)
  const PICKUP = [110, 140, 170]; // 주문 화면 픽업대 자리 (가운데 x)
  const SLIDE_MS = 220;    // 화면을 옮기는 시간

  // 주문 화면 자리 (도트)
  const O = {
    hole: { cx: 232, by: 189 },
    nav: { x: W - 19, y: 58, w: 19, h: 48 },
  };
  // 제작 화면 자리 (칸, 한 칸 = 2도트). 컵·병·머신은 바닥 가운데 x, 바닥 y
  const B = {
    hot: { x: 34, y: 33 },          // 선반 왼쪽 끝 따뜻한 컵
    ice: { x: 106, y: 33 },         // 선반 오른쪽 끝 아이스 컵
    tickets: [108, 142, 176],       // 주문서 가운데 x (도트, 손님 자리 순서)
    ticketTop: 11,                  // 주문서 위쪽 (도트, 금속 줄 높이)
    bottleY: 67,                    // 재료 병 바닥 (작업대 뒤쪽)
    bottleX: 50,                    // 첫 재료 병 가운데 x (20칸씩 오른쪽으로)
    machine: { x: 22, y: 88 },      // 커피 머신
    slot: { x: 22, y: 85 },         // 머신 안 컵 자리
    tray: { x: 62, y: 86 },         // 쟁반 위 컵 자리
    hole: { x: 124, y: 89 },        // 버리는 구멍
    whip: { x: 94, y: 89 },         // 휘핑크림 통 (작업대 앞쪽, 쟁반과 버리는 구멍 사이)
    nav: { x: 0, y: 58, w: 19, h: 48 }, // 주문 화면으로 가는 탭 (도트)
  };

  // ---- 영업 상태 ----
  // view: "lobby"(영업 전) / "play"(영업 중) / "result"(끝)
  let view = "lobby";
  let round = null;
  let lastResult = null;
  let canvas = null, ctx = null;
  let hover = null;      // 마우스가 올라간 물건
  let frameId = null;

  function newRound() {
    const now = Date.now();
    return {
      startAt: now,
      endAt: now + CAFE_ROUND_SECONDS * 1000,
      nextAt: now + 800,
      zone: "order",      // 지금 보는 곳: order(주문) / brew(제작)
      slide: null,        // 화면 옮기는 중 { from, t0 }
      guests: [],         // 손님
      cup: null,          // 제작 중인 컵 { temp, adds, at: "tray" | "machine", x, y, anim } (제작 화면 칸 좌표)
      brew: null,         // { until, total } 에스프레소 내리는 중
      drops: [],          // 병에서 컵으로 떨어지는 방울
      lift: {},           // 재료 병 들어 올린 시각 { 재료id: 끝나는 시각 }
      pickup: [],         // 픽업대에 올린 음료 [{ temp, adds }]
      sel: null,          // 고른 픽업대 음료 번호
      flying: [],         // 날아가는 컵 { cup, zone, done }
      floats: [],         // 떠오르는 글자 (주문 화면)
      tip: "", tipUntil: 0,
      sales: 0, served: 0, missed: 0,
      strikes: 0,         // 실수한 횟수 (mode().lives번이면 게임 오버)
      overStart: 0,       // 게임 오버가 된 시각 (글자 튀어 오르기 기준)
      overAt: 0,          // 게임 오버: 이 시각에 영업을 마감 (그동안 "게임 오버" 표시)
      last: now,
    };
  }

  // 위치를 부드럽게 옮기기 (dur 밀리초 동안, arc만큼 위로 휘어서)
  function tween(obj, tx, ty, dur, arc, done) {
    obj.anim = { fx: obj.x, fy: obj.y, tx, ty, t0: Date.now(), dur, arc: arc || 0, done };
  }
  function stepTween(obj, now) {
    const a = obj.anim;
    if (!a) return;
    const t = Math.min(1, (now - a.t0) / a.dur);
    const e = 1 - (1 - t) * (1 - t);
    obj.x = a.fx + (a.tx - a.fx) * e;
    obj.y = a.fy + (a.ty - a.fy) * e - Math.sin(t * Math.PI) * a.arc;
    if (t >= 1) {
      obj.anim = null;
      obj.x = a.tx; obj.y = a.ty;
      if (a.done) a.done();
    }
  }

  function say(text) {
    round.tip = text;
    round.tipUntil = Date.now() + 1800;
  }

  function floatText(x, y, text, color) {
    round.floats.push({ x, y, text, color, t0: Date.now() });
  }

  // 실수 하나 (화나서 나간 손님, 잘못 건넨 음료). 다 쓰면 잠깐 "게임 오버"를 보여 주고 마감
  function strike(why) {
    if (round.overAt) return;
    round.strikes += 1;
    const left = mode().lives - round.strikes;
    if (left > 0) return say(`${why} 실수 ${round.strikes}/${mode().lives}`);
    round.overStart = Date.now();
    round.overAt = round.overStart + CAFE_OVER_MS;
    hover = null;
  }

  // 캐릭터 그림의 빈 여백을 잘라 냄 (키를 맞추기 쉽게)
  function trimmed(c) {
    const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
      if (d[(y * c.width + x) * 4 + 3] < 10) continue;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    if (x1 < 0) return c;
    const out = document.createElement("canvas");
    out.width = x1 - x0 + 1;
    out.height = y1 - y0 + 1;
    out.getContext("2d").drawImage(c, -x0, -y0);
    return out;
  }

  // ---- 화면 옮기기 ----
  function goZone(zone) {
    if (!round || round.zone === zone) return;
    round.slide = { from: round.zone, t0: Date.now() };
    round.zone = zone;
    hover = null;
  }

  // ---- 손님 오고 가기 ----
  function spawn() {
    const taken = round.guests.map((g) => g.spot);
    const free = SPOTS.map((_, i) => i).filter((i) => !taken.includes(i));
    if (!free.length) return;
    const kind = pickKind();
    const menu = pick(menuOpen());
    round.guests.push({
      spot: pick(free),
      kind,             // 특별 손님 (CAFE_GUESTS) 또는 null
      art: kind ? null : trimmed(makeHeroPreview(randomLook())), // 특별 손님은 정해진 그림
      menu,
      whip: !!menu.whip && Math.random() < CAFE_WHIP_CHANCE,
      temp: Math.random() < 0.5 ? "hot" : "ice",
      x: DOOR_X,
      state: "enter",   // enter(들어오는 중) / wait(주문하고 기다림) / leave(나가는 중)
      until: 0,
      total: patience() * (kind ? kind.patienceMul : 1) * 1000,
      mood: null,       // 나갈 때 표정: happy / angry
      wrongUntil: 0,    // "이게 아니에요" 보여 주는 동안
    });
  }

  // 이번 손님이 특별 손님인지 (이미 가게에 있는 특별 손님은 또 오지 않음)
  function pickKind() {
    let r = Math.random();
    for (const k of CAFE_GUESTS) {
      if (r < k.chance) return round.guests.some((g) => g.kind === k && g.state !== "leave") ? null : k;
      r -= k.chance;
    }
    return null;
  }

  function leave(g, mood) {
    g.state = "leave";
    g.mood = mood;
  }

  function stepGuests(now, dt) {
    for (const g of round.guests) {
      const target = SPOTS[g.spot];
      if (g.state === "enter") {
        g.x = Math.min(target, g.x + WALK * dt);
        if (g.x >= target) {
          g.state = "wait";
          g.until = now + g.total;
          if (g.kind) floatText(g.x, FEET_Y - 34, g.kind.hello, g.kind.id === "rich" ? "#9a7420" : "#c0463a");
        }
      } else if (g.state === "wait" && now >= g.until) {
        round.missed += 1;
        floatText(g.x, FEET_Y - GUEST_H - 14, "흥! 너무 늦어요", "#c0463a");
        leave(g, "angry");
        strike("손님이 화나서 나갔어요.");
      } else if (g.state === "leave") {
        g.x -= WALK * 1.2 * dt;
      }
    }
    round.guests = round.guests.filter((g) => !(g.state === "leave" && g.x <= DOOR_X));
  }

  const ratio = (g, now) => Math.max(0, (g.until - now) / g.total);

  // ---- 만들기 (제작 화면) ----
  function cupBusy() {
    const cup = round.cup;
    return !cup || cup.at !== "tray" || !!cup.anim;
  }

  function takeCup(temp) {
    const cup = round.cup;
    if (cup) {
      if (cupBusy()) return say("컵이 머신에 있어요.");
      if (cup.adds.length) return say("만들던 음료는 구멍에 버리고 새 컵을 꺼내요.");
      if (cup.temp === temp) return;
    }
    const from = B[temp];
    const c = { temp, adds: [], at: "tray", x: from.x, y: from.y };
    round.cup = c;
    tween(c, B.tray.x, B.tray.y, 260, 8);
  }

  function useMachine() {
    const cup = round.cup;
    if (!cup) return say("선반에서 컵을 먼저 꺼내요.");
    if (cupBusy()) return;
    if (cup.adds.includes("shot")) return say("에스프레소는 이미 넣었어요.");
    cup.at = "machine";
    tween(cup, B.slot.x, B.slot.y, 220, 6, () => {
      const total = shotSeconds() * 1000;
      round.brew = { until: Date.now() + total, total };
    });
  }

  function finishBrew() {
    const cup = round.cup;
    round.brew = null;
    if (!cup) return;
    cup.adds.push("shot");
    tween(cup, B.tray.x, B.tray.y, 220, 6, () => { cup.at = "tray"; });
  }

  function pour(id, bx, by = B.bottleY) {
    const cup = round.cup;
    if (!cup) return say("선반에서 컵을 먼저 꺼내요.");
    if (cupBusy()) return say("컵이 머신에서 나올 때까지 기다려요.");
    if (cup.adds.includes(id) || round.drops.some((d) => d.id === id)) return say(`${ingName(id)}는 이미 넣었어요.`);
    round.lift[id] = Date.now() + 380;
    const g = CAFE_INGREDIENTS.find((x) => x.id === id);
    const drop = { id, color: g.drop, x: bx, y: by - 28 };
    tween(drop, B.tray.x, B.tray.y - 22, 320, 10, () => {
      round.drops = round.drops.filter((d) => d !== drop);
      if (round.cup === cup) cup.adds.push(id);
    });
    round.drops.push(drop);
  }

  function trashBrew() {
    const cup = round.cup;
    if (!cup || cupBusy()) return;
    round.cup = null;
    fly(cup, "brew", B.hole.x, B.hole.y - 4, 12);
  }

  // 다 만든 컵을 픽업대로
  function send() {
    const cup = round.cup;
    if (!cup || cupBusy() || round.drops.length) return;
    if (!cup.adds.length) return say("빈 컵이에요. 재료를 넣어요.");
    if (round.pickup.length >= PICKUP.length) return say("픽업대가 가득 찼어요. 주문 화면에서 건네거나 버려요.");
    round.cup = null;
    fly(cup, "brew", 150, B.tray.y, 6, () => {
      round.pickup.push({ temp: cup.temp, adds: cup.adds });
    });
    say("픽업대로 보냈어요.");
  }

  function fly(cup, zone, tx, ty, arc, done) {
    const f = { cup, zone };
    tween(cup, tx, ty, 260, arc, () => {
      round.flying = round.flying.filter((x) => x !== f);
      if (done) done();
    });
    round.flying.push(f);
  }

  // ---- 건네기 (주문 화면) ----
  function pickSelect(i) {
    round.sel = round.sel === i ? null : i;
  }

  function trashPickup() {
    if (round.sel == null) return say("버릴 음료를 픽업대에서 먼저 골라요.");
    const d = round.pickup.splice(round.sel, 1)[0];
    const c = { temp: d.temp, adds: d.adds, x: PICKUP[round.sel], y: BASE_Y };
    round.sel = null;
    fly(c, "order", O.hole.cx, O.hole.by - 4, 12);
  }

  function serve(g) {
    if (g.state !== "wait") return;
    if (!round.pickup.length) return say("제작 화면에서 음료를 만들어 픽업대로 보내요.");
    // 주문과 맞는 음료가 있으면 그것을, 없으면 고른 음료를 건넴
    let i = round.pickup.findIndex((d) => d.temp === g.temp && sameRecipe(d.adds, orderRecipe(g)));
    if (i < 0) i = round.sel;
    if (i == null) return say("이 손님 주문과 맞는 음료가 없어요.");
    const d = round.pickup.splice(i, 1)[0];
    round.sel = null;
    const c = { temp: d.temp, adds: d.adds, x: PICKUP[i], y: BASE_Y };
    fly(c, "order", g.x, FEET_Y - GUEST_H + 10, 18, () => judge(g, c));
  }

  // 건넨 음료 확인: 맞으면 기다린 시간에 따라 값을 받고, 틀리면 돌려받음(버려짐)
  function judge(g, cup) {
    if (g.state !== "wait") return;
    const headY = FEET_Y - GUEST_H;
    if (cup.temp !== g.temp || !sameRecipe(cup.adds, orderRecipe(g))) {
      g.until -= g.total * 0.2;
      g.wrongUntil = Date.now() + 1200;
      floatText(g.x, headY - 6, "이게 아니에요", "#c0463a");
      strike("주문과 다른 음료예요.");
      return;
    }
    // 빨리 주면 팁 (큰손 손님은 몇 배로, 조금 기다려도 기본 팁), 늦으면 덜 냄
    const left = (g.until - Date.now()) / g.total;
    const k = g.kind;
    let pay = orderPrice(g), note = "", tip = 0;
    if (left > CAFE_TIP_OVER) tip = mode().tip * (k ? k.tipMul : 1);
    else if (left >= CAFE_LATE_UNDER && k && k.midTip) tip = mode().tip;
    if (tip) { pay += tip; note = ` (팁 ${tip})`; }
    else if (left < CAFE_LATE_UNDER) { pay = Math.max(1, pay - CAFE_LATE_CUT); note = " (늦었어요)"; }
    round.sales += pay;
    round.served += 1;
    floatText(g.x, headY - 6, `+${pay}${note}`, left < CAFE_LATE_UNDER ? "#a0743a" : "#4f7a3a");
    leave(g, "happy");
  }

  // ---- 누를 수 있는 곳 (도트 좌표) ----
  function bottles() {
    return ingredientOpen().filter((g) => g.id !== "shot" && g.id !== "whip").map((g, i) => ({ id: g.id, x: B.bottleX + i * 20 }));
  }
  const u = (x, y, w, h) => ({ x: x * U, y: y * U, w: w * U, h: h * U }); // 제작 화면 칸 → 도트

  function hotspots() {
    if (round.zone === "brew") {
      const list = [
        { name: "주문 화면으로", ...B.nav, act: () => goZone("order") },
        { name: "따뜻한 컵 꺼내기", ...u(21, 4, 26, 30), act: () => takeCup("hot") },
        { name: "아이스 컵 꺼내기", ...u(95, 2, 23, 32), act: () => takeCup("ice") },
        { name: "커피 머신 (에스프레소)", ...u(2, 45, 40, 44), act: useMachine },
      ];
      for (const b of bottles()) list.push({ name: ingName(b.id), ...u(b.x - 10, B.bottleY - 28, 20, 28), act: () => pour(b.id, b.x) });
      if (whipOpen()) list.push({ name: "휘핑크림", ...u(B.whip.x - 8, B.whip.y - 27, 16, 27), act: () => pour("whip", B.whip.x, B.whip.y) });
      list.push({ name: "버리기", ...u(110, 74, 28, 17), act: trashBrew });
      if (round.cup && !cupBusy()) list.push({ name: "픽업대로 보내기", ...u(B.tray.x - 14, B.tray.y - 28, 28, 30), act: send });
      return list;
    }
    const list = [
      { name: "제작 화면으로", ...O.nav, act: () => goZone("brew") },
      { name: "버리기 (고른 음료)", x: O.hole.cx - 14, y: O.hole.by - 16, w: 28, h: 17, act: trashPickup },
    ];
    round.pickup.forEach((d, i) => list.push({ name: "음료 고르기", x: PICKUP[i] - 13, y: BASE_Y - 32, w: 26, h: 33, act: () => pickSelect(i) }));
    for (const g of round.guests) {
      if (g.state !== "wait") continue;
      list.push({ id: "guest", name: `${g.kind ? g.kind.name : "손님"}에게 건네기`, x: g.x - 18, y: FEET_Y - GUEST_H - 42, w: 36, h: COUNTER_Y - (FEET_Y - GUEST_H - 42), act: () => serve(g) });
    }
    return list;
  }

  // 누른 곳의 물건. 휴대폰처럼 손가락으로 누를 때는(pad) 물건에서 조금 벗어나도 가장 가까운 물건을 고름
  function hit(px, py, pad = 0) {
    if (round.slide || round.overAt) return null;
    const list = hotspots();
    for (let i = list.length - 1; i >= 0; i--) {
      const h = list[i];
      if (px >= h.x && px <= h.x + h.w && py >= h.y && py <= h.y + h.h) return h;
    }
    let best = null, bestD = pad;
    for (const h of list) {
      const dx = Math.max(h.x - px, 0, px - (h.x + h.w));
      const dy = Math.max(h.y - py, 0, py - (h.y + h.h));
      const d = Math.hypot(dx, dy);
      if (d <= bestD) { best = h; bestD = d; }
    }
    return best;
  }

  function toLocal(e) {
    const r = canvas.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
  }

  // ---- 시간 흐름 ----
  function frame() {
    if (!round) return;
    const now = Date.now();
    const dt = Math.min(0.1, (now - round.last) / 1000);
    round.last = now;

    if (round.brew && now >= round.brew.until) finishBrew();
    if (round.cup) stepTween(round.cup, now);
    round.flying.slice().forEach((f) => stepTween(f.cup, now));
    round.drops.slice().forEach((d) => stepTween(d, now));
    stepGuests(now, dt);
    round.floats = round.floats.filter((f) => now - f.t0 < 1400);
    if (round.slide && now - round.slide.t0 >= SLIDE_MS) round.slide = null;
    if (round.sel != null && round.sel >= round.pickup.length) round.sel = null;

    if (!round.overAt && now >= round.nextAt && now < round.endAt - 8000) {
      spawn();
      const [a, b] = spawnGap();
      round.nextAt = now + (a + Math.random() * (b - a)) * 1000;
    }
    if (now >= round.endAt || (round.overAt && now >= round.overAt)) return finish();

    updateHud(now);
    draw(now);
    frameId = (typeof pipWin !== "undefined" && pipWin ? pipWin : window).requestAnimationFrame(frame);
  }

  // ---- 그리기 ----
  function rect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  function drawImg(file, cx, by) {
    const i = img(file);
    if (!i) return;
    ctx.drawImage(i, Math.round(cx - i.width / 2), Math.round(by - i.height));
  }

  // 바닥에 놓인 물건 아래 옅은 그림자
  function shadow(cx, by, w) {
    ctx.fillStyle = "rgba(120, 64, 24, 0.18)";
    ctx.beginPath();
    ctx.ellipse(cx, by - 0.5, w / 2, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawGuest(g, now) {
    const c = g.art || img(`guest-${g.kind.id}`);
    if (!c) return;
    const s = g.art ? GUEST_H / c.height : GUEST_H / GUEST_ART_H; // 특별 손님은 모자만큼 더 큼
    const w = c.width * s, h = c.height * s;
    const walking = g.state !== "wait";
    const bob = walking && Math.floor(now / 140) % 2 ? 1 : 0;
    const shake = g.wrongUntil > now || (g.state === "wait" && ratio(g, now) < 0.15) ? Math.round(Math.sin(now / 40)) : 0;
    ctx.save();
    ctx.translate(Math.round(g.x + shake), FEET_Y - h - bob);
    if (g.state === "leave") ctx.scale(-1, 1);
    ctx.drawImage(c, -w / 2, 0, w, h);
    ctx.restore();
  }

  function bubble(x, y, w, h) {
    ctx.fillStyle = "#3a2a24";
    ctx.fillRect(x - 1, y, w + 2, h);
    ctx.fillRect(x, y - 1, w, h + 2);
    ctx.fillStyle = "#fffdf8";
    ctx.fillRect(x, y, w, h);
    const cx = Math.round(x + w / 2);
    for (let i = 0; i < 3; i++) rect(cx - 2 + i, y + h + i, 5 - i * 2, 1, "#fffdf8");
    for (const [dx, dy] of [[-3, 0], [3, 0], [-2, 1], [2, 1], [-1, 2], [1, 2], [0, 3]]) rect(cx + dx, y + h + dy, 1, 1, "#3a2a24");
  }

  const barColor = (r) => (r > CAFE_TIP_OVER ? "#7fae5a" : r > CAFE_LATE_UNDER ? "#e0b24f" : "#d0574a");

  function drawOrderBubble(g, now) {
    const headY = FEET_Y - GUEST_H;
    if (g.state === "leave") {
      if (g.mood) drawImg(g.mood === "happy" ? "heart" : "angry", g.x, headY - 1);
      return;
    }
    if (g.state !== "wait") return;
    const extra = g.whip ? (g.temp === "ice" ? 8 : 1) : 0; // 휘핑크림 컵은 그만큼 키가 큼
    const bw = 32, bh = 40 + extra, bx = Math.round(g.x - bw / 2), by = headY - bh - 5;
    bubble(bx, by, bw, bh);
    drawImg(orderFile(g), g.x, by + 33 + extra);
    const r = ratio(g, now);
    rect(bx + 3, by + bh - 5, bw - 6, 3, "#e4ded6");
    rect(bx + 3, by + bh - 5, Math.round((bw - 6) * r), 3, barColor(r));
  }

  // 컵 그림 이름. 휘핑크림을 넣었고 그 음료의 휘핑 그림이 있으면 휘핑 컵
  function cupFile(cup) {
    const d = drinkOf(cup.adds);
    return `${cup.temp}-${d}${cup.adds.includes("whip") && WHIP_ART.includes(d) ? "-whip" : ""}`;
  }
  // 휘핑 그림이 없는 음료에 휘핑크림을 넣었을 때: 컵 위에 작은 글자로 알려 줌
  const strayWhip = (cup) => cup.adds.includes("whip") && !WHIP_ART.includes(drinkOf(cup.adds));
  function drawCup(cup, x, by) {
    drawImg(cupFile(cup), x, by);
    if (strayWhip(cup)) text("+휘핑", x, by - 32, "#a0785a", 6);
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // 마우스를 올린 물건: 둥근 테두리로 은은하게
  function highlight(h) {
    roundRect(h.x - 1, h.y - 1, h.w + 2, h.h + 2, 4);
    ctx.fillStyle = "rgba(255, 246, 220, 0.30)";
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.stroke();
  }

  // 화면 옆 탭 (다른 화면으로 가기). alert면 빨갛게 깜빡임
  function navTab(n, label, arrow, alert, now) {
    const blink = alert && Math.floor(now / 350) % 2;
    roundRect(n.x + 0.5, n.y + 0.5, n.w - 1, n.h - 1, 6);
    ctx.fillStyle = blink ? "rgba(236, 160, 150, 0.96)" : "rgba(255, 250, 240, 0.94)";
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#7a5034";
    ctx.stroke();
    ctx.fillStyle = "#7a5034";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 8px system-ui, sans-serif";
    const cx = n.x + n.w / 2;
    ctx.fillText(arrow, cx, n.y + 9);
    [...label].forEach((ch, i) => ctx.fillText(ch, cx, n.y + 21 + i * 10));
  }

  function text(str, x, y, color, size = 8) {
    ctx.font = `bold ${size}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#fffdf8";
    ctx.strokeText(str, x, y);
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
  }

  // ---- 주문 화면 ----
  function drawOrderZone(now) {
    const bg = img("bg");
    if (bg) ctx.drawImage(bg, 0, 0, W, COUNTER_Y);
    else rect(0, 0, W, COUNTER_Y, "#f4dcc0");

    const guests = round.guests.slice().sort((a, b) => a.x - b.x);
    guests.forEach((g) => drawGuest(g, now));

    const top = img("counter");
    if (top) ctx.drawImage(top, 0, COUNTER_Y - 2);
    else rect(0, COUNTER_Y - 2, W, H - COUNTER_Y + 2, "#f6bb80");
    guests.forEach((g) => drawOrderBubble(g, now));

    // 픽업대 (쟁반 3칸)와 올린 음료
    PICKUP.forEach((x) => { shadow(x, BASE_Y + 1, 26); drawImg("tray", x, BASE_Y + 3); });
    round.pickup.forEach((d, i) => {
      const lifted = round.sel === i;
      if (lifted) highlight({ x: PICKUP[i] - 14, y: BASE_Y - 36, w: 28, h: 37 });
      drawCup(d, PICKUP[i], BASE_Y - (lifted ? 4 : 0));
    });
    if (!round.pickup.length) text("픽업대", 140, BASE_Y - 12, "#a0785a", 7);
    drawImg("hole", O.hole.cx, O.hole.by);

    for (const f of round.flying) if (f.zone === "order") drawCup(f.cup, f.cup.x, f.cup.y);
    for (const f of round.floats) {
      const t = (now - f.t0) / 1400;
      ctx.globalAlpha = 1 - t * t;
      text(f.text, f.x, f.y - t * 14, f.color);
      ctx.globalAlpha = 1;
    }
    navTab(O.nav, "제작", "▶", false, now);
  }

  // ---- 제작 화면 (그림 2배) ----
  function drawBrewZone(now) {
    ctx.save();
    ctx.scale(U, U);
    const bg = img("brew-bg");
    if (bg) ctx.drawImage(bg, 0, 0);
    else rect(0, 0, W / U, H / U, "#f4dcc0");

    // 선반 위 컵
    drawImg("hot-empty", B.hot.x, B.hot.y - 3);
    drawImg("hot-empty", B.hot.x, B.hot.y);
    drawImg("ice-empty", B.ice.x, B.ice.y - 3);
    drawImg("ice-empty", B.ice.x, B.ice.y);

    // 작업대 뒤쪽 재료 병
    for (const b of bottles()) {
      shadow(b.x, B.bottleY, 16);
      drawImg(b.id, b.x, B.bottleY - ((round.lift[b.id] || 0) > now ? 3 : 0));
    }

    // 앞쪽: 머신, 쟁반, 버리는 구멍
    shadow(B.machine.x, B.machine.y, 34);
    drawImg(`brew-machine${data().machine + 1}`, B.machine.x, B.machine.y);
    shadow(B.tray.x, B.tray.y + 2, 26);
    drawImg("tray", B.tray.x, B.tray.y + 2);
    drawImg("hole", B.hole.x, B.hole.y);
    if (whipOpen()) {
      shadow(B.whip.x, B.whip.y, 12);
      drawImg("whip", B.whip.x, B.whip.y - ((round.lift.whip || 0) > now ? 3 : 0));
    }

    if (round.cup) drawCup(round.cup, round.cup.x, round.cup.y);
    for (const f of round.flying) if (f.zone === "brew") drawCup(f.cup, f.cup.x, f.cup.y);
    for (const d of round.drops) {
      rect(Math.round(d.x) - 1, Math.round(d.y) - 1, 3, 3, "#3a2a24");
      rect(Math.round(d.x) - 1, Math.round(d.y), 3, 1, d.color);
      rect(Math.round(d.x), Math.round(d.y), 1, 1, d.color);
    }
    // 에스프레소 내리는 중: 머신 위 막대와 김
    if (round.brew) {
      const r = 1 - Math.max(0, round.brew.until - now) / round.brew.total;
      rect(B.machine.x - 15, B.machine.y - 49, 30, 4, "#3a2a24");
      rect(B.machine.x - 14, B.machine.y - 48, Math.round(28 * r), 2, "#e0b24f");
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      for (let i = 0; i < 3; i++) {
        const t = ((now / 900) + i / 3) % 1;
        ctx.globalAlpha = 1 - t;
        ctx.fillRect(Math.round(B.slot.x - 4 + i * 3 + Math.sin(t * 6 + i)), Math.round(B.slot.y - 28 - t * 10), 2, 2);
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    // 주문서 (도트 크기 그대로): 손님 자리 순서대로
    let hurry = false;
    SPOTS.forEach((_, i) => {
      const g = round.guests.find((x) => x.spot === i && x.state === "wait");
      if (!g) return;
      const r = ratio(g, now);
      if (r < CAFE_LATE_UNDER) hurry = true;
      const cx = B.tickets[i] + (r < 0.15 ? Math.round(Math.sin(now / 40)) : 0);
      const top = B.ticketTop;
      drawImg("ticket", cx, top + 39);
      drawImg(orderFile(g), cx, top + 33);
      rect(cx - 10, top + 34, 20, 2, "#e4ded6");
      rect(cx - 10, top + 34, Math.round(20 * r), 2, barColor(r));
    });
    navTab(B.nav, "주문", "◀", hurry, now);
  }

  // 영업 시작 알림 (처음 잠깐)
  function drawBanner(now) {
    const since = now - round.startAt;
    if (since >= 1400) return;
    ctx.globalAlpha = since < 1000 ? 1 : 1 - (since - 1000) / 400;
    roundRect(W / 2 - 40, 50, 80, 20, 10);
    ctx.fillStyle = "rgba(255, 250, 240, 0.96)"; ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = "#7a5034"; ctx.stroke();
    ctx.font = "bold 10px system-ui, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#7a5034";
    ctx.fillText("영업 시작!", W / 2, 60.5);
    ctx.globalAlpha = 1;
  }

  // 게임 오버 (마감 전 잠깐): 화면을 어둡게 하고, 글자가 왼쪽부터 하나씩 위로 튀어 오름 (0.9초마다 다시)
  function drawGameOver(now) {
    const t = now - round.overStart;
    ctx.fillStyle = `rgba(58, 42, 36, ${Math.min(0.35, t / 600)})`;
    ctx.fillRect(0, 0, W, H);
    roundRect(W / 2 - 64, 76, 128, 44, 12);
    ctx.fillStyle = "rgba(255, 250, 240, 0.97)"; ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = "#c0463a"; ctx.stroke();

    const chars = [...CAFE_OVER_TEXT];
    ctx.font = "bold 15px system-ui, sans-serif";
    ctx.textAlign = "left"; ctx.textBaseline = "middle";
    const widths = chars.map((c) => ctx.measureText(c).width);
    let x = W / 2 - widths.reduce((a, b) => a + b, 0) / 2;
    chars.forEach((c, i) => {
      const k = ((t - i * 60) % 900) / 300; // 글자마다 0.06초씩 늦게, 0.3초 동안 튀어 오름
      const lift = t >= i * 60 && k < 1 ? Math.sin(k * Math.PI) * 5 : 0;
      ctx.fillStyle = "#c0463a";
      ctx.fillText(c, x, 94 - lift);
      x += widths[i];
    });
    ctx.textAlign = "center";
    ctx.fillStyle = "#7a5034";
    ctx.font = "bold 7px system-ui, sans-serif";
    ctx.fillText(`실수 ${round.strikes}번`, W / 2, 111);
  }

  // 패널 제목줄: 매출과 남은 시간 (마지막 10초는 빨갛게)
  let hudText = "";
  function updateHud(now) {
    const left = Math.max(0, Math.ceil((round.endAt - now) / 1000));
    const key = `${round.sales}|${left}|${round.strikes}`;
    if (key === hudText) return;
    hudText = key;
    statusEl.innerHTML = `<span class="cafe-hud"><i class="coin"></i>${round.sales}</span>`
      + `<span class="cafe-hud${left <= 10 ? " hurry" : ""}">남은 ${left}초</span>`
      + `<span class="cafe-hud lives" title="실수할 수 있는 횟수">${"♥".repeat(mode().lives - round.strikes)}${"♡".repeat(round.strikes)}</span>`
      + (data().mode === "hard" ? `<span class="cafe-hud hard">${mode().name}</span>` : "");
  }

  function draw(now) {
    ctx.setTransform(PX, 0, 0, PX, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, W, H);

    // 화면 옮기는 중이면 두 화면을 옆으로 밀며 그림 (주문 화면이 왼쪽, 제작 화면이 오른쪽)
    let cam = round.zone === "brew" ? 1 : 0;
    if (round.slide) {
      const t = Math.min(1, (now - round.slide.t0) / SLIDE_MS);
      const e = 1 - (1 - t) * (1 - t);
      const from = round.slide.from === "brew" ? 1 : 0;
      cam = from + (cam - from) * e;
    }
    if (cam < 1) {
      ctx.save(); ctx.translate(Math.round(-cam * W), 0);
      drawOrderZone(now);
      if (hover && round.zone === "order" && hover.id !== "guest" && !round.slide) highlight(hover);
      ctx.restore();
    }
    if (cam > 0) {
      ctx.save(); ctx.translate(Math.round((1 - cam) * W), 0);
      drawBrewZone(now);
      if (hover && round.zone === "brew" && !round.slide) highlight(hover);
      ctx.restore();
    }

    const tip = round.tipUntil > now ? round.tip : hover ? hover.name : "";
    if (tip) text(tip, W / 2, H - 5, "#5a4636");
    drawBanner(now);
    if (round.overAt) drawGameOver(now);
  }

  // ---- 시작과 끝 ----
  // 그림을 미리 불러 둠 (첫 손님이 올 때 그림이 비지 않게)
  function preload() {
    const files = [...SCENE_ART, ...CAFE_INGREDIENTS.map((g) => g.id)];
    for (const t of ["hot", "ice"]) {
      for (const d of ["empty", ...MAKING, ...CAFE_MENU.map((m) => m.id)]) files.push(`${t}-${d}`);
      for (const d of WHIP_ART) files.push(`${t}-${d}-whip`);
    }
    files.forEach(img);
  }

  function startRound() {
    if (visiting || sideMode()) return;
    hudText = "";
    preload();
    round = newRound();
    view = "play";
    render();
    frame();
  }

  // 영업을 마치고 코인 받기 (하루 상한까지)
  function finish() {
    if (!round) return;
    const win = typeof pipWin !== "undefined" && pipWin ? pipWin : window;
    if (frameId) win.cancelAnimationFrame(frameId);
    frameId = null;
    const c = data();
    const id = data().mode;
    const coins = Math.max(0, Math.min(round.sales, mode().dailyMax - todayCoins(id)));
    daily().coins[id] = todayCoins(id) + coins;
    c.served += round.served;
    const best = round.sales > c.best;
    if (best) c.best = round.sales;
    lastResult = { sales: round.sales, served: round.served, missed: round.missed, coins, best, mode: mode().name, dailyMax: mode().dailyMax,
      over: !!round.overAt, strikes: round.strikes, lives: mode().lives, modeId: id,
      // 오늘 이 난이도 내 기록보다 높으면 이름을 적어 랭킹에 올릴 수 있음
      record: round.sales > 0 && round.sales <= CAFE_RANK_MAX_SCORE && round.sales > rankBest(id), entry: null };
    round = null;
    if (coins) {
      save.coins += coins;
      updateCoins(coins);
    }
    Save.save(save);
    view = "result";
    render();
  }

  // ---- HTML 화면 (영업 전, 결과) ----
  function el(tag, cls, txt) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }

  function render() {
    body.innerHTML = "";
    canvas = null;
    if (view === "play") return renderPlay();
    if (view === "result") return renderResult();
    renderLobby();
  }

  function stats() {
    const c = data();
    const row = el("div", "cafe-stats");
    row.append(
      ...CAFE_MODES.map((m) => el("span", "", `오늘 ${m.name} 코인 ${todayCoins(m.id)}/${m.dailyMax}`)),
      el("span", "", `최고 매출 ${c.best}`),
      el("span", "", `누적 손님 ${c.served}`),
    );
    return row;
  }

  // 영업 전·결과 화면 위쪽의 가게 그림 띠
  function hero(title) {
    const h = el("div", "cafe-hero");
    if (title) h.append(el("span", "cafe-hero-title", title));
    return h;
  }

  // 난이도 고르기 (계정에 저장)
  function modePicker() {
    const wrap = el("div", "cafe-modes");
    for (const m of CAFE_MODES) {
      const sec = m.patience * (data().chair ? 1.3 : 1);
      const b = el("button", m.id === data().mode ? "active" : "", `${m.name} · 손님 ${Math.round(sec * 10) / 10}초 · 팁 +${m.tip}`);
      b.type = "button";
      b.addEventListener("click", () => {
        if (data().mode === m.id) return;
        data().mode = m.id;
        Save.save(save);
        render();
      });
      wrap.append(b);
    }
    return wrap;
  }

  function renderLobby() {
    statusEl.textContent = "";
    const c = data();
    const intro = el("p", "cafe-text",
      "손님이 주문하면 제작 화면에서 컵을 꺼내고, 에스프레소를 내리고, 재료를 넣어 픽업대로 보낸 뒤 손님을 눌러 건네요. 빨리 주면 팁을 받고, 너무 기다리게 하면 화내며 나가요. "
      + `화나서 나간 손님과 잘못 건넨 음료는 실수예요. 실수가 ${mode().lives}번 쌓이면 영업이 끝나요.`);
    const start = el("button", "primary cafe-start", "영업 시작");
    start.type = "button";
    start.addEventListener("click", startRound);
    if (todayCoins(data().mode) >= mode().dailyMax) {
      const other = CAFE_MODES.find((m) => todayCoins(m.id) < m.dailyMax);
      intro.textContent = other
        ? `오늘 ${mode().name} 난이도로 받을 수 있는 코인은 다 받았어요. ${other.name} 난이도로 받거나, 영업은 계속 연습할 수 있어요.`
        : "오늘 받을 수 있는 카페 코인은 다 받았어요. 영업은 계속 연습할 수 있어요.";
    }

    body.append(hero(), intro, modePicker(), start, stats(), rankBoard(), menuBoard(), el("h3", "cafe-sub", "가게 늘리기"));

    const list = el("div", "cafe-shop");
    for (const m of CAFE_MENU.filter((x) => x.unlock)) {
      const owned = c.menu.includes(m.id);
      list.append(shopRow(cupArt("hot", m.id, 1), `${m.name} 메뉴`, `${m.price}코인짜리 새 메뉴`, owned ? null : m.unlock, () => {
        c.menu.push(m.id);
      }));
    }
    for (const u of CAFE_UPGRADES) {
      const lv = c[u.id];
      const max = lv >= u.prices.length;
      const multi = u.prices.length > 1;
      const name = multi ? `${u.name} (지금 ${lv + 1}단계)` : u.name;
      const desc = multi && !max ? `${u.desc} · ${lv + 2}단계로 올리기` : u.desc;
      const pic = u.id === "machine" ? `machine${Math.min(lv + 2, 3)}` : u.id; // 커피 머신은 다음 단계 그림
      list.append(shopRow(art(pic, ART_SIZE.upgrade, 1), name, desc, max ? null : u.prices[lv], () => {
        c[u.id] = lv + 1;
      }));
    }
    body.append(list);
  }

  function shopRow(pic, name, desc, price, buy) {
    const row = el("div", "cafe-item");
    const icon = el("div", "cafe-item-pic");
    icon.append(pic);
    const info = el("div", "cafe-item-info");
    info.append(el("strong", "", name), el("span", "", desc));
    const btn = el("button", "", price == null ? "보유" : "");
    btn.type = "button";
    if (price == null) btn.disabled = true;
    else {
      btn.innerHTML = `<i class="coin"></i>${price}`;
      btn.disabled = save.coins < price;
      btn.addEventListener("click", () => {
        if (save.coins < price) return;
        save.coins -= price;
        buy();
        updateCoins();
        Save.save(save);
        render();
      });
    }
    row.append(icon, info, btn);
    return row;
  }

  function menuBoard() {
    const box = el("div", "cafe-board");
    box.append(el("h3", "cafe-sub", "메뉴판"));
    for (const m of menuOpen()) {
      const row = el("div", "cafe-recipe");
      const name = el("span", "cafe-recipe-name");
      name.append(cupArt("hot", m.id, 1), document.createTextNode(`${m.name} ${m.price}`));
      row.append(name, el("span", "", m.recipe.map(ingName).join(" + ") + (m.whip ? " (+ 휘핑크림)" : "")));
      box.append(row);
    }
    box.append(el("p", "cafe-note", "따뜻한 컵과 아이스 컵은 주문에 맞춰 골라요. 재료 순서는 상관없어요."));
    if (whipOpen()) box.append(el("p", "cafe-note", `휘핑크림이 올라간 주문은 휘핑크림까지 넣어요. (+${CAFE_WHIP_PRICE}코인)`));
    box.append(el("p", "cafe-note", "정장 입은 큰손 손님은 팁을 많이 주고, 휴대폰 든 급한 손님은 금방 화를 내요."));
    return box;
  }

  // 영업 중 아래쪽 레시피 (짧게, 두 칸씩)
  function recipeGrid() {
    const box = el("div", "cafe-grid");
    for (const m of menuOpen()) {
      const item = el("div", "cafe-grid-item");
      const info = el("div", "cafe-grid-info");
      info.append(el("strong", "", `${m.name} ${m.price}`), el("span", "", m.recipe.map(ingName).join(" + ") + (m.whip ? " (+휘핑)" : "")));
      item.append(cupArt("hot", m.id, 1), info);
      box.append(item);
    }
    return box;
  }

  function renderPlay() {
    const wrap = el("div", "cafe-scene");
    canvas = el("canvas", "cafe-canvas");
    canvas.width = W * PX;
    canvas.height = H * PX;
    ctx = canvas.getContext("2d");
    canvas.addEventListener("pointerdown", (e) => {
      if (!round) return;
      e.preventDefault();
      canvas.focus({ preventScroll: true });
      const h = hit(...toLocal(e), e.pointerType === "mouse" ? 0 : 8);
      if (h) h.act();
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!round) return;
      hover = e.pointerType === "mouse" ? hit(...toLocal(e)) : null;
      canvas.style.cursor = hover ? "pointer" : "default";
    });
    canvas.addEventListener("pointerleave", () => { hover = null; });
    // 키보드 ← → 로 주문·제작 화면 옮기기 (캔버스를 누른 뒤)
    canvas.tabIndex = 0;
    canvas.addEventListener("keydown", (e) => {
      if (!round) return;
      if (e.key === "ArrowRight") { goZone("brew"); e.preventDefault(); }
      if (e.key === "ArrowLeft") { goZone("order"); e.preventDefault(); }
    });

    wrap.append(canvas);
    body.append(wrap, recipeGrid());
  }

  function renderResult() {
    statusEl.textContent = "";
    const r = lastResult;
    body.append(hero(r.over ? CAFE_OVER_TEXT : r.best && r.sales ? "최고 매출 달성!" : "오늘 영업 끝"));
    const box = el("div", "cafe-result");
    const dl = el("dl", "cafe-result-list");
    for (const [k, v] of [["난이도", r.mode], ["매출", r.sales], ["손님", `${r.served}명`], ["놓친 손님", `${r.missed}명`], ["실수", `${r.strikes}/${r.lives}`], ["받은 코인", r.coins]]) {
      dl.append(el("dt", "", k), el("dd", "", String(v)));
    }
    box.append(dl);
    if (r.over) box.append(el("p", "cafe-note", `실수가 ${r.lives}번 쌓여서 영업을 일찍 마쳤어요. 그때까지의 매출은 받아요.`));
    if (r.coins < r.sales) box.append(el("p", "cafe-note", `${r.mode} 난이도 카페 코인은 하루 ${r.dailyMax}까지 받을 수 있어요.`));
    if (r.record) box.append(nameEntry(r));
    const row = el("div", "cafe-actions");
    const again = el("button", "primary", "다시 영업");
    again.type = "button";
    again.addEventListener("click", startRound);
    const lobby = el("button", "", "가게로");
    lobby.type = "button";
    lobby.addEventListener("click", () => { view = "lobby"; render(); });
    row.append(lobby, again);
    box.append(row);
    body.append(box);
  }

  // ---- 일일 랭킹 ----
  const db = () => (typeof Cloud !== "undefined" ? Cloud.client() : null); // 로그인하고 계정을 맞춘 뒤에만
  const kstDay = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10); // 랭킹 날짜는 한국 기준
  const modeName = (id) => (CAFE_MODES.find((m) => m.id === id) || {}).name;
  let rankTab = null; // 영업 전 화면에서 보고 있는 랭킹 난이도

  // 오늘 이 난이도로 랭킹에 올린 내 점수 (이 기기에 기억, 날이 바뀌면 0)
  function rankBest(id) {
    const c = data();
    if (!c.rankBest || c.rankBest.day !== kstDay()) c.rankBest = { day: kstDay() };
    return c.rankBest[id] || 0;
  }

  // 랭킹 표 (상위 CAFE_RANK_SHOW명 + 순위 밖이면 내 줄). 불러오는 동안 자리만 잡아 둠
  function rankTable(id) {
    const box = el("div", "cafe-rank-list");
    box.append(el("p", "cafe-note", "불러오는 중…"));
    const client = db();
    if (!client) return box;
    client.rpc("cafe_ranking", { p_mode: id, p_limit: CAFE_RANK_SHOW }).then(({ data: rows, error }) => {
      box.innerHTML = "";
      if (error) return box.append(el("p", "cafe-note", "랭킹을 불러오지 못했어요."));
      if (!rows || !rows.length) return box.append(el("p", "cafe-note", "아직 오늘 기록이 없어요. 첫 1위가 되어 보세요."));
      rows.forEach((x, i) => {
        if (i && x.rank > rows[i - 1].rank + 1) box.append(el("div", "cafe-rank-gap", "⋯"));
        const line = el("div", "cafe-rank-row" + (x.mine ? " mine" : "") + (x.rank === 1 ? " first" : ""));
        line.append(el("span", "cafe-rank-no", String(x.rank)), el("span", "cafe-rank-name", x.name), el("span", "cafe-rank-score", String(x.score)));
        box.append(line);
      });
    });
    return box;
  }

  // 영업 전 화면의 "오늘의 랭킹"
  function rankBoard() {
    const box = el("div", "cafe-board");
    box.append(el("h3", "cafe-sub", "오늘의 랭킹"));
    if (!db()) {
      box.append(el("p", "cafe-note", "구글 로그인을 하면 일일 랭킹에 참여할 수 있어요."));
      return box;
    }
    const tab = rankTab || data().mode;
    const tabs = el("div", "cafe-modes cafe-rank-tabs");
    for (const m of CAFE_MODES) {
      const b = el("button", m.id === tab ? "active" : "", m.name);
      b.type = "button";
      b.addEventListener("click", () => {
        if (tab === m.id) return;
        rankTab = m.id;
        box.replaceWith(rankBoard());
      });
      tabs.append(b);
    }
    box.append(tabs, rankTable(tab),
      el("p", "cafe-note", `오늘 최고 기록을 내면 이름을 남길 수 있어요. 자정(한국 시각)이 지나면 1위에게 어려움 ${CAFE_RANK_PRIZE.hard}코인, 보통 ${CAFE_RANK_PRIZE.normal}코인을 줘요.`));
    return box;
  }

  // 결과 화면: 오락실처럼 영문 3글자 이름 적기 (▲▼ 버튼이나 키보드)
  function nameEntry(r) {
    const box = el("div", "cafe-entry");
    if (!db()) {
      box.append(el("p", "cafe-note", "오늘 최고 기록이에요. 구글 로그인을 하면 일일 랭킹에 올릴 수 있어요."));
      return box;
    }
    if (r.entry && r.entry.done) {
      box.append(el("p", "cafe-entry-title", r.entry.text), rankTable(r.modeId));
      return box;
    }
    const c = data();
    const e = r.entry || (r.entry = { letters: ((c.rankName || "AAA") + "AAA").slice(0, 3).split(""), at: 0, busy: false });
    box.append(el("p", "cafe-entry-title", `오늘 ${r.mode} 최고 기록! 이름을 남겨 주세요`));

    const slots = el("div", "cafe-entry-slots");
    slots.tabIndex = 0;
    const cells = e.letters.map((_, i) => {
      const cell = el("div", "cafe-entry-cell");
      const up = el("button", "cafe-entry-arrow", "▲");
      const down = el("button", "cafe-entry-arrow", "▼");
      const letter = el("span", "cafe-entry-letter");
      up.type = down.type = "button";
      up.setAttribute("aria-label", `${i + 1}번째 글자 앞으로`);
      down.setAttribute("aria-label", `${i + 1}번째 글자 뒤로`);
      up.addEventListener("click", () => { e.at = i; shift(-1); });
      down.addEventListener("click", () => { e.at = i; shift(1); });
      letter.addEventListener("click", () => { e.at = i; paint(); slots.focus({ preventScroll: true }); });
      cell.append(up, letter, down);
      slots.append(cell);
      return { cell, letter };
    });
    const submit = el("button", "primary", "등록");
    submit.type = "button";
    const msg = el("p", "cafe-note");

    function paint() {
      cells.forEach((x, i) => {
        x.letter.textContent = e.letters[i];
        x.cell.classList.toggle("active", i === e.at);
      });
    }
    function shift(d) {
      const k = CAFE_LETTERS.indexOf(e.letters[e.at]);
      e.letters[e.at] = CAFE_LETTERS[(k + d + CAFE_LETTERS.length) % CAFE_LETTERS.length];
      paint();
    }
    slots.addEventListener("keydown", (ev) => {
      const key = ev.key;
      if (/^[a-zA-Z]$/.test(key)) { e.letters[e.at] = key.toUpperCase(); e.at = Math.min(2, e.at + 1); paint(); }
      else if (key === "ArrowUp") shift(-1);
      else if (key === "ArrowDown") shift(1);
      else if (key === "ArrowLeft" || key === "Backspace") { e.at = Math.max(0, e.at - 1); paint(); }
      else if (key === "ArrowRight") { e.at = Math.min(2, e.at + 1); paint(); }
      else if (key === "Enter") send();
      else return;
      ev.preventDefault();
    });

    async function send() {
      const client = db();
      if (e.busy || !client) return;
      e.busy = true;
      submit.disabled = true;
      msg.textContent = "올리는 중…";
      const name = e.letters.join("");
      const { data: rows, error } = await client.rpc("submit_cafe_score", { p_mode: r.modeId, p_name: name, p_score: r.sales });
      e.busy = false;
      if (error || !rows || !rows[0]) {
        submit.disabled = false;
        msg.textContent = "올리지 못했어요. 잠시 후 다시 시도해 주세요.";
        return;
      }
      const res = rows[0];
      c.rankName = name;
      rankBest(r.modeId);
      c.rankBest[r.modeId] = res.best;
      Save.save(save);
      e.done = true;
      e.text = res.updated
        ? `${name} · ${r.sales} · 오늘 ${r.mode} ${res.rank}위에 올랐어요!`
        : `다른 기기에서 낸 오늘 기록(${res.best})이 더 높아요. 지금 ${r.mode} ${res.rank}위예요.`;
      if (view === "result" && lastResult === r) render();
    }
    submit.addEventListener("click", send);

    paint();
    box.append(slots, submit, msg, el("p", "cafe-note", "▲▼나 키보드로 입력하고 Enter로 등록해요."));
    setTimeout(() => slots.focus({ preventScroll: true }), 0);
    return box;
  }

  // 지난 날 1위 보상 받기 (로그인할 때, 카페를 열 때). 서버가 한 번만 주도록 막음
  let claiming = false;
  async function claimRewards() {
    const client = db();
    if (!client || claiming || visiting) return;
    claiming = true;
    const { data: rows, error } = await client.rpc("claim_cafe_rewards");
    claiming = false;
    if (error || !rows || !rows.length) return;
    let total = 0;
    for (const x of rows) {
      total += x.amount;
      const [, mm, dd] = String(x.day).split("-").map(Number);
      notify(`${mm}/${dd} 카페 ${modeName(x.mode)} 랭킹 1위! ${x.amount}코인을 받았어요.`);
    }
    save.coins += total;
    Save.save(save);
    updateCoins(total);
  }

  // ---- 패널 열기/닫기 ----
  // 세로 보기(세로 창)에서는 화면 비율이 맞지 않아 열지 않음
  const sideMode = () => app.ownerDocument.body.classList.contains("side-mode");

  function open() {
    if (visiting || sideMode()) return;
    if (editing) setEditing(false);
    closeShop();
    if (typeof Focus !== "undefined") Focus.close();
    if (typeof Friends !== "undefined") Friends.close();
    panel.hidden = false;
    openBtn.classList.add("active");
    if (!round) { view = view === "play" ? "lobby" : view; render(); }
    claimRewards();
  }

  // 닫으면 영업 중이던 판은 그때까지의 매출로 마감
  function close() {
    if (round) finish();
    if (view === "result") view = "lobby";
    panel.hidden = true;
    openBtn.classList.remove("active");
  }

  openBtn.addEventListener("click", () => (panel.hidden ? open() : close()));
  $("cafe-close").addEventListener("click", close);

  // round: 테스트에서 지금 영업 상태를 확인할 때 씀
  return { open, close, claimRewards, round: () => round };
})();

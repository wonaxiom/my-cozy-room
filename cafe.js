// =============================================================
// cafe.js — 카페 운영 미니게임 (타이쿤)
// 카운터 너머로 손님이 들어와 주문하면, 컵을 꺼내고 머신으로 에스프레소를 내리고
// 재료를 넣어 만든 뒤 손님을 눌러 건네줍니다.
// 빨리 주면 팁, 오래 기다리게 하면 덜 내고, 시간이 다 되면 화내며 나갑니다.
// 판 매출은 코인으로 받고(하루 상한), 코인으로 메뉴와 장비를 늘립니다.
// =============================================================

const CAFE_ROUND_SECONDS = 90;  // 한 판 영업 시간
const CAFE_DAILY_MAX = 80;      // 하루에 카페에서 받을 수 있는 코인
const CAFE_SEATS = 3;           // 카운터 앞에 설 수 있는 손님 수
const CAFE_PATIENCE = 25;       // 손님이 기다리는 시간(초)
const CAFE_SHOT_SECONDS = [2.0, 1.3, 0.7]; // 커피 머신 단계별 에스프레소 내리는 시간
// 기다림이 얼마나 남았을 때 건넸는지에 따라: 넉넉하면 팁, 조금 남았으면 덜 냄
const CAFE_TIP_OVER = 0.6;      // 기다림이 60% 넘게 남으면 팁
const CAFE_TIP = 2;
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
];

// 메뉴: recipe는 넣어야 할 재료 (순서는 상관없음), unlock이 있으면 그 메뉴를 사야 나옴
const CAFE_MENU = [
  { id: "americano", name: "아메리카노", price: 4, recipe: ["shot", "water"] },
  { id: "latte", name: "카페라떼", price: 5, recipe: ["shot", "milk"] },
  { id: "vanilla", name: "바닐라 라떼", price: 6, recipe: ["shot", "milk", "vanilla"], unlock: 80 },
  { id: "choco", name: "초코 라떼", price: 6, recipe: ["choco", "milk"], unlock: 120 },
  { id: "matcha", name: "녹차 라떼", price: 7, recipe: ["matcha", "milk"], unlock: 160 },
];

// 장비 업그레이드: level은 지금 단계, prices는 다음 단계로 올리는 가격
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
  const menuBtn = $("cafe-menu-btn");

  // ---- 저장 데이터 ----
  // 예전 저장에 없는 값만 채움 (같은 객체를 계속 써야 산 것이 저장됨)
  function data() {
    const c = save.cafe || (save.cafe = {});
    const base = { machine: 0, chair: 0, sign: 0, served: 0, best: 0 };
    for (const k in base) if (typeof c[k] !== "number") c[k] = base[k];
    if (!Array.isArray(c.menu)) c.menu = [];
    if (!c.daily) c.daily = {};
    return c;
  }

  function today() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  function daily() {
    const c = data();
    if (c.daily.date !== today()) c.daily = { date: today(), coins: 0 };
    return c.daily;
  }

  const menuOpen = () => CAFE_MENU.filter((m) => !m.unlock || data().menu.includes(m.id));
  const ingredientOpen = () => CAFE_INGREDIENTS.filter((g) => menuOpen().some((m) => m.recipe.includes(g.id)));
  const shotSeconds = () => CAFE_SHOT_SECONDS[data().machine] || CAFE_SHOT_SECONDS[0];
  const patience = () => CAFE_PATIENCE * (data().chair ? 1.3 : 1);
  const spawnGap = () => (data().sign ? [3.5, 6] : [5, 8]);
  const ingName = (id) => (CAFE_INGREDIENTS.find((g) => g.id === id) || {}).name;

  // ---- 그림 (img/cafe/, 정리 스크립트: art-src/tools/cafe_proc.py) ----
  // 그림 크기 [가로, 세로] (도트)
  const ART_SIZE = { hot: [25, 27], ice: [22, 30], ingredient: [20, 28], upgrade: [43, 45] };

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
  // 가게 배경·카운터·휴지통·표정 그림은 받은 것만 SCENE_ART에 적음. 없는 것은 코드로 그린 임시 그림을 씀
  const SCENE_ART = [];   // 예: ["bg", "counter", "trash", "tray", "heart", "angry"]
  const OPTIONAL_ART = ["bg", "counter", "trash", "tray", "heart", "angry"];
  const images = {};
  function img(file) {
    if (OPTIONAL_ART.includes(file) && !SCENE_ART.includes(file)) return null;
    if (!images[file]) {
      const i = new Image();
      i.src = `img/cafe/${file}.png`;
      images[file] = i;
    }
    const i = images[file];
    return i.complete && i.naturalWidth ? i : null;
  }

  // 지금 넣은 재료와 가장 가까운 음료 그림 (만드는 중에도 컵이 채워지는 모습)
  function drinkOf(adds) {
    const exact = CAFE_MENU.find((m) => sameRecipe(m.recipe, adds));
    if (exact) return exact.id;
    if (adds.includes("matcha")) return "matcha";
    if (adds.includes("choco")) return "choco";
    if (adds.includes("vanilla") && (adds.includes("shot") || adds.includes("milk"))) return "vanilla";
    if (adds.includes("milk")) return "latte";
    if (adds.includes("shot")) return "americano";
    return "empty";
  }

  function sameRecipe(a, b) {
    return a.length === b.length && [...a].sort().join() === [...b].sort().join();
  }

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
  // 가게 화면 (캔버스)
  // 위쪽은 가게 안(문, 창문, 손님이 서는 자리), 아래쪽은 내가 일하는 카운터.
  // 좌표는 280 × 208 도트 기준이고, 캔버스는 2배로 그려서 글자가 또렷하게 보이게 함
  // =============================================================
  const W = 280, H = 208, PX = 2;
  const COUNTER_Y = 120;   // 카운터 윗선 (손님 다리는 이 아래로 가려짐)
  const BASE_Y = 196;      // 카운터 위 물건의 바닥선
  const DOOR_X = 26;       // 손님이 드나드는 문 가운데
  const SPOTS = [104, 162, 220]; // 손님이 서는 자리 (가운데 x)
  const FEET_Y = 130;      // 손님 발 위치 (발은 카운터에 가려짐)
  const GUEST_H = 70;      // 손님 키
  const WALK = 55;         // 걷는 속도 (도트/초)

  // 카운터 위 자리 (바닥 가운데 x, 바닥 y)
  const SPOT = {
    hot: { x: 19, y: BASE_Y },
    ice: { x: 47, y: BASE_Y },
    machine: { x: 62, w: 43 },  // 머신 왼쪽 x, 폭
    slot: { x: 83, y: BASE_Y - 3 }, // 머신 안 컵 자리
    tray: { x: 129, y: BASE_Y - 2 },
    bottles: 154,               // 첫 재료 병 왼쪽 x (22씩 오른쪽으로)
    trash: { x: 264, y: 176, w: 15, h: 20 },
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
      endAt: now + CAFE_ROUND_SECONDS * 1000,
      nextAt: now + 800,
      guests: [],         // 손님
      cup: null,          // { temp, adds, at: "tray" | "machine", x, y, anim }
      brew: null,         // { until, total } 에스프레소 내리는 중
      drops: [],          // 병에서 컵으로 떨어지는 방울
      lift: {},           // 재료 병 들어 올린 시각 { 재료id: 끝나는 시각 }
      floats: [],         // 떠오르는 글자 (코인, 팁, 화남)
      flying: null,       // 손님에게 날아가는 컵 { cup, guest, anim }
      tip: "",            // 아래쪽 안내 글
      tipUntil: 0,
      sales: 0,
      served: 0,
      missed: 0,
      last: now,
    };
  }

  // 위치를 부드럽게 옮기기 (dur 밀리초 동안)
  function tween(obj, tx, ty, dur, done) {
    obj.anim = { fx: obj.x, fy: obj.y, tx, ty, t0: Date.now(), dur, done };
  }
  function stepTween(obj, now) {
    const a = obj.anim;
    if (!a) return;
    const t = Math.min(1, (now - a.t0) / a.dur);
    const e = 1 - (1 - t) * (1 - t);
    obj.x = a.fx + (a.tx - a.fx) * e;
    obj.y = a.fy + (a.ty - a.fy) * e - Math.sin(t * Math.PI) * (a.arc || 0);
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

  // ---- 손님 오고 가기 ----
  function spawn() {
    const taken = round.guests.map((g) => g.spot);
    const free = SPOTS.map((_, i) => i).filter((i) => !taken.includes(i));
    if (!free.length) return;
    const look = randomLook();
    round.guests.push({
      spot: pick(free),
      look,
      art: trimmed(makeHeroPreview(look)),
      menu: pick(menuOpen()),
      temp: Math.random() < 0.5 ? "hot" : "ice",
      x: DOOR_X,
      state: "enter",   // enter(들어오는 중) / wait(주문하고 기다림) / leave(나가는 중)
      until: 0,
      total: patience() * 1000,
      mood: null,       // 나갈 때 표정: happy / angry
      wrongUntil: 0,    // "이게 아니에요" 보여 주는 동안
    });
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
        if (g.x >= target) { g.state = "wait"; g.until = now + g.total; }
      } else if (g.state === "wait" && now >= g.until) {
        round.missed += 1;
        floatText(g.x, FEET_Y - GUEST_H - 14, "흥! 너무 늦어요", "#c0463a");
        leave(g, "angry");
      } else if (g.state === "leave") {
        g.x -= WALK * 1.2 * dt;
      }
    }
    round.guests = round.guests.filter((g) => !(g.state === "leave" && g.x <= DOOR_X));
  }

  // ---- 만들기 ----
  function takeCup(temp) {
    if (round.cup) {
      if (round.cup.at !== "tray" || round.cup.anim) return say("컵이 머신에 있어요.");
      if (round.cup.adds.length) return say("만들던 음료는 휴지통에 버리고 새 컵을 꺼내요.");
      if (round.cup.temp === temp) return;
    }
    const from = SPOT[temp];
    const cup = { temp, adds: [], at: "tray", x: from.x, y: from.y - 6 };
    round.cup = cup;
    tween(cup, SPOT.tray.x, SPOT.tray.y, 220);
    cup.anim.arc = 10;
  }

  function useMachine() {
    const cup = round.cup;
    if (!cup) return say("컵을 먼저 꺼내 주세요.");
    if (cup.at !== "tray" || cup.anim) return;
    if (cup.adds.includes("shot")) return say("에스프레소는 이미 넣었어요.");
    cup.at = "machine";
    tween(cup, SPOT.slot.x, SPOT.slot.y, 220, () => {
      const total = shotSeconds() * 1000;
      round.brew = { until: Date.now() + total, total };
    });
    cup.anim.arc = 6;
  }

  function finishBrew() {
    const cup = round.cup;
    round.brew = null;
    if (!cup) return;
    cup.adds.push("shot");
    tween(cup, SPOT.tray.x, SPOT.tray.y, 220, () => { cup.at = "tray"; });
    cup.anim.arc = 6;
  }

  function pour(id, bx) {
    const cup = round.cup;
    if (!cup) return say("컵을 먼저 꺼내 주세요.");
    if (cup.at !== "tray" || cup.anim) return say("컵이 머신에서 나올 때까지 기다려요.");
    if (cup.adds.includes(id) || round.drops.some((d) => d.id === id)) return say(`${ingName(id)}는 이미 넣었어요.`);
    const now = Date.now();
    round.lift[id] = now + 380;
    const g = CAFE_INGREDIENTS.find((x) => x.id === id);
    const drop = { id, color: g.drop, x: bx + 10, y: BASE_Y - 30 };
    tween(drop, SPOT.tray.x, SPOT.tray.y - 22, 320, () => {
      round.drops = round.drops.filter((d) => d !== drop);
      if (round.cup === cup) cup.adds.push(id);
    });
    drop.anim.arc = 14;
    round.drops.push(drop);
  }

  function trash() {
    const cup = round.cup;
    if (!cup || cup.at !== "tray" || cup.anim) return;
    round.cup = null;
    round.flying = { cup, trash: true };
    tween(cup, SPOT.trash.x + 7, SPOT.trash.y + 6, 240, () => { round.flying = null; });
    cup.anim.arc = 12;
  }

  function serve(g) {
    const cup = round.cup;
    if (g.state !== "wait") return;
    if (!cup) return say("음료를 만들어서 건네요.");
    if (cup.at !== "tray" || cup.anim || round.drops.length) return;
    if (!cup.adds.length) return say("빈 컵이에요.");
    round.cup = null;
    round.flying = { cup, guest: g };
    tween(cup, g.x, FEET_Y - GUEST_H + 10, 260, () => {
      round.flying = null;
      judge(g, cup);
    });
    cup.anim.arc = 18;
  }

  // 건넨 음료 확인: 맞으면 기다린 시간에 따라 값을 받고, 틀리면 돌려받음
  function judge(g, cup) {
    if (g.state !== "wait") return;
    const headY = FEET_Y - GUEST_H;
    if (cup.temp !== g.temp || !sameRecipe(cup.adds, g.menu.recipe)) {
      g.until -= g.total * 0.2;
      g.wrongUntil = Date.now() + 1200;
      floatText(g.x, headY - 6, "이게 아니에요", "#c0463a");
      return;
    }
    const left = (g.until - Date.now()) / g.total;
    let pay = g.menu.price, note = "";
    if (left > CAFE_TIP_OVER) { pay += CAFE_TIP; note = ` (팁 ${CAFE_TIP})`; }
    else if (left < CAFE_LATE_UNDER) { pay = Math.max(1, pay - CAFE_LATE_CUT); note = " (늦었어요)"; }
    round.sales += pay;
    round.served += 1;
    floatText(g.x, headY - 6, `+${pay}${note}`, left < CAFE_LATE_UNDER ? "#a0743a" : "#4f7a3a");
    leave(g, "happy");
  }

  // ---- 누를 수 있는 곳 ----
  function bottles() {
    return ingredientOpen().filter((g) => g.id !== "shot").map((g, i) => ({ id: g.id, x: SPOT.bottles + i * 22 }));
  }

  function hotspots() {
    const list = [
      { id: "hot", name: "따뜻한 컵", x: 5, y: BASE_Y - 34, w: 28, h: 36, act: () => takeCup("hot") },
      { id: "ice", name: "아이스 컵", x: 35, y: BASE_Y - 36, w: 25, h: 38, act: () => takeCup("ice") },
      { id: "machine", name: "커피 머신 (에스프레소)", x: SPOT.machine.x, y: BASE_Y - 46, w: SPOT.machine.w, h: 48, act: useMachine },
    ];
    for (const b of bottles()) list.push({ id: b.id, name: ingName(b.id), x: b.x, y: BASE_Y - 30, w: 21, h: 32, act: () => pour(b.id, b.x) });
    list.push({ id: "trash", name: "휴지통", ...SPOT.trash, act: trash });
    for (const g of round.guests) {
      if (g.state !== "wait") continue;
      list.push({ id: "guest", guest: g, name: "손님에게 건네기", x: g.x - 18, y: FEET_Y - GUEST_H - 42, w: 36, h: COUNTER_Y - (FEET_Y - GUEST_H - 42), act: () => serve(g) });
    }
    return list;
  }

  function hit(px, py) {
    const list = hotspots();
    for (let i = list.length - 1; i >= 0; i--) {
      const h = list[i];
      if (px >= h.x && px <= h.x + h.w && py >= h.y && py <= h.y + h.h) return h;
    }
    return null;
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
    if (round.flying) stepTween(round.flying.cup, now);
    round.drops.slice().forEach((d) => stepTween(d, now));
    stepGuests(now, dt);
    round.floats = round.floats.filter((f) => now - f.t0 < 1400);

    if (now >= round.nextAt && now < round.endAt - 8000) {
      spawn();
      const [a, b] = spawnGap();
      round.nextAt = now + (a + Math.random() * (b - a)) * 1000;
    }
    if (now >= round.endAt) return finish();

    const left = Math.max(0, Math.ceil((round.endAt - now) / 1000));
    statusEl.textContent = `남은 시간 ${left}초 · 매출 ${round.sales}`;
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

  // 임시 배경 (GPT 배경 그림 img/cafe/bg.png 를 받으면 그 그림을 씀)
  function drawRoom() {
    const bg = img("bg");
    if (bg) { ctx.drawImage(bg, 0, 0, W, COUNTER_Y); return; }
    rect(0, 0, W, COUNTER_Y, "#f1e6d4");                 // 벽
    rect(0, 86, W, COUNTER_Y - 86, "#c9a27a");           // 벽 아래 나무판
    rect(0, 86, W, 2, "#a77f5a");
    for (let x = 6; x < W; x += 16) rect(x, 90, 1, COUNTER_Y - 90, "#b8916b");
    // 문
    rect(DOOR_X - 16, 30, 32, COUNTER_Y - 30, "#7a5034");
    rect(DOOR_X - 13, 33, 26, COUNTER_Y - 33, "#a8774f");
    rect(DOOR_X - 9, 38, 18, 22, "#cfe3ee");
    rect(DOOR_X + 7, 78, 3, 3, "#e8c66a");
    // 메뉴판
    rect(124, 14, 64, 36, "#7a5034");
    rect(126, 16, 60, 32, "#3f4a3c");
    for (let i = 0; i < 4; i++) rect(132, 22 + i * 7, 26 + (i % 2) * 10, 2, "#d8d2c2");
    // 창문
    rect(204, 14, 56, 44, "#7a5034");
    rect(207, 17, 50, 38, "#bfdcec");
    rect(231, 17, 2, 38, "#7a5034");
    rect(207, 35, 50, 2, "#7a5034");
    // 화분
    rect(64, 70, 14, 16, "#c0714a");
    rect(60, 56, 22, 14, "#7fa864");
  }

  function drawCounter() {
    const top = img("counter");
    if (top) { ctx.drawImage(top, 0, COUNTER_Y - 4, W, H - COUNTER_Y + 4); return; }
    rect(0, COUNTER_Y - 4, W, 6, "#8a5e3c");             // 손님 쪽 모서리
    rect(0, COUNTER_Y + 2, W, H - COUNTER_Y, "#c79a6c"); // 카운터 윗면
    for (let y = COUNTER_Y + 14; y < H; y += 14) rect(0, y, W, 1, "#b88c60");
  }

  function drawTray() {
    if (img("tray")) return drawImg("tray", SPOT.tray.x, SPOT.tray.y + 3);
    rect(SPOT.tray.x - 17, SPOT.tray.y - 2, 34, 5, "#8a8f96");
    rect(SPOT.tray.x - 17, SPOT.tray.y - 2, 34, 1, "#b7bcc2");
  }

  function drawTrash() {
    const t = SPOT.trash;
    if (img("trash")) return drawImg("trash", t.x + t.w / 2, t.y + t.h);
    rect(t.x, t.y + 3, t.w, t.h - 3, "#7d8590");
    rect(t.x - 1, t.y, t.w + 2, 3, "#5d646d");
    rect(t.x + 4, t.y + 6, 1, t.h - 9, "#646b74");
    rect(t.x + 9, t.y + 6, 1, t.h - 9, "#646b74");
  }

  function drawGuest(g, now) {
    const c = g.art;
    const s = GUEST_H / c.height;
    const w = c.width * s, h = c.height * s;
    const walking = g.state !== "wait";
    const bob = walking && Math.floor(now / 140) % 2 ? 1 : 0;
    const shake = g.wrongUntil > now || (g.state === "wait" && (g.until - now) / g.total < 0.15) ? Math.round(Math.sin(now / 40)) : 0;
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
    // 꼬리
    const cx = Math.round(x + w / 2);
    rect(cx - 2, y + h, 5, 1, "#fffdf8");
    rect(cx - 1, y + h + 1, 3, 1, "#fffdf8");
    rect(cx, y + h + 2, 1, 1, "#fffdf8");
    rect(cx - 3, y + h, 1, 1, "#3a2a24");
    rect(cx + 3, y + h, 1, 1, "#3a2a24");
    rect(cx - 2, y + h + 1, 1, 1, "#3a2a24");
    rect(cx + 2, y + h + 1, 1, 1, "#3a2a24");
    rect(cx - 1, y + h + 2, 1, 1, "#3a2a24");
    rect(cx + 1, y + h + 2, 1, 1, "#3a2a24");
    rect(cx, y + h + 3, 1, 1, "#3a2a24");
  }

  // 작은 표정 그림 (하트, 화남). 받은 그림 img/cafe/heart.png, angry.png 가 있으면 그 그림을 씀
  const HEART = [".RR.RR.", "RRRRRRR", "RRRRRRR", ".RRRRR.", "..RRR..", "...R..."];
  const ANGRY = ["RR...RR", "R.....R", "...R...", "..RRR..", "...R...", "R.....R", "RR...RR"];
  function pixels(rows, x, y, color) {
    rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === "R") rect(x + i, y + j, 1, 1, color); }));
  }

  function drawOrder(g, now) {
    const headY = FEET_Y - GUEST_H;
    if (g.state === "leave") {
      if (g.mood === "happy") { if (!img("heart")) pixels(HEART, Math.round(g.x - 3), headY - 6, "#e0605a"); else drawImg("heart", g.x, headY - 1); }
      if (g.mood === "angry") { if (!img("angry")) pixels(ANGRY, Math.round(g.x - 3), headY - 7, "#d0443a"); else drawImg("angry", g.x, headY - 1); }
      return;
    }
    if (g.state !== "wait") return;
    const bw = 32, bh = 40, bx = Math.round(g.x - bw / 2), by = headY - bh - 5;
    bubble(bx, by, bw, bh);
    drawImg(`${g.temp}-${g.menu.id}`, g.x, by + 33);
    // 기다림 막대
    const r = Math.max(0, (g.until - now) / g.total);
    rect(bx + 3, by + bh - 5, bw - 6, 3, "#e4ded6");
    rect(bx + 3, by + bh - 5, Math.round((bw - 6) * r), 3, r > CAFE_TIP_OVER ? "#7fae5a" : r > CAFE_LATE_UNDER ? "#e0b24f" : "#d0574a");
  }

  function drawCup(cup) {
    if (!cup) return;
    drawImg(`${cup.temp}-${drinkOf(cup.adds)}`, cup.x, cup.y);
  }

  function highlight(h) {
    ctx.fillStyle = "rgba(255, 248, 225, 0.28)";
    ctx.fillRect(h.x, h.y, h.w, h.h);
  }

  function text(str, x, y, color, align = "center") {
    ctx.font = "bold 8px system-ui, sans-serif";
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#fffdf8";
    ctx.strokeText(str, x, y);
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
  }

  function draw(now) {
    ctx.setTransform(PX, 0, 0, PX, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, W, H);
    drawRoom();

    const guests = round.guests.slice().sort((a, b) => a.x - b.x);
    guests.forEach((g) => drawGuest(g, now));
    drawCounter();
    drawTray();
    guests.forEach((g) => drawOrder(g, now));

    // 컵 쌓아 둔 곳
    drawImg("hot-empty", SPOT.hot.x, SPOT.hot.y - 6);
    drawImg("hot-empty", SPOT.hot.x, SPOT.hot.y);
    drawImg("ice-empty", SPOT.ice.x, SPOT.ice.y - 5);
    drawImg("ice-empty", SPOT.ice.x, SPOT.ice.y);

    // 커피 머신
    const m = `machine${data().machine + 1}`;
    drawImg(m, SPOT.machine.x + SPOT.machine.w / 2, BASE_Y);
    if (round.brew) {
      const r = 1 - Math.max(0, round.brew.until - now) / round.brew.total;
      rect(SPOT.machine.x + 4, BASE_Y - 52, SPOT.machine.w - 8, 4, "#3a2a24");
      rect(SPOT.machine.x + 5, BASE_Y - 51, Math.round((SPOT.machine.w - 10) * r), 2, "#e0b24f");
      if (Math.floor(now / 90) % 2) rect(SPOT.slot.x, BASE_Y - 30, 1, 6, "#4a2e20");
    }

    // 재료 병
    for (const b of bottles()) drawImg(b.id, b.x + 10, BASE_Y - ((round.lift[b.id] || 0) > now ? 4 : 0));
    drawTrash();

    if (hover && hover.id !== "guest") highlight(hover);
    if (round.cup && round.cup.at === "machine") drawCup(round.cup);
    if (round.cup && round.cup.at !== "machine") drawCup(round.cup);
    if (round.flying) drawCup(round.flying.cup);
    for (const d of round.drops) {
      rect(Math.round(d.x) - 1, Math.round(d.y) - 1, 3, 3, "#3a2a24");
      rect(Math.round(d.x), Math.round(d.y), 1, 1, d.color);
      rect(Math.round(d.x) - 1, Math.round(d.y), 3, 1, d.color);
    }

    for (const f of round.floats) {
      const t = (now - f.t0) / 1400;
      ctx.globalAlpha = 1 - t * t;
      text(f.text, f.x, f.y - t * 14, f.color);
      ctx.globalAlpha = 1;
    }

    // 아래쪽 안내 (누를 곳 이름, 실수 안내)
    const tip = round.tipUntil > now ? round.tip : hover ? hover.name : "";
    if (tip) text(tip, W / 2, H - 6, "#5a4636");
  }

  // ---- 시작과 끝 ----
  // 그림을 미리 불러 둠 (첫 손님이 올 때 그림이 비지 않게)
  function preload() {
    const files = [...OPTIONAL_ART, "machine1", "machine2", "machine3", ...CAFE_INGREDIENTS.map((g) => g.id)];
    for (const t of ["hot", "ice"]) for (const d of ["empty", ...CAFE_MENU.map((m) => m.id)]) files.push(`${t}-${d}`);
    files.forEach(img);
  }

  function startRound() {
    if (visiting || !allowed()) return;
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
    const d = daily();
    const coins = Math.max(0, Math.min(round.sales, CAFE_DAILY_MAX - d.coins));
    d.coins += coins;
    c.served += round.served;
    const best = round.sales > c.best;
    if (best) c.best = round.sales;
    lastResult = { sales: round.sales, served: round.served, missed: round.missed, coins, best };
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
    menuBtn.hidden = view !== "play";
    if (view === "play") return renderPlay();
    if (view === "result") return renderResult();
    renderLobby();
  }

  function stats() {
    const c = data();
    const d = daily();
    const row = el("div", "cafe-stats");
    row.append(
      el("span", "", `오늘 받은 코인 ${d.coins}/${CAFE_DAILY_MAX}`),
      el("span", "", `최고 매출 ${c.best}`),
      el("span", "", `누적 손님 ${c.served}`),
    );
    return row;
  }

  function renderLobby() {
    statusEl.textContent = "";
    const c = data();
    const intro = el("p", "cafe-text",
      "손님이 주문하면 컵을 꺼내고, 머신으로 에스프레소를 내리고, 재료를 넣어 만든 뒤 손님을 눌러 건네요. 빨리 주면 팁을 받고, 너무 기다리게 하면 화내며 나가요.");
    const start = el("button", "primary cafe-start", "영업 시작");
    start.type = "button";
    start.addEventListener("click", startRound);
    if (daily().coins >= CAFE_DAILY_MAX) intro.textContent = "오늘 받을 수 있는 코인은 다 받았어요. 영업은 계속 연습할 수 있어요.";

    body.append(intro, start, stats(), menuBoard(), el("h3", "cafe-sub", "가게 늘리기"));

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
      row.append(name, el("span", "", m.recipe.map(ingName).join(" + ")));
      box.append(row);
    }
    box.append(el("p", "cafe-note", "따뜻한 컵과 아이스 컵은 주문에 맞춰 골라요. 재료 순서는 상관없어요."));
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
      const h = hit(...toLocal(e));
      if (h) h.act();
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!round) return;
      hover = e.pointerType === "mouse" ? hit(...toLocal(e)) : null;
      canvas.style.cursor = hover ? "pointer" : "default";
    });
    canvas.addEventListener("pointerleave", () => { hover = null; });

    const board = menuBoard();
    board.classList.add("cafe-board-pop");
    board.hidden = true;
    wrap.append(canvas, board);
    body.append(wrap);
  }

  function renderResult() {
    statusEl.textContent = "";
    const r = lastResult;
    const box = el("div", "cafe-result");
    box.append(el("h3", "cafe-result-title", r.best && r.sales ? "최고 매출 달성!" : "오늘 영업 끝"));
    const dl = el("dl", "cafe-result-list");
    for (const [k, v] of [["매출", r.sales], ["손님", `${r.served}명`], ["놓친 손님", `${r.missed}명`], ["받은 코인", r.coins]]) {
      dl.append(el("dt", "", k), el("dd", "", String(v)));
    }
    box.append(dl);
    if (r.coins < r.sales) box.append(el("p", "cafe-note", `오늘 카페 코인은 ${CAFE_DAILY_MAX}까지 받을 수 있어요.`));
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

  // ---- 패널 열기/닫기 ----
  function open() {
    if (visiting || !allowed()) return;
    if (editing) setEditing(false);
    closeShop();
    if (typeof Focus !== "undefined") Focus.close();
    if (typeof Friends !== "undefined") Friends.close();
    panel.hidden = false;
    openBtn.classList.add("active");
    if (!round) { view = view === "play" ? "lobby" : view; render(); }
  }

  // 닫으면 영업 중이던 판은 그때까지의 매출로 마감
  function close() {
    if (round) finish();
    if (view === "result") view = "lobby";
    panel.hidden = true;
    openBtn.classList.remove("active");
  }

  // 테스트 중이라 게임 주인 계정에서만 버튼이 보임 (파일로 직접 열었을 때도 확인용으로 보임)
  const allowed = () => location.protocol === "file:" || (typeof isOwnerAccount === "function" && isOwnerAccount());
  function refresh() {
    openBtn.hidden = !allowed();
    if (openBtn.hidden && !panel.hidden) close();
  }

  openBtn.addEventListener("click", () => (panel.hidden ? open() : close()));
  $("cafe-close").addEventListener("click", close);
  // 영업 중 메뉴판 (레시피를 잠깐 보기)
  menuBtn.addEventListener("click", () => {
    const b = body.querySelector(".cafe-board-pop");
    if (b) b.hidden = !b.hidden;
  });
  refresh();

  // round: 테스트에서 지금 영업 상태를 확인할 때 씀
  return { open, close, refresh, round: () => round };
})();

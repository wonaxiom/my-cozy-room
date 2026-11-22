// =============================================================
// cafe.js — 카페 운영 미니게임 (타이쿤)
// 손님이 주문하면 컵을 고르고 재료를 넣어 만든 뒤, 손님을 눌러 건네줍니다.
// 판 매출은 코인으로 받고(하루 상한), 코인으로 메뉴와 장비를 늘립니다.
// =============================================================

const CAFE_ROUND_SECONDS = 90;  // 한 판 영업 시간
const CAFE_DAILY_MAX = 80;      // 하루에 카페에서 받을 수 있는 코인
const CAFE_SEATS = 3;           // 동시에 기다릴 수 있는 손님 수
const CAFE_PATIENCE = 22;       // 손님이 기다리는 시간(초)
const CAFE_SHOT_SECONDS = [1.6, 1.0, 0.5]; // 커피 머신 단계별 에스프레소 내리는 시간

// 재료 (버튼 순서대로, 그림은 img/cafe/재료id.png)
const CAFE_INGREDIENTS = [
  { id: "shot", name: "에스프레소" },
  { id: "water", name: "물" },
  { id: "milk", name: "우유" },
  { id: "vanilla", name: "바닐라" },
  { id: "choco", name: "초코" },
  { id: "matcha", name: "녹차" },
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

  // ---- 그림 (img/cafe/, 정리 스크립트: art-src/tools/cafe_proc.py) ----
  // 그림 크기 [가로, 세로] (도트). scale배로 키워서 보여 줌
  const ART_SIZE = { hot: [25, 27], ice: [22, 30], ingredient: [20, 28], upgrade: [43, 45] };

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

  const cupArt = (temp, drink, scale) => art(`${temp}-${drink}`, ART_SIZE[temp], scale);

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

  // ---- 영업 상태 ----
  // view: "lobby"(영업 전) / "play"(영업 중) / "result"(끝)
  let view = "lobby";
  let round = null;
  let ticker = null;
  let lastResult = null;

  function newRound() {
    return {
      endAt: Date.now() + CAFE_ROUND_SECONDS * 1000,
      nextAt: Date.now() + 600,
      seats: Array(CAFE_SEATS).fill(null),
      cup: null,          // { temp: "hot" | "ice", adds: [] }
      pouring: null,      // { id, until } 에스프레소 내리는 중
      sales: 0,
      served: 0,
      missed: 0,
    };
  }

  function spawn() {
    const free = round.seats.findIndex((s) => !s);
    if (free < 0) return;
    const menu = pick(menuOpen());
    const look = randomLook();
    const p = patience();
    round.seats[free] = {
      menu,
      temp: Math.random() < 0.5 ? "hot" : "ice",
      look,
      art: makeHeroPreview(look),
      until: Date.now() + p * 1000,
      total: p * 1000,
      mood: null, // "happy" / "sad" 떠나는 중
    };
    buildSeat(free);
  }

  function leave(i, mood) {
    const s = round.seats[i];
    if (!s || s.mood) return;
    s.mood = mood;
    buildSeat(i);
    setTimeout(() => {
      if (!round || round.seats[i] !== s) return;
      round.seats[i] = null;
      buildSeat(i);
    }, 700);
  }

  function serve(i) {
    const s = round && round.seats[i];
    if (!s || s.mood) return;
    const cup = round.cup;
    if (!cup) return hint("먼저 음료를 만들어 주세요.");
    if (round.pouring) return hint("에스프레소를 내리는 중이에요.");
    if (cup.temp === s.temp && sameRecipe(cup.adds, s.menu.recipe)) {
      const left = (s.until - Date.now()) / s.total;
      const tip = left > 0.6 ? 2 : left > 0.3 ? 1 : 0;
      const pay = s.menu.price + tip;
      round.sales += pay;
      round.served += 1;
      round.cup = null;
      floatText(i, tip ? `+${pay} (팁 ${tip})` : `+${pay}`);
      leave(i, "happy");
    } else {
      // 주문과 다르면 음료는 버리고, 손님은 조금 지침
      s.until -= s.total * 0.25;
      round.cup = null;
      floatText(i, "주문이랑 달라요");
    }
    renderCounter();
  }

  // 에스프레소를 내리는 동안에도 다른 재료는 넣을 수 있음
  function addIngredient(id) {
    if (!round) return;
    if (!round.cup) return hint("컵을 먼저 골라 주세요.");
    if (round.cup.adds.includes(id) || (round.pouring && round.pouring.id === id)) return hint("이미 넣었어요.");
    if (id === "shot") {
      round.pouring = { id, until: Date.now() + shotSeconds() * 1000 };
      renderCounter();
      return;
    }
    round.cup.adds.push(id);
    renderCounter();
  }

  function chooseCup(temp) {
    if (!round || round.pouring) return;
    if (round.cup && round.cup.adds.length) return hint("만들던 음료를 버리고 골라 주세요.");
    round.cup = { temp, adds: [] };
    renderCounter();
  }

  function trash() {
    if (!round || round.pouring) return;
    round.cup = null;
    renderCounter();
  }

  // ---- 시간 흐름 ----
  function tick() {
    if (!round) return;
    const now = Date.now();
    if (round.pouring && now >= round.pouring.until) {
      if (round.cup) round.cup.adds.push(round.pouring.id);
      round.pouring = null;
      renderCounter();
    }
    round.seats.forEach((s, i) => {
      if (s && !s.mood && now >= s.until) {
        round.missed += 1;
        leave(i, "sad");
      }
    });
    if (now >= round.nextAt && now < round.endAt - 4000) {
      spawn();
      const [a, b] = spawnGap();
      round.nextAt = now + (a + Math.random() * (b - a)) * 1000;
    }
    if (now >= round.endAt) return finish();
    updateBars();
    ticker = (typeof pipWin !== "undefined" && pipWin ? pipWin : window).setTimeout(tick, 100);
  }

  function startRound() {
    if (visiting || !allowed()) return;
    round = newRound();
    view = "play";
    render();
    tick();
  }

  // 영업을 마치고 코인 받기 (하루 상한까지)
  function finish() {
    if (!round) return;
    clearTimeout(ticker);
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

  // ---- 화면 ----
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  let hintTimer = null;
  function hint(text) {
    const h = body.querySelector(".cafe-hint");
    if (!h) return;
    h.textContent = text;
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => { h.textContent = ""; }, 1600);
  }

  function floatText(i, text) {
    const seat = body.querySelectorAll(".cafe-seat")[i];
    if (!seat) return;
    const f = el("span", "cafe-float", text);
    seat.append(f);
    setTimeout(() => f.remove(), 900);
  }

  function render() {
    body.innerHTML = "";
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
      "손님이 주문하면 컵을 고르고 재료를 넣어 만든 뒤, 손님을 눌러 건네주세요. 판 매출만큼 코인을 받아요.");
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
    const names = Object.fromEntries(CAFE_INGREDIENTS.map((g) => [g.id, g.name]));
    for (const m of menuOpen()) {
      const row = el("div", "cafe-recipe");
      row.append(el("span", "cafe-recipe-name", `${m.name} ${m.price}`), el("span", "", m.recipe.map((r) => names[r]).join(" + ")));
      box.append(row);
    }
    box.append(el("p", "cafe-note", "따뜻한 컵과 아이스 컵은 주문에 맞춰 골라요. 재료 순서는 상관없어요."));
    return box;
  }

  function renderPlay() {
    const seats = el("div", "cafe-seats");
    for (let i = 0; i < CAFE_SEATS; i++) {
      const seat = el("button", "cafe-seat");
      seat.type = "button";
      seat.addEventListener("click", () => serve(i));
      seats.append(seat);
    }

    const counter = el("div", "cafe-counter");
    const cups = el("div", "cafe-row");
    for (const [temp, name] of [["hot", "따뜻한 컵"], ["ice", "아이스 컵"]]) {
      const b = el("button", "cafe-btn");
      b.type = "button";
      b.dataset.cup = temp;
      b.append(cupArt(temp, "empty", 1), el("span", "", name));
      b.addEventListener("click", () => chooseCup(temp));
      cups.append(b);
    }
    const trashBtn = el("button", "cafe-btn cafe-trash", "버리기");
    trashBtn.type = "button";
    trashBtn.addEventListener("click", trash);
    cups.append(trashBtn);

    const adds = el("div", "cafe-row");
    for (const g of ingredientOpen()) {
      const b = el("button", "cafe-btn");
      b.type = "button";
      b.dataset.add = g.id;
      b.append(art(g.id, ART_SIZE.ingredient, 1), el("span", "", g.name));
      b.addEventListener("click", () => addIngredient(g.id));
      adds.append(b);
    }

    const work = el("div", "cafe-work");
    work.append(el("div", "cafe-made"), el("div", "cafe-made-text"));
    counter.append(work, cups, adds, el("p", "cafe-hint"));

    const help = el("details", "cafe-help");
    help.append(el("summary", "", "메뉴판"), menuBoard());

    body.append(seats, counter, help);
    for (let i = 0; i < CAFE_SEATS; i++) buildSeat(i);
    renderCounter();
    updateBars();
  }

  function buildSeat(i) {
    const seat = body.querySelectorAll(".cafe-seat")[i];
    if (!seat || !round) return;
    const s = round.seats[i];
    seat.querySelectorAll(":scope > :not(.cafe-float)").forEach((n) => n.remove());
    seat.classList.toggle("empty", !s);
    seat.classList.toggle("happy", !!(s && s.mood === "happy"));
    seat.classList.toggle("sad", !!(s && s.mood === "sad"));
    if (!s) {
      seat.prepend(el("span", "cafe-empty", "빈자리"));
      return;
    }
    const bubble = el("div", "cafe-bubble");
    if (s.mood) bubble.append(el("span", "cafe-mood", s.mood === "happy" ? "고마워요!" : "다음에 올게요"));
    else {
      bubble.append(cupArt(s.temp, s.menu.id, 1));
      const t = el("span", "cafe-order");
      t.append(el("b", "", s.temp === "ice" ? "아이스" : "따뜻한"), document.createTextNode(" " + s.menu.name));
      bubble.append(t);
    }
    const art = s.art;
    art.classList.add("cafe-guest");
    const bar = el("div", "cafe-bar");
    bar.append(el("i"));
    seat.prepend(bubble, art, bar);
  }

  function renderCounter() {
    if (!round) return;
    const made = body.querySelector(".cafe-made");
    const text = body.querySelector(".cafe-made-text");
    if (!made) return;
    const cup = round.cup;
    made.innerHTML = "";
    if (cup) made.append(cupArt(cup.temp, drinkOf(cup.adds), 2));
    const names = Object.fromEntries(CAFE_INGREDIENTS.map((g) => [g.id, g.name]));
    if (round.pouring) text.textContent = cup.adds.length ? `에스프레소 내리는 중… (${cup.adds.map((a) => names[a]).join(" + ")})` : "에스프레소 내리는 중…";
    else if (!cup) text.textContent = "컵을 골라 주세요";
    else {
      const what = CAFE_MENU.find((m) => sameRecipe(m.recipe, cup.adds));
      const base = cup.temp === "ice" ? "아이스 컵" : "따뜻한 컵";
      text.textContent = what ? `${cup.temp === "ice" ? "아이스" : "따뜻한"} ${what.name} 완성! 손님을 눌러 건네요`
        : cup.adds.length ? `${base} + ${cup.adds.map((a) => names[a]).join(" + ")}` : base;
    }
    body.querySelectorAll("[data-cup]").forEach((b) => b.classList.toggle("active", !!cup && cup.temp === b.dataset.cup));
    body.querySelectorAll("[data-add]").forEach((b) => {
      b.classList.toggle("active", !!cup && cup.adds.includes(b.dataset.add));
      b.classList.toggle("pouring", !!round.pouring && round.pouring.id === b.dataset.add);
    });
  }

  function updateBars() {
    if (!round) return;
    const now = Date.now();
    const left = Math.max(0, Math.ceil((round.endAt - now) / 1000));
    statusEl.textContent = `남은 시간 ${left}초 · 매출 ${round.sales}`;
    body.querySelectorAll(".cafe-seat").forEach((seat, i) => {
      const s = round.seats[i];
      const fill = seat.querySelector(".cafe-bar i");
      if (!s || !fill) return;
      const r = s.mood ? 0 : Math.max(0, (s.until - now) / s.total);
      fill.style.width = `${r * 100}%`;
      fill.style.background = r > 0.5 ? "#8fb36a" : r > 0.25 ? "#e0b24f" : "#d0574a";
    });
    const pour = body.querySelector(".pouring");
    if (pour && round.pouring) {
      const r = 1 - (round.pouring.until - now) / (shotSeconds() * 1000);
      pour.style.setProperty("--pour", `${Math.min(100, r * 100)}%`);
    }
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
  refresh();

  return { open, close, refresh };
})();

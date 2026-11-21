// =============================================================
// side-deco.js — 세로 보기 장식 (GPT 그림, img/side/)
// 위쪽 하늘: 날씨와 밤낮에 따라 구름·반짝이·비·눈·달·별이 바뀌고 천천히 움직입니다.
// 맨 아래 선반: 등불(밤에 켜짐)·책·숨 쉬는 고양이·화분 ('12월' 장식을 고르면 트리·선물·눈사람 등).
// 방 그림을 가리지 않게 하늘 장식은 위쪽 가장자리와 양옆에만 둡니다.
// 선반 장식은 '내 정보 → 배경 장식'에서 고르고 계정에 저장합니다. (save.decoTheme)
// 크리스마스 현수막(12월 24~26일)과 새해 장식(1월 1~15일)은 이벤트 장식이라 그 기간에만 저절로 나옵니다.
// =============================================================

// 고를 수 있는 배경 장식. 여기에 한 줄 넣으면 '내 정보'의 선택지에 저절로 나옵니다.
// art가 있는 장식은 그림 이름만 적으면 선반에 저절로 놓입니다. (그림 크기는 아래 SIZE에도 넣기)
//   left: 등불 옆 소품들, pets: 숨 쉬는 동물 (고양이·강아지별 이름, 그림은 이름A·이름B 두 장), tall: 오른쪽 끝 큰 소품,
//   strip: 선반 띠 (없으면 기본 나무 선반), fall: 하늘 양옆에서 천천히 떨어지는 조각 (비·눈 오는 날은 빠짐)
// 그림 만드는 법: art-src/tools/side_theme.py, GPT 요청문: art-src/guide/gpt-request-deco.md
const DECO_THEMES = [
  { id: "basic", name: "평소", pets: { cat: "cat", dog: "dog" } },
  { id: "december", name: "12월", pets: { cat: "xcat", dog: "xdog" } },
  { id: "sakura", name: "벚꽃", art: { left: ["sakuraVase", "sakuraDango"], pets: { cat: "sakuraCat", dog: "sakuraDog" }, tall: "sakuraTree", strip: "sakuraStripTile", fall: ["petalS", "petalL"] } },
  { id: "wood", name: "나무", art: { left: ["woodStump", "woodBasket"], pets: { cat: "woodCat", dog: "woodDog" }, tall: "woodBonsai", strip: "woodStripTile" } },
  { id: "dog", name: "강아지", art: { left: ["dogBowl", "dogToys"], pets: { cat: "cat", dog: "dog" }, tall: "dogHouse" } },
  { id: "sea", name: "바다", art: { left: ["seaShells", "seaBottle"], pets: { cat: "seaCat", dog: "seaDog" }, tall: "seaLighthouse", strip: "seaStripTile" } },
  { id: "autumn", name: "단풍", art: { left: ["autumnTea", "autumnBasket"], pets: { cat: "autumnCat", dog: "autumnDog" }, tall: "autumnTree", strip: "autumnStripTile", fall: ["leafS", "leafL"] } },
];
const DEFAULT_DECO = "basic";

// 선반에서 자는 동물. 배경에 맞춘 그림이 없으면 평소 그림(방석 위 고양이·강아지)으로 나옵니다.
const DECO_PETS = [
  { id: "cat", name: "고양이" },
  { id: "dog", name: "강아지" },
];
const DEFAULT_PET = "cat";
const PLAIN_PETS = { cat: "cat", dog: "dog" };
const NEWYEAR_PETS = { cat: "nycat", dog: "nydog" }; // 새해 장식 (이벤트)

const SideDeco = (() => {
  const $ = (id) => document.getElementById(id) || app.querySelector("#" + id);
  const sky = $("side-sky");
  const shelf = $("side-shelf");
  const DOT = 1.5; // 그림 도트 하나 = 화면 1.5px
  const SIZE = {
    lanternOn: [29, 39], lanternOff: [29, 39], books: [37, 29], catA: [50, 32], catB: [50, 32], plant: [38, 50], tree: [41, 50],
    cloud1: [54, 26], cloud2: [30, 18], cloud3: [16, 11], sparkS: [9, 9], sparkL: [15, 16], rainCloud1: [38, 21], rainCloud2: [24, 15],
    drop: [7, 9], snowS: [10, 11], snowL: [16, 18], moon: [18, 19], star: [7, 7],
    // 12월
    xmasBanner: [230, 22], xstarS: [10, 10], xstarL: [19, 20],
    // 새해 (1월)
    nyBanner: [171, 23], pouch: [34, 33], tteokguk: [37, 39], kite: [40, 41], sheep: [38, 34], nycatA: [48, 30], nycatB: [48, 30],
    sunrise: [47, 27], fireworkA: [40, 30], fireworkB: [40, 30],
    // 고르는 배경 장식 (DECO_THEMES)
    sakuraVase: [42, 46], sakuraDango: [39, 23], sakuraCatA: [50, 31], sakuraCatB: [50, 31], sakuraTree: [41, 46], petalS: [17, 18], petalL: [19, 18], sakuraStripTile: [121, 14],
    woodStump: [42, 38], woodBasket: [42, 38], woodCatA: [52, 34], woodCatB: [52, 34], woodBonsai: [46, 45], woodStripTile: [170, 15],
    dogBowl: [40, 29], dogToys: [38, 24], dogA: [53, 35], dogB: [53, 35], dogHouse: [50, 45],
    seaShells: [46, 45], seaBottle: [36, 47], seaCatA: [57, 35], seaCatB: [57, 35], seaLighthouse: [39, 53], seaStripTile: [167, 17],
    autumnTea: [35, 46], autumnBasket: [51, 42], autumnCatA: [53, 35], autumnCatB: [53, 35], autumnTree: [48, 48], leafS: [17, 15], leafL: [23, 18], autumnStripTile: [116, 17],
    sakuraDogA: [54, 36], sakuraDogB: [54, 36], woodDogA: [54, 38], woodDogB: [54, 38], seaDogA: [58, 39], seaDogB: [58, 39], autumnDogA: [55, 38], autumnDogB: [55, 38],
    xdogA: [53, 41], xdogB: [53, 41], nydogA: [53, 35], nydogB: [53, 35],
    gifts: [43, 42], snowman: [28, 40], candleA: [26, 38], candleB: [26, 38], xcatA: [49, 35], xcatB: [49, 35], lightsA: [112, 18], lightsB: [112, 18],
  };
  let lastKey = "";

  // 그림 하나 (style: 위치, cls: 움직임)
  function pic(name, style, cls = "") {
    const img = document.createElement("img");
    img.src = `img/side/${name}.png`;
    img.alt = "";
    img.className = "deco " + cls;
    const [w, h] = SIZE[name];
    Object.assign(img.style, { width: `${w * DOT}px`, height: `${h * DOT}px` }, style);
    return img;
  }

  // 같은 자리에서 정해진 순서로 (매번 같은 배치가 되게)
  const seq = (i, n) => ((i * 37) % n) / n;

  function renderSky(weather, night, banner, art) {
    sky.innerHTML = "";
    const low = banner ? 44 : 0; // 현수막 날은 구름·달을 현수막 아래로
    const add = (...els) => sky.append(...els);
    const wet = weather === "rain" || weather === "storm";
    const snow = weather === "snow";
    const grey = wet || snow || weather === "cloudy";
    // 구름: 맑으면 크림색, 흐리면 회색이 섞임. 밤에 맑으면 구름 대신 달과 별
    if (night && !grey) {
      add(pic("moon", { left: "8%", top: `${40 + low}px` }, "bob"));
      [[18, 44], [80, 40], [92, 100], [4, 128], [90, 162], [8, 182]].forEach(([x, y], i) =>
        add(pic(i % 3 ? "star" : "sparkS", { left: `${x}%`, top: `${y}px`, animationDelay: `${i * 0.6}s` }, "twinkle")));
    } else {
      if (banner !== "nyBanner") add(pic(grey ? "rainCloud1" : "cloud1", { left: "-4%", top: `${36 + low}px` }, "drift")); // 새해 첫 사흘은 그 자리에 해돋이
      add(pic(grey ? "rainCloud2" : "cloud2", { right: "2%", top: `${44 + low}px`, animationDelay: "-3s" }, "drift"));
      if (!banner) add(pic(weather === "cloudy" ? "rainCloud2" : "cloud3", { right: "24%", top: "30px", animationDelay: "-6s" }, "drift slow"));
      if (!grey) [[6, 96], [90, 112], [10, 160], [88, 180]].forEach(([x, y], i) =>
        add(pic(i % 2 ? "sparkS" : "sparkL", { left: `${x}%`, top: `${y}px`, animationDelay: `${i * 0.7}s` }, "twinkle")));
    }
    // 비·눈: 방을 가리지 않게 양옆 줄에서만 내림
    if (wet || snow) {
      for (let i = 0; i < 10; i++) {
        const left = i % 2 ? 2 + seq(i, 10) * 16 : 82 + seq(i, 10) * 16;
        const name = wet ? "drop" : i % 3 ? "snowS" : "snowL";
        add(pic(name, { left: `${left}%`, top: "60px", animationDelay: `${-seq(i + 3, 10) * (wet ? 1.2 : 5)}s` }, wet ? "fall" : "fall snowy"));
      }
    } else if (art && art.fall) {
      // 꽃잎·낙엽: 눈처럼 양옆에서 천천히 (눈보다 드문드문)
      for (let i = 0; i < 6; i++) {
        const left = i % 2 ? 2 + seq(i, 6) * 14 : 84 + seq(i, 6) * 13;
        add(pic(art.fall[i % 3 ? 0 : 1], { left: `${left}%`, top: "60px", animationDelay: `${-seq(i + 3, 6) * 7}s` }, "fall petal"));
      }
    }
  }

  function renderShelf(night, december, newYear, art, pet) {
    shelf.innerHTML = "";
    shelf.classList.toggle("xmas", december); // 12월: 눈 쌓인 선반 띠
    // 고른 장식의 선반 띠 (도트 1.5배), 없으면 CSS의 기본 나무 선반
    const strip = !newYear && art && art.strip;
    shelf.style.backgroundImage = strip ? `url("img/side/${strip}.png")` : "";
    shelf.style.backgroundSize = strip ? `${SIZE[strip][0] * DOT}px ${SIZE[strip][1] * DOT}px` : "";
    if (newYear) {
      // 1월 1~15일: 등불·떡국·복주머니·아기 양·복주머니 안은 고양이·방패연
      shelf.append(
        pic(night ? "lanternOn" : "lanternOff", { left: "8px", bottom: "14px" }, night ? "glow" : ""),
        pic("tteokguk", { left: "52px", bottom: "13px" }),
        pic("pouch", { left: "108px", bottom: "13px" }),
        pic("sheep", { right: `${64 + SIZE[pet + "A"][0] * DOT}px`, bottom: "13px" }), // 동물 바로 왼쪽 (강아지가 더 넓음)
        pic(pet + "A", { right: "64px", bottom: "12px" }, "breathe-a"),
        pic(pet + "B", { right: "64px", bottom: "12px" }, "breathe-b"),
        pic("kite", { right: "0", bottom: "18px" }, "bob"),
      );
      return;
    }
    if (art) {
      // 왼쪽: 등불과 소품들을 차례로, 오른쪽: 끝에 큰 소품, 그 옆에 숨 쉬는 동물
      const w = (n) => SIZE[n][0] * DOT;
      const lantern = night ? "lanternOn" : "lanternOff";
      shelf.append(pic(lantern, { left: "8px", bottom: "14px" }, night ? "glow" : ""));
      let x = 8 + w(lantern) + 6;
      for (const n of art.left) { shelf.append(pic(n, { left: `${x}px`, bottom: "13px" })); x += w(n) + 6; }
      shelf.append(pic(art.tall, { right: "6px", bottom: "13px" }));
      const r = `${6 + w(art.tall) + 6}px`;
      shelf.append(pic(pet + "A", { right: r, bottom: "12px" }, "breathe-a"), pic(pet + "B", { right: r, bottom: "12px" }, "breathe-b"));
      return;
    }
    if (!december) {
      shelf.append(
        pic(night ? "lanternOn" : "lanternOff", { left: "14px", bottom: "14px" }, night ? "glow" : ""),
        pic("books", { left: "62px", bottom: "14px" }),
        pic(pet + "A", { right: "70px", bottom: "12px" }, "breathe-a"),
        pic(pet + "B", { right: "70px", bottom: "12px" }, "breathe-b"),
        pic("plant", { right: "10px", bottom: "14px" }),
      );
      return;
    }
    // 12월: 꼬마전구 줄(반짝임)을 뒤에 걸고, 등불·선물·촛불(흔들림)·눈사람·산타 모자 고양이·트리
    for (const left of ["-6px", "162px"]) {
      shelf.append(pic("lightsA", { left, top: "-10px" }, "blink-a"), pic("lightsB", { left, top: "-10px" }, "blink-b"));
    }
    shelf.append(
      pic(night ? "lanternOn" : "lanternOff", { left: "8px", bottom: "14px" }, night ? "glow" : ""),
      pic("gifts", { left: "50px", bottom: "13px" }),
      pic("candleA", { left: "116px", bottom: "13px" }, "flicker-a"),
      pic("candleB", { left: "116px", bottom: "13px" }, "flicker-b"),
      pic("snowman", { left: "156px", bottom: "13px" }),
      pic(pet + "A", { right: "66px", bottom: "11px" }, "breathe-a"),
      pic(pet + "B", { right: "66px", bottom: "11px" }, "breathe-b"),
      pic("tree", { right: "6px", bottom: "13px" }),
    );
  }

  // 기념일 현수막: 방 위쪽 가운데 (방 지붕에 닿지 않게 그날은 방을 조금 내림)
  function renderBanner(name, night) {
    const root = sky.ownerDocument.body;
    root.classList.toggle("side-banner", !!name);
    if (!name) return;
    const [w] = SIZE[name];
    const width = Math.min(300, w * DOT);
    sky.append(pic(name, { left: "50%", top: "38px", width: `${width}px`, height: "auto", marginLeft: `${-width / 2}px` }, "banner"));
    if (name === "nyBanner") {
      // 새해: 낮에는 왼쪽에 해돋이, 오른쪽(밤에는 양쪽)에 터지는 폭죽
      if (!night) sky.append(pic("sunrise", { left: "3%", top: "92px" }));
      const spots = night ? [[78, 82], [4, 150]] : [[76, 128]];
      spots.forEach(([x, y], i) => sky.append(
        pic("fireworkA", { left: `${x}%`, top: `${y}px`, animationDelay: `${i * 0.8}s` }, "pop-a"),
        pic("fireworkB", { left: `${x}%`, top: `${y}px`, animationDelay: `${i * 0.8}s` }, "pop-b")));
      return;
    }
    [[3, 28, "xstarS"], [93, 26, "xstarS"], [16, 66, "xstarL"], [80, 64, "xstarL"]].forEach(([x, y, n], i) =>
      sky.append(pic(n, { left: `${x}%`, top: `${y}px`, animationDelay: `${i * 0.5}s` }, "twinkle")));
  }

  // 확인용: 주소에 ?day= 가 있으면 그 날짜로
  const dayOf = (d) => (params.has("day") ? Number(params.get("day")) : d.getDate());

  // 오늘 띄울 현수막 (12월 24~26일: 메리 크리스마스, 1월 1~3일: 새해)
  function bannerToday(d) {
    const day = dayOf(d);
    if (d.getMonth() === 11 && day >= 24 && day <= 26) return "xmasBanner";
    if (d.getMonth() === 0 && day <= 3) return "nyBanner";
    return null;
  }

  // ---- 보통 화면: 방 그림 네 모서리 ----
  // 크기는 방 그림 너비에 맞춰 (컴퓨터 약 1.2배, 휴대폰 약 0.9배), 위치는 그림 칸의 %로
  const roomSky = $("room-sky"), shelfL = $("room-shelf-l"), shelfR = $("room-shelf-r");
  let roomKey = "";

  function rpic(name, dot, style, cls = "") {
    const [w, h] = SIZE[name];
    return pic(name, Object.assign({ width: `${w * dot}px`, height: `${h * dot}px` }, style), cls);
  }
  // 숨 쉬는 고양이처럼 두 장을 번갈아 보이는 그림 (같은 자리에 겹침)
  function pair(a, b, dot, ca, cb) {
    const box = document.createElement("span");
    box.className = "pair";
    const [w, h] = SIZE[a];
    Object.assign(box.style, { width: `${w * dot}px`, height: `${h * dot}px` });
    box.append(rpic(a, dot, {}, ca), rpic(b, dot, {}, cb));
    return box;
  }

  function renderRoom(weather, night, december, newYear, art, pet) {
    const dot = Math.max(0.7, roomSky.parentElement.clientWidth / 400);
    roomSky.innerHTML = "";
    const add = (...els) => roomSky.append(...els);
    const wet = weather === "rain" || weather === "storm";
    const snow = weather === "snow";
    const grey = wet || snow || weather === "cloudy";
    if (night && !grey) {
      add(rpic("moon", dot, { left: "4%", top: "13%" }, "bob"));
      [[3, 34], [13, 48], [92, 30], [86, 46], [95, 62]].forEach(([x, y], i) =>
        add(rpic(i % 2 ? "star" : "sparkS", dot, { left: `${x}%`, top: `${y}%`, animationDelay: `${i * 0.6}s` }, "twinkle")));
    } else {
      add(rpic(grey ? "rainCloud1" : "cloud1", dot, { left: "-3%", top: "11%" }, "drift"));
      add(rpic(grey ? "rainCloud2" : "cloud2", dot, { right: "1%", top: "13%", animationDelay: "-3s" }, "drift"));
      if (!grey) [[4, 36], [93, 38], [10, 54]].forEach(([x, y], i) =>
        add(rpic(i % 2 ? "sparkS" : "sparkL", dot, { left: `${x}%`, top: `${y}%`, animationDelay: `${i * 0.7}s` }, "twinkle")));
    }
    if (wet || snow) {
      for (let i = 0; i < 8; i++) {
        const left = i % 2 ? 1 + seq(i, 8) * 11 : 88 + seq(i, 8) * 10;
        add(rpic(wet ? "drop" : i % 3 ? "snowS" : "snowL", dot, { left: `${left}%`, top: "20%", animationDelay: `${-seq(i + 3, 8) * (wet ? 1.2 : 5)}s` }, wet ? "fall" : "fall snowy"));
      }
    } else if (art && art.fall) {
      for (let i = 0; i < 6; i++) {
        const left = i % 2 ? 1 + seq(i, 6) * 10 : 89 + seq(i, 6) * 9;
        add(rpic(art.fall[i % 3 ? 0 : 1], dot, { left: `${left}%`, top: "20%", animationDelay: `${-seq(i + 3, 6) * 7}s` }, "fall petal"));
      }
    }
    // 아래 선반 두 무리: 왼쪽 등불(밤에 켜짐)과 소품, 오른쪽 고양이와 화분 (12월·새해에는 바뀜)
    const lantern = rpic(night ? "lanternOn" : "lanternOff", dot, {}, night ? "glow" : "");
    let left, right;
    if (newYear) {
      left = [lantern, rpic("tteokguk", dot, {}), rpic("pouch", dot, {})];
      right = [pair(pet + "A", pet + "B", dot, "breathe-a", "breathe-b"), rpic("kite", dot, {}, "bob")];
    } else if (art) {
      left = [lantern, ...art.left.map((n) => rpic(n, dot, {}))];
      right = [pair(pet + "A", pet + "B", dot, "breathe-a", "breathe-b"), rpic(art.tall, dot, {})];
    } else if (december) {
      left = [lantern, rpic("gifts", dot, {}), pair("candleA", "candleB", dot, "flicker-a", "flicker-b")];
      right = [pair(pet + "A", pet + "B", dot, "breathe-a", "breathe-b"), rpic("tree", dot, {})];
    } else {
      left = [lantern, rpic("books", dot, {})];
      right = [pair(pet + "A", pet + "B", dot, "breathe-a", "breathe-b"), rpic("plant", dot, {})];
    }
    for (const [el, list] of [[shelfL, left], [shelfR, right]]) { el.innerHTML = ""; el.append(...list); }
    // 선반 띠 크기 (도트에 맞춤), 12월에는 눈 쌓인 띠
    const deco = roomSky.parentElement;
    deco.style.setProperty("--strip-w", `${122 * dot}px`); deco.style.setProperty("--strip-h", `${13 * dot}px`);
    deco.style.setProperty("--snow-w", `${203 * dot}px`); deco.style.setProperty("--snow-h", `${16 * dot}px`);
    deco.style.setProperty("--strip-lift", `${8 * dot}px`);
    const roomStrip = $("room-strip");
    roomStrip.classList.toggle("xmas", december);
    // 고른 장식의 선반 띠 (없으면 CSS의 기본 나무 선반)
    const strip = !newYear && art && art.strip;
    roomStrip.style.backgroundImage = strip ? `url("img/side/${strip}.png")` : "";
    roomStrip.style.backgroundSize = strip ? `${SIZE[strip][0] * dot}px ${SIZE[strip][1] * dot}px` : "";
    roomStrip.style.height = strip ? `${SIZE[strip][1] * dot}px` : "";
  }

  // 내가 고른 배경 장식과 동물 (친구 방 구경 중에도 내 설정, 목록에 없는 값이면 기본)
  const mine = () => (typeof visiting !== "undefined" && visiting && typeof ownSave !== "undefined" && ownSave ? ownSave : save) || {};
  function theme() {
    const id = mine().decoTheme;
    return DECO_THEMES.some((t) => t.id === id) ? id : DEFAULT_DECO;
  }
  function petChoice() {
    const id = mine().decoPet;
    return DECO_PETS.some((p) => p.id === id) ? id : DEFAULT_PET;
  }

  // 날씨·밤낮·장식이 바뀔 때만 다시 그림
  function update() {
    const weather = typeof storm !== "undefined" && storm ? "storm" : weatherNow();
    const night = currentPhase === "night" || currentPhase === "evening";
    const d = now();
    const newYear = d.getMonth() === 0 && dayOf(d) <= 15; // 새해 장식(이벤트)은 1월 15일까지, 그동안은 고른 장식 대신 나옴
    const id = theme();
    const december = !newYear && id === "december"; // 고른 장식이 '12월'이면
    const t = DECO_THEMES.find((x) => x.id === id);
    const art = newYear ? null : t.art || null; // 새해 기간에는 새해 장식
    const kind = petChoice();
    const pets = newYear ? NEWYEAR_PETS : (art ? art.pets : t.pets) || {};
    const pet = pets[kind] || PLAIN_PETS[kind]; // 배경에 맞춘 그림이 없으면 평소 그림
    const banner = bannerToday(d);
    // 보통 화면 장식 (방 그림 크기가 바뀌어도 다시 그림)
    const rk = [weather, night, id, pet, newYear, roomSky.parentElement.clientWidth].join("|");
    if (rk !== roomKey) { roomKey = rk; renderRoom(weather, night, december, newYear, art, pet); }
    const sideOn = document.body.classList.contains("side-mode") || (typeof pipWin !== "undefined" && pipWin && pipWin.document.body.classList.contains("side-mode"));
    if (!sideOn) return;
    const key = [weather, night, id, pet, newYear, banner].join("|");
    if (key === lastKey) return;
    lastKey = key;
    renderSky(weather, night, banner, art);
    renderBanner(banner, night);
    renderShelf(night, december, newYear, art, pet);
  }

  setInterval(update, 5000);
  window.addEventListener("resize", update);
  setTimeout(update, 300); // 처음 열 때
  return { update, reset: () => { lastKey = ""; roomKey = ""; update(); } };
})();

// =============================================================
// side-deco.js — 세로 보기 장식 (GPT 그림, img/side/)
// 위쪽 하늘: 날씨와 밤낮에 따라 구름·반짝이·비·눈·달·별이 바뀌고 천천히 움직입니다.
// 맨 아래 선반: 등불(밤에 켜짐)·책·숨 쉬는 고양이·화분 (12월에는 크리스마스트리).
// 방 그림을 가리지 않게 하늘 장식은 위쪽 가장자리와 양옆에만 둡니다.
// =============================================================

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

  function renderSky(weather, night) {
    sky.innerHTML = "";
    const add = (...els) => sky.append(...els);
    const wet = weather === "rain" || weather === "storm";
    const snow = weather === "snow";
    const grey = wet || snow || weather === "cloudy";
    // 구름: 맑으면 크림색, 흐리면 회색이 섞임. 밤에 맑으면 구름 대신 달과 별
    if (night && !grey) {
      add(pic("moon", { left: "8%", top: "40px" }, "bob"));
      [[18, 44], [80, 40], [92, 100], [4, 128], [90, 162], [8, 182]].forEach(([x, y], i) =>
        add(pic(i % 3 ? "star" : "sparkS", { left: `${x}%`, top: `${y}px`, animationDelay: `${i * 0.6}s` }, "twinkle")));
    } else {
      add(pic(grey ? "rainCloud1" : "cloud1", { left: "-4%", top: "36px" }, "drift"));
      add(pic(grey ? "rainCloud2" : "cloud2", { right: "2%", top: "44px", animationDelay: "-3s" }, "drift"));
      add(pic(weather === "cloudy" ? "rainCloud2" : "cloud3", { right: "24%", top: "30px", animationDelay: "-6s" }, "drift slow"));
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
    }
  }

  function renderShelf(night, december) {
    shelf.innerHTML = "";
    shelf.classList.toggle("xmas", december); // 12월: 눈 쌓인 선반 띠
    if (!december) {
      shelf.append(
        pic(night ? "lanternOn" : "lanternOff", { left: "14px", bottom: "14px" }, night ? "glow" : ""),
        pic("books", { left: "62px", bottom: "14px" }),
        pic("catA", { right: "70px", bottom: "12px" }, "breathe-a"),
        pic("catB", { right: "70px", bottom: "12px" }, "breathe-b"),
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
      pic("xcatA", { right: "66px", bottom: "11px" }, "breathe-a"),
      pic("xcatB", { right: "66px", bottom: "11px" }, "breathe-b"),
      pic("tree", { right: "6px", bottom: "13px" }),
    );
  }

  // 날씨·밤낮·달이 바뀔 때만 다시 그림
  function update() {
    if (!document.body.classList.contains("side-mode") && !(typeof pipWin !== "undefined" && pipWin && pipWin.document.body.classList.contains("side-mode"))) return;
    const weather = typeof storm !== "undefined" && storm ? "storm" : weatherNow();
    const night = currentPhase === "night" || currentPhase === "evening";
    const december = now().getMonth() === 11;
    const key = [weather, night, december].join("|");
    if (key === lastKey) return;
    lastKey = key;
    renderSky(weather, night);
    renderShelf(night, december);
  }

  setInterval(update, 5000);
  return { update, reset: () => { lastKey = ""; update(); } };
})();

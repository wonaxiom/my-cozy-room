// =============================================================
// start.js — 첫 화면 (로그인 → 캐릭터 만들기 → 사는 곳 → 방)
// 화면 상태는 <body data-state="...">로 바꿉니다.
//   loading: 불러오는 중 / login: 로그인 화면 / onboard: 시작 설정 / game: 방
// =============================================================

const Start = (() => {
  const $ = (id) => document.getElementById(id);
  const setState = (state) => { document.body.dataset.state = state; };

  let editMode = false;    // "내 정보"로 연 경우 (이미 시작한 사람)
  let hairTouched = false; // 머리를 직접 골랐으면 성별을 바꿔도 머리는 그대로
  let draft = {};          // 고르는 중인 모습 (저장 전)
  let step = 1;

  // 로그인 화면에 보여줄 방 그림
  $("gate-preview").append(makeRoomPreview(ROOMS[0]));

  // 사는 곳 목록
  for (const c of CITIES) {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.name;
    $("ob-city").append(opt);
  }

  function showLoading() {
    setState("loading");
  }

  // error: 로그인 기능을 불러오지 못했을 때 (다시 시도 / 로그인 없이 하기)
  function showLogin(opts = {}) {
    setState("login");
    $("gate-error").hidden = !opts.error;
    $("gate-login").hidden = !!opts.error;
  }

  // 로그인과 데이터 맞추기가 끝난 뒤
  function ready() {
    applyProfile();
    if (!save.profileDone) openOnboarding(false);
    else setState("game");
  }

  // 이름은 제목에, 사는 곳은 날씨에
  function applyProfile() {
    const name = save.profile && save.profile.name;
    const title = name ? `${name}의 방` : "My Cozy Room";
    $("title").textContent = title;
    document.title = title;
    refreshWeather();
  }

  // ---- 시작 설정 ----
  function openOnboarding(edit) {
    editMode = edit;
    hairTouched = edit;
    draft = Object.assign({}, save.look);
    $("ob-name").value = (save.profile && save.profile.name) || "";
    $("ob-city").value = (save.profile && save.profile.city) || "";
    $("ob-done").textContent = edit ? "저장" : "시작하기";
    $("ob-close").hidden = !edit;
    showStep(1);
    setState("onboard");
  }

  function showStep(n) {
    step = n;
    for (let i = 1; i <= 4; i++) $("step" + i).hidden = i !== n;
    $("ob-preview").hidden = n === 4;
    document.querySelectorAll(".steps [data-step]").forEach((el) => {
      el.classList.toggle("on", Number(el.dataset.step) === n);
    });
    render();
  }

  function pick(key, value) {
    draft[key] = value;
    if (key === "hair") hairTouched = true;
    if (key === "gender" && !hairTouched) draft.hair = findBy(GENDERS, value).hair;
    render();
  }

  // 글자 버튼 목록
  function chips(el, list, key) {
    el.innerHTML = "";
    for (const item of list) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = item.name;
      b.classList.toggle("active", draft[key] === item.id);
      b.addEventListener("click", () => pick(key, item.id));
      el.append(b);
    }
  }

  // 색 동그라미 목록
  function swatches(el, list, key) {
    el.innerHTML = "";
    for (const item of list) el.append(swatch(item, key));
  }

  function swatch(item, key) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "swatch" + (draft[key] === item.id ? " active" : "");
    b.title = item.name;
    b.style.background = item.color;
    b.addEventListener("click", () => pick(key, item.id));
    return b;
  }

  function render() {
    const preview = $("ob-preview");
    preview.innerHTML = "";
    preview.append(makeSpritePreview(heroRows("idle", draft), heroColors(draft)));

    if (step === 1) {
      chips($("ob-gender"), GENDERS, "gender");
      swatches($("ob-skin"), SKIN_TONES, "skin");
    } else if (step === 2) {
      chips($("ob-hair"), HAIR_STYLES, "hair");
      swatches($("ob-color"), HAIR_COLORS, "hairColor");
      chips($("ob-eyes"), EYES, "eyes");
      chips($("ob-mouth"), MOUTHS, "mouth");
    } else if (step === 3) {
      // 무료 옷 + 상점에서 산 옷
      swatches($("ob-top"), TOPS.filter(ownsCloth), "top");
      const groups = $("ob-bottom");
      groups.innerHTML = "";
      for (const type of BOTTOM_TYPES) {
        const list = BOTTOMS.filter((b) => b.type === type.id && ownsCloth(b));
        if (!list.length) continue;
        const row = document.createElement("div");
        row.className = "bottom-group";
        const label = document.createElement("span");
        label.textContent = type.name;
        const sw = document.createElement("div");
        sw.className = "swatches";
        list.forEach((b) => sw.append(swatch(b, "bottom")));
        row.append(label, sw);
        groups.append(row);
      }
    }
  }

  function finish() {
    const name = $("ob-name").value.trim();
    save.profile = { name, city: $("ob-city").value || null };
    save.look = normLook(draft);
    const first = !save.profileDone;
    save.profileDone = true;
    Save.save(save);
    applyProfile();
    refreshWeather(true);
    setState("game");
    if (first) toast(`${name ? name + "님, " : ""}어서 와요! 상점에서 가구를 사서 방을 꾸며 보세요.`);
  }

  // ---- 버튼 연결 ----
  document.querySelectorAll("#onboard [data-go]").forEach((b) => {
    b.addEventListener("click", () => showStep(Number(b.dataset.go)));
  });
  $("ob-done").addEventListener("click", finish);
  $("ob-close").addEventListener("click", () => setState("game"));
  $("profile-btn").addEventListener("click", () => openOnboarding(true));
  $("gate-retry").addEventListener("click", () => location.reload());
  $("gate-guest").addEventListener("click", ready);

  return { showLoading, showLogin, ready };
})();

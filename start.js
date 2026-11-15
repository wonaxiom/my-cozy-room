// =============================================================
// start.js — 첫 화면 (로그인 → 캐릭터 만들기 → 사는 곳 → 방)
// 화면 상태는 <body data-state="...">로 바꿉니다.
//   loading: 불러오는 중 / login: 로그인 화면 / onboard: 시작 설정 / game: 방
// =============================================================

const Start = (() => {
  const $ = (id) => document.getElementById(id);
  const setState = (state) => { document.body.dataset.state = state; };

  let editMode = false; // "내 정보"로 연 경우 (이미 시작한 사람)
  const draft = { hair: "short", hairColor: "brown" };

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
    draft.hair = save.look.hair;
    draft.hairColor = save.look.hairColor;
    $("ob-name").value = (save.profile && save.profile.name) || "";
    $("ob-city").value = (save.profile && save.profile.city) || "";
    $("ob-done").textContent = edit ? "저장" : "시작하기";
    $("ob-close").hidden = !edit;
    showStep(1);
    setState("onboard");
  }

  function showStep(n) {
    $("step1").hidden = n !== 1;
    $("step2").hidden = n !== 2;
    document.querySelectorAll(".steps [data-step]").forEach((el) => {
      el.classList.toggle("on", Number(el.dataset.step) === n);
    });
    if (n === 1) renderLook();
  }

  function renderLook() {
    const look = Object.assign({}, save.look, draft);
    const preview = $("ob-preview");
    preview.innerHTML = "";
    preview.append(makeSpritePreview(heroRows("idle", look), heroColors(look)));

    const hair = $("ob-hair");
    hair.innerHTML = "";
    for (const st of HAIR_STYLES) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = st.name;
      b.classList.toggle("active", draft.hair === st.id);
      b.addEventListener("click", () => { draft.hair = st.id; renderLook(); });
      hair.append(b);
    }

    const colors = $("ob-color");
    colors.innerHTML = "";
    for (const hc of HAIR_COLORS) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "swatch" + (draft.hairColor === hc.id ? " active" : "");
      b.title = hc.name;
      b.style.background = hc.color;
      b.addEventListener("click", () => { draft.hairColor = hc.id; renderLook(); });
      colors.append(b);
    }
  }

  function finish() {
    const name = $("ob-name").value.trim();
    save.profile = { name, city: $("ob-city").value || null };
    save.look = Object.assign({}, save.look, draft);
    const first = !save.profileDone;
    save.profileDone = true;
    Save.save(save);
    applyProfile();
    refreshWeather(true);
    setState("game");
    if (first) toast(`${name ? name + "님, " : ""}어서 와요! 상점에서 가구를 사서 방을 꾸며 보세요.`);
  }

  // ---- 버튼 연결 ----
  $("ob-next").addEventListener("click", () => showStep(2));
  $("ob-back").addEventListener("click", () => showStep(1));
  $("ob-done").addEventListener("click", finish);
  $("ob-close").addEventListener("click", () => setState("game"));
  $("profile-btn").addEventListener("click", () => openOnboarding(true));
  $("gate-retry").addEventListener("click", () => location.reload());
  $("gate-guest").addEventListener("click", ready);

  return { showLoading, showLogin, ready };
})();

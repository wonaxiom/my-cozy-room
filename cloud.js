// =============================================================
// cloud.js — 구글 로그인과 계정 저장 (Supabase)
// 로그인하면 코인, 보관함, 꾸민 방이 구글 계정에 저장되어
// 다른 PC에서도 이어서 할 수 있습니다.
// =============================================================

// 공개용 주소와 키입니다. 브라우저에 넣어도 되는 키이고,
// 데이터는 "자기 데이터만 읽고 쓸 수 있다"는 데이터베이스 규칙으로 보호됩니다.
const SUPABASE_URL = "https://qmdbebqpjiimihkxhkjr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtZGJlYnFwamlpbWloa3hoa2pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ3MTg2MzQsImV4cCI6MjExMDI5NDYzNH0.zE47SiIcoGQyEdhzvLZiob7xzA5Jdcr2gLAKHS_33Xc";

const UPLOAD_DELAY = 15000; // 저장을 모아서 15초마다 한 번씩 계정에 올립니다.

const Cloud = (() => {
  const loginBtn = document.getElementById("login-btn");
  const nameEl = document.getElementById("account-name");
  const statusEl = document.getElementById("account-status");

  let client = null;
  let user = null;
  let ready = false;   // 계정 데이터를 한 번 맞춘 뒤부터 올리기 시작
  let syncing = false;
  let timer = null;
  // 여러 기기 맞추기: 실제로 바꾼 시각(editedAt)이 더 최근인 쪽을 씁니다.
  // (코인이 쌓이는 자동 저장은 바꾼 것으로 치지 않아서, 켜 두기만 한 기기가 덮어쓰지 않음)
  // editedAt이 없는 예전 데이터는 0으로 봅니다. (자동 저장 시각을 쓰면 켜 두기만 한 기기가 계속 이겨서
  // 기기끼리 서로 덮어쓰게 됨)
  const editedOf = (d) => (d && d.editedAt) || 0;

  function setStatus(text) {
    statusEl.textContent = text ? "· " + text : "";
  }

  function setUser(u) {
    user = u;
    if (!user) ready = false;
    const meta = (user && user.user_metadata) || {};
    nameEl.textContent = user ? meta.full_name || meta.name || user.email : "";
    loginBtn.hidden = !user;
    if (!user) setStatus("");
  }

  // 로그인 직후: 계정에 저장된 데이터와 이 컴퓨터의 데이터를 맞춥니다.
  async function sync() {
    if (!user || syncing) return;
    syncing = true;
    setStatus("불러오는 중…");
    const { data, error } = await client
      .from("game_saves")
      .select("data")
      .eq("user_id", user.id)
      .maybeSingle();
    syncing = false;

    if (error) {
      setStatus("연결 실패");
      Start.ready(); // 계정에 못 붙어도 이 컴퓨터의 데이터로 계속
      return;
    }
    const remote = data && data.data;

    // 계정에 데이터가 있고, 이 컴퓨터 데이터가 다른 사람(또는 로그인 전) 것이거나 더 오래됐으면
    // 계정 데이터로 바꾸고 다시 엽니다.
    if (remote && (save.owner !== user.id || editedOf(remote) > editedOf(save))) {
      adopt(remote);
      return;
    }

    // 계정에 데이터가 없거나 이 컴퓨터 데이터가 더 최신이면 계정에 올립니다.
    // (처음 로그인하면 지금까지 한 진행 상황이 계정으로 옮겨집니다)
    save.owner = user.id;
    ready = true;
    Save.save(save, { auto: true }); // 로그인할 때의 저장은 바꾼 것으로 치지 않음
    Start.ready();
    if (sessionStorage.getItem("cozy-pulled")) {
      sessionStorage.removeItem("cozy-pulled");
      toast("다른 기기에서 바꾼 내용을 불러왔어요.");
    }
    await upload();
    await loadProfile();
    if (typeof Friends !== "undefined") Friends.start(client, user);
  }

  // 고유번호 받아오기 (처음이면 서버가 겹치지 않는 번호를 만들어 줌). 이름도 함께 맞춥니다.
  async function loadProfile() {
    if (!user) return null;
    const name = (save.profile && save.profile.name) || null;
    const { data, error } = await client.rpc("ensure_profile", { p_name: name });
    if (error || !data) return null;
    if (save.friendCode !== data) {
      save.friendCode = data;
      Save.save(save, { auto: true });
    }
    return data;
  }

  // 계정 데이터로 바꾸고 페이지를 다시 엶
  function adopt(remote) {
    remote.owner = user.id;
    Save.locked = true; // 페이지를 다시 여는 동안 옛 데이터가 덮어쓰지 않게
    localStorage.setItem(Save.KEY, JSON.stringify(remote));
    location.reload();
  }

  // 다른 기기가 그사이에 올렸으면 그 내용을 받아옴 (덮어쓰지 않게). 받아왔으면 true
  async function pullIfChanged() {
    if (!user || !ready || visiting) return false;
    const { data, error } = await client
      .from("game_saves")
      .select("data")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error || !data || !data.data || editedOf(data.data) <= editedOf(save)) return false;
    sessionStorage.setItem("cozy-pulled", "1");
    adopt(data.data);
    return true;
  }

  async function upload() {
    clearTimeout(timer);
    timer = null;
    if (!user || !ready) return;
    if (visiting) { queue(); return; } // 친구 방 구경 중에는 돌아온 뒤에 저장
    if (await pullIfChanged()) return; // 다른 기기에서 바뀌었으면 올리지 않고 받아옴
    setStatus("저장 중…");
    const { error } = await client.from("game_saves").upsert({
      user_id: user.id,
      data: save,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      setStatus("저장 실패, 다시 시도할게요");
      queue();
    } else {
      setStatus("저장됨");
      if (typeof Friends !== "undefined") Friends.publish(); // 친구에게 보이는 방 정보도 함께
    }
  }

  // 저장할 일이 생기면 잠시 모았다가 올립니다.
  function queue() {
    if (!user || !ready || timer) return;
    timer = setTimeout(upload, UPLOAD_DELAY);
  }

  async function login() {
    const here = location.origin + location.pathname;
    await client.auth.signInWithOAuth({ provider: "google", options: { redirectTo: here } });
  }

  async function logout() {
    if (visiting) endVisit();
    if (typeof Friends !== "undefined") Friends.stop();
    await upload();
    await client.auth.signOut();
    setUser(null);
    Start.showLogin();
  }

  async function init() {
    loginBtn.hidden = true;
    // 파일로 직접 열었을 때는 로그인 없이 바로 시작 (만들면서 확인하는 용도)
    if (location.protocol === "file:") {
      Start.ready();
      return;
    }
    // 로그인 기능을 불러오지 못했으면 다시 시도하거나 로그인 없이 할 수 있게
    if (!window.supabase) {
      Start.showLogin({ error: true });
      return;
    }

    Start.showLoading();
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    loginBtn.addEventListener("click", logout);
    document.getElementById("gate-login").addEventListener("click", login);
    Save.onSave = queue;

    // 창을 닫거나 다른 창으로 갈 때는 바로 올립니다.
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden" && timer) upload();
      if (document.visibilityState === "visible") pullIfChanged(); // 다시 볼 때 다른 기기 변경 확인
    });
    // 켜 둔 동안에도 1분마다 확인
    setInterval(() => { if (document.visibilityState === "visible") pullIfChanged(); }, 60000);

    client.auth.onAuthStateChange((event, session) => {
      const before = user && user.id;
      setUser((session && session.user) || null);
      if (user && user.id !== before) sync();
      if (!user) Start.showLogin();
    });

    const { data } = await client.auth.getSession();
    const u = (data && data.session && data.session.user) || null;
    if (u && (!user || user.id !== u.id)) {
      setUser(u);
      sync();
    } else if (!u) {
      Start.showLogin();
    }
  }

  init();
  return {
    upload,
    sync,
    loadProfile,
    isSignedIn: () => !!user,
    userId: () => (user ? user.id : null),
    client: () => (user && ready ? client : null), // 로그인하고 맞춰진 뒤에만 (공지 불러오기 등)
  };
})();

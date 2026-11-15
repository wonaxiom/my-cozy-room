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

  function setStatus(text) {
    statusEl.textContent = text ? "· " + text : "";
  }

  function setUser(u) {
    user = u;
    if (!user) ready = false;
    const meta = (user && user.user_metadata) || {};
    nameEl.textContent = user ? meta.full_name || meta.name || user.email : "";
    loginBtn.textContent = user ? "로그아웃" : "구글로 로그인";
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
      return;
    }
    const remote = data && data.data;

    // 계정에 데이터가 있고, 이 컴퓨터 데이터가 다른 사람(또는 로그인 전) 것이거나 더 오래됐으면
    // 계정 데이터로 바꾸고 다시 엽니다.
    if (remote && (save.owner !== user.id || (remote.savedAt || 0) > (save.savedAt || 0))) {
      remote.owner = user.id;
      Save.locked = true; // 페이지를 다시 여는 동안 옛 데이터가 덮어쓰지 않게
      localStorage.setItem(Save.KEY, JSON.stringify(remote));
      location.reload();
      return;
    }

    // 계정에 데이터가 없거나 이 컴퓨터 데이터가 더 최신이면 계정에 올립니다.
    // (처음 로그인하면 지금까지 한 진행 상황이 계정으로 옮겨집니다)
    save.owner = user.id;
    ready = true;
    Save.save(save);
    await upload();
  }

  async function upload() {
    clearTimeout(timer);
    timer = null;
    if (!user || !ready) return;
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
    await upload();
    await client.auth.signOut();
    setUser(null);
  }

  async function init() {
    if (location.protocol === "file:") {
      loginBtn.disabled = true;
      loginBtn.title = "로그인은 사이트 주소(github.io)에서 열었을 때만 쓸 수 있어요.";
      return;
    }
    if (!window.supabase) {
      loginBtn.disabled = true;
      setStatus("로그인 기능을 불러오지 못했어요");
      return;
    }

    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    loginBtn.addEventListener("click", () => (user ? logout() : login()));
    Save.onSave = queue;

    // 창을 닫거나 다른 창으로 갈 때는 바로 올립니다.
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden" && timer) upload();
    });

    client.auth.onAuthStateChange((event, session) => {
      const before = user && user.id;
      setUser((session && session.user) || null);
      if (user && user.id !== before) sync();
    });

    const { data } = await client.auth.getSession();
    const u = (data && data.session && data.session.user) || null;
    if (u && (!user || user.id !== u.id)) {
      setUser(u);
      sync();
    }
  }

  init();
  return { upload, sync };
})();

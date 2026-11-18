// =============================================================
// gcal.js — 구글 캘린더 일정 불러오기 (내 계정에서만)
// 구글에서 일정을 "읽기만" 해서 세로 보기 달력에 보여 줍니다.
// - 연결 버튼은 OWNER_ID 계정으로 로그인했을 때만 '내 정보'에 보입니다.
// - 일정은 게임 서버(Supabase)에 올리지 않고, 이 브라우저에만 잠깐 기억합니다. (친구에게 보이지 않음)
// - CLIENT_ID: Google Cloud 콘솔의 OAuth 클라이언트 ID (공개돼도 되는 값. 보안 비밀(Secret)은 쓰지 않음)
// =============================================================

const GCal = (() => {
  // 연결 버튼은 주인 계정(data.js의 OWNER_ID)에서만 보여 줌
  const CLIENT_ID = "457708425576-3v745lco1bbn7jgkt0sp9nt805k499jp.apps.googleusercontent.com";
  // 일정 읽기 + 캘린더 목록 읽기 (기본 캘린더 말고 다른 캘린더 일정도 가져오려고)
  const SCOPE = "https://www.googleapis.com/auth/calendar.events.readonly https://www.googleapis.com/auth/calendar.calendarlist.readonly";
  const CACHE_KEY = "cozyroom-gcal";
  const REFRESH_MS = 15 * 60 * 1000; // 연결돼 있는 동안 15분마다 새로 불러옴

  const $ = (id) => document.getElementById(id);
  const box = $("pf-gcal"), btn = $("pf-gcal-btn"), statusEl = $("pf-gcal-status");
  let token = null, tokenUntil = 0, tokenClient = null;
  let events = {};   // "2026-11-20" → [{ title, time }]
  let fetchedAt = 0;
  let count = 0;     // 불러온 일정 수 (상태 칸에 표시)
  let onChange = null;

  // 이 브라우저에 기억해 둔 일정 (새로고침해도 바로 보이게)
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    if (c && c.events) { events = c.events; fetchedAt = c.at || 0; count = c.count || 0; }
  } catch (e) { /* 없으면 빈 달력 */ }

  const isOwner = () => typeof Cloud !== "undefined" && Cloud.userId && Cloud.userId() === OWNER_ID;
  const pad = (n) => String(n).padStart(2, "0");
  const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  function ui() {
    box.hidden = !isOwner();
    if (box.hidden) return;
    if (!CLIENT_ID) { statusEl.textContent = "준비 중 (구글 설정 필요)"; btn.hidden = true; return; }
    btn.hidden = false;
    const live = token && Date.now() < tokenUntil;
    btn.textContent = live ? "새로고침" : fetchedAt ? "다시 연결" : "연결";
    const at = new Date(fetchedAt);
    statusEl.textContent = fetchedAt ? `일정 ${count}개 · ${at.getMonth() + 1}/${at.getDate()} ${pad(at.getHours())}:${pad(at.getMinutes())}` : "연결 안 됨";
  }

  // 구글 로그인 창 스크립트는 처음 연결할 때만 불러옴
  function loadGis() {
    if (window.google && google.accounts && google.accounts.oauth2) return Promise.resolve();
    return new Promise((ok, fail) => {
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.onload = ok;
      s.onerror = fail;
      document.head.append(s);
    });
  }

  // 지금 권한(SCOPE)으로 한 번이라도 허용했는지 (권한이 바뀌면 동의 화면을 다시 띄움)
  const granted = () => { try { return localStorage.getItem(CACHE_KEY + "-scope") === SCOPE; } catch (e) { return false; } };

  async function connect() {
    if (!isOwner() || !CLIENT_ID) return;
    if (token && Date.now() < tokenUntil) { await load(); return; }
    try { await loadGis(); } catch (e) { statusEl.textContent = "구글 연결 창을 열지 못했어요."; return; }
    tokenClient = tokenClient || google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: async (res) => {
        if (res.error || !res.access_token) { statusEl.textContent = "연결을 취소했어요."; return; }
        token = res.access_token;
        try { localStorage.setItem(CACHE_KEY + "-scope", SCOPE); } catch (e) { /* 다음에도 동의 화면 */ }
        tokenUntil = Date.now() + (Number(res.expires_in) || 3600) * 1000 - 60000;
        await load();
      },
    });
    tokenClient.requestAccessToken({ prompt: granted() ? "" : "consent" });
  }

  const api = (path) => fetch("https://www.googleapis.com/calendar/v3/" + path, { headers: { Authorization: `Bearer ${token}` } });

  // 구글 캘린더 화면에서 체크해 둔 캘린더 목록 (목록을 못 읽으면 기본 캘린더만)
  async function calendars() {
    try {
      const res = await api("users/me/calendarList?minAccessRole=reader");
      if (!res.ok) return ["primary"];
      const json = await res.json();
      const ids = (json.items || []).filter((c) => c.selected !== false && !c.hidden).map((c) => c.id);
      return ids.length ? ids : ["primary"];
    } catch (e) {
      return ["primary"];
    }
  }

  // 지난달 1일 ~ 다다음 달 말일 일정 불러오기
  async function load() {
    if (!token) return;
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 3, 1);
    const range = `&timeMin=${encodeURIComponent(from.toISOString())}&timeMax=${encodeURIComponent(to.toISOString())}`;
    statusEl.textContent = "불러오는 중…";
    try {
      const next = {};
      let n = 0;
      for (const id of await calendars()) {
        const res = await api(`calendars/${encodeURIComponent(id)}/events?singleEvents=true&orderBy=startTime&maxResults=500${range}`);
        if (res.status === 401) { token = null; ui(); statusEl.textContent = "다시 연결해 주세요."; return; }
        if (!res.ok) continue; // 읽을 수 없는 캘린더는 건너뜀
        const json = await res.json();
        for (const ev of json.items || []) {
          if (ev.status === "cancelled") continue;
          const title = ev.summary || "(제목 없음)";
          n++;
          if (ev.start && ev.start.date) {
            // 종일 일정: 끝나는 날 전날까지 날마다 표시 (최대 31일)
            const d = new Date(ev.start.date + "T00:00:00"), end = new Date((ev.end && ev.end.date || ev.start.date) + "T00:00:00");
            for (let i = 0; i < 31 && (i === 0 || d < end); i++, d.setDate(d.getDate() + 1)) (next[keyOf(d)] = next[keyOf(d)] || []).push({ title, time: "" });
          } else if (ev.start && ev.start.dateTime) {
            const d = new Date(ev.start.dateTime);
            (next[keyOf(d)] = next[keyOf(d)] || []).push({ title, time: `${pad(d.getHours())}:${pad(d.getMinutes())}` });
          }
        }
      }
      // 같은 날은 시간 순서로 (종일 일정 먼저)
      for (const k in next) next[k].sort((a, b) => (a.time || "").localeCompare(b.time || ""));
      events = next;
      count = n;
      fetchedAt = Date.now();
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ at: fetchedAt, events, count })); } catch (e) { /* 기억 못 해도 이번엔 보임 */ }
      if (onChange) onChange();
    } catch (e) {
      statusEl.textContent = "일정을 불러오지 못했어요.";
      return;
    }
    ui();
  }

  btn.addEventListener("click", connect);
  $("profile-btn").addEventListener("click", ui); // 내 정보를 열 때 버튼 상태 맞추기
  setInterval(() => { if (token && Date.now() < tokenUntil && Date.now() - fetchedAt > REFRESH_MS) load(); }, 60 * 1000);
  setTimeout(ui, 0);

  return {
    // 그날 일정 (내 계정이 아니면 빈 목록)
    eventsOn: (key) => (isOwner() ? events[key] || [] : []),
    setRender: (fn) => { onChange = fn; },
  };
})();

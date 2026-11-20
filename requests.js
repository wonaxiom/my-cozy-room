// =============================================================
// requests.js — 개발 요청
// 화면 아래 '개발 요청' 링크: 누구나 바라는 점을 적어 보냄 (작성자는 저장하지 않아 익명).
// 게임 주인 계정에서는 같은 링크가 '요청함'이 되어, 받은 요청을 모아 보고 처리하면 체크.
// 새 요청이 오면 링크 옆 빨간 숫자와 알림(벨)으로 알려 줌. (주인 확인: isOwnerAccount, 데이터베이스 규칙도 주인만 읽기)
// =============================================================

const Requests = (() => {
  const $ = (id) => document.getElementById(id);
  const box = $("req"), link = $("req-link"), badge = $("req-badge");
  const text = $("req-text"), count = $("req-count");
  let showDone = false;
  let rows = [];

  const db = () => (typeof Cloud !== "undefined" && Cloud.client ? Cloud.client() : null);
  const owner = () => typeof isOwnerAccount === "function" && isOwnerAccount();

  // 링크 이름: 주인이면 '요청함', 아니면 '개발 요청'
  function updateLink() {
    link.firstChild.textContent = owner() ? "요청함" : "개발 요청";
  }

  function open() {
    updateLink();
    const inbox = owner();
    $("req-title").textContent = inbox ? "요청함" : "개발 요청";
    $("req-write").hidden = inbox;
    $("req-inbox").hidden = !inbox;
    box.hidden = false;
    if (inbox) loadInbox(true);
    else { text.value = ""; updateCount(); setTimeout(() => text.focus(), 0); }
  }
  function close() { box.hidden = true; }

  function updateCount() { count.textContent = `${text.value.length} / 1000`; }

  async function send() {
    const body = cleanText(text.value).trim();
    if (!body) return toast("내용을 적어 주세요.");
    const client = db();
    if (!client) return toast("로그인하면 보낼 수 있어요.");
    const btn = $("req-send");
    btn.disabled = true;
    const { error } = await client.from("dev_requests").insert({ body });
    btn.disabled = false;
    if (error) return toast("보내지 못했어요. 잠시 후 다시 시도해 주세요.");
    close();
    toast("요청을 보냈어요. 고마워요!");
  }

  // ---- 주인: 요청함 ----
  async function fetchRows() {
    const client = db();
    if (!client || !owner()) return null;
    const { data, error } = await client.from("dev_requests").select("id, body, created_at, seen, done").order("created_at", { ascending: false }).limit(300);
    return error ? null : data;
  }

  async function loadInbox(markSeen) {
    const data = await fetchRows();
    if (!data) return;
    rows = data;
    render();
    if (markSeen) {
      const unseen = rows.filter((r) => !r.seen).map((r) => r.id);
      if (unseen.length) {
        await db().from("dev_requests").update({ seen: true }).in("id", unseen);
        rows.forEach((r) => { if (unseen.includes(r.id)) r.justSeen = true; r.seen = true; });
        render(); // 방금 처음 본 요청에 NEW 표시
      }
      setBadge(0);
    }
  }

  function render() {
    $("req-tab-open").classList.toggle("active", !showDone);
    $("req-tab-done").classList.toggle("active", showDone);
    const list = $("req-list");
    list.innerHTML = "";
    const shown = rows.filter((r) => r.done === showDone);
    if (!shown.length) {
      const li = document.createElement("li");
      li.className = "req-empty";
      li.textContent = showDone ? "처리한 요청이 없어요." : "새로 처리할 요청이 없어요.";
      list.append(li);
      return;
    }
    for (const r of shown) {
      const li = document.createElement("li");
      li.classList.toggle("done", r.done);
      const check = document.createElement("input");
      check.type = "checkbox";
      check.checked = r.done;
      check.setAttribute("aria-label", "처리함");
      check.addEventListener("change", async () => {
        const { error } = await db().from("dev_requests").update({ done: check.checked }).eq("id", r.id);
        if (error) { check.checked = !check.checked; return toast("저장하지 못했어요."); }
        r.done = check.checked;
        setTimeout(render, 250); // 체크한 게 잠깐 보이고 다른 탭으로 옮겨감
      });
      const body = document.createElement("div");
      body.className = "req-body";
      body.textContent = r.body;
      const meta = document.createElement("span");
      meta.className = "req-meta";
      const d = new Date(r.created_at);
      meta.textContent = `${d.getMonth() + 1}월 ${d.getDate()}일 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      if (r.justSeen) { const n = document.createElement("span"); n.className = "req-new"; n.textContent = "NEW"; meta.append(n); }
      body.append(meta);
      li.append(check, body);
      list.append(li);
    }
  }

  function setBadge(n) {
    badge.hidden = !n;
    badge.textContent = n;
  }

  // 주인: 새 요청 수 확인 (접속할 때와 5분마다). 늘었으면 알림(벨)에도 남김
  async function check() {
    updateLink();
    if (typeof visiting !== "undefined" && visiting) return; // 친구 방 구경 중에는 다녀와서
    if (!owner()) { setBadge(0); return; }
    const data = await fetchRows();
    if (!data) return;
    const unseen = data.filter((r) => !r.seen);
    setBadge(box.hidden ? unseen.length : 0);
    // 알림(벨)은 전에 알린 것보다 새 요청이 왔을 때만 (내 저장에 마지막으로 알린 번호를 적어 둠)
    const newest = Math.max(0, ...unseen.map((r) => r.id));
    if (newest > (save.reqNotifiedId || 0) && typeof notify === "function") {
      notify(`새 개발 요청이 ${unseen.length}개 있어요. 화면 아래 '요청함'에서 볼 수 있어요.`);
      save.reqNotifiedId = newest;
      Save.save(save, { auto: true });
    }
  }

  link.addEventListener("click", (e) => { e.preventDefault(); open(); });
  $("req-close").addEventListener("click", close);
  box.addEventListener("click", (e) => { if (e.target === box) close(); });
  text.addEventListener("input", updateCount);
  $("req-send").addEventListener("click", send);
  $("req-tab-open").addEventListener("click", () => { showDone = false; render(); });
  $("req-tab-done").addEventListener("click", () => { showDone = true; render(); });

  // 로그인이 끝나야 주인인지 알 수 있어서, 처음에는 조금 기다렸다가 확인
  setTimeout(function loop() { check(); setTimeout(loop, 5 * 60 * 1000); }, 4000);

  return { open, check };
})();

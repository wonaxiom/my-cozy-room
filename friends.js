// =============================================================
// friends.js — 친구 (요청, 목록, 방 구경, 하트, 방명록, 선물, 채팅)
// 누가 무엇을 볼 수 있는지는 데이터베이스 규칙(RLS)이 지킵니다.
//   - 방명록: 쓴 사람과 방 주인만
//   - 채팅: 보낸 사람과 받은 사람만
//   - 친구 방: 친구만 (할 일, 코인, 보관함은 공개하지 않음)
// =============================================================

const HEART_COINS = 10;              // 하트 하나에 받는 코인
const GIFT_COINS = [10, 50, 100];    // 선물할 수 있는 코인
const ONLINE_MS = 2 * 60 * 1000;     // 이 시간 안에 저장했으면 "접속 중"
const POLL_MS = 20000;               // 실시간 알림이 끊겼을 때를 대비해 확인하는 간격
const CHAT_POLL_MS = 4000;           // 대화창을 열어 둔 동안 확인하는 간격

const Friends = (() => {
  const $ = (id) => document.getElementById(id);
  const panel = $("friends");
  const bodyEl = $("friends-body");
  const pill = $("friends-pill");
  const badge = $("friends-badge");

  let db = null;        // Supabase 연결
  let me = null;        // 로그인한 사용자
  let channel = null;   // 실시간 알림
  let pollTimer = null;
  let chatTimer = null;
  let view = "list";    // list / requests / guestbook / chat / gift / visitbook
  let target = null;    // 대화·선물 상대 { id, name }
  let found = null;     // 고유번호로 찾은 사람

  const st = {
    rows: [],       // 친구 관계 (요청 포함)
    names: {},      // 사용자 id → 이름
    snaps: {},      // 사용자 id → 공개 방 정보
    unread: {},     // 사용자 id → 안 읽은 메시지 수
    newGuest: 0,    // 아직 안 본 방명록 수
    messages: [],   // 열려 있는 대화
    book: [],       // 보고 있는 방명록
  };

  // ---- 작은 도우미 ----
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function btn(label, onClick, cls) {
    const b = el("button", cls, label);
    b.type = "button";
    b.addEventListener("click", onClick);
    return b;
  }

  const other = (row) => (row.from_id === me.id ? row.to_id : row.from_id);
  const nameOf = (id) => st.names[id] || "알 수 없음";
  const kstDay = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);

  function ago(ms) {
    const m = Math.floor(ms / 60000);
    if (m < 60) return `${Math.max(1, m)}분 전`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}시간 전`;
    return `${Math.floor(h / 24)}일 전`;
  }

  function timeText(iso) {
    const d = new Date(iso);
    const hm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    const today = new Date().toDateString() === d.toDateString();
    return today ? hm : `${d.getMonth() + 1}/${d.getDate()} ${hm}`;
  }

  function avatar(id) {
    const snap = st.snaps[id];
    const look = (snap && snap.data && snap.data.look) || {};
    const c = makeSpritePreview(heroRows("idle", look), heroColors(look));
    c.className = "friend-avatar";
    return c;
  }

  function statusOf(id) {
    const snap = st.snaps[id];
    if (!snap) return "아직 방이 없어요";
    const age = Date.now() - new Date(snap.updated_at).getTime();
    const t = snap.data && snap.data.timer;
    if (age < ONLINE_MS) return t && t.endAt > Date.now() ? "집중 중" : "접속 중";
    return `${ago(age)} 접속`;
  }

  // ---- 시작 / 종료 ----
  async function start(client, user) {
    db = client;
    me = user;
    pill.hidden = false;
    await refresh();
    await claim();
    subscribe();
    clearInterval(pollTimer);
    pollTimer = setInterval(async () => {
      await refresh();
      await claim();
    }, POLL_MS);
    publish();
  }

  function stop() {
    if (channel && db) db.removeChannel(channel);
    channel = null;
    clearInterval(pollTimer);
    clearInterval(chatTimer);
    pill.hidden = true;
    close();
    db = null;
    me = null;
  }

  // ---- 친구에게 보이는 내 방 정보 ----
  async function publish() {
    if (!db || visiting) return;
    const owned = (r) => !r.price || save.ownedRooms.includes(r.id);
    const room = ROOMS.find((r) => r.id === save.roomId && owned(r)) || ROOMS[0];
    const t = save.timer;
    const data = {
      name: (save.profile && save.profile.name) || "",
      city: (save.profile && save.profile.city) || null,
      look: save.look,
      pet: save.pet,
      roomId: room.id,
      layout: save.layouts[room.id] || room.layout,
      styles: save.roomStyles[room.id] || {},
      lampOn: save.lampOn,
      timer: t.mode === "focus" && t.endAt ? { length: t.length, mode: "focus", endAt: t.endAt, remain: 0 } : null,
    };
    await db.from("room_snapshots").upsert({ user_id: me.id, data });
  }

  // ---- 데이터 불러오기 ----
  async function refresh() {
    if (!db) return;
    const { data: rows } = await db.from("friendships").select("id, from_id, to_id, status, created_at");
    st.rows = rows || [];
    const ids = [...new Set(st.rows.map(other))];
    if (ids.length) {
      const { data: profs } = await db.from("profiles").select("user_id, display_name").in("user_id", ids);
      (profs || []).forEach((p) => { st.names[p.user_id] = p.display_name || "이름 없음"; });
      const { data: snaps } = await db.from("room_snapshots").select("user_id, data, updated_at").in("user_id", ids);
      (snaps || []).forEach((s) => { st.snaps[s.user_id] = s; });
    }
    const { data: unread } = await db.from("messages").select("sender_id").eq("receiver_id", me.id).is("read_at", null);
    st.unread = {};
    (unread || []).forEach((m) => { st.unread[m.sender_id] = (st.unread[m.sender_id] || 0) + 1; });
    const { data: guest } = await db.from("guestbook").select("id").eq("owner_id", me.id).eq("seen", false);
    st.newGuest = (guest || []).length;
    updateBadge();
    if (!panel.hidden && ["list", "requests"].includes(view)) render();
  }

  const friends = () => st.rows.filter((r) => r.status === "accepted").map((r) => ({ id: other(r), row: r, name: nameOf(other(r)) }));
  const incoming = () => st.rows.filter((r) => r.status === "pending" && r.to_id === me.id);
  const outgoing = () => st.rows.filter((r) => r.status === "pending" && r.from_id === me.id);

  function updateBadge() {
    const unread = Object.values(st.unread).reduce((a, b) => a + b, 0);
    const total = incoming().length + unread + st.newGuest;
    badge.hidden = !total;
    badge.textContent = total > 99 ? "99+" : String(total);
    $("req-count").textContent = incoming().length || "";
    $("gb-count").textContent = st.newGuest || "";
  }

  // ---- 받은 하트·선물 받기 ----
  async function claim() {
    if (!db || visiting) return;
    const { data: hearts } = await db.from("hearts")
      .update({ claimed: true }).eq("owner_id", me.id).eq("claimed", false).select("giver_id");
    if (hearts && hearts.length) {
      const gained = hearts.length * HEART_COINS;
      save.coins += gained;
      Save.save(save);
      updateCoins(gained);
      const who = [...new Set(hearts.map((h) => nameOf(h.giver_id)))].join(", ");
      toast(`${who}님이 하트를 남겼어요. ${gained}코인을 받았어요.`);
    }
    const { data: gifts } = await db.from("gifts")
      .update({ claimed: true }).eq("to_id", me.id).eq("claimed", false).select("from_id, kind, item_id, amount");
    for (const g of gifts || []) {
      if (g.kind === "coins") {
        save.coins += g.amount;
        updateCoins(g.amount);
        toast(`${nameOf(g.from_id)}님이 ${g.amount}코인을 선물했어요.`);
      } else if (FURNITURE[g.item_id]) {
        save.inventory[g.item_id] = (save.inventory[g.item_id] || 0) + 1;
        toast(`${nameOf(g.from_id)}님이 ${FURNITURE[g.item_id].name}을(를) 선물했어요. 보관함을 확인해 보세요.`);
      }
    }
    if (gifts && gifts.length) {
      Save.save(save);
      // 열려 있는 보관함과 선물 화면을 바로 새로 그리기
      if (editing) renderBag();
      if (!panel.hidden && view === "gift") render();
    }
  }

  // ---- 실시간 알림 ----
  function subscribe() {
    if (!db.channel) return;
    if (channel) db.removeChannel(channel);
    const on = (table, filter, fn, event = "*") => ({ table, filter, fn, event });
    const subs = [
      on("messages", `receiver_id=eq.${me.id}`, (p) => onMessage(p.new), "INSERT"),
      on("friendships", `to_id=eq.${me.id}`, () => refresh()),
      on("friendships", `from_id=eq.${me.id}`, () => refresh()),
      on("guestbook", `owner_id=eq.${me.id}`, () => refresh(), "INSERT"),
      on("hearts", `owner_id=eq.${me.id}`, () => claim(), "INSERT"),
      on("gifts", `to_id=eq.${me.id}`, () => claim(), "INSERT"),
    ];
    channel = db.channel(`cozy-${me.id}`);
    for (const s of subs) {
      channel.on("postgres_changes", { event: s.event, schema: "public", table: s.table, filter: s.filter }, s.fn);
    }
    channel.subscribe();
  }

  function onMessage(msg) {
    if (!msg) return;
    if (!panel.hidden && view === "chat" && target && msg.sender_id === target.id) {
      addMessages([msg]);
      markRead();
    } else {
      st.unread[msg.sender_id] = (st.unread[msg.sender_id] || 0) + 1;
      updateBadge();
      toast(`${nameOf(msg.sender_id)}: ${msg.body.length > 30 ? msg.body.slice(0, 30) + "…" : msg.body}`);
      if (!panel.hidden && view === "list") render();
    }
  }

  // ---- 패널 ----
  function open(v = "list") {
    if (!db) return;
    if (editing) setEditing(false);
    closeShop();
    if (typeof Focus !== "undefined") Focus.close();
    panel.hidden = false;
    pill.classList.add("active");
    show(v);
  }

  function close() {
    panel.hidden = true;
    pill.classList.remove("active");
    clearInterval(chatTimer);
  }

  function show(v) {
    view = v;
    clearInterval(chatTimer);
    render();
    if (v === "guestbook") loadMyBook();
    if (v === "visitbook") loadVisitBook();
    if (v === "chat") {
      loadMessages().then(markRead);
      chatTimer = setInterval(loadMessages, CHAT_POLL_MS);
    }
  }

  function render() {
    panel.querySelectorAll("#friends-tabs .tab").forEach((t) => t.classList.toggle("active", t.dataset.view === view));
    $("friends-tabs").hidden = !["list", "requests", "guestbook"].includes(view);
    bodyEl.innerHTML = "";
    if (view === "list") renderList();
    else if (view === "requests") renderRequests();
    else if (view === "guestbook") renderBook(true);
    else if (view === "visitbook") renderBook(false);
    else if (view === "chat") renderChat();
    else if (view === "gift") renderGift();
    updateBadge();
  }

  // 위쪽 제목 줄 (대화, 선물 등 하위 화면)
  function subHead(title) {
    const row = el("div", "sub-head");
    row.append(btn("‹ 목록", () => show(visiting && view === "visitbook" ? "visitbook" : "list")), el("strong", null, title));
    if (view === "visitbook") row.firstChild.remove();
    bodyEl.append(row);
  }

  // ---- 친구 목록 ----
  function renderList() {
    // 고유번호로 친구 추가
    const add = el("form", "friend-add");
    const input = el("input");
    input.placeholder = "친구 고유번호 (예: K7QP-4M2X)";
    input.maxLength = 9;
    input.autocomplete = "off";
    const findBtn = el("button", null, "찾기");
    findBtn.type = "submit";
    add.append(input, findBtn);
    add.addEventListener("submit", async (e) => {
      e.preventDefault();
      const code = input.value.trim();
      if (!code) return;
      const { data } = await db.rpc("find_profile", { p_code: code });
      found = data && data[0] ? data[0] : { none: true };
      render();
    });
    bodyEl.append(add);

    if (found) {
      const box = el("div", "found");
      if (found.none) {
        box.append(el("span", "muted", "그 고유번호를 가진 사람이 없어요."));
      } else if (found.user_id === me.id) {
        box.append(el("span", "muted", "내 고유번호예요."));
      } else {
        box.append(el("strong", null, found.display_name || "이름 없음"), btn("친구 요청", () => request(found), "primary small"));
      }
      bodyEl.append(box);
    }

    const list = friends();
    bodyEl.append(el("div", "shop-section", `친구 ${list.length}명`));
    if (!list.length) {
      bodyEl.append(el("p", "muted left", "친구의 고유번호를 넣어 친구 요청을 보내 보세요. 내 고유번호는 '내 정보'에서 볼 수 있어요."));
      return;
    }
    for (const f of list) {
      const row = el("div", "friend-row");
      const info = el("div", "friend-info");
      const city = CITIES.find((c) => c.id === (st.snaps[f.id] && st.snaps[f.id].data.city));
      info.append(el("strong", null, f.name), el("span", "muted", [city && city.name, statusOf(f.id)].filter(Boolean).join(" · ")));
      const actions = el("div", "friend-actions");
      const chat = btn("대화", () => { target = f; show("chat"); });
      if (st.unread[f.id]) chat.append(el("span", "badge", String(st.unread[f.id])));
      actions.append(
        btn("놀러 가기", () => visit(f), "primary small"),
        chat,
        btn("선물", () => { target = f; show("gift"); }),
        confirmBtn("삭제", "정말 삭제", () => removeRow(f.row, `${f.name}님을 친구에서 삭제했어요.`)),
      );
      row.append(avatar(f.id), info, actions);
      bodyEl.append(row);
    }
  }

  // 한 번 누르면 "정말 ○○"으로 바뀌고, 다시 누르면 실행
  function confirmBtn(label, sure, fn) {
    const b = btn(label, () => {
      if (b.dataset.armed) { fn(); return; }
      b.dataset.armed = "1";
      b.textContent = sure;
      b.classList.add("danger");
      setTimeout(() => { delete b.dataset.armed; b.textContent = label; b.classList.remove("danger"); }, 3000);
    });
    return b;
  }

  async function request(person) {
    const row = st.rows.find((r) => other(r) === person.user_id);
    if (row && row.status === "accepted") return toast("이미 친구예요.");
    if (row && row.from_id === me.id) return toast("이미 요청을 보냈어요. 친구가 수락하면 친구가 돼요.");
    if (row) return accept(row); // 상대가 먼저 보낸 요청이 있으면 바로 수락
    const { error } = await db.from("friendships").insert({ from_id: me.id, to_id: person.user_id });
    if (error) return toast("요청을 보내지 못했어요. 잠시 후 다시 시도해 주세요.");
    found = null;
    toast(`${person.display_name || "친구"}님에게 친구 요청을 보냈어요.`);
    await refresh();
    render();
  }

  // ---- 요청 ----
  function renderRequests() {
    const inc = incoming();
    const out = outgoing();
    bodyEl.append(el("div", "shop-section", `받은 요청 ${inc.length}`));
    if (!inc.length) bodyEl.append(el("p", "muted left", "받은 요청이 없어요."));
    for (const r of inc) {
      const row = el("div", "friend-row");
      const info = el("div", "friend-info");
      info.append(el("strong", null, nameOf(r.from_id)), el("span", "muted", timeText(r.created_at)));
      const actions = el("div", "friend-actions");
      actions.append(btn("수락", () => accept(r), "primary small"), btn("거절", () => removeRow(r, "요청을 거절했어요.")));
      row.append(info, actions);
      bodyEl.append(row);
    }
    bodyEl.append(el("div", "shop-section", `보낸 요청 ${out.length}`));
    if (!out.length) bodyEl.append(el("p", "muted left", "보낸 요청이 없어요."));
    for (const r of out) {
      const row = el("div", "friend-row");
      const info = el("div", "friend-info");
      info.append(el("strong", null, nameOf(r.to_id)), el("span", "muted", "수락을 기다리는 중"));
      row.append(info, btn("취소", () => removeRow(r, "요청을 취소했어요.")));
      bodyEl.append(row);
    }
  }

  async function accept(row) {
    const { error } = await db.from("friendships").update({ status: "accepted" }).eq("id", row.id);
    if (error) return toast("수락하지 못했어요. 잠시 후 다시 시도해 주세요.");
    toast(`${nameOf(row.from_id)}님과 친구가 됐어요.`);
    await refresh();
    render();
  }

  async function removeRow(row, message) {
    const { error } = await db.from("friendships").delete().eq("id", row.id);
    if (error) return toast("처리하지 못했어요. 잠시 후 다시 시도해 주세요.");
    toast(message);
    await refresh();
    render();
  }

  // ---- 방 구경 ----
  async function visit(f) {
    const { data } = await db.from("room_snapshots").select("data").eq("user_id", f.id).maybeSingle();
    if (!data) return toast("아직 친구 방 정보가 없어요. 친구가 한 번 접속하면 생겨요.");
    close();
    startVisit(f, data.data);
    // 오늘 이미 하트를 남겼는지
    const { data: given } = await db.from("hearts").select("day").eq("giver_id", me.id).eq("owner_id", f.id).eq("day", kstDay());
    setHeartButton(given && given.length);
  }

  function setHeartButton(done) {
    const b = $("visit-heart");
    b.disabled = !!done;
    b.textContent = done ? "하트 남김" : "하트 남기기";
  }

  async function giveHeart() {
    if (!visiting) return;
    const { error } = await db.from("hearts").insert({ giver_id: me.id, owner_id: visiting.id });
    if (error) {
      setHeartButton(true);
      return toast("오늘은 이미 하트를 남겼어요.");
    }
    setHeartButton(true);
    hero.heartT = 1.2;
    hero.jumpT = 0.35;
    toast(`하트를 남겼어요. ${visiting.name}님이 ${HEART_COINS}코인을 받아요.`);
  }

  function leaveVisit() {
    close();
    endVisit();
  }

  // ---- 방명록 ----
  async function loadMyBook() {
    const { data } = await db.from("guestbook").select("id, owner_id, author_id, body, created_at")
      .eq("owner_id", me.id).order("created_at", { ascending: false }).limit(100);
    st.book = data || [];
    if (st.newGuest) {
      await db.from("guestbook").update({ seen: true }).eq("owner_id", me.id).eq("seen", false);
      st.newGuest = 0;
    }
    if (view === "guestbook") render();
  }

  async function loadVisitBook() {
    if (!visiting) return;
    // 규칙상 친구 방명록에서는 내가 쓴 글만 보입니다.
    const { data } = await db.from("guestbook").select("id, owner_id, author_id, body, created_at")
      .eq("owner_id", visiting.id).order("created_at", { ascending: false }).limit(100);
    st.book = data || [];
    if (view === "visitbook") render();
  }

  function renderBook(mine) {
    if (!mine) {
      subHead(`${visiting ? visiting.name : ""}님의 방명록`);
      bodyEl.append(el("p", "muted left", "여기 쓴 글은 나와 방 주인만 볼 수 있어요."));
      const form = el("form", "friend-add");
      const input = el("input");
      input.placeholder = "한마디 남기기 (200자까지)";
      input.maxLength = 200;
      input.autocomplete = "off";
      const send = el("button", "primary", "남기기");
      send.type = "submit";
      form.append(input, send);
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text || !visiting) return;
        const { error } = await db.from("guestbook").insert({ owner_id: visiting.id, author_id: me.id, body: text });
        if (error) return toast("남기지 못했어요. 잠시 후 다시 시도해 주세요.");
        input.value = "";
        toast("방명록을 남겼어요.");
        loadVisitBook();
      });
      bodyEl.append(form);
    } else {
      bodyEl.append(el("p", "muted left", "친구들이 내 방에 남긴 글이에요. 각 글은 쓴 친구와 나만 볼 수 있어요."));
    }
    if (!st.book.length) {
      bodyEl.append(el("p", "muted left", mine ? "아직 방명록이 없어요." : "아직 남긴 글이 없어요."));
      return;
    }
    for (const g of st.book) {
      const row = el("div", "book-row");
      const head = el("div", "book-head");
      head.append(el("strong", null, mine ? nameOf(g.author_id) : "나"), el("span", "muted", timeText(g.created_at)));
      head.append(confirmBtn("삭제", "정말 삭제", async () => {
        await db.from("guestbook").delete().eq("id", g.id);
        mine ? loadMyBook() : loadVisitBook();
      }));
      row.append(head, el("p", "book-body", g.body));
      bodyEl.append(row);
    }
  }

  // ---- 선물 ----
  function renderGift() {
    subHead(`${target.name}님에게 선물`);
    bodyEl.append(el("div", "shop-section", `코인 (지금 ${save.coins.toLocaleString()}코인)`));
    const coins = el("div", "chips");
    for (const n of GIFT_COINS) {
      const b = btn(`${n}코인`, () => sendGift("coins", n));
      b.disabled = save.coins < n;
      coins.append(b);
    }
    bodyEl.append(coins);
    bodyEl.append(el("div", "shop-section", "보관함의 물건"));
    const ids = Object.keys(save.inventory).filter((id) => save.inventory[id] > 0 && FURNITURE[id]);
    if (!ids.length) {
      bodyEl.append(el("p", "muted left", "보관함이 비어 있어요. 방에 놓인 물건은 보관함에 넣은 뒤 선물할 수 있어요."));
      return;
    }
    const bag = el("div", "inventory");
    for (const id of ids) {
      const b = btn("", () => sendGift("item", id), "bag-item");
      b.append(makePreview(id), el("span", null, FURNITURE[id].name));
      if (save.inventory[id] > 1) b.append(el("span", "count", String(save.inventory[id])));
      bag.append(b);
    }
    bodyEl.append(bag);
  }

  async function sendGift(kind, value) {
    if (visiting || !target) return;
    // 먼저 내 것에서 빼고, 실패하면 되돌립니다.
    if (kind === "coins") {
      if (save.coins < value) return;
      save.coins -= value;
    } else {
      if (!save.inventory[value]) return;
      save.inventory[value] -= 1;
      if (save.inventory[value] <= 0) delete save.inventory[value];
    }
    Save.save(save);
    updateCoins();
    const { error } = await db.from("gifts").insert({
      from_id: me.id,
      to_id: target.id,
      kind,
      amount: kind === "coins" ? value : 0,
      item_id: kind === "item" ? value : null,
    });
    if (error) {
      if (kind === "coins") save.coins += value;
      else save.inventory[value] = (save.inventory[value] || 0) + 1;
      Save.save(save);
      updateCoins();
      toast("선물을 보내지 못했어요. 잠시 후 다시 시도해 주세요.");
    } else {
      const what = kind === "coins" ? `${value}코인을` : `${withObject(FURNITURE[value].name)}`;
      toast(`${target.name}님에게 ${what} 선물했어요.`);
    }
    render();
  }

  // ---- 채팅 ----
  async function loadMessages() {
    if (!target) return;
    const pair = [me.id, target.id];
    const { data } = await db.from("messages").select("id, sender_id, receiver_id, body, created_at")
      .in("sender_id", pair).in("receiver_id", pair)
      .order("created_at", { ascending: false }).limit(100);
    st.messages = [];
    addMessages((data || []).reverse());
  }

  function addMessages(list) {
    const known = new Set(st.messages.map((m) => m.id));
    for (const m of list) if (!known.has(m.id)) st.messages.push(m);
    st.messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    if (view === "chat") drawMessages();
  }

  async function markRead() {
    if (!target || !st.unread[target.id]) return;
    await db.from("messages").update({ read_at: new Date().toISOString() })
      .eq("sender_id", target.id).eq("receiver_id", me.id).is("read_at", null);
    delete st.unread[target.id];
    updateBadge();
  }

  function renderChat() {
    subHead(`${target.name}님과 대화`);
    const box = el("div", "chat-box");
    box.id = "chat-box";
    bodyEl.append(box);
    const form = el("form", "friend-add chat-form");
    const input = el("input");
    input.placeholder = "메시지 보내기";
    input.maxLength = 500;
    input.autocomplete = "off";
    const send = el("button", "primary", "보내기");
    send.type = "submit";
    form.append(input, send);
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      input.value = "";
      const { data, error } = await db.from("messages")
        .insert({ sender_id: me.id, receiver_id: target.id, body: text }).select("id, sender_id, receiver_id, body, created_at");
      if (error) {
        input.value = text;
        return toast("보내지 못했어요. 친구 관계를 확인하거나 잠시 후 다시 시도해 주세요.");
      }
      addMessages(data || []);
      input.focus();
    });
    bodyEl.append(form);
    drawMessages();
    setTimeout(() => input.focus(), 0);
  }

  function drawMessages() {
    const box = $("chat-box");
    if (!box) return;
    box.innerHTML = "";
    if (!st.messages.length) box.append(el("p", "muted", "첫 메시지를 보내 보세요."));
    for (const m of st.messages) {
      const mine = m.sender_id === me.id;
      const row = el("div", "msg" + (mine ? " mine" : ""));
      row.append(el("span", "bubble", m.body), el("span", "msg-time", timeText(m.created_at)));
      box.append(row);
    }
    box.scrollTop = box.scrollHeight;
  }

  // ---- 버튼 연결 ----
  pill.addEventListener("click", () => (panel.hidden ? open(visiting ? "visitbook" : "list") : close()));
  $("friends-close").addEventListener("click", close);
  panel.querySelectorAll("#friends-tabs .tab").forEach((t) => t.addEventListener("click", () => show(t.dataset.view)));
  $("visit-heart").addEventListener("click", giveHeart);
  $("visit-guestbook").addEventListener("click", () => open("visitbook"));
  $("visit-back").addEventListener("click", leaveVisit);

  return { start, stop, publish, refresh, claim, open, close };
})();

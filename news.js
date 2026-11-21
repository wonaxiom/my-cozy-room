// =============================================================
// news.js — 업데이트 공지
// 매일 아침 예약 작업이 전날 바뀐 점을 announcements 표에 올리면(공개 시각 오전 9시),
// 접속할 때와 10분마다 확인해서 처음 보는 공지를 창으로 한 번 띄우고 알림(벨)에도 남깁니다.
// 이벤트 안내(EVENT_NOTICES)는 공지 표에 올리지 않고, 기간 안에 처음 접속했을 때 한 번만 띄웁니다. (벨에도 남기지 않음)
// =============================================================

// 이벤트 안내: id는 한 번 정하면 바꾸지 않음 (본 사람은 save.eventsSeen에 id가 남음), when: 띄울 기간
const EVENT_NOTICES = [
  {
    id: "xmas2026", title: "크리스마스 이벤트", sub: "11월 ~ 1월",
    when: () => typeof isXmasSeason === "function" && isXmasSeason(),
    sections: [
      { h: "크리스마스 아이템", items: [
        { t: "산타 모자, 산타 수염, 산타 옷, 크리스마스 목도리가 나왔어요 (11월~1월에만 판매)", how: "상점 › 옷 › 크리스마스" },
        "머리·얼굴·목 장식을 하나씩 함께 쓸 수 있어요",
        "산 아이템은 이벤트가 끝나도 계속 입을 수 있어요",
      ] },
      { h: "산타 세트 보너스", items: [
        { t: "4가지 중 3가지 이상 입으면 1분에 모이는 코인이 2개에서 3개로 늘어요", how: "이벤트 기간(11월~1월) 동안만 적용돼요" },
      ] },
    ],
  },
];

const News = (() => {
  const $ = (id) => document.getElementById(id);
  const box = $("news");
  const WEEK = ["일", "월", "화", "수", "목", "금", "토"];
  const cache = new Map(); // 불러온 공지 (id → 내용)

  function dayLabel(day) {
    const [y, m, d] = day.split("-").map(Number);
    return `${m}월 ${d}일 (${WEEK[new Date(y, m - 1, d).getDay()]}) 바뀐 점`;
  }

  function open(id) {
    const a = typeof id === "object" ? id : cache.get(id);
    if (!a) return;
    $("news-title").textContent = a.title || "업데이트 소식";
    $("news-day").textContent = a.sub || dayLabel(a.day);
    const body = $("news-body");
    body.innerHTML = "";
    for (const sec of a.sections || []) {
      const h = document.createElement("b");
      h.textContent = sec.h;
      const ul = document.createElement("ul");
      for (const it of sec.items || []) {
        // 항목: 글자만 쓰거나, { t: 내용, how: 쓰는 법, img: 그림 주소(이 사이트 안) }
        const item = typeof it === "string" ? { t: it } : it || {};
        const li = document.createElement("li");
        const text = document.createElement("span");
        text.textContent = item.t || "";
        li.append(text);
        if (item.img && /^img\/[\w\/.-]+\.png$/.test(item.img)) {
          const pic = document.createElement("img");
          pic.src = item.img;
          pic.alt = "";
          pic.className = "news-pic";
          li.append(pic);
        }
        if (item.how) {
          const how = document.createElement("small");
          how.className = "news-how";
          how.textContent = item.how;
          li.append(how);
        }
        ul.append(li);
      }
      body.append(h, ul);
    }
    box.hidden = false;
  }

  async function check() {
    const db = typeof Cloud !== "undefined" && Cloud.client && Cloud.client();
    if (!db || visiting) return false;
    const { data, error } = await db.from("announcements").select("id, day, title, sections").order("day", { ascending: false }).limit(14);
    if (error || !data) return false;
    data.forEach((a) => cache.set(a.id, a));
    const seen = save.newsSeen || 0;
    const fresh = data.filter((a) => a.id > seen).sort((a, b) => a.id - b.id);
    if (!fresh.length) return true;
    for (const a of fresh) {
      const [, m, d] = a.day.split("-").map(Number);
      notify(`업데이트 소식이 있어요 (${m}월 ${d}일)`, { toast: false, news: a.id });
    }
    save.newsSeen = fresh[fresh.length - 1].id;
    Save.save(save);
    open(fresh[fresh.length - 1].id); // 가장 최근 공지만 창으로
    return true;
  }

  // 이벤트 안내: 기간 안에 아직 안 본 것을 한 번만 (친구 방 구경 중이나 다른 창이 떠 있으면 다음에)
  function checkEvents() {
    if (visiting || !box.hidden) return;
    if (document.body.dataset.state && document.body.dataset.state !== "game") return; // 로그인·시작 설정 화면에서는 기다림
    const seen = save.eventsSeen || [];
    const ev = EVENT_NOTICES.find((e) => !seen.includes(e.id) && e.when());
    if (!ev) return;
    save.eventsSeen = seen.concat(ev.id);
    Save.save(save);
    open(ev);
  }

  $("news-ok").addEventListener("click", () => { box.hidden = true; });
  setTimeout(function loopEvents() {
    try { checkEvents(); } catch (e) { /* 다음에 다시 */ }
    if (EVENT_NOTICES.some((e) => !(save.eventsSeen || []).includes(e.id))) setTimeout(loopEvents, 60 * 1000);
  }, 5000);
  // 처음에는 로그인될 때까지 1분마다, 그 뒤로는 10분마다 확인
  let ok = false;
  setTimeout(async function loop() {
    try { ok = (await check()) || ok; } catch (e) { /* 다음에 다시 */ }
    setTimeout(loop, ok ? 10 * 60 * 1000 : 60 * 1000);
  }, 3000);

  return { open, check };
})();

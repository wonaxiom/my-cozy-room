// =============================================================
// news.js — 업데이트 공지
// 매일 아침 예약 작업이 전날 바뀐 점을 announcements 표에 올리면(공개 시각 오전 9시),
// 접속할 때와 10분마다 확인해서 처음 보는 공지를 창으로 한 번 띄우고 알림(벨)에도 남깁니다.
// =============================================================

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
    const a = cache.get(id);
    if (!a) return;
    $("news-title").textContent = a.title || "업데이트 소식";
    $("news-day").textContent = dayLabel(a.day);
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

  $("news-ok").addEventListener("click", () => { box.hidden = true; });
  // 처음에는 로그인될 때까지 1분마다, 그 뒤로는 10분마다 확인
  let ok = false;
  setTimeout(async function loop() {
    try { ok = (await check()) || ok; } catch (e) { /* 다음에 다시 */ }
    setTimeout(loop, ok ? 10 * 60 * 1000 : 60 * 1000);
  }, 3000);

  return { open, check };
})();

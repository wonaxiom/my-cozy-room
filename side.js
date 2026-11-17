// =============================================================
// side.js — 세로 보기 (항상 위 작은 창에서만)
// 작은 창을 화면 오른쪽에 길게 세워 두고 쓰는 모드입니다.
// 위에는 방, 아래에는 시계·날짜·달력·집중 타이머·오늘 할 일을 보여 줍니다.
// =============================================================

const Side = (() => {
  // 작은 창(항상 위)으로 옮겨진 화면에서도 찾을 수 있게: 원래 창에 없으면 방 화면(app) 안에서 찾음
  const $ = (id) => document.getElementById(id) || app.querySelector("#" + id);
  const panel = $("side");
  const btn = $("side-btn");
  const WEEK = ["일", "월", "화", "수", "목", "금", "토"];
  const SIDE_SIZE = { width: 300 }; // 세로 보기 창 너비 (높이는 화면 높이에 꽉 맞춤)
  let on = false;
  let lastDay = "";
  let sel = "";      // 고른 날짜 ("2026-11-20"). 비어 있으면 오늘
  let view = null;   // 달력에 보이는 달 { y, m }

  const pad = (n) => String(n).padStart(2, "0");

  // 시계와 날짜 (날씨는 방 위 시계 칸의 글자를 그대로 씀)
  function renderClock() {
    const d = new Date();
    const [clock, weather = ""] = $("clock").textContent.split("·").map((t) => t.trim()); // 방 위 시계 칸과 같은 시각·날씨
    $("side-time").textContent = /\d+:\d+/.test(clock) ? clock : `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    $("side-date").textContent = `${d.getMonth() + 1}월 ${d.getDate()}일 ${WEEK[d.getDay()]}요일` + (weather ? ` · ${weather}` : "");
    const day = d.toDateString();
    if (day !== lastDay) {
      // 날이 바뀌면 오늘로 돌아감
      lastDay = day; sel = ""; view = { y: d.getFullYear(), m: d.getMonth() };
      renderCalendar(); renderTodos();
    }
  }

  // 구글 캘린더 일정 (gcal.js, 내 계정에서만)
  const eventsOn = (key) => (typeof GCal !== "undefined" ? GCal.eventsOn(key) : []);
  const keyOf = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
  const selKey = () => sel || Focus.dayKey();

  // 달력: 오늘·고른 날 표시, 할 일이 남은 날에는 점. 날짜를 누르면 그날 할 일을 봄
  function renderCalendar() {
    const now = new Date();
    if (!view) view = { y: now.getFullYear(), m: now.getMonth() };
    const { y, m } = view;
    $("side-month").textContent = `${y}년 ${m + 1}월`;
    const cal = $("side-cal");
    cal.innerHTML = "";
    for (const w of WEEK) {
      const h = document.createElement("span");
      h.className = "cal-head";
      h.textContent = w;
      cal.append(h);
    }
    const first = new Date(y, m, 1).getDay();
    const days = new Date(y, m + 1, 0).getDate();
    const today = Focus.dayKey();
    for (let i = 0; i < first; i++) cal.append(document.createElement("span"));
    for (let d = 1; d <= days; d++) {
      const key = keyOf(y, m, d);
      const c = document.createElement("button");
      c.type = "button";
      const has = Focus.todosFor(key).some((t) => !t.done);
      const ev = eventsOn(key).length > 0; // 구글 캘린더 일정이 있는 날
      c.className = "cal-day" + (key === today ? " today" : "") + (key === selKey() && key !== today ? " sel" : "")
        + ((first + d - 1) % 7 === 0 ? " sun" : "") + (has ? " has" : "") + (ev ? " ev" : "");
      c.textContent = d;
      c.addEventListener("click", () => { sel = key === today ? "" : key; renderCalendar(); renderTodos(); });
      cal.append(c);
    }
  }

  // 지난달·다음 달 보기
  function moveMonth(step) {
    const d = new Date(view.y, view.m + step, 1);
    view = { y: d.getFullYear(), m: d.getMonth() };
    renderCalendar();
  }
  $("side-prev").addEventListener("click", () => moveMonth(-1));
  $("side-next").addEventListener("click", () => moveMonth(1));

  // 집중 타이머: 남은 시간, 시작/멈춤/그만, 집중 시간 고르기
  function renderTimer() {
    const t = save.timer;
    const box = $("side-timer");
    const left = t.endAt ? Math.max(0, t.endAt - Date.now()) : t.remain || t.length * 60000;
    const label = t.mode === "break" ? "쉬는 중" : t.mode ? (t.endAt ? "집중 중" : "멈춤") : "";
    const text = `${pad(Math.floor(left / 60000))}:${pad(Math.floor((left % 60000) / 1000))}`;
    if (!box.firstChild) {
      box.innerHTML =
        '<div class="side-timer-row"><span class="side-timer-time"></span><span class="side-timer-label"></span>' +
        '<button type="button" class="side-timer-go"></button><button type="button" class="side-timer-stop">그만</button></div>' +
        '<div class="side-timer-len"><button type="button" data-step="-5" aria-label="5분 줄이기">−</button>' +
        '<span class="side-timer-min"></span><button type="button" data-step="5" aria-label="5분 늘리기">+</button>' +
        '<span class="side-timer-gap"></span><button type="button" data-set="15">15</button>' +
        '<button type="button" data-set="25">25</button><button type="button" data-set="50">50</button></div>';
      // 누르면 1초를 기다리지 않고 바로 다시 그림
      const act = (fn) => () => { fn(); renderTimer(); };
      box.querySelector(".side-timer-go").addEventListener("click", act(() => (save.timer.endAt ? Focus.pause() : Focus.start())));
      box.querySelector(".side-timer-stop").addEventListener("click", act(() => Focus.stop()));
      box.querySelectorAll("[data-step]").forEach((b) => b.addEventListener("click", act(() => Focus.setLength(save.timer.length + Number(b.dataset.step)))));
      box.querySelectorAll("[data-set]").forEach((b) => b.addEventListener("click", act(() => Focus.setLength(Number(b.dataset.set)))));
    }
    box.querySelector(".side-timer-time").textContent = text;
    box.querySelector(".side-timer-label").textContent = label;
    box.querySelector(".side-timer-go").textContent = !t.mode ? "시작" : t.endAt ? "멈춤" : "계속";
    box.querySelector(".side-timer-stop").hidden = !t.mode;
    // 집중 시간은 타이머가 멈춰 있을 때만 바꿀 수 있음
    box.querySelector(".side-timer-len").hidden = !!t.mode;
    box.querySelector(".side-timer-min").textContent = `${t.length}분`;
    box.querySelectorAll("[data-set]").forEach((b) => b.classList.toggle("active", Number(b.dataset.set) === t.length));
  }

  // 고른 날의 할 일 (오늘이면 집중 창의 오늘 할 일과 같은 목록)
  function renderTodos() {
    const key = selKey();
    const [, mm, dd] = key.split("-").map(Number);
    $("side-todo-title").textContent = sel ? `${mm}월 ${dd}일 할 일` : "오늘 할 일";
    const list = $("side-todo-list");
    list.innerHTML = "";
    const todos = Focus.todosFor(key);
    // 그날 구글 캘린더 일정 (할 일 위에, 체크 없이)
    for (const ev of eventsOn(key)) {
      const li = document.createElement("li");
      li.className = "side-event";
      const time = document.createElement("small");
      time.textContent = ev.time || "종일";
      const text = document.createElement("span");
      text.textContent = ev.title;
      li.append(time, text);
      list.append(li);
    }
    if (!todos.length) {
      const li = document.createElement("li");
      li.className = "side-empty";
      li.textContent = sel ? "이날 할 일이 없어요." : "아직 할 일이 없어요.";
      list.append(li);
    }
    for (const todo of todos) {
      const li = document.createElement("li");
      li.className = todo.done ? "done" : "";
      const label = document.createElement("label");
      const box = document.createElement("input");
      box.type = "checkbox";
      box.checked = todo.done;
      box.addEventListener("change", () => Focus.toggleTodo(todo));
      const text = document.createElement("span");
      text.textContent = todo.text;
      label.append(box, text);
      const late = Focus.lateTag(todo);
      if (late) {
        const tag = document.createElement("small");
        tag.className = "side-late";
        tag.textContent = late;
        label.append(tag);
      }
      const del = document.createElement("button");
      del.type = "button";
      del.className = "side-del";
      del.setAttribute("aria-label", "삭제");
      del.textContent = "×";
      del.addEventListener("click", () => Focus.removeTodo(todo));
      li.append(label, del);
      list.append(li);
    }
  }

  $("side-todo-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = $("side-todo-input");
    const text = input.value.trim();
    if (!text) return;
    Focus.addTodo(text, selKey());
    input.value = "";
  });
  Focus.setTodoRender(() => { if (on) { renderTodos(); renderCalendar(); } });
  // 구글 캘린더를 새로 불러오면 달력도 다시 그림 (gcal.js는 이 파일 뒤에 불러옴)
  setTimeout(() => { if (typeof GCal !== "undefined") GCal.setRender(() => { if (on) { renderTodos(); renderCalendar(); } }); }, 0);

  // 세로 보기 켜고 끄기: 작은 창 크기도 함께 바꿈
  function set(next, win) {
    on = next;
    const body = win ? win.document.body : document.body;
    body.classList.toggle("side-mode", on);
    panel.hidden = !on;
    btn.textContent = on ? "방 보기" : "세로 보기";
    if (on) { lastDay = ""; renderClock(); renderTimer(); renderTodos(); }
    if (win && win.resizeTo) {
      try {
        if (on) {
          // 화면 위아래를 꽉 채우고, 되면 오른쪽 끝으로 붙임
          win.resizeTo(SIDE_SIZE.width, win.screen.availHeight);
          try { win.moveTo(win.screen.availLeft + win.screen.availWidth - SIDE_SIZE.width, win.screen.availTop); } catch (e) { /* 위치는 못 바꾸는 브라우저면 그대로 */ }
        } else win.resizeTo(380, Math.round(380 * H / W) + 40);
      } catch (e) { /* 크기를 못 바꾸는 브라우저면 그대로 */ }
    }
  }

  btn.addEventListener("click", () => set(!on, typeof pipWin !== "undefined" ? pipWin : null));
  setInterval(() => { if (on) { renderClock(); renderTimer(); } }, 1000);

  return {
    // 작은 창이 열리거나 닫힐 때 (닫히면 세로 보기도 끔)
    pip: (open) => { btn.hidden = !open; if (!open && on) set(false); },
  };
})();

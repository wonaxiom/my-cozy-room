// =============================================================
// side.js — 세로 보기 (항상 위 작은 창에서만)
// 작은 창을 화면 오른쪽에 길게 세워 두고 쓰는 모드입니다.
// 위에는 방, 아래에는 시계·날짜·달력·집중 타이머·오늘 할 일을 보여 줍니다.
// =============================================================

const Side = (() => {
  const $ = (id) => document.getElementById(id);
  const panel = $("side");
  const btn = $("side-btn");
  const WEEK = ["일", "월", "화", "수", "목", "금", "토"];
  const SIDE_SIZE = { width: 300, height: 760 }; // 세로 보기 창 크기 (화면이 작으면 화면 높이에 맞춤)
  let on = false;
  let lastDay = "";

  const pad = (n) => String(n).padStart(2, "0");

  // 시계와 날짜 (날씨는 방 위 시계 칸의 글자를 그대로 씀)
  function renderClock() {
    const d = new Date();
    const [clock, weather = ""] = $("clock").textContent.split("·").map((t) => t.trim()); // 방 위 시계 칸과 같은 시각·날씨
    $("side-time").textContent = /\d+:\d+/.test(clock) ? clock : `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    $("side-date").textContent = `${d.getMonth() + 1}월 ${d.getDate()}일 ${WEEK[d.getDay()]}요일` + (weather ? ` · ${weather}` : "");
    const day = d.toDateString();
    if (day !== lastDay) { lastDay = day; renderCalendar(d); }
  }

  // 이번 달 달력 (오늘 표시)
  function renderCalendar(now) {
    const y = now.getFullYear(), m = now.getMonth();
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
    for (let i = 0; i < first; i++) cal.append(document.createElement("span"));
    for (let d = 1; d <= days; d++) {
      const c = document.createElement("span");
      c.className = "cal-day" + (d === now.getDate() ? " today" : "") + ((first + d - 1) % 7 === 0 ? " sun" : "");
      c.textContent = d;
      cal.append(c);
    }
  }

  // 집중 타이머: 남은 시간과 시작/멈춤
  function renderTimer() {
    const t = save.timer;
    const box = $("side-timer");
    const left = t.endAt ? Math.max(0, t.endAt - Date.now()) : t.remain || t.length * 60000;
    const label = t.mode === "break" ? "쉬는 중" : t.mode ? (t.endAt ? "집중 중" : "멈춤") : `${t.length}분`;
    const text = `${pad(Math.floor(left / 60000))}:${pad(Math.floor((left % 60000) / 1000))}`;
    if (!box.firstChild) {
      box.innerHTML = '<span class="side-timer-time"></span><span class="side-timer-label"></span><button type="button"></button>';
      box.querySelector("button").addEventListener("click", () => (save.timer.endAt ? Focus.pause() : Focus.start()));
    }
    box.querySelector(".side-timer-time").textContent = text;
    box.querySelector(".side-timer-label").textContent = label;
    box.querySelector("button").textContent = t.endAt ? "멈춤" : "시작";
  }

  // 오늘 할 일 (집중 창의 할 일과 같은 목록)
  function renderTodos() {
    const list = $("side-todo-list");
    list.innerHTML = "";
    if (!save.todos.length) {
      const li = document.createElement("li");
      li.className = "side-empty";
      li.textContent = "아직 할 일이 없어요.";
      list.append(li);
    }
    for (const todo of save.todos) {
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
      li.append(label);
      list.append(li);
    }
  }

  $("side-todo-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = $("side-todo-input");
    const text = input.value.trim();
    if (!text) return;
    Focus.addTodo(text);
    input.value = "";
  });
  Focus.setTodoRender(() => { if (on) renderTodos(); });

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
        if (on) win.resizeTo(SIDE_SIZE.width, Math.min(SIDE_SIZE.height, screen.availHeight - 40));
        else win.resizeTo(380, Math.round(380 * H / W) + 40);
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

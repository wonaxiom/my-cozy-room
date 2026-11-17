// =============================================================
// focus.js — 집중 타이머와 오늘 할 일
// =============================================================

const FOCUS_BONUS_PER_MINUTE = 0.8; // 집중 1분당 보너스 (25분이면 20코인)
const BREAK_MINUTES = 5;            // 집중이 끝나면 쉬는 시간
const TODO_REWARD = 5;              // 할 일 하나를 끝내면 받는 코인
const TODO_DAILY_MAX = 10;          // 하루에 코인을 받을 수 있는 할 일 개수

const Focus = (() => {
  // 작은 창(항상 위)으로 옮겨진 화면에서도 찾을 수 있게: 원래 창에 없으면 방 화면(app) 안에서 찾음
  const $ = (id) => document.getElementById(id) || app.querySelector("#" + id);
  const panel = $("focus");
  const openBtn = $("focus-btn");
  const timeEl = $("timer-time");
  const startBtn = $("timer-start");
  const stopBtn = $("timer-stop");
  const infoEl = $("timer-info");
  const pill = $("timer-pill");
  const lengthBtns = [...panel.querySelectorAll("[data-min]")];
  const list = $("todo-list");
  const form = $("todo-form");
  const input = $("todo-input");
  const todoInfo = $("todo-info");

  // 예전 저장 데이터에는 없을 수 있어서 기본값을 채웁니다.
  save.timer = Object.assign({ length: 25, mode: null, endAt: 0, remain: 0 }, save.timer);
  save.todos = save.todos || [];
  save.daily = save.daily || {};

  // ---- 날짜별 기록 (오늘 집중 횟수, 오늘 받은 할 일 코인) ----
  function today() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  function daily() {
    if (save.daily.date !== today()) save.daily = { date: today(), focus: 0, todoRewards: 0 };
    return save.daily;
  }

  const bonusOf = (minutes) => Math.round(minutes * FOCUS_BONUS_PER_MINUTE);

  function format(ms) {
    const s = Math.max(0, Math.ceil(ms / 1000));
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  }

  // ---- 타이머 ----
  // mode: null(대기) / "focus"(집중) / "break"(휴식)
  // endAt: 끝나는 시각 (멈춤 상태면 0이고 남은 시간은 remain에)
  function remaining() {
    const t = save.timer;
    if (!t.mode) return t.length * 60000;
    return t.endAt ? t.endAt - Date.now() : t.remain;
  }

  function isFocusing() {
    return save.timer.mode === "focus" && !!save.timer.endAt;
  }

  function start() {
    unlockSound();
    const t = save.timer;
    if (!t.mode) {
      t.mode = "focus";
      t.endAt = Date.now() + t.length * 60000;
    } else if (!t.endAt) {
      t.endAt = Date.now() + t.remain; // 멈춘 곳부터 이어서
      t.remain = 0;
    }
    Save.save(save);
    render();
  }

  function pause() {
    const t = save.timer;
    if (!t.endAt) return;
    t.remain = t.endAt - Date.now();
    t.endAt = 0;
    Save.save(save);
    render();
  }

  function stop() {
    Object.assign(save.timer, { mode: null, endAt: 0, remain: 0 });
    Save.save(save);
    render();
  }

  function finish() {
    const t = save.timer;
    if (t.mode === "focus") {
      const bonus = bonusOf(t.length);
      save.coins += bonus;
      daily().focus += 1;
      updateCoins(bonus);
      toast(`집중 완료! 보너스 ${bonus}코인을 받았어요. ${BREAK_MINUTES}분 쉬어 가요.`);
      t.mode = "break";
      t.endAt = Date.now() + BREAK_MINUTES * 60000;
    } else {
      toast("휴식 끝! 다시 집중해 볼까요?");
      Object.assign(t, { mode: null, endAt: 0, remain: 0 });
    }
    chime();
    Save.save(save);
    render();
  }

  // 화면을 그릴 때마다 불러서 시간이 다 됐는지 확인합니다.
  function update() {
    if (visiting) return; // 친구 방 구경 중에는 타이머를 건드리지 않음
    const t = save.timer;
    if (t.mode && t.endAt && Date.now() >= t.endAt) finish();
    renderTime();
  }

  function renderTime() {
    const t = save.timer;
    const text = format(remaining());
    if (timeEl.textContent !== text) timeEl.textContent = text;
    if (t.mode) {
      const label = `${t.mode === "focus" ? "집중" : "휴식"} ${text}${t.endAt ? "" : " · 멈춤"}`;
      if (pill.textContent !== label) pill.textContent = label;
      pill.hidden = false;
      pill.classList.toggle("break", t.mode === "break");
    } else {
      pill.hidden = true;
    }
  }

  function render() {
    const t = save.timer;
    const running = !!t.endAt;
    lengthBtns.forEach((b) => {
      b.classList.toggle("active", Number(b.dataset.min) === t.length);
      b.disabled = !!t.mode;
    });
    startBtn.textContent = !t.mode ? "시작" : running ? "일시정지" : "계속하기";
    stopBtn.hidden = !t.mode;
    stopBtn.textContent = t.mode === "break" ? "휴식 건너뛰기" : "그만두기";
    if (!t.mode) {
      infoEl.textContent = `끝까지 집중하면 보너스 ${bonusOf(t.length)}코인 · 오늘 집중 ${daily().focus}회`;
    } else if (t.mode === "focus") {
      infoEl.textContent = workItem()
        ? "집중하는 동안 캐릭터도 책상에서 함께해요."
        : "책상을 놓아 두면 캐릭터도 함께 집중해요.";
    } else {
      infoEl.textContent = "잠깐 쉬어요. 기지개를 켜 보는 건 어때요?";
    }
    renderTime();
  }

  // ---- 알림 소리 (짧은 두 음) ----
  let audio = null;
  function unlockSound() {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      audio.resume();
    } catch (e) {
      audio = null;
    }
  }

  function chime() {
    if (!audio) return;
    const t0 = audio.currentTime;
    [660, 880].forEach((freq, i) => {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      const at = t0 + i * 0.18;
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.15, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.6);
      osc.connect(gain).connect(audio.destination);
      osc.start(at);
      osc.stop(at + 0.7);
    });
  }

  // ---- 오늘 할 일 ----
  function addTodo(text) {
    save.todos.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      text,
      done: false,
      rewarded: false,
    });
    Save.save(save);
    renderTodos();
  }

  function toggleTodo(todo) {
    todo.done = !todo.done;
    // 처음 완료했을 때만 코인 (체크를 껐다 켜도 다시 받지 않음)
    if (todo.done && !todo.rewarded) {
      todo.rewarded = true;
      const d = daily();
      if (d.todoRewards < TODO_DAILY_MAX) {
        d.todoRewards += 1;
        save.coins += TODO_REWARD;
        updateCoins(TODO_REWARD);
        toast(`잘했어요! ${TODO_REWARD}코인을 받았어요.`);
      } else {
        toast("오늘 받을 수 있는 할 일 코인은 다 받았어요.");
      }
    }
    Save.save(save);
    renderTodos();
  }

  function removeTodo(todo) {
    save.todos = save.todos.filter((t) => t !== todo);
    Save.save(save);
    renderTodos();
  }

  let onTodos = null; // 할 일이 바뀌면 세로 보기도 새로 그림
  function renderTodos() {
    if (onTodos) onTodos();
    list.innerHTML = "";
    if (!save.todos.length) {
      const li = document.createElement("li");
      li.className = "todo-empty";
      li.textContent = "아직 할 일이 없어요.";
      list.append(li);
    }
    for (const todo of save.todos) {
      const li = document.createElement("li");
      li.className = "todo" + (todo.done ? " done" : "");
      const label = document.createElement("label");
      const box = document.createElement("input");
      box.type = "checkbox";
      box.checked = todo.done;
      box.addEventListener("change", () => toggleTodo(todo));
      const text = document.createElement("span");
      text.textContent = todo.text;
      label.append(box, text);
      const del = document.createElement("button");
      del.type = "button";
      del.className = "todo-del";
      del.setAttribute("aria-label", "삭제");
      del.textContent = "×";
      del.addEventListener("click", () => removeTodo(todo));
      li.append(label, del);
      list.append(li);
    }
    const d = daily();
    todoInfo.textContent = `끝낸 일마다 ${TODO_REWARD}코인 (오늘 ${d.todoRewards}/${TODO_DAILY_MAX})`;
    $("todo-clear").hidden = !save.todos.some((t) => t.done);
  }

  // ---- 패널 열기/닫기 ----
  function open() {
    if (editing) setEditing(false);
    closeShop();
    if (typeof Friends !== "undefined") Friends.close();
    panel.hidden = false;
    openBtn.classList.add("active");
    render();
    renderTodos();
  }

  function close() {
    panel.hidden = true;
    openBtn.classList.remove("active");
  }

  // ---- 버튼 연결 ----
  openBtn.addEventListener("click", () => (panel.hidden ? open() : close()));
  $("focus-close").addEventListener("click", close);
  pill.addEventListener("click", open);
  startBtn.addEventListener("click", () => (save.timer.endAt ? pause() : start()));
  stopBtn.addEventListener("click", stop);
  lengthBtns.forEach((b) => b.addEventListener("click", () => {
    save.timer.length = Number(b.dataset.min);
    Save.save(save);
    render();
  }));
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    addTodo(text);
    input.value = "";
  });
  $("todo-clear").addEventListener("click", () => {
    save.todos = save.todos.filter((t) => !t.done);
    Save.save(save);
    renderTodos();
  });

  render();
  // 세로 보기(side.js)에서도 같은 할 일을 쓰도록 내보냄
  function setTodoRender(fn) { onTodos = fn; }
  return { isFocusing, update, open, close, addTodo, toggleTodo, setTodoRender, start, pause };
})();

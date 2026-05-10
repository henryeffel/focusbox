import { formatRemaining, formatTime } from "../src/date.js";
import { getState, getTodayLogs } from "../src/storage.js";

const app = document.querySelector("#app");
const statusText = document.querySelector("#statusText");
let timerId = null;

init();

async function init() {
  const { currentSession } = await getState();
  if (currentSession) {
    renderSession(currentSession);
  } else {
    renderEmpty();
  }
}

function renderSession(session) {
  statusText.textContent = "진행 중인 작업이 있습니다.";
  app.innerHTML = `
    <div class="summary">
      <div class="item"><span>작업</span>${escapeHtml(session.task)}</div>
      <div class="item"><span>첫 행동</span>${escapeHtml(session.nextAction)}</div>
    </div>
    <div class="timer" id="timer">${formatRemaining(session.endsAt)}</div>
    <div class="actions">
      <button id="openButton" type="button">진행 화면 열기</button>
      <button class="secondary" id="todayButton" type="button">오늘 기록 보기</button>
    </div>
  `;

  timerId = setInterval(() => {
    const timer = document.querySelector("#timer");
    if (timer) timer.textContent = formatRemaining(session.endsAt);
  }, 1000);

  app.querySelector("#openButton").addEventListener("click", openStartPage);
  app.querySelector("#todayButton").addEventListener("click", renderTodayLogs);
}

function renderEmpty() {
  statusText.textContent = "아직 진행 중인 작업이 없습니다.";
  app.innerHTML = `
    <div class="empty">현재 세션이 없습니다.</div>
    <div class="actions">
      <button id="startButton" type="button">FocusBox 시작하기</button>
      <button class="secondary" id="todayButton" type="button">오늘 기록 보기</button>
    </div>
  `;

  app.querySelector("#startButton").addEventListener("click", openStartPage);
  app.querySelector("#todayButton").addEventListener("click", renderTodayLogs);
}

async function renderTodayLogs() {
  if (timerId) clearInterval(timerId);
  const logs = await getTodayLogs();
  statusText.textContent = "오늘의 기록";
  app.innerHTML = `
    ${
      logs.length
        ? logs.map((log) => `<div class="log">${formatLog(log)}</div>`).join("")
        : `<div class="empty">오늘 기록이 아직 없습니다.</div>`
    }
    <div class="actions">
      <button class="secondary" id="backButton" type="button">돌아가기</button>
    </div>
  `;

  app.querySelector("#backButton").addEventListener("click", init);
}

async function openStartPage() {
  await chrome.tabs.create({ url: chrome.runtime.getURL("pages/start.html") });
  window.close();
}

function formatLog(log) {
  const labels = {
    start: "시작",
    brain_dump: "Brain Dump",
    complete: "완료",
    interrupted: "중단",
    ritual_skipped: "Start Ritual skipped",
    next: "Next"
  };
  return `${formatTime(log.time)} ${labels[log.type] || log.type} - ${escapeHtml(log.message)}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

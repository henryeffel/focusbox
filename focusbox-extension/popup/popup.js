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
  statusText.textContent = "지금 집중 중인 박스가 있습니다.";
  app.innerHTML = `
    <div class="summary">
      <div class="item"><span>현재 작업</span>${escapeHtml(session.task)}</div>
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
  statusText.textContent = "진행 중인 박스가 없습니다.";
  app.innerHTML = `
    <div class="empty">지금은 열린 세션이 없습니다.</div>
    <div class="actions">
      <button id="startButton" type="button">첫 박스 시작하기</button>
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
        ? logs.map((log) => `<article class="log">${formatLog(log)}</article>`).join("")
        : `<div class="empty">아직 기록이 없습니다. 작은 박스 하나부터 시작해보세요.</div>`
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
    start: { icon: "Start", label: "시작" },
    brain_dump: { icon: "Note", label: "생각 맡김" },
    complete: { icon: "Done", label: "완료" },
    next: { icon: "Next", label: "다음 행동" },
    stop: { icon: "Stop", label: "중단" },
    interrupted: { icon: "Stop", label: "중단" },
    distraction: { icon: "Drift", label: "방해 사이트" },
    ritual_skipped: { icon: "Skip", label: "첫 박스 건너뜀" }
  };
  const meta = labels[log.type] || { icon: "Log", label: log.type };
  return `
    <div class="log-meta">
      <time>${formatTime(log.time)}</time>
      <span class="log-type">${meta.icon} · ${escapeHtml(meta.label)}</span>
    </div>
    <div class="log-message">${escapeHtml(log.message)}</div>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

import { DURATIONS, INTERRUPT_REASONS, SKIP_REASONS } from "../src/constants.js";
import { formatRemaining, formatTime, todayKey } from "../src/date.js";
import { getState, getTodayLogs } from "../src/storage.js";
import { addBrainDump, completeSession, interruptSession, skipRitual, startSession } from "../src/session.js";

const app = document.querySelector("#app");
const subtitle = document.querySelector("#subtitle");
const todayLogButton = document.querySelector("#todayLogButton");

let selectedDuration = 25;
let timerId = null;

todayLogButton.addEventListener("click", renderTodayLogs);

init();

async function init() {
  const { currentSession, settings } = await getState();
  if (currentSession) {
    renderSession(currentSession);
  } else if (settings.lastRitualDate === todayKey() || settings.skipDate === todayKey()) {
    renderIdle();
  } else {
    renderStart();
  }
}

function setView(title) {
  subtitle.textContent = title;
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}

function renderStart() {
  setView("지금은 하나만 정하면 됩니다.");
  app.innerHTML = `
    <h2>Start Ritual</h2>
    <form id="startForm" novalidate>
      <div class="field">
        <label for="task">지금 하려던 일은?</label>
        <input id="task" name="task" autocomplete="off" placeholder="예: 이력서 프로젝트 설명 수정">
      </div>
      <div class="field">
        <label for="nextAction">가장 작은 첫 행동은?</label>
        <input id="nextAction" name="nextAction" autocomplete="off" placeholder="예: README 파일 열기">
      </div>
      <div class="label">몇 분만 해볼까요?</div>
      <div class="duration-row" id="durationRow">
        ${DURATIONS.map((duration) => `<button class="choice ${duration === selectedDuration ? "active" : ""}" type="button" data-duration="${duration}">${duration}분</button>`).join("")}
      </div>
      <div class="action-row">
        <button type="submit">시작하기</button>
        <button class="secondary" id="skipButton" type="button">오늘은 건너뛰기</button>
      </div>
      <p class="error" id="error"></p>
    </form>
  `;

  app.querySelector("#durationRow").addEventListener("click", (event) => {
    const button = event.target.closest("[data-duration]");
    if (!button) return;
    selectedDuration = Number(button.dataset.duration);
    renderStart();
  });

  app.querySelector("#skipButton").addEventListener("click", renderSkip);
  app.querySelector("#startForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const task = String(form.get("task") || "").trim();
    const nextAction = String(form.get("nextAction") || "").trim();

    if (!task || !nextAction) {
      app.querySelector("#error").textContent = "작업과 첫 행동을 입력해야 시작할 수 있습니다.";
      return;
    }

    const session = await startSession({ task, nextAction, durationMinutes: selectedDuration });
    renderSession(session);
  });
}

function renderIdle() {
  setView("오늘 Start Ritual은 이미 처리했습니다.");
  app.innerHTML = `
    <h2>오늘은 준비가 끝났습니다.</h2>
    <p>진행 중인 세션은 없습니다.</p>
    <div class="action-row">
      <button id="newSessionButton" type="button">새 세션 시작하기</button>
      <button class="secondary" id="showLogsButton" type="button">오늘 기록 보기</button>
    </div>
  `;

  app.querySelector("#newSessionButton").addEventListener("click", renderStart);
  app.querySelector("#showLogsButton").addEventListener("click", renderTodayLogs);
}

function renderSession(session) {
  setView("FocusBox 진행 중");
  app.innerHTML = `
    <h2>FocusBox 진행 중</h2>
    <div class="summary">
      <div class="summary-item"><span>작업</span>${escapeHtml(session.task)}</div>
      <div class="summary-item"><span>첫 행동</span>${escapeHtml(session.nextAction)}</div>
    </div>
    <div class="label">남은 시간</div>
    <div class="timer" id="timer">${formatRemaining(session.endsAt)}</div>
    <div class="action-row">
      <button id="completeButton" type="button">완료</button>
      <button class="secondary" id="brainDumpButton" type="button">딴생각 저장</button>
      <button class="danger" id="interruptButton" type="button">중단</button>
    </div>
  `;

  timerId = setInterval(() => {
    const timer = app.querySelector("#timer");
    if (timer) timer.textContent = formatRemaining(session.endsAt);
  }, 1000);

  app.querySelector("#completeButton").addEventListener("click", renderComplete);
  app.querySelector("#brainDumpButton").addEventListener("click", renderBrainDump);
  app.querySelector("#interruptButton").addEventListener("click", renderInterrupt);
}

function renderBrainDump() {
  setView("떠오른 생각을 보관하고 돌아갑니다.");
  app.innerHTML = `
    <h2>떠오른 생각을 보관하세요.</h2>
    <p>지금 실행하지 말고, 적고 돌아갑니다.</p>
    <form id="brainDumpForm">
      <div class="field">
        <label for="brainDump">딴생각</label>
        <textarea id="brainDump" name="brainDump" placeholder="예: GitHub README 이미지 첨부법 찾아보기"></textarea>
      </div>
      <div class="action-row">
        <button type="submit">저장하고 복귀</button>
        <button class="secondary" id="cancelButton" type="button">취소</button>
      </div>
      <p class="error" id="error"></p>
    </form>
  `;

  app.querySelector("#brainDumpForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = app.querySelector("#brainDump").value.trim();
    if (!message) {
      app.querySelector("#error").textContent = "보관할 생각을 입력하세요.";
      return;
    }
    const session = await addBrainDump(message);
    app.innerHTML = `<p class="success">저장했습니다. 지금 작업으로 돌아갑니다.</p>`;
    setTimeout(() => renderSession(session), 800);
  });

  app.querySelector("#cancelButton").addEventListener("click", async () => {
    const { currentSession } = await getState();
    renderSession(currentSession);
  });
}

function renderComplete() {
  setView("완료 로그를 남깁니다.");
  app.innerHTML = `
    <h2>이번 블록에서 한 일은?</h2>
    <form id="completeForm">
      <div class="field">
        <label for="result">이번 블록에서 한 일</label>
        <textarea id="result" name="result"></textarea>
      </div>
      <div class="field">
        <label for="nextStep">다음 작은 행동은?</label>
        <input id="nextStep" name="nextStep" autocomplete="off">
      </div>
      <div class="action-row">
        <button type="submit">완료 저장</button>
      </div>
      <p class="error" id="error"></p>
    </form>
  `;

  app.querySelector("#completeForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const result = app.querySelector("#result").value.trim();
    const nextStep = app.querySelector("#nextStep").value.trim();
    if (!result) {
      app.querySelector("#error").textContent = "이번 블록에서 한 일을 입력하세요.";
      return;
    }
    await completeSession({ result, nextStep });
    renderTodayLogs();
  });
}

function renderInterrupt() {
  setView("중단 사유를 남깁니다.");
  app.innerHTML = `
    <h2>FocusBox를 중단할까요?</h2>
    <div class="label">사유</div>
    <div class="reason-grid">
      ${INTERRUPT_REASONS.map((reason) => `<button class="choice" type="button" data-reason="${reason}">${reason}</button>`).join("")}
    </div>
    <div class="action-row">
      <button class="secondary" id="continueButton" type="button">계속하기</button>
    </div>
  `;

  app.querySelector(".reason-grid").addEventListener("click", async (event) => {
    const button = event.target.closest("[data-reason]");
    if (!button) return;
    await interruptSession(button.dataset.reason);
    renderTodayLogs();
  });

  app.querySelector("#continueButton").addEventListener("click", async () => {
    const { currentSession } = await getState();
    renderSession(currentSession);
  });
}

function renderSkip() {
  setView("오늘 시작 계획을 건너뜁니다.");
  app.innerHTML = `
    <h2>오늘 시작 계획을 건너뜁니다.</h2>
    <p>사유를 선택하세요.</p>
    <div class="reason-grid">
      ${SKIP_REASONS.map((reason) => `<button class="choice" type="button" data-reason="${reason}">${reason}</button>`).join("")}
    </div>
    <div class="action-row">
      <button class="secondary" id="backButton" type="button">돌아가기</button>
    </div>
  `;

  app.querySelector(".reason-grid").addEventListener("click", async (event) => {
    const button = event.target.closest("[data-reason]");
    if (!button) return;
    await skipRitual(button.dataset.reason);
    renderTodayLogs();
  });

  app.querySelector("#backButton").addEventListener("click", renderStart);
}

async function renderTodayLogs() {
  setView("오늘의 FocusBox 기록");
  const logs = await getTodayLogs();
  app.innerHTML = `
    <h2>오늘의 기록</h2>
    ${
      logs.length
        ? `<div class="log-list">${logs.map((log) => `<article class="log-row">${formatLog(log)}</article>`).join("")}</div>`
        : `<div class="empty">아직 기록이 없습니다. 작은 FocusBox 하나부터 시작해보세요.</div>`
    }
    <div class="action-row">
      <button class="secondary" id="backButton" type="button">돌아가기</button>
    </div>
  `;

  app.querySelector("#backButton").addEventListener("click", init);
}

function formatLog(log) {
  const labels = {
    start: { icon: "▶️", label: "시작" },
    brain_dump: { icon: "💭", label: "생각 보관" },
    complete: { icon: "✅", label: "완료" },
    next: { icon: "➡️", label: "다음 행동" },
    stop: { icon: "⏹️", label: "중단" },
    interrupted: { icon: "⏹️", label: "중단" },
    distraction: { icon: "!", label: "방해 사이트" },
    ritual_skipped: { icon: "↪️", label: "시작 건너뜀" }
  };
  const meta = labels[log.type] || { icon: "•", label: log.type };
  return `
    <div class="log-meta">
      <time>${formatTime(log.time)}</time>
      <span class="log-type">${meta.icon} ${escapeHtml(meta.label)}</span>
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

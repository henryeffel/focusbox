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
    <div class="view-heading hero-heading">
      <p class="eyebrow">오늘의 첫 박스</p>
      <h2>브라우저를 켠 이유를 잃어버리기 전에, 첫 작업 하나만 정해보세요.</h2>
      <p>완벽한 계획보다 지금 바로 시작할 수 있는 한 줄이면 충분합니다.</p>
    </div>
    <form id="startForm" novalidate>
      <div class="field">
        <label for="task">지금 할 작업</label>
        <input id="task" name="task" autocomplete="off" placeholder="예: FocusBox README 정리">
      </div>
      <div class="field">
        <label for="nextAction">가장 작은 첫 행동</label>
        <input id="nextAction" name="nextAction" autocomplete="off" placeholder="예: README 파일 열기">
      </div>
      <div class="label">얼마 동안 집중할까요?</div>
      <div class="duration-row" id="durationRow">
        ${DURATIONS.map((duration) => `<button class="choice ${duration === selectedDuration ? "active" : ""}" type="button" data-duration="${duration}">${duration}분</button>`).join("")}
      </div>
      <div class="action-row">
        <button type="submit">첫 박스 시작하기</button>
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
      app.querySelector("#error").textContent = "작업과 첫 행동을 입력하면 시작할 수 있습니다.";
      return;
    }

    const session = await startSession({ task, nextAction, durationMinutes: selectedDuration });
    renderSession(session);
  });
}

function renderIdle() {
  setView("오늘의 첫 박스가 이미 처리되었습니다.");
  app.innerHTML = `
    <div class="view-heading">
      <p class="eyebrow">오늘의 첫 박스</p>
      <h2>오늘은 시작 준비가 끝났습니다.</h2>
      <p>진행 중인 박스가 없다면 새 박스를 바로 시작할 수 있습니다.</p>
    </div>
    <div class="action-row">
      <button id="newSessionButton" type="button">새 박스 시작하기</button>
      <button class="secondary" id="showLogsButton" type="button">오늘 기록 보기</button>
    </div>
  `;

  app.querySelector("#newSessionButton").addEventListener("click", renderStart);
  app.querySelector("#showLogsButton").addEventListener("click", renderTodayLogs);
}

function renderSession(session) {
  setView("지금 집중 중인 박스가 있습니다.");
  app.innerHTML = `
    <div class="session-hero">
      <div>
        <p class="eyebrow">Focus Session</p>
        <h2>${escapeHtml(session.task)}</h2>
        <p>다음 행동: ${escapeHtml(session.nextAction)}</p>
      </div>
      <div class="session-side">
        <div class="timer" id="timer">${formatRemaining(session.endsAt)}</div>
        <div class="sleeping-pet" aria-hidden="true">
          <span class="pet-zzz z-one">Z</span>
          <span class="pet-zzz z-two">z</span>
          <div class="pet-body">
            <span class="pet-ear pet-ear-left"></span>
            <span class="pet-ear pet-ear-right"></span>
            <span class="pet-face">
              <span class="pet-eye pet-eye-left"></span>
              <span class="pet-eye pet-eye-right"></span>
              <span class="pet-nose"></span>
            </span>
            <span class="pet-tail"></span>
          </div>
        </div>
      </div>
    </div>
    <div class="summary">
      <div class="summary-item"><span>현재 작업</span>${escapeHtml(session.task)}</div>
      <div class="summary-item"><span>첫 행동</span>${escapeHtml(session.nextAction)}</div>
    </div>
    <div class="action-row">
      <button id="completeButton" type="button">완료</button>
      <button class="secondary" id="brainDumpButton" type="button">생각 맡기기</button>
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
  setView("떠오른 생각은 잠깐 맡기고 돌아옵니다.");
  app.innerHTML = `
    <div class="view-heading">
      <p class="eyebrow">Quick Capture</p>
      <h2>지금 붙잡지 않아도 되는 생각을 한 줄로 남겨두세요.</h2>
      <p>기록하면 바로 현재 작업으로 돌아갑니다.</p>
    </div>
    <form id="brainDumpForm">
      <div class="field">
        <label for="brainDump">맡겨둘 생각</label>
        <textarea id="brainDump" name="brainDump" placeholder="예: 나중에 GitHub README 이미지 확인하기"></textarea>
      </div>
      <div class="action-row">
        <button type="submit">저장하고 돌아가기</button>
        <button class="secondary" id="cancelButton" type="button">취소</button>
      </div>
      <p class="error" id="error"></p>
    </form>
  `;

  app.querySelector("#brainDumpForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = app.querySelector("#brainDump").value.trim();
    if (!message) {
      app.querySelector("#error").textContent = "맡겨둘 생각을 한 줄로 입력해주세요.";
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
  setView("이번 박스의 결과를 남깁니다.");
  app.innerHTML = `
    <div class="view-heading">
      <p class="eyebrow">완료 기록</p>
      <h2>이번 박스에서 끝낸 일을 짧게 남겨주세요.</h2>
    </div>
    <form id="completeForm">
      <div class="field">
        <label for="result">완료한 일</label>
        <textarea id="result" name="result" placeholder="예: README 구조를 정리함"></textarea>
      </div>
      <div class="field">
        <label for="nextStep">다음 작은 행동</label>
        <input id="nextStep" name="nextStep" autocomplete="off" placeholder="예: 스크린샷 추가하기">
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
      app.querySelector("#error").textContent = "완료한 일을 한 줄 이상 입력해주세요.";
      return;
    }
    await completeSession({ result, nextStep });
    renderTodayLogs();
  });
}

function renderInterrupt() {
  setView("중단 이유를 기록합니다.");
  app.innerHTML = `
    <div class="view-heading">
      <p class="eyebrow">중단 기록</p>
      <h2>이 박스를 여기서 멈출까요?</h2>
      <p>가장 가까운 이유만 고르면 오늘 기록에 남깁니다.</p>
    </div>
    <div class="label">이유</div>
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
  setView("오늘은 건너뛰기로 기록합니다.");
  app.innerHTML = `
    <div class="view-heading">
      <p class="eyebrow">첫 박스 건너뜀</p>
      <h2>오늘은 건너뛰기</h2>
      <p>가장 가까운 이유를 하나만 선택해주세요.</p>
    </div>
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
  setView("오늘 기록을 확인합니다.");
  const logs = await getTodayLogs();
  app.innerHTML = `
    <div class="view-heading">
      <p class="eyebrow">Today Log</p>
      <h2>오늘의 기록</h2>
    </div>
    ${
      logs.length
        ? `<div class="log-list">${logs.map((log) => `<article class="log-row">${formatLog(log)}</article>`).join("")}</div>`
        : `<div class="empty">아직 기록이 없습니다. 작은 박스 하나부터 시작해보세요.</div>`
    }
    <div class="action-row">
      <button class="secondary" id="backButton" type="button">돌아가기</button>
    </div>
  `;

  app.querySelector("#backButton").addEventListener("click", init);
}

function formatLog(log) {
  const labels = {
    start: { label: "시작" },
    brain_dump: { label: "생각 맡김" },
    complete: { label: "완료" },
    next: { label: "다음 행동" },
    stop: { label: "중단" },
    interrupted: { label: "중단" },
    distraction: { label: "방해 사이트" },
    ritual_skipped: { label: "첫 박스 건너뜀" }
  };
  const meta = labels[log.type] || { label: log.type };
  return `
    <div class="log-meta">
      <time>${formatTime(log.time)}</time>
      <span class="log-type">${escapeHtml(meta.label)}</span>
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

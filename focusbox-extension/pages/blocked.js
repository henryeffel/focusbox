import { getState } from "../src/storage.js";
import { addBrainDump } from "../src/session.js";

const app = document.querySelector("#app");
const params = new URLSearchParams(window.location.search);
const targetUrl = params.get("target") || "";
const returnUrl = params.get("return") || chrome.runtime.getURL("pages/start.html");
const startUrl = chrome.runtime.getURL("pages/start.html");

init();

async function init() {
  const { currentSession } = await getState();
  if (!currentSession || currentSession.status !== "running") {
    await goTo(targetUrl || returnUrl);
    return;
  }

  renderBlocked(currentSession);
}

function renderBlocked(session) {
  app.innerHTML = `
    <p class="eyebrow">잠깐 멈춤</p>
    <h1>지금은 이 사이트보다 현재 박스가 먼저입니다.</h1>
    <p class="lede">정해둔 작업으로 돌아가거나, 떠오른 생각만 맡겨두고 다시 이어갈 수 있습니다.</p>
    <div class="target">${escapeHtml(formatTarget(targetUrl))}</div>

    <div class="summary">
      <div class="summary-item"><span>현재 작업</span>${escapeHtml(session.task)}</div>
      <div class="summary-item"><span>첫 행동</span>${escapeHtml(session.nextAction)}</div>
    </div>

    <div class="actions">
      <button id="returnButton" type="button">작업으로 돌아가기</button>
      <button class="secondary" id="captureButton" type="button">생각 맡기기</button>
      <button class="danger" id="continueButton" type="button">기록하고 계속 이동</button>
    </div>

    <form class="capture" id="captureForm" hidden>
      <label for="thought">맡겨둘 생각</label>
      <input id="thought" name="thought" autocomplete="off" placeholder="나중에 확인할 일을 한 줄로 적어주세요.">
      <div class="actions">
        <button type="submit">저장하고 돌아가기</button>
        <button class="secondary" id="cancelCaptureButton" type="button">취소</button>
      </div>
      <p class="error" id="error"></p>
    </form>
  `;

  app.querySelector("#returnButton").addEventListener("click", () => goTo(returnUrl));
  app.querySelector("#captureButton").addEventListener("click", showCapture);
  app.querySelector("#continueButton").addEventListener("click", continueToTarget);
  app.querySelector("#captureForm").addEventListener("submit", saveThought);
  app.querySelector("#cancelCaptureButton").addEventListener("click", hideCapture);
}

function showCapture() {
  const form = app.querySelector("#captureForm");
  form.hidden = false;
  app.querySelector("#thought").focus();
}

function hideCapture() {
  app.querySelector("#captureForm").hidden = true;
  app.querySelector("#error").textContent = "";
}

async function saveThought(event) {
  event.preventDefault();
  const thought = app.querySelector("#thought").value.trim();
  if (!thought) {
    app.querySelector("#error").textContent = "저장할 내용을 한 줄로 입력해주세요.";
    return;
  }

  await addBrainDump(thought);
  await goTo(startUrl);
}

async function continueToTarget() {
  const response = await chrome.runtime.sendMessage({
    type: "focusbox_continue_to_distraction",
    targetUrl
  });

  if (!response?.ok) {
    app.querySelector("#error").textContent = "사이트로 이동하지 못했습니다.";
  }
}

async function goTo(url) {
  if (isNavigableUrl(url)) {
    window.location.replace(url);
  } else {
    window.location.replace(startUrl);
  }
}

function isNavigableUrl(url) {
  return url.startsWith("http://") || url.startsWith("https://") || url.startsWith(chrome.runtime.getURL(""));
}

function formatTarget(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url || "알 수 없는 사이트";
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

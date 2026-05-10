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
    <h1>FocusBox blocked a distraction site</h1>
    <p class="lede">This site is paused while your Focus Session is running.</p>
    <div class="target">${escapeHtml(formatTarget(targetUrl))}</div>

    <div class="summary">
      <div class="summary-item"><span>Current task</span>${escapeHtml(session.task)}</div>
      <div class="summary-item"><span>First action</span>${escapeHtml(session.nextAction)}</div>
    </div>

    <div class="actions">
      <button id="returnButton" type="button">Return to task</button>
      <button class="secondary" id="captureButton" type="button">Save to thought parking</button>
      <button class="danger" id="continueButton" type="button">Record drift and continue</button>
    </div>

    <form class="capture" id="captureForm" hidden>
      <label for="thought">One line to park</label>
      <input id="thought" name="thought" autocomplete="off" placeholder="What do you want to remember?">
      <div class="actions">
        <button type="submit">Save and return</button>
        <button class="secondary" id="cancelCaptureButton" type="button">Cancel</button>
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
    app.querySelector("#error").textContent = "Enter one line before saving.";
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
    app.querySelector("#error").textContent = "Could not continue to the site.";
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
    return url || "Unknown site";
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

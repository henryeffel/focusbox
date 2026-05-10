import { ensureInitialState, getState } from "./src/storage.js";
import { todayKey } from "./src/date.js";

const START_PAGE = "pages/start.html";

chrome.runtime.onInstalled.addListener(async () => {
  await ensureInitialState();
  await openStartIfNeeded(true);
});

chrome.runtime.onStartup.addListener(async () => {
  await ensureInitialState();
  await openStartIfNeeded(false);
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (!alarm.name.startsWith("focusbox_session_")) return;

  const { currentSession } = await getState();
  if (!currentSession || !alarm.name.endsWith(currentSession.id)) return;

  await chrome.action.setBadgeText({ text: "0" });
  await chrome.action.setBadgeBackgroundColor({ color: "#2563eb" });
});

async function openStartIfNeeded(forceOpen) {
  const { settings, currentSession } = await getState();
  const today = todayKey();
  const alreadyHandledToday = settings.lastRitualDate === today || settings.skipDate === today;

  if (!forceOpen && alreadyHandledToday && !currentSession) return;

  await chrome.tabs.create({ url: chrome.runtime.getURL(START_PAGE) });
}

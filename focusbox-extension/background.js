import { DEFAULT_DISTRACTION_SITES } from "./src/constants.js";
import { recordDistraction } from "./src/session.js";
import { ensureInitialState, getState } from "./src/storage.js";
import { todayKey } from "./src/date.js";

const START_PAGE = "pages/start.html";
const BLOCKED_PAGE = "pages/blocked.html";
const ALLOW_ONCE_MS = 5000;
const previousAllowedUrlByTab = new Map();
const allowOnceByTab = new Map();

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

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!changeInfo.url) return;

  await handleNavigation(tabId, changeInfo.url);
});

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return;

  await handleNavigation(details.tabId, details.url);
});

chrome.tabs.onRemoved.addListener((tabId) => {
  previousAllowedUrlByTab.delete(tabId);
  allowOnceByTab.delete(tabId);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "focusbox_continue_to_distraction") return false;

  handleContinueToDistraction(message, sender)
    .then(() => sendResponse({ ok: true }))
    .catch((error) => sendResponse({ ok: false, error: error.message }));
  return true;
});

async function handleNavigation(tabId, url) {
  if (!isHttpUrl(url) || isExtensionUrl(url)) return;

  const allowEntry = allowOnceByTab.get(tabId);
  if (allowEntry?.url === url && allowEntry.expiresAt > Date.now()) {
    previousAllowedUrlByTab.set(tabId, url);
    return;
  }
  if (allowEntry && allowEntry.expiresAt <= Date.now()) {
    allowOnceByTab.delete(tabId);
  }

  const { currentSession } = await getState();
  if (!currentSession || currentSession.status !== "running") {
    previousAllowedUrlByTab.set(tabId, url);
    return;
  }

  if (!isDistractionUrl(url)) {
    previousAllowedUrlByTab.set(tabId, url);
    return;
  }

  const returnUrl = previousAllowedUrlByTab.get(tabId) || chrome.runtime.getURL(START_PAGE);
  const warningUrl = buildBlockedPageUrl({ targetUrl: url, returnUrl });
  await chrome.tabs.update(tabId, { url: warningUrl });
}

async function openStartIfNeeded(forceOpen) {
  const { settings, currentSession } = await getState();
  const today = todayKey();
  const alreadyHandledToday = settings.lastRitualDate === today || settings.skipDate === today;

  if (!forceOpen && alreadyHandledToday && !currentSession) return;

  await chrome.tabs.create({ url: chrome.runtime.getURL(START_PAGE) });
}

function isHttpUrl(url) {
  return url.startsWith("http://") || url.startsWith("https://");
}

function isExtensionUrl(url) {
  return url.startsWith(chrome.runtime.getURL(""));
}

function isDistractionUrl(url) {
  try {
    const { hostname } = new URL(url);
    const normalizedHost = hostname.toLowerCase();

    return DEFAULT_DISTRACTION_SITES.some((site) => {
      const normalizedSite = site.toLowerCase();
      return (
        normalizedHost === normalizedSite ||
        normalizedHost.endsWith(`.${normalizedSite}`)
      );
    });
  } catch {
    return false;
  }
}

function buildBlockedPageUrl({ targetUrl, returnUrl }) {
  const url = new URL(chrome.runtime.getURL(BLOCKED_PAGE));
  url.searchParams.set("target", targetUrl);
  url.searchParams.set("return", returnUrl);
  return url.toString();
}

async function handleContinueToDistraction(message, sender) {
  const targetUrl = String(message.targetUrl || "");
  if (!isHttpUrl(targetUrl)) return;

  const tabId = sender.tab?.id;
  const host = new URL(targetUrl).hostname;
  await recordDistraction({ url: targetUrl, host });

  if (typeof tabId === "number") {
    const allowEntry = { url: targetUrl, expiresAt: Date.now() + ALLOW_ONCE_MS };
    allowOnceByTab.set(tabId, allowEntry);
    setTimeout(() => {
      if (allowOnceByTab.get(tabId) === allowEntry) {
        allowOnceByTab.delete(tabId);
      }
    }, ALLOW_ONCE_MS);
    await chrome.tabs.update(tabId, { url: targetUrl });
  }
}

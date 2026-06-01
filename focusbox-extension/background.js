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

// 크롬 스토리지에서 dailyLogs를 읽어와 FastAPI 백엔드로 전송하는 함수
function syncLogsToFastAPI() {
  // 1. Chrome Storage API에서 데이터 꺼내기
  chrome.storage.local.get(['dailyLogs'], function(result) {
    const logsFromStorage = result.dailyLogs || [];
    
    console.log("현재 크롬 스토리지에 쌓인 로그:", logsFromStorage);

    // 2. FastAPI 서버 주소로 POST 요청 날리기
    fetch('http://localhost:8000/api/sync-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        logs: logsFromStorage // FastAPI가 기다리는 { logs: [...] } 형태로 가공
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log('★ FastAPI 서버 동기화 성공! 수신된 개수:', data.received_count);
    })
    .catch(error => {
      console.error('⚠️ FastAPI 서버 전송 실패:', error);
    });
  });
}

// [실험용 브릿지] 사용자가 새 탭을 열거나 특정 행동을 할 때마다 강제로 동기화가 돌도록 임시 연결
chrome.tabs.onCreated.addListener(function() {
  console.log("새 탭이 열려 동기화를 시도합니다.");
  syncLogsToFastAPI();
});
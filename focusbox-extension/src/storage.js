import { DEFAULT_SETTINGS, STORAGE_KEYS } from "./constants.js";
import { todayKey } from "./date.js";

export async function getState() {
  const data = await chrome.storage.local.get(Object.values(STORAGE_KEYS));
  return {
    settings: { ...DEFAULT_SETTINGS, ...(data.settings || {}) },
    currentSession: data.currentSession || null,
    sessions: data.sessions || [],
    dailyLogs: data.dailyLogs || []
  };
}

export async function setState(partial) {
  await chrome.storage.local.set(partial);
}

export async function ensureInitialState() {
  const state = await getState();
  await setState({
    settings: state.settings,
    sessions: state.sessions,
    dailyLogs: state.dailyLogs,
    currentSession: state.currentSession
  });
  return getState();
}

export async function updateSettings(patch) {
  const { settings } = await getState();
  const next = { ...settings, ...patch };
  await setState({ settings: next });
  return next;
}

export async function appendDailyLog(log, date = todayKey(new Date(log.time || Date.now()))) {
  const { dailyLogs } = await getState();
  const nextLogs = [...dailyLogs];
  const index = nextLogs.findIndex((entry) => entry.date === date);
  const nextLog = { time: new Date().toISOString(), ...log };

  if (index >= 0) {
    nextLogs[index] = {
      ...nextLogs[index],
      logs: [...nextLogs[index].logs, nextLog]
    };
  } else {
    nextLogs.push({ date, logs: [nextLog] });
  }

  await setState({ dailyLogs: nextLogs });
  return nextLog;
}

export async function getTodayLogs() {
  const { dailyLogs } = await getState();
  return dailyLogs.find((entry) => entry.date === todayKey())?.logs || [];
}

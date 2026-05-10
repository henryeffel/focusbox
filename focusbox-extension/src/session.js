import { appendDailyLog, getState, setState, updateSettings } from "./storage.js";
import { addMinutes, todayKey } from "./date.js";

export async function startSession({ task, nextAction, durationMinutes }) {
  const startedAt = new Date();
  const endsAt = addMinutes(startedAt, durationMinutes);
  const session = {
    id: `session_${startedAt.getTime()}`,
    task: task.trim(),
    nextAction: nextAction.trim(),
    durationMinutes,
    startedAt: startedAt.toISOString(),
    endsAt: endsAt.toISOString(),
    status: "running",
    logs: [
      {
        time: startedAt.toISOString(),
        type: "start",
        message: task.trim()
      }
    ]
  };

  const { sessions } = await getState();
  await setState({
    currentSession: session,
    sessions: [...sessions, session]
  });
  await updateSettings({ lastRitualDate: todayKey() });
  await appendDailyLog({
    time: startedAt.toISOString(),
    type: "start",
    sessionId: session.id,
    message: task.trim()
  });
  await chrome.alarms.create(`focusbox_session_${session.id}`, { when: endsAt.getTime() });
  return session;
}

export async function addBrainDump(message) {
  const { currentSession, sessions } = await getState();
  if (!currentSession) return null;

  const log = {
    time: new Date().toISOString(),
    type: "brain_dump",
    message: message.trim()
  };
  const nextSession = {
    ...currentSession,
    logs: [...(currentSession.logs || []), log]
  };

  await setState({
    currentSession: nextSession,
    sessions: sessions.map((session) => (session.id === nextSession.id ? nextSession : session))
  });
  await appendDailyLog({ ...log, sessionId: nextSession.id });
  return nextSession;
}

export async function completeSession({ result, nextStep }) {
  const { currentSession, sessions } = await getState();
  if (!currentSession) return null;

  const endedAt = new Date().toISOString();
  const log = {
    time: endedAt,
    type: "complete",
    message: result.trim()
  };
  const nextSession = {
    ...currentSession,
    endedAt,
    status: "completed",
    result: result.trim(),
    nextStep: nextStep.trim(),
    logs: [...(currentSession.logs || []), log]
  };

  await setState({
    currentSession: null,
    sessions: sessions.map((session) => (session.id === nextSession.id ? nextSession : session))
  });
  await chrome.alarms.clear(`focusbox_session_${nextSession.id}`);
  await appendDailyLog({ ...log, sessionId: nextSession.id });
  if (nextStep.trim()) {
    await appendDailyLog({
      time: endedAt,
      type: "next",
      sessionId: nextSession.id,
      message: nextStep.trim()
    });
  }
  return nextSession;
}

export async function interruptSession(reason) {
  const { currentSession, sessions } = await getState();
  if (!currentSession) return null;

  const endedAt = new Date().toISOString();
  const log = {
    time: endedAt,
    type: "interrupted",
    message: reason
  };
  const nextSession = {
    ...currentSession,
    endedAt,
    status: "interrupted",
    interruptReason: reason,
    logs: [...(currentSession.logs || []), log]
  };

  await setState({
    currentSession: null,
    sessions: sessions.map((session) => (session.id === nextSession.id ? nextSession : session))
  });
  await chrome.alarms.clear(`focusbox_session_${nextSession.id}`);
  await appendDailyLog({ ...log, sessionId: nextSession.id });
  return nextSession;
}

export async function skipRitual(reason) {
  const now = new Date().toISOString();
  await updateSettings({ skipDate: todayKey(), lastRitualDate: todayKey() });
  await appendDailyLog({
    time: now,
    type: "ritual_skipped",
    message: reason
  });
}

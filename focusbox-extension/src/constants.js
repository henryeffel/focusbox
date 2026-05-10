export const STORAGE_KEYS = {
  settings: "settings",
  currentSession: "currentSession",
  sessions: "sessions",
  dailyLogs: "dailyLogs"
};

export const DEFAULT_SETTINGS = {
  defaultDuration: 25,
  startRitualMode: "start_ritual",
  lastRitualDate: null,
  skipDate: null
};

export const DURATIONS = [10, 25, 50];

export const SKIP_REASONS = ["급한 검색만 함", "쉬는 날", "귀찮음", "나중에 함"];

export const INTERRUPT_REASONS = ["급한 일", "집중 안 됨", "작업 변경", "기타"];

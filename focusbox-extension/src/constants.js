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

export const DEFAULT_DISTRACTION_SITES = [
  "youtube.com",
  "www.youtube.com",
  "instagram.com",
  "www.instagram.com",
  "x.com",
  "twitter.com",
  "www.facebook.com",
  "reddit.com"
];

export const SKIP_REASONS = ["급한 검색만 필요", "쉬는 날", "컨디션 낮음", "나중에"];

export const INTERRUPT_REASONS = ["급한 일", "집중 어려움", "작업 변경", "기타"];

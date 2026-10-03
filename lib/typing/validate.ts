import type { ResultStats, WpmSnapshot } from "./types";

export type InvalidReason =
  | "no_keystrokes"
  | "invalid_numbers"
  | "invalid_accuracy"
  | "too_short"
  | "impossible_wpm"
  | "impossible_raw"
  | "impossible_cps"
  | "impossible_burst"
  | "flat_wpm_history"
  | "perfect_consistency"
  | "afk_detected";

export type Validation = { valid: true } | { valid: false; reason: InvalidReason };

const MAX_WPM = 300;
const MAX_RAW_WPM = 350;
const MAX_CHARS_PER_SECOND = 30;
const MAX_BURST_WPM = 600;
const MIN_ELAPSED_SECONDS = 2;
const MAX_IDLE_SECONDS = 3;
const MIN_HISTORY_FOR_STATS = 4;
const MIN_WPM_FOR_BOT_CHECKS = 80;

export const INVALID_REASON_COPY: Record<InvalidReason, string> = {
  no_keystrokes: "No keystrokes were recorded.",
  invalid_numbers: "The result contained values that could not be scored.",
  invalid_accuracy: "Accuracy fell outside the valid range.",
  too_short: "The test ended too quickly to score.",
  impossible_wpm: "That speed is above the human ceiling.",
  impossible_raw: "That raw speed is above the human ceiling.",
  impossible_cps: "Too many characters per second to be real.",
  impossible_burst: "A single second spiked far beyond human speed.",
  flat_wpm_history: "Your speed was perfectly flat, which looks automated.",
  perfect_consistency: "Your pacing was inhumanly steady.",
  afk_detected: "You went idle for too long during the test.",
};

function isFlat(history: WpmSnapshot[], wpm: number) {
  if (history.length < MIN_HISTORY_FOR_STATS || wpm < MIN_WPM_FOR_BOT_CHECKS) {
    return false;
  }
  const values = history.map((snapshot) => snapshot.wpm);
  return Math.max(...values) - Math.min(...values) <= 1;
}

function wentIdle(history: WpmSnapshot[]) {
  let idle = 0;
  for (const snapshot of history.slice(1, -1)) {
    idle = snapshot.raw === 0 ? idle + 1 : 0;
    if (idle > MAX_IDLE_SECONDS) {
      return true;
    }
  }
  return false;
}

export function validateResult(stats: ResultStats): Validation {
  const keystrokes = stats.correctChars + stats.incorrectChars + stats.extraChars;

  if (keystrokes === 0) {
    return { valid: false, reason: "no_keystrokes" };
  }
  if (![stats.wpm, stats.raw, stats.accuracy].every(Number.isFinite)) {
    return { valid: false, reason: "invalid_numbers" };
  }
  if (stats.accuracy < 0 || stats.accuracy > 100) {
    return { valid: false, reason: "invalid_accuracy" };
  }
  if (stats.elapsedSeconds < MIN_ELAPSED_SECONDS) {
    return { valid: false, reason: "too_short" };
  }
  if (stats.wpm > MAX_WPM) {
    return { valid: false, reason: "impossible_wpm" };
  }
  if (stats.raw > MAX_RAW_WPM) {
    return { valid: false, reason: "impossible_raw" };
  }
  if (keystrokes / stats.elapsedSeconds > MAX_CHARS_PER_SECOND) {
    return { valid: false, reason: "impossible_cps" };
  }

  const history = stats.wpmHistory;
  if (history.some((snapshot) => snapshot.wpm > MAX_BURST_WPM)) {
    return { valid: false, reason: "impossible_burst" };
  }
  if (history.length > MIN_HISTORY_FOR_STATS + 2 && wentIdle(history)) {
    return { valid: false, reason: "afk_detected" };
  }
  if (isFlat(history, stats.wpm)) {
    return { valid: false, reason: "flat_wpm_history" };
  }
  if (
    history.length >= MIN_HISTORY_FOR_STATS &&
    stats.wpm >= MIN_WPM_FOR_BOT_CHECKS &&
    stats.consistency >= 99
  ) {
    return { valid: false, reason: "perfect_consistency" };
  }

  return { valid: true };
}

export const TEST_MODES = ["time", "words", "quote", "zen"] as const;
export const TIME_OPTIONS = [15, 30, 60, 120] as const;
export const WORD_OPTIONS = [10, 25, 50, 100] as const;
export const QUOTE_LENGTHS = ["short", "medium", "long"] as const;
export const DIFFICULTIES = ["easy", "hard"] as const;

export type TestMode = (typeof TEST_MODES)[number];
export type TimeOption = (typeof TIME_OPTIONS)[number];
export type WordOption = (typeof WORD_OPTIONS)[number];
export type QuoteLength = (typeof QUOTE_LENGTHS)[number];
export type Difficulty = (typeof DIFFICULTIES)[number];

export interface TestOptions {
  difficulty: Difficulty | null;
  mode: TestMode;
  numbers: boolean;
  punctuation: boolean;
  quoteLength: QuoteLength;
  timeOption: TimeOption;
  wordOption: WordOption;
}

export const DEFAULT_OPTIONS: TestOptions = {
  mode: "time",
  timeOption: 30,
  wordOption: 25,
  quoteLength: "medium",
  punctuation: false,
  numbers: false,
  difficulty: "easy",
};

export const RANKED_MODES = ["time", "words"] as const;
export type RankedMode = (typeof RANKED_MODES)[number];

export const RANKED_DETAILS: Record<RankedMode, readonly string[]> = {
  time: TIME_OPTIONS.map(String),
  words: WORD_OPTIONS.map(String),
};

export function modeDetailOf(options: TestOptions): string {
  if (options.mode === "time") {
    return String(options.timeOption);
  }
  if (options.mode === "words") {
    return String(options.wordOption);
  }
  if (options.mode === "quote") {
    return options.quoteLength;
  }
  return "";
}

export function isRanked(mode: string, detail: string): mode is RankedMode {
  return (
    (RANKED_MODES as readonly string[]).includes(mode) &&
    RANKED_DETAILS[mode as RankedMode].includes(detail)
  );
}

const STORAGE_KEY = "kc-test-options";

function sanitize(raw: unknown): TestOptions {
  const value = (raw ?? {}) as Partial<Record<keyof TestOptions, unknown>>;
  const pick = <T>(candidate: unknown, allowed: readonly T[], fallback: T): T =>
    allowed.includes(candidate as T) ? (candidate as T) : fallback;

  return {
    mode: pick(value.mode, TEST_MODES, DEFAULT_OPTIONS.mode),
    timeOption: pick(value.timeOption, TIME_OPTIONS, DEFAULT_OPTIONS.timeOption),
    wordOption: pick(value.wordOption, WORD_OPTIONS, DEFAULT_OPTIONS.wordOption),
    quoteLength: pick(value.quoteLength, QUOTE_LENGTHS, DEFAULT_OPTIONS.quoteLength),
    punctuation: typeof value.punctuation === "boolean" ? value.punctuation : false,
    numbers: typeof value.numbers === "boolean" ? value.numbers : false,
    difficulty: pick(value.difficulty, [...DIFFICULTIES, null], DEFAULT_OPTIONS.difficulty),
  };
}

export function readStoredOptions(): TestOptions {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? sanitize(JSON.parse(raw)) : DEFAULT_OPTIONS;
  } catch {
    return DEFAULT_OPTIONS;
  }
}

export function writeStoredOptions(options: TestOptions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
  } catch {
    return;
  }
}

export function clearStoredOptions() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    return;
  }
}

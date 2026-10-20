import type { Difficulty, TestMode } from "./options";

export interface WpmSnapshot {
  errors: number;
  raw: number;
  second: number;
  wpm: number;
}

export interface ResultStats {
  accuracy: number;
  consistency: number;
  correctChars: number;
  correctedErrors: number;
  difficulty: Difficulty | null;
  elapsedSeconds: number;
  extraChars: number;
  incorrectChars: number;
  missedChars: number;
  mode: TestMode;
  modeDetail: string;
  numbers: boolean;
  punctuation: boolean;
  raw: number;
  /** Key-down thocks recorded during this test. */
  thocks: number;
  wpm: number;
  wpmHistory: WpmSnapshot[];
}

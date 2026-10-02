import type { TestMode } from "./options";
import type { WpmSnapshot } from "./types";

export interface CharCounts {
  allCorrectChars: number;
  correctSpaces: number;
  correctWordChars: number;
  extraChars: number;
  incorrectChars: number;
  missedChars: number;
}

interface CountInput {
  final: boolean;
  mode: TestMode;
  targetWords: string[];
  typed: string;
  wordIndex: number;
  wordInputs: string[];
}

export function countChars({
  targetWords,
  wordInputs,
  typed,
  wordIndex,
  mode,
  final,
}: CountInput): CharCounts {
  const inputs = [...wordInputs.slice(0, wordIndex), typed];
  const counts: CharCounts = {
    allCorrectChars: 0,
    correctSpaces: 0,
    correctWordChars: 0,
    extraChars: 0,
    incorrectChars: 0,
    missedChars: 0,
  };
  const countPartialLast = !final || mode === "time" || mode === "zen";

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const target = targetWords[i];
    if (target === undefined) {
      break;
    }

    if (input === target) {
      counts.correctWordChars += target.length;
      counts.allCorrectChars += target.length;
      if (i < inputs.length - 1) {
        counts.correctSpaces += 1;
      }
      continue;
    }

    if (input.length >= target.length) {
      for (let c = 0; c < input.length; c++) {
        if (c >= target.length) {
          counts.extraChars += 1;
        } else if (input[c] === target[c]) {
          counts.allCorrectChars += 1;
        } else {
          counts.incorrectChars += 1;
        }
      }
      continue;
    }

    let correct = 0;
    let incorrect = 0;
    for (let c = 0; c < input.length; c++) {
      if (input[c] === target[c]) {
        correct += 1;
      } else {
        incorrect += 1;
      }
    }
    counts.allCorrectChars += correct;
    counts.incorrectChars += incorrect;

    const isLast = i === inputs.length - 1;
    if (isLast && countPartialLast) {
      if (incorrect === 0) {
        counts.correctWordChars += correct;
      }
    } else {
      counts.missedChars += target.length - input.length;
    }
  }

  return counts;
}

export function wpmNumerator(counts: CharCounts) {
  return counts.correctWordChars + counts.correctSpaces;
}

export function accuracyOf(counts: CharCounts) {
  const total = counts.allCorrectChars + counts.incorrectChars;
  return total > 0 ? Math.round((counts.allCorrectChars / total) * 100) : 100;
}

export function wordsPerMinute(chars: number, seconds: number) {
  return Math.round(chars / 5 / Math.max(seconds / 60, 1 / 60));
}

export function consistencyOf(history: WpmSnapshot[]) {
  const values = history.map((snapshot) => snapshot.wpm).filter((wpm) => wpm > 0);
  if (values.length < 2) {
    return 100;
  }
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.max(0, Math.round(100 - (Math.sqrt(variance) / (mean || 1)) * 100));
}

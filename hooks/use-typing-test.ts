"use client";

import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { readConsent } from "@/lib/client/consent";
import {
  DEFAULT_OPTIONS,
  type Difficulty,
  modeDetailOf,
  readStoredOptions,
  type TestOptions,
  writeStoredOptions,
} from "@/lib/typing/options";
import {
  accuracyOf,
  consistencyOf,
  countChars,
  wordsPerMinute,
  wpmNumerator,
} from "@/lib/typing/scoring";
import type { ResultStats, WpmSnapshot } from "@/lib/typing/types";
import { generateWords, pickQuote } from "@/lib/typing/words";

const OPEN_ENDED_WORDS = 120;
const EXTEND_THRESHOLD = 40;
const EXTEND_BY = 80;
const RESET_FADE_MS = 150;

interface UseTypingTestProps {
  onActiveChange?: (active: boolean) => void;
  onMistake?: () => void;
}

function wordCountFor(options: TestOptions) {
  return options.mode === "words" ? options.wordOption : OPEN_ENDED_WORDS;
}

function wordSource(options: TestOptions) {
  return {
    hard: options.difficulty === "hard",
    punctuation: options.punctuation,
    numbers: options.numbers,
  };
}

function isOpenEnded(options: TestOptions) {
  return options.mode === "time" || options.mode === "zen";
}

function countWordErrors(input: string, target: string) {
  let errors = input.length > target.length ? 1 : 0;
  for (let i = 0; i < Math.min(input.length, target.length); i++) {
    if (input[i] !== target[i]) {
      errors += 1;
    }
  }
  return errors;
}

export function useTypingTest({ onActiveChange, onMistake }: UseTypingTestProps = {}) {
  const [options, setOptions] = useState<TestOptions>(DEFAULT_OPTIONS);
  const [words, setWords] = useState<string[]>([]);
  const [quoteAuthor, setQuoteAuthor] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [wordInputs, setWordInputs] = useState<string[]>([]);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(DEFAULT_OPTIONS.timeOption);
  const [history, setHistory] = useState<WpmSnapshot[]>([]);
  const [rowOffset, setRowOffset] = useState(0);
  const [focused, setFocused] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [typing, setTyping] = useState(false);
  const [controlsShown, setControlsShown] = useState(true);
  const [ready, setReady] = useState(false);

  const optionsRef = useRef(options);
  const onActiveChangeRef = useRef(onActiveChange);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeWordRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const tabTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const tabPressedRef = useRef(false);
  const buildIdRef = useRef(0);
  const extendingRef = useRef(false);
  const liveNumeratorRef = useRef(0);
  const allTypedRef = useRef(0);
  const secondErrorsRef = useRef(0);
  const correctedErrorsRef = useRef(0);
  const finishRef = useRef<() => void>(() => undefined);
  const frozenRef = useRef<ResultStats | null>(null);

  const onMistakeRef = useRef(onMistake);
  onActiveChangeRef.current = onActiveChange;
  onMistakeRef.current = onMistake;

  const counts = countChars({
    targetWords: words,
    wordInputs,
    typed,
    wordIndex,
    mode: options.mode,
    final: finished,
  });
  const numerator = wpmNumerator(counts);
  const accuracy = accuracyOf(counts);
  liveNumeratorRef.current = numerator;

  const startTime = startTimeRef.current;
  const liveWpm =
    started && startTime && !finished
      ? wordsPerMinute(numerator, (Date.now() - startTime) / 1000)
      : 0;

  const setActive = useCallback((active: boolean) => {
    onActiveChangeRef.current?.(active);
  }, []);

  const stopTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = undefined;
  }, []);

  const finishTest = useCallback(() => {
    stopTimer();
    setFinished(true);
    setControlsShown(true);
    setTyping(false);
    setActive(false);
  }, [stopTimer, setActive]);

  finishRef.current = finishTest;

  const clearProgress = useCallback(
    (next: TestOptions) => {
      stopTimer();
      clearTimeout(idleTimerRef.current);
      setTyped("");
      setWordIndex(0);
      setWordInputs([]);
      setStarted(false);
      setFinished(false);
      setHistory([]);
      setRowOffset(0);
      setControlsShown(true);
      setTyping(false);
      setTimeLeft(next.timeOption);
      startTimeRef.current = null;
      allTypedRef.current = 0;
      secondErrorsRef.current = 0;
      correctedErrorsRef.current = 0;
      extendingRef.current = false;
      setActive(false);
    },
    [stopTimer, setActive],
  );

  const startFresh = useCallback(
    async (next: TestOptions) => {
      const buildId = ++buildIdRef.current;
      let nextWords: string[];
      let author: string | null = null;

      if (next.mode === "quote") {
        const quote = pickQuote(next.quoteLength);
        nextWords = quote.words;
        author = quote.author;
      } else {
        nextWords = await generateWords(wordCountFor(next), wordSource(next));
      }

      if (buildId !== buildIdRef.current) {
        return;
      }
      setWords(nextWords);
      setQuoteAuthor(author);
      clearProgress(next);
      setReady(true);
      inputRef.current?.focus();
    },
    [clearProgress],
  );

  const restart = useCallback(
    (next: TestOptions = optionsRef.current) => {
      clearTimeout(resetTimerRef.current);
      stopTimer();
      setResetting(true);
      resetTimerRef.current = setTimeout(() => {
        void startFresh(next).finally(() => setResetting(false));
      }, RESET_FADE_MS);
    },
    [startFresh, stopTimer],
  );

  const repeat = useCallback(() => {
    clearProgress(optionsRef.current);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [clearProgress]);

  const updateOptions = useCallback(
    (patch: Partial<TestOptions>) => {
      const next = { ...optionsRef.current, ...patch };
      optionsRef.current = next;
      setOptions(next);
      if (readConsent() === "all") {
        writeStoredOptions(next);
      }
      restart(next);
    },
    [restart],
  );

  useEffect(() => {
    const initial = readConsent() === "all" ? readStoredOptions() : DEFAULT_OPTIONS;
    optionsRef.current = initial;
    setOptions(initial);
    void startFresh(initial);

    return () => {
      clearInterval(timerRef.current);
      clearTimeout(idleTimerRef.current);
      clearTimeout(controlsTimerRef.current);
      clearTimeout(resetTimerRef.current);
      clearTimeout(tabTimerRef.current);
    };
  }, [startFresh]);

  const startTimer = useCallback((limit: number) => {
    let ticks = 0;
    timerRef.current = setInterval(() => {
      ticks += 1;
      const minutes = ticks / 60;
      const wpm = Math.round(liveNumeratorRef.current / 5 / minutes);
      const raw = Math.max(Math.round(allTypedRef.current / 5 / minutes), wpm);
      const errors = secondErrorsRef.current;
      secondErrorsRef.current = 0;
      setHistory((previous) => [...previous, { second: ticks, wpm, raw, errors }]);
      if (ticks >= limit) {
        finishRef.current();
      } else {
        setTimeLeft(limit - ticks);
      }
    }, 1000);
  }, []);

  const ensureStarted = useCallback(() => {
    if (startTimeRef.current !== null) {
      return;
    }
    startTimeRef.current = Date.now();
    setStarted(true);
    setControlsShown(false);
    setActive(true);
    if (optionsRef.current.mode === "time") {
      startTimer(optionsRef.current.timeOption);
    }
  }, [setActive, startTimer]);

  const markTyping = useCallback(() => {
    setTyping(true);
    clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => setTyping(false), 1000);
  }, []);

  const measureRow = useCallback(() => {
    requestAnimationFrame(() => {
      const word = activeWordRef.current;
      if (!word) {
        return;
      }
      const lineHeight = word.offsetHeight + 4;
      const row = Math.round(word.offsetTop / lineHeight);
      setRowOffset(Math.max(0, row - 1) * lineHeight);
    });
  }, []);

  const recordWordSnapshot = useCallback(
    (inputs: string[], nextIndex: number) => {
      const begin = startTimeRef.current;
      if (!begin || optionsRef.current.mode === "time") {
        return;
      }
      const snapshot = countChars({
        targetWords: words,
        wordInputs: inputs,
        typed: "",
        wordIndex: nextIndex,
        mode: optionsRef.current.mode,
        final: false,
      });
      const seconds = (Date.now() - begin) / 1000;
      const wpm = wordsPerMinute(wpmNumerator(snapshot), seconds);
      const raw = Math.max(wordsPerMinute(allTypedRef.current, seconds), wpm);
      const errors = secondErrorsRef.current;
      secondErrorsRef.current = 0;
      setHistory((previous) => [...previous, { second: Math.round(seconds), wpm, raw, errors }]);
    },
    [words],
  );

  const extendIfNeeded = useCallback(
    (nextIndex: number) => {
      const current = optionsRef.current;
      if (
        !isOpenEnded(current) ||
        extendingRef.current ||
        nextIndex < words.length - EXTEND_THRESHOLD
      ) {
        return;
      }
      extendingRef.current = true;
      const buildId = buildIdRef.current;
      void generateWords(EXTEND_BY, wordSource(current)).then((more) => {
        if (buildId === buildIdRef.current) {
          setWords((previous) => [...previous, ...more]);
        }
        extendingRef.current = false;
      });
    },
    [words.length],
  );

  const deleteWord = useCallback(() => {
    if (typed.length > 0) {
      setTyped("");
      return;
    }
    if (wordIndex === 0) {
      return;
    }
    setWordIndex(wordIndex - 1);
    setTyped(wordInputs[wordIndex - 1] ?? "");
    setWordInputs(wordInputs.slice(0, -1));
    measureRow();
  }, [typed, wordIndex, wordInputs, measureRow]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      const { key, altKey, ctrlKey, metaKey, shiftKey } = event;
      const wordDelete =
        (altKey && !ctrlKey && !metaKey && (key === "Backspace" || key === "Delete")) ||
        (ctrlKey && !altKey && !metaKey && key === "Backspace");

      if (wordDelete) {
        event.preventDefault();
        if (!finished) {
          ensureStarted();
          markTyping();
          deleteWord();
        }
        return;
      }
      if (metaKey || ctrlKey || altKey) {
        return;
      }
      if (key === "Tab") {
        event.preventDefault();
        tabPressedRef.current = true;
        clearTimeout(tabTimerRef.current);
        tabTimerRef.current = setTimeout(() => {
          tabPressedRef.current = false;
        }, 1000);
        return;
      }
      if (key === "Enter") {
        event.preventDefault();
        if (tabPressedRef.current) {
          tabPressedRef.current = false;
          restart();
        } else if (shiftKey && options.mode === "zen" && started && !finished) {
          finishTest();
        }
        return;
      }
      if (finished || (key.length > 1 && key !== "Backspace")) {
        return;
      }

      ensureStarted();
      markTyping();
      const target = words[wordIndex] ?? "";

      if (key === " ") {
        event.preventDefault();
        if (typed.length === 0) {
          return;
        }
        allTypedRef.current += 1;
        secondErrorsRef.current += countWordErrors(typed, target);
        const nextInputs = [...wordInputs, typed];
        const nextIndex = wordIndex + 1;
        recordWordSnapshot(nextInputs, nextIndex);
        setWordInputs(nextInputs);
        if (nextIndex >= words.length) {
          finishTest();
          return;
        }
        setWordIndex(nextIndex);
        setTyped("");
        extendIfNeeded(nextIndex);
        measureRow();
        return;
      }

      if (key === "Backspace") {
        event.preventDefault();
        if (typed.length > 0) {
          const last = typed.length - 1;
          if (last >= target.length || typed[last] !== target[last]) {
            correctedErrorsRef.current += 1;
          }
          setTyped(typed.slice(0, -1));
        } else if (wordIndex > 0) {
          setWordIndex(wordIndex - 1);
          setTyped(wordInputs[wordIndex - 1] ?? "");
          setWordInputs(wordInputs.slice(0, -1));
          measureRow();
        }
        return;
      }

      allTypedRef.current += 1;
      const nextTyped = typed + key;
      setTyped(nextTyped);
      if (typed.length >= target.length || key !== target[typed.length]) {
        onMistakeRef.current?.();
      }

      const isLastWord = wordIndex + 1 >= words.length;
      if (isLastWord && !isOpenEnded(options) && nextTyped.length >= target.length) {
        secondErrorsRef.current += countWordErrors(nextTyped, target);
        const nextInputs = [...wordInputs, nextTyped];
        setWordInputs(nextInputs);
        recordWordSnapshot(nextInputs, wordIndex + 1);
        finishTest();
      }
    },
    [
      deleteWord,
      ensureStarted,
      extendIfNeeded,
      finishTest,
      finished,
      markTyping,
      measureRow,
      options,
      recordWordSnapshot,
      restart,
      started,
      typed,
      wordIndex,
      wordInputs,
      words,
    ],
  );

  const handleMouseMove = useCallback(() => {
    if (!started || finished) {
      return;
    }
    setControlsShown(true);
    clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setControlsShown(false), 2500);
  }, [started, finished]);

  const focusInput = useCallback(() => inputRef.current?.focus(), []);

  if (finished && !frozenRef.current) {
    const measured = startTime ? (Date.now() - startTime) / 1000 : 0;
    const elapsed = options.mode === "time" ? options.timeOption : measured;
    const wpm = wordsPerMinute(numerator, elapsed);
    frozenRef.current = {
      wpm,
      raw: Math.max(wordsPerMinute(allTypedRef.current, elapsed), wpm),
      accuracy,
      consistency: consistencyOf(history),
      correctChars: counts.correctWordChars,
      incorrectChars: counts.incorrectChars,
      extraChars: counts.extraChars,
      missedChars: counts.missedChars,
      correctedErrors: correctedErrorsRef.current,
      elapsedSeconds: Math.round(elapsed),
      mode: options.mode,
      modeDetail: modeDetailOf(options),
      punctuation: options.punctuation,
      numbers: options.numbers,
      difficulty: options.difficulty,
      wpmHistory: history,
    };
  }
  if (!finished) {
    frozenRef.current = null;
  }

  return {
    options,
    words,
    quoteAuthor,
    typed,
    wordIndex,
    wordInputs,
    started,
    finished,
    ready,
    timeLeft,
    rowOffset,
    focused,
    resetting,
    typing,
    liveWpm,
    accuracy,
    controlsVisible: !started || controlsShown,
    results: finished ? frozenRef.current : null,
    inputRef,
    activeWordRef,
    handleKeyDown,
    handleMouseMove,
    handleBlur: () => setFocused(false),
    handleFocus: () => setFocused(true),
    focusInput,
    restart: () => restart(),
    repeat,
    setMode: (mode: TestOptions["mode"]) => updateOptions({ mode }),
    setTimeOption: (timeOption: TestOptions["timeOption"]) => updateOptions({ timeOption }),
    setWordOption: (wordOption: TestOptions["wordOption"]) => updateOptions({ wordOption }),
    setQuoteLength: (quoteLength: TestOptions["quoteLength"]) => updateOptions({ quoteLength }),
    togglePunctuation: () => updateOptions({ punctuation: !options.punctuation }),
    toggleNumbers: () => updateOptions({ numbers: !options.numbers }),
    toggleDifficulty: (difficulty: Difficulty) =>
      updateOptions({ difficulty: options.difficulty === difficulty ? null : difficulty }),
  };
}

export type TypingTest = ReturnType<typeof useTypingTest>;

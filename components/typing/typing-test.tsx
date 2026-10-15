"use client";

import { ArrowCounterClockwise, CursorClick } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { MechanicalKeyboard } from "@/components/keyboard/mechanical-keyboard";
import { useChrome } from "@/components/layout/chrome-provider";
import { useSettings } from "@/components/settings/settings-provider";
import { ResultsScreen } from "@/components/typing/results-screen";
import { TestToolbar } from "@/components/typing/test-toolbar";
import { WordItem } from "@/components/typing/word-item";
import { useTypingTest } from "@/hooks/use-typing-test";
import { playEffect, preloadEffect } from "@/lib/keyboard/sound";
import { modeDetailOf } from "@/lib/typing/options";
import { cn } from "@/lib/utils";

function isEditable(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="rounded-md bg-surface-strong px-1.5 py-0.5 font-mono text-[10px] text-muted">
      {children}
    </kbd>
  );
}

function LiveStat({ value, unit }: { value: number | string; unit: string }) {
  return (
    <span className="tabular-nums">
      <span className="font-semibold text-foreground text-xl">{value}</span>
      <span className="ml-0.5 text-subtle text-xs">{unit}</span>
    </span>
  );
}

function RestartButton({ onRestart, visible }: { onRestart: () => void; visible: boolean }) {
  const [spins, setSpins] = useState(0);
  return (
    <motion.button
      animate={{ opacity: visible ? 1 : 0.15 }}
      aria-label="Restart test"
      className={cn(
        "rounded-xl p-2.5 text-subtle transition-colors hover:bg-surface hover:text-foreground",
        !visible && "pointer-events-none",
      )}
      onClick={() => {
        setSpins((value) => value + 1);
        onRestart();
      }}
      transition={{ duration: 0.3 }}
      type="button"
    >
      <motion.span
        animate={{ rotate: spins * -360 }}
        className="inline-flex"
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        <ArrowCounterClockwise size={18} weight="bold" />
      </motion.span>
    </motion.button>
  );
}

export function TypingTest() {
  const { setTypingActive } = useChrome();
  const { preferences } = useSettings();
  const faahActive = preferences.faahMode && preferences.soundEnabled;
  const volume = preferences.volume;
  const handleMistake = useCallback(() => {
    if (faahActive) {
      playEffect("faah", volume);
    }
  }, [faahActive, volume]);
  const test = useTypingTest({ onActiveChange: setTypingActive, onMistake: handleMistake });
  const {
    options,
    words,
    typed,
    wordIndex,
    wordInputs,
    started,
    ready,
    focused,
    resetting,
    typing,
    timeLeft,
    rowOffset,
    liveWpm,
    accuracy,
    results,
    inputRef,
    activeWordRef,
    focusInput,
  } = test;

  useEffect(() => () => setTypingActive(false), [setTypingActive]);

  useEffect(() => {
    if (faahActive) {
      void preloadEffect("faah");
    }
  }, [faahActive]);

  useEffect(() => {
    if (focused || results) {
      return;
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || isEditable(event.target)) {
        return;
      }
      if (document.querySelector("[role=dialog]")) {
        return;
      }
      focusInput();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [focused, results, focusInput]);

  if (results) {
    return (
      <motion.div
        animate={{ opacity: 1, filter: "blur(0px)" }}
        className="flex w-full justify-center"
        initial={{ opacity: 0, filter: "blur(6px)" }}
        key="results"
        transition={{ duration: 0.3 }}
      >
        <ResultsScreen
          onNext={test.restart}
          onRepeat={test.repeat}
          quoteAuthor={test.quoteAuthor}
          stats={results}
        />
      </motion.div>
    );
  }

  let wordsOpacity = 1;
  if (resetting || !ready) {
    wordsOpacity = 0;
  } else if (!focused) {
    wordsOpacity = 0.2;
  }

  const showLive = started;
  const progress: Record<typeof options.mode, string | null> = {
    time: `${timeLeft}s`,
    words: `${wordIndex}/${options.wordOption}`,
    quote: `${wordIndex}/${words.length}`,
    zen: null,
  };
  const lcd = {
    phase: started ? ("running" as const) : ("idle" as const),
    wpm: liveWpm,
    detail: progress[options.mode],
    label: `${options.mode} ${modeDetailOf(options)}`.trim(),
  };

  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="flex w-full max-w-5xl flex-col items-center gap-8"
      initial={{ opacity: 0 }}
      key="test"
      onMouseMove={test.handleMouseMove}
    >
      <TestToolbar
        options={options}
        setMode={test.setMode}
        setQuoteLength={test.setQuoteLength}
        setTimeOption={test.setTimeOption}
        setWordOption={test.setWordOption}
        toggleDifficulty={test.toggleDifficulty}
        toggleNumbers={test.toggleNumbers}
        togglePunctuation={test.togglePunctuation}
        visible={test.controlsVisible}
      />

      <div className="relative w-full">
        <div
          className={cn(
            "mb-3 flex min-h-8 items-baseline gap-6 transition-opacity duration-200",
            showLive && !resetting ? "opacity-100" : "opacity-0",
          )}
        >
          {options.mode === "time" && <LiveStat unit="s" value={timeLeft} />}
          {options.mode === "words" && (
            <LiveStat unit={`/${options.wordOption}`} value={wordIndex} />
          )}
          {options.mode === "quote" && <LiveStat unit={`/${words.length}`} value={wordIndex} />}
          <span className="flex-1" />
          {preferences.liveStats && (
            <>
              <LiveStat unit="wpm" value={liveWpm} />
              <LiveStat unit="% acc" value={accuracy} />
            </>
          )}
        </div>

        <label
          className={cn(
            "relative block h-[8.3rem] w-full cursor-text overflow-hidden font-[family-name:var(--typing-font)] text-[1.65rem] leading-[2.6rem] sm:text-[1.8rem]",
            typing && "is-typing",
          )}
        >
          <input
            aria-label="Type here"
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect="off"
            className="absolute size-0 opacity-0"
            onBlur={test.handleBlur}
            onChange={() => undefined}
            onFocus={test.handleFocus}
            onKeyDown={test.handleKeyDown}
            ref={inputRef}
            spellCheck={false}
            value={typed}
          />

          <motion.div
            animate={{
              y: -rowOffset,
              opacity: wordsOpacity,
              filter: resetting ? "blur(4px)" : "blur(0px)",
            }}
            className="flex flex-wrap gap-x-[0.6em] gap-y-1"
            transition={
              resetting
                ? { duration: 0.15, ease: "easeOut" }
                : { type: "spring", stiffness: 300, damping: 30, mass: 0.8 }
            }
          >
            {words.map((word, index) => (
              <WordItem
                active={index === wordIndex}
                elementRef={activeWordRef}
                hasError={index < wordIndex && wordInputs[index] !== word}
                input={
                  index === wordIndex ? typed : index < wordIndex ? (wordInputs[index] ?? "") : ""
                }
                key={`${index}-${word}`}
                past={index < wordIndex}
                word={word}
              />
            ))}
          </motion.div>

          <AnimatePresence>
            {!focused && ready && (
              <motion.span
                animate={{ opacity: 1 }}
                className="absolute inset-0 z-10 flex items-center justify-center gap-2 font-sans text-muted text-sm backdrop-blur-[2px]"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <CursorClick size={16} weight="duotone" />
                click or press any key to focus
              </motion.span>
            )}
          </AnimatePresence>
        </label>
      </div>

      <RestartButton onRestart={test.restart} visible={test.controlsVisible} />

      <motion.div
        animate={{ opacity: test.controlsVisible || (options.mode === "zen" && started) ? 1 : 0 }}
        className="flex items-center gap-1.5 text-[11px] text-subtle"
        transition={{ duration: 0.4 }}
      >
        {options.mode === "zen" && started ? (
          <>
            <Kbd>shift</Kbd>+<Kbd>enter</Kbd>
            <span className="ml-1">finish</span>
          </>
        ) : (
          <>
            <Kbd>tab</Kbd>+<Kbd>enter</Kbd>
            <span className="ml-1">restart</span>
          </>
        )}
      </motion.div>

      {preferences.showKeyboard && (
        <MechanicalKeyboard
          className="mt-2 hidden max-w-[860px] lg:block [@media(max-height:780px)]:hidden"
          lcd={lcd}
          sound={{
            enabled: preferences.soundEnabled,
            pack: preferences.soundPack,
            volume: preferences.volume,
          }}
        />
      )}
    </motion.div>
  );
}

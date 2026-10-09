"use client";

import { At, Clock, Hash, Mountains, Quotes, TextAa } from "@phosphor-icons/react";
import { LayoutGroup, motion } from "motion/react";
import { PillDivider, pillGroupClass, SelectPill, TogglePill } from "@/components/ui/pills";
import type { TypingTest } from "@/hooks/use-typing-test";
import {
  QUOTE_LENGTHS,
  TEST_MODES,
  type TestMode,
  TIME_OPTIONS,
  WORD_OPTIONS,
} from "@/lib/typing/options";
import { cn } from "@/lib/utils";

const MODE_ICONS = {
  time: Clock,
  words: TextAa,
  quote: Quotes,
  zen: Mountains,
} as const;

type ToolbarProps = Pick<
  TypingTest,
  | "options"
  | "setMode"
  | "setTimeOption"
  | "setWordOption"
  | "setQuoteLength"
  | "togglePunctuation"
  | "toggleNumbers"
  | "toggleDifficulty"
> & { visible: boolean };

function SubOptions({
  mode,
  options,
  setTimeOption,
  setWordOption,
  setQuoteLength,
}: Omit<
  ToolbarProps,
  "visible" | "setMode" | "togglePunctuation" | "toggleNumbers" | "toggleDifficulty"
> & {
  mode: TestMode;
}) {
  if (mode === "time") {
    return TIME_OPTIONS.map((value) => (
      <SelectPill
        active={options.timeOption === value}
        key={value}
        label={`${value} seconds`}
        layoutId="sub-time"
        onClick={() => setTimeOption(value)}
      >
        {value}
      </SelectPill>
    ));
  }
  if (mode === "words") {
    return WORD_OPTIONS.map((value) => (
      <SelectPill
        active={options.wordOption === value}
        key={value}
        label={`${value} words`}
        layoutId="sub-words"
        onClick={() => setWordOption(value)}
      >
        {value}
      </SelectPill>
    ));
  }
  if (mode === "quote") {
    return QUOTE_LENGTHS.map((value) => (
      <SelectPill
        active={options.quoteLength === value}
        key={value}
        layoutId="sub-quote"
        onClick={() => setQuoteLength(value)}
      >
        {value}
      </SelectPill>
    ));
  }
  return (
    <span className="px-4 py-1.5 text-[12px] text-faint italic tracking-widest">free flow</span>
  );
}

export function TestToolbar({ visible, ...props }: ToolbarProps) {
  const { options, setMode, togglePunctuation, toggleNumbers, toggleDifficulty } = props;

  return (
    <motion.div
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : -4 }}
      className={cn(
        "flex flex-wrap items-center justify-center gap-2",
        !visible && "pointer-events-none select-none",
      )}
      transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
    >
      <LayoutGroup id="toolbar">
        <div className={pillGroupClass}>
          <TogglePill active={options.punctuation} onClick={togglePunctuation}>
            <At size={15} weight="bold" />
            punctuation
          </TogglePill>
          <TogglePill active={options.numbers} onClick={toggleNumbers}>
            <Hash size={15} weight="bold" />
            numbers
          </TogglePill>
          <PillDivider />
          <TogglePill
            active={options.difficulty === "easy"}
            onClick={() => toggleDifficulty("easy")}
          >
            easy
          </TogglePill>
          <TogglePill
            active={options.difficulty === "hard"}
            onClick={() => toggleDifficulty("hard")}
          >
            hard
          </TogglePill>
        </div>

        <div className={pillGroupClass}>
          {TEST_MODES.map((mode) => {
            const Icon = MODE_ICONS[mode];
            return (
              <SelectPill
                active={options.mode === mode}
                key={mode}
                layoutId="mode"
                onClick={() => setMode(mode)}
              >
                <Icon size={15} weight="duotone" />
                {mode}
              </SelectPill>
            );
          })}
        </div>

        <div className={cn(pillGroupClass, "grid [&>*]:col-start-1 [&>*]:row-start-1")}>
          {TEST_MODES.map((mode) => {
            const active = options.mode === mode;
            return (
              <div
                aria-hidden={!active}
                className={cn(
                  "flex items-center justify-center gap-0.5 transition-[opacity,filter] duration-200",
                  active ? "opacity-100" : "pointer-events-none opacity-0 blur-[2px]",
                )}
                inert={!active}
                key={mode}
              >
                <SubOptions mode={mode} {...props} />
              </div>
            );
          })}
        </div>
      </LayoutGroup>
    </motion.div>
  );
}

"use client";

import {
  ArrowCounterClockwise,
  ArrowRight,
  CheckCircle,
  CircleNotch,
  Trophy,
  WarningCircle,
} from "@phosphor-icons/react";
import { motion } from "motion/react";
import Link from "next/link";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { GoogleButton } from "@/components/player/google-button";
import { usePlayer } from "@/components/player/player-provider";
import { WpmChart } from "@/components/typing/wpm-chart";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Button } from "@/components/ui/button";
import { ApiError, api } from "@/lib/client/api";
import type { SavedResult } from "@/lib/client/types";
import type { ResultStats } from "@/lib/typing/types";
import { INVALID_REASON_COPY, validateResult } from "@/lib/typing/validate";
import { formatDuration } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

type SaveState =
  | { status: "saving" }
  | { status: "saved"; result: SavedResult }
  | { status: "error"; message: string };

function rise(delay: number) {
  return {
    initial: { opacity: 0, y: 12, filter: "blur(4px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { delay, duration: 0.5, ease },
  };
}

function useSaveResult(stats: ResultStats, enabled: boolean) {
  const [state, setState] = useState<SaveState>({ status: "saving" });
  const sentRef = useRef<ResultStats | null>(null);

  useEffect(() => {
    if (!enabled || sentRef.current === stats) {
      return;
    }
    sentRef.current = stats;
    api<{ result: SavedResult }>("/api/results", {
      method: "POST",
      body: JSON.stringify(stats),
    })
      .then(({ result }) => setState({ status: "saved", result }))
      .catch((error: unknown) =>
        setState({
          status: "error",
          message: error instanceof ApiError ? error.message : "Could not save this result",
        }),
      );
  }, [stats, enabled]);

  return state;
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="font-mono font-semibold text-2xl text-foreground">{children}</span>
      <span className="text-[10px] text-subtle uppercase tracking-[0.18em]">{label}</span>
    </div>
  );
}

function Detail({ label, value, accent }: { label: string; value: ReactNode; accent?: boolean }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[10px] text-subtle uppercase tracking-[0.18em]">{label}</span>
      <span className={accent ? "font-mono text-primary text-xs" : "font-mono text-muted text-xs"}>
        {value}
      </span>
    </div>
  );
}

function SaveStatus({
  state,
  ranked,
  testLabel,
}: {
  state: SaveState;
  ranked: boolean;
  testLabel: string;
}) {
  const { player } = usePlayer();

  if (state.status === "saving") {
    return (
      <span className="flex items-center gap-2 text-subtle text-xs">
        <CircleNotch className="animate-spin" size={14} weight="bold" />
        saving result…
      </span>
    );
  }
  if (state.status === "error") {
    return (
      <span className="flex items-center gap-2 text-danger text-xs">
        <WarningCircle size={15} weight="duotone" />
        {state.message}
      </span>
    );
  }

  const { result } = state;
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {result.isPersonalBest && (
          <motion.span
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 font-medium text-primary text-xs"
            initial={{ opacity: 0, scale: 0.7 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
          >
            <Trophy size={14} weight="duotone" />
            new personal best
          </motion.span>
        )}
        {ranked && result.rank ? (
          <Link
            className="flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 font-medium text-foreground text-xs transition-colors hover:bg-surface-strong"
            href="/leaderboard"
          >
            <span className="font-mono text-primary">#{result.rank.rank}</span>
            of {result.rank.total} on {testLabel}
            <ArrowRight size={12} weight="bold" />
          </Link>
        ) : (
          <span className="flex items-center gap-1.5 text-subtle text-xs">
            <CheckCircle size={14} weight="duotone" />
            saved to your history
          </span>
        )}
      </div>
      {player?.isGuest && (
        <div className="flex w-full max-w-xs flex-col items-center gap-2 text-center">
          <p className="text-subtle text-xs">
            Playing as a guest — sign in to keep scores on any device.
          </p>
          <GoogleButton className="w-full" />
        </div>
      )}
    </div>
  );
}

interface ResultsScreenProps {
  onNext: () => void;
  onRepeat: () => void;
  quoteAuthor: string | null;
  stats: ResultStats;
}

export function ResultsScreen({ onNext, onRepeat, quoteAuthor, stats }: ResultsScreenProps) {
  const validation = validateResult(stats);
  const saveState = useSaveResult(stats, validation.valid);
  const ranked = stats.mode === "time" || stats.mode === "words";
  const testLabel = `${stats.mode} ${stats.modeDetail}`.trim();

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const idle = !document.activeElement || document.activeElement === document.body;
      if (event.key === "Tab" && idle) {
        event.preventDefault();
        onNext();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onNext]);

  const actions = (
    <motion.div className="flex flex-wrap items-center justify-center gap-2" {...rise(0.75)}>
      <Button onClick={onNext} variant="soft">
        <ArrowRight size={16} weight="bold" />
        next test
      </Button>
      <Button onClick={onRepeat} variant="ghost">
        <ArrowCounterClockwise size={16} weight="bold" />
        repeat
      </Button>
    </motion.div>
  );

  if (!validation.valid) {
    return (
      <div className="flex w-full max-w-xl flex-col items-center gap-6 text-center">
        <motion.div className="flex flex-col items-center gap-3" {...rise(0)}>
          <WarningCircle className="text-subtle" size={40} weight="duotone" />
          <h2 className="font-semibold text-3xl text-foreground">invalid result</h2>
          <p className="max-w-sm text-muted text-sm leading-relaxed">
            {INVALID_REASON_COPY[validation.reason]} This run won&apos;t be saved.
          </p>
          <p className="font-mono text-subtle text-xs">
            {testLabel}
            {stats.elapsedSeconds > 0 ? ` · ${stats.elapsedSeconds}s` : ""}
          </p>
        </motion.div>
        {actions}
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-5xl flex-col gap-7">
      <div className="flex items-end justify-center gap-10 sm:gap-16">
        <motion.div className="flex flex-col items-center gap-1" {...rise(0)}>
          <AnimatedNumber
            className="font-bold font-mono text-6xl text-primary leading-none sm:text-8xl md:text-9xl"
            value={stats.wpm}
          />
          <span className="text-[11px] text-subtle uppercase tracking-[0.2em]">wpm</span>
        </motion.div>
        <motion.div className="flex flex-col items-center gap-1" {...rise(0.08)}>
          <span className="font-bold font-mono text-6xl leading-none sm:text-8xl md:text-9xl">
            <AnimatedNumber className="text-foreground" value={stats.accuracy} />
            <span className="text-faint">%</span>
          </span>
          <span className="text-[11px] text-subtle uppercase tracking-[0.2em]">accuracy</span>
        </motion.div>
      </div>

      <motion.div className="flex min-h-8 justify-center" {...rise(0.2)}>
        <SaveStatus ranked={ranked} state={saveState} testLabel={testLabel} />
      </motion.div>

      <motion.div className="flex items-center justify-center gap-8 md:gap-12" {...rise(0.3)}>
        <Stat label="raw">
          <AnimatedNumber value={stats.raw} />
        </Stat>
        <span className="h-6 w-px bg-border" />
        <Stat label="consistency">
          <AnimatedNumber suffix="%" value={stats.consistency} />
        </Stat>
        <span className="h-6 w-px bg-border" />
        <Stat label="time">{formatDuration(stats.elapsedSeconds)}</Stat>
      </motion.div>

      <motion.div
        animate={{ opacity: 1, clipPath: "inset(0% 0% 0% 0%)" }}
        initial={{ opacity: 0, clipPath: "inset(0% 0% 100% 0%)" }}
        transition={{ delay: 0.4, duration: 0.6, ease }}
      >
        {stats.wpmHistory.length > 1 ? (
          <WpmChart history={stats.wpmHistory} />
        ) : (
          <div className="flex h-[200px] items-center justify-center text-subtle text-xs">
            not enough data for a chart
          </div>
        )}
      </motion.div>

      <motion.div
        className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-border border-t pt-5"
        {...rise(0.6)}
      >
        <Detail
          label="characters"
          value={`${stats.correctChars}/${stats.incorrectChars}/${stats.extraChars}/${stats.missedChars}`}
        />
        <Detail label="fixes" value={stats.correctedErrors} />
        <Detail accent label="test" value={testLabel} />
        {(stats.punctuation || stats.numbers || stats.difficulty) && (
          <Detail
            label="modifiers"
            value={[
              stats.punctuation && "punctuation",
              stats.numbers && "numbers",
              stats.difficulty,
            ]
              .filter(Boolean)
              .join(" · ")}
          />
        )}
        {quoteAuthor && <Detail label="quote" value={`— ${quoteAuthor}`} />}
      </motion.div>

      {actions}
    </div>
  );
}

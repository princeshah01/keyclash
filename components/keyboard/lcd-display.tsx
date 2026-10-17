"use client";

import { memo } from "react";

export interface LcdState {
  detail: string | null;
  label: string;
  phase: "idle" | "running";
  wpm: number;
}

const BODY = [".#........#.", ".##......##.", ".##########.", "############"];
const EYES = { open: "##oo####oo##", closed: "##cc####cc##" } as const;
const FACE = ["#b########b#", "#####pp#####", ".##########."];
const FEET = ["..##....##..", ".##......##.", "...##..##..."] as const;

const PIXEL_COLORS: Record<string, string> = {
  "#": "var(--lcd-ink)",
  o: "oklch(0.3 0.06 262)",
  c: "oklch(0.3 0.06 262)",
  p: "oklch(0.75 0.13 10)",
  b: "oklch(0.8 0.1 10 / 0.7)",
};

function catRows(awake: boolean, step: number) {
  return [
    ...BODY,
    awake ? EYES.open : EYES.closed,
    ...FACE,
    awake ? FEET[1 + (step % 2)] : FEET[0],
  ];
}

const Mascot = memo(function Mascot({ awake, step }: { awake: boolean; step: number }) {
  const rows = catRows(awake, step);
  return (
    <svg
      aria-hidden
      className="h-[66%] shrink-0"
      shapeRendering="crispEdges"
      style={{
        transform: awake && step % 2 === 1 ? "translateY(-4%)" : "none",
        filter: "drop-shadow(0 1px 0 var(--lcd-shadow))",
      }}
      viewBox="0 0 12 9"
    >
      {rows.flatMap((row, y) =>
        [...row].map((pixel, x) => {
          const fill = PIXEL_COLORS[pixel];
          if (!fill) {
            return null;
          }
          const half = pixel === "c";
          return (
            <rect
              fill={fill}
              height={half ? 0.45 : 1}
              key={`${x}-${y}`}
              width={1}
              x={x}
              y={half ? y + 0.55 : y}
            />
          );
        }),
      )}
    </svg>
  );
});

export function LcdDisplay({ state, taps }: { state: LcdState; taps: number }) {
  const running = state.phase === "running";

  return (
    <div className="kb-screen">
      <div className="relative flex h-full items-center">
        <Mascot awake={running} step={taps} />
        {!running && (
          <span
            aria-hidden
            className="absolute -top-[2%] right-[-18%] flex flex-col font-bold text-[calc(var(--u)*0.13)] leading-none"
          >
            <span className="kb-z">z</span>
            <span className="kb-z">z</span>
            <span className="kb-z">z</span>
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-end justify-center gap-[calc(var(--u)*0.04)]">
        <span className="font-bold text-[calc(var(--u)*0.38)] tabular-nums leading-none tracking-tight">
          {running ? state.wpm : "hi!"}
        </span>
        <span className="truncate text-[calc(var(--u)*0.13)] uppercase leading-none tracking-[0.12em] opacity-90">
          {running ? ["wpm", state.detail].filter(Boolean).join(" · ") : state.label}
        </span>
      </div>
    </div>
  );
}

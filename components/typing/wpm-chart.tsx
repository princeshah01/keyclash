"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { WpmSnapshot } from "@/lib/typing/types";

const PAD = { top: 12, right: 12, bottom: 24, left: 34 };

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

function niceCeiling(value: number) {
  const step = value > 150 ? 50 : value > 60 ? 20 : 10;
  return Math.max(step, Math.ceil((value * 1.1) / step) * step);
}

function linePath(points: [number, number][]) {
  return points
    .map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
}

export function WpmChart({ history, height = 200 }: { history: WpmSnapshot[]; height?: number }) {
  const [containerRef, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const gradientId = useId();

  const chart = useMemo(() => {
    if (width === 0 || history.length < 2) {
      return null;
    }
    const innerWidth = width - PAD.left - PAD.right;
    const innerHeight = height - PAD.top - PAD.bottom;
    const maxY = niceCeiling(
      Math.max(...history.map((point) => Math.max(point.raw, point.wpm)), 10),
    );
    const firstSecond = history[0].second;
    const lastSecond = history.at(-1)?.second ?? firstSecond + 1;
    const span = Math.max(lastSecond - firstSecond, 1);
    const x = (second: number) => PAD.left + ((second - firstSecond) / span) * innerWidth;
    const y = (value: number) => PAD.top + innerHeight - (value / maxY) * innerHeight;

    const wpmPoints = history.map((point) => [x(point.second), y(point.wpm)] as [number, number]);
    const rawPoints = history.map((point) => [x(point.second), y(point.raw)] as [number, number]);
    const baseline = PAD.top + innerHeight;
    const area = `${linePath(wpmPoints)} L${wpmPoints.at(-1)?.[0]},${baseline} L${wpmPoints[0][0]},${baseline} Z`;
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => Math.round(maxY * ratio));
    const xLabelEvery = Math.max(
      1,
      Math.ceil(history.length / Math.max(2, Math.floor(innerWidth / 48))),
    );

    return { x, y, wpmPoints, rawPoints, area, ticks, baseline, xLabelEvery, innerWidth };
  }, [history, width, height]);

  const handlePointer = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!chart) {
      return;
    }
    const bounds = event.currentTarget.getBoundingClientRect();
    const pointerX = event.clientX - bounds.left;
    let nearest = 0;
    for (let i = 1; i < chart.wpmPoints.length; i++) {
      if (
        Math.abs(chart.wpmPoints[i][0] - pointerX) <
        Math.abs(chart.wpmPoints[nearest][0] - pointerX)
      ) {
        nearest = i;
      }
    }
    setHover(nearest);
  };

  const hovered = hover !== null && chart ? history[hover] : null;

  return (
    <div className="relative w-full" ref={containerRef} style={{ height }}>
      {chart && (
        <svg
          aria-label="Words per minute over time"
          className="absolute inset-0 overflow-visible"
          height={height}
          onPointerLeave={() => setHover(null)}
          onPointerMove={handlePointer}
          role="img"
          width={width}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {chart.ticks.map((tick) => (
            <g key={tick}>
              <line
                stroke="var(--border)"
                x1={PAD.left}
                x2={width - PAD.right}
                y1={chart.y(tick)}
                y2={chart.y(tick)}
              />
              <text
                className="fill-subtle font-mono text-[10px]"
                dominantBaseline="middle"
                textAnchor="end"
                x={PAD.left - 8}
                y={chart.y(tick)}
              >
                {tick}
              </text>
            </g>
          ))}

          {history.map((point, index) =>
            index % chart.xLabelEvery === 0 || index === history.length - 1 ? (
              <text
                className="fill-subtle font-mono text-[10px]"
                key={point.second}
                textAnchor="middle"
                x={chart.x(point.second)}
                y={height - 6}
              >
                {point.second}
              </text>
            ) : null,
          )}

          <motion.path
            animate={{ opacity: 1 }}
            d={chart.area}
            fill={`url(#${gradientId})`}
            initial={{ opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          />
          <path
            d={linePath(chart.rawPoints)}
            fill="none"
            stroke="var(--subtle)"
            strokeDasharray="3 4"
            strokeLinecap="round"
            strokeOpacity={0.7}
            strokeWidth={1.5}
          />
          <motion.path
            animate={{ pathLength: 1 }}
            d={linePath(chart.wpmPoints)}
            fill="none"
            initial={{ pathLength: 0 }}
            stroke="var(--primary)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          />

          {history.map((point) =>
            point.errors > 0 ? (
              <g
                key={`error-${point.second}`}
                transform={`translate(${chart.x(point.second)}, ${PAD.top + 2})`}
              >
                <path
                  d="M-3,-3 L3,3 M3,-3 L-3,3"
                  stroke="var(--danger)"
                  strokeLinecap="round"
                  strokeWidth={1.6}
                />
              </g>
            ) : null,
          )}

          {hovered && hover !== null && (
            <g>
              <line
                stroke="var(--muted)"
                strokeOpacity={0.35}
                x1={chart.wpmPoints[hover][0]}
                x2={chart.wpmPoints[hover][0]}
                y1={PAD.top}
                y2={chart.baseline}
              />
              <circle
                cx={chart.rawPoints[hover][0]}
                cy={chart.rawPoints[hover][1]}
                fill="var(--subtle)"
                r={3}
              />
              <circle
                cx={chart.wpmPoints[hover][0]}
                cy={chart.wpmPoints[hover][1]}
                fill="var(--primary)"
                r={4.5}
                stroke="var(--background)"
                strokeWidth={2}
              />
            </g>
          )}
        </svg>
      )}

      <AnimatePresence>
        {chart && hovered && hover !== null && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="pointer-events-none absolute top-0 z-10 flex min-w-28 -translate-x-1/2 flex-col gap-1 rounded-xl border border-border bg-elevated px-3 py-2 text-xs shadow-lg"
            exit={{ opacity: 0, y: 4 }}
            initial={{ opacity: 0, y: 4 }}
            style={{
              left: Math.min(Math.max(chart.wpmPoints[hover][0], 70), width - 70),
            }}
            transition={{ duration: 0.12 }}
          >
            <span className="font-mono text-[10px] text-subtle">{hovered.second}s</span>
            <span className="flex justify-between gap-3">
              <span className="text-muted">wpm</span>
              <span className="font-mono font-semibold text-primary">{hovered.wpm}</span>
            </span>
            <span className="flex justify-between gap-3">
              <span className="text-muted">raw</span>
              <span className="font-mono">{hovered.raw}</span>
            </span>
            {hovered.errors > 0 && (
              <span className="flex justify-between gap-3">
                <span className="text-muted">errors</span>
                <span className="font-mono text-danger">{hovered.errors}</span>
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

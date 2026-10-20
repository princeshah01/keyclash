"use client";

import { At, Crown, Hash, Keyboard } from "@phosphor-icons/react";
import { LayoutGroup, motion } from "motion/react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import { buttonClass } from "@/components/ui/button";
import { pillGroupClass, SelectPill } from "@/components/ui/pills";
import type { LeaderboardEntry } from "@/lib/client/types";
import { RANKED_DETAILS, RANKED_MODES, type RankedMode } from "@/lib/typing/options";
import { cn, timeAgo } from "@/lib/utils";

export const MEDALS = ["text-gold", "text-silver", "text-bronze"] as const;
/** Visible rows on global and room boards; viewer rank is always included separately when outside. */
export const BOARD_TOP = 10;

const spring = { type: "spring", stiffness: 420, damping: 38 } as const;

export function splitBoard(entries: LeaderboardEntry[], playerId: string | undefined) {
  const top = entries.filter((entry) => entry.rank <= BOARD_TOP);
  const me = playerId ? entries.find((entry) => entry.playerId === playerId) : undefined;
  const meOutside = Boolean(me && !top.some((entry) => entry.playerId === me.playerId));
  return { top, me: meOutside ? me : undefined };
}

/** Right-aligned board scope line used on global, rooms, and the home panel. */
export function BoardScope({ roomName }: { roomName?: string }) {
  return (
    <p className="text-right text-[11px] text-subtle">
      top {BOARD_TOP} players · {roomName ? `in ${roomName}` : "worldwide"}
    </p>
  );
}

export function Modifiers({ entry }: { entry: LeaderboardEntry }) {
  if (!(entry.punctuation || entry.numbers)) {
    return null;
  }
  return (
    <span className="flex items-center gap-0.5 text-subtle">
      {entry.punctuation && <At aria-label="punctuation" size={12} weight="bold" />}
      {entry.numbers && <Hash aria-label="numbers" size={12} weight="bold" />}
    </span>
  );
}

export function TestFilters({
  detail,
  idPrefix,
  mode,
  onChange,
  children,
}: {
  children?: ReactNode;
  detail: string;
  idPrefix: string;
  mode: RankedMode;
  onChange: (next: { mode: RankedMode; detail: string }) => void;
}) {
  return (
    <LayoutGroup id={`${idPrefix}-filters`}>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <div className={pillGroupClass}>
          {RANKED_MODES.map((value) => (
            <SelectPill
              active={mode === value}
              key={value}
              layoutId={`${idPrefix}-mode`}
              onClick={() =>
                value !== mode && onChange({ mode: value, detail: value === "time" ? "30" : "25" })
              }
            >
              {value}
            </SelectPill>
          ))}
        </div>
        <div className={pillGroupClass}>
          {RANKED_DETAILS[mode].map((value) => (
            <SelectPill
              active={detail === value}
              key={value}
              layoutId={`${idPrefix}-detail`}
              onClick={() => onChange({ mode, detail: value })}
            >
              {value}
            </SelectPill>
          ))}
        </div>
        {children}
      </div>
    </LayoutGroup>
  );
}

export function Podium({
  entries,
  meId,
}: {
  entries: LeaderboardEntry[];
  meId: string | undefined;
}) {
  const order = [entries[1], entries[0], entries[2]];
  const heights = ["h-20", "h-28", "h-14"];

  return (
    <div className="grid grid-cols-3 items-end gap-3 sm:gap-5">
      {order.map((entry, slot) => {
        if (!entry) {
          return <div key={`empty-${slot}`} />;
        }
        return (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-2"
            initial={{ opacity: 0, y: 16 }}
            key={entry.playerId}
            layout
            transition={spring}
          >
            <div className="relative">
              {entry.rank === 1 && (
                <Crown
                  className="absolute -top-5 left-1/2 -translate-x-1/2 text-gold"
                  size={22}
                  weight="fill"
                />
              )}
              <Avatar
                className={cn(
                  "ring-2 ring-offset-2 ring-offset-background",
                  entry.rank === 1 ? "ring-gold" : "ring-border",
                )}
                name={entry.name}
                size={entry.rank === 1 ? 64 : 52}
                src={entry.avatarUrl}
              />
            </div>
            <div className="flex max-w-full flex-col items-center">
              <span className="max-w-full truncate font-medium text-foreground text-sm">
                {entry.name}
                {entry.playerId === meId && (
                  <span className="ml-1 text-primary text-xs">(you)</span>
                )}
              </span>
              <span className="font-mono text-subtle text-xs">{entry.accuracy}% acc</span>
            </div>
            <div
              className={cn(
                "flex w-full flex-col items-center justify-center rounded-t-2xl bg-surface",
                heights[slot],
              )}
            >
              <motion.span
                animate={{ scale: 1 }}
                className={cn(
                  "font-bold font-mono text-2xl sm:text-3xl",
                  MEDALS[entry.rank - 1] ?? "text-foreground",
                )}
                initial={{ scale: 1.25 }}
                key={entry.wpm}
              >
                {entry.wpm}
              </motion.span>
              <span className="text-[10px] text-subtle uppercase tracking-[0.18em]">wpm</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export function Row({
  compact = false,
  entry,
  isMe,
}: {
  compact?: boolean;
  entry: LeaderboardEntry;
  isMe: boolean;
}) {
  return (
    <motion.li
      animate={{ opacity: 1 }}
      className={cn(
        "grid items-center rounded-2xl",
        compact
          ? "grid-cols-[2rem_1fr_3.25rem] gap-2 px-2 py-1.5"
          : "grid-cols-[3rem_1fr_4.5rem_4rem] gap-3 px-3 py-2.5 sm:grid-cols-[3.5rem_1fr_5rem_4.5rem_4rem_6.5rem]",
        isMe ? "bg-primary-soft" : "hover:bg-surface",
      )}
      initial={{ opacity: 0 }}
      layout
      transition={spring}
    >
      <span
        className={cn(
          "font-mono font-semibold",
          compact ? "text-xs" : "text-sm",
          MEDALS[entry.rank - 1] ?? "text-subtle",
        )}
      >
        #{entry.rank}
      </span>
      <span className="flex min-w-0 items-center gap-2">
        <Avatar name={entry.name} size={compact ? 22 : 30} src={entry.avatarUrl} />
        <span
          className={cn("truncate font-medium text-foreground", compact ? "text-xs" : "text-sm")}
        >
          {entry.name}
        </span>
        {isMe && (
          <span className="shrink-0 rounded-full bg-primary px-1.5 py-0.5 font-semibold text-[9px] text-primary-foreground uppercase tracking-wider">
            you
          </span>
        )}
        {!compact && <Modifiers entry={entry} />}
      </span>
      <motion.span
        animate={{ scale: 1, opacity: 1 }}
        className={cn("text-right font-mono font-semibold text-foreground", compact && "text-sm")}
        initial={{ scale: 1.2, opacity: 0.4 }}
        key={entry.wpm}
      >
        {entry.wpm}
        <span className="ml-1 font-normal text-[10px] text-subtle">wpm</span>
      </motion.span>
      {!compact && (
        <>
          <span className="text-right font-mono text-muted text-sm">{entry.accuracy}%</span>
          <span className="hidden text-right font-mono text-sm text-subtle sm:block">
            {entry.raw}
          </span>
          <span className="hidden text-right text-subtle text-xs sm:block">
            {timeAgo(entry.createdAt)}
          </span>
        </>
      )}
    </motion.li>
  );
}

export function YourRank({
  compact = false,
  entry,
}: {
  compact?: boolean;
  entry: LeaderboardEntry;
}) {
  return (
    <div className="flex flex-col gap-1 border-border border-t border-dashed pt-4">
      <span className="px-3 text-[10px] text-subtle uppercase tracking-[0.18em]">your rank</span>
      <ul>
        <Row compact={compact} entry={entry} isMe />
      </ul>
    </div>
  );
}

export function BoardSkeleton({ rows = 8, compact = false }: { compact?: boolean; rows?: number }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {Array.from({ length: rows }, (_, index) => (
        <li
          className={cn("animate-pulse rounded-2xl bg-surface", compact ? "h-9" : "h-[54px]")}
          key={index}
        />
      ))}
    </ul>
  );
}

export function EmptyBoard({ title, body }: { body: string; title: string }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl bg-surface px-6 py-14 text-center">
      <Keyboard className="text-subtle" size={36} weight="duotone" />
      <div className="flex flex-col gap-1">
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-muted text-sm">{body}</p>
      </div>
      <Link className={buttonClass("primary")} href="/">
        start typing
      </Link>
    </div>
  );
}

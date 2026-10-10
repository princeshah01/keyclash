"use client";

import { At, Crown, Hash, Keyboard, WarningCircle } from "@phosphor-icons/react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { usePlayer } from "@/components/player/player-provider";
import { Avatar } from "@/components/ui/avatar";
import { buttonClass } from "@/components/ui/button";
import { pillGroupClass, SelectPill } from "@/components/ui/pills";
import { api } from "@/lib/client/api";
import type { LeaderboardEntry, LeaderboardRange, LeaderboardResponse } from "@/lib/client/types";
import { RANKED_DETAILS, RANKED_MODES, type RankedMode } from "@/lib/typing/options";
import { cn, timeAgo } from "@/lib/utils";

const RANGES: { value: LeaderboardRange; label: string }[] = [
  { value: "all", label: "all time" },
  { value: "weekly", label: "this week" },
  { value: "daily", label: "today" },
];

const MEDALS = ["text-gold", "text-silver", "text-bronze"] as const;

function readQuery(params: URLSearchParams) {
  const mode = (RANKED_MODES as readonly string[]).includes(params.get("mode") ?? "")
    ? (params.get("mode") as RankedMode)
    : "time";
  const detail = RANKED_DETAILS[mode].includes(params.get("detail") ?? "")
    ? (params.get("detail") as string)
    : mode === "time"
      ? "30"
      : "25";
  const range = RANGES.some((item) => item.value === params.get("range"))
    ? (params.get("range") as LeaderboardRange)
    : "all";
  return { mode, detail, range };
}

function Modifiers({ entry }: { entry: LeaderboardEntry }) {
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

function Podium({ entries, meId }: { entries: LeaderboardEntry[]; meId: string | undefined }) {
  const order = [entries[1], entries[0], entries[2]];
  const heights = ["h-20", "h-28", "h-14"];

  return (
    <div className="grid grid-cols-3 items-end gap-3 sm:gap-5">
      {order.map((entry, slot) => {
        if (!entry) {
          return <div key={`empty-${slot}`} />;
        }
        const place = entry.rank - 1;
        return (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-2"
            initial={{ opacity: 0, y: 16 }}
            key={entry.playerId}
            transition={{ delay: 0.08 * slot, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
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
              <span
                className={cn(
                  "font-bold font-mono text-2xl sm:text-3xl",
                  MEDALS[place] ?? "text-foreground",
                )}
              >
                {entry.wpm}
              </span>
              <span className="text-[10px] text-subtle uppercase tracking-[0.18em]">wpm</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function Row({ entry, isMe, index }: { entry: LeaderboardEntry; isMe: boolean; index: number }) {
  return (
    <motion.li
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "grid grid-cols-[3rem_1fr_4.5rem_4rem] items-center gap-3 rounded-2xl px-3 py-2.5 sm:grid-cols-[3.5rem_1fr_5rem_4.5rem_4rem_6.5rem]",
        isMe ? "bg-primary-soft" : "hover:bg-surface",
      )}
      initial={{ opacity: 0, y: 6 }}
      transition={{ delay: Math.min(index * 0.02, 0.4), duration: 0.3 }}
    >
      <span
        className={cn("font-mono font-semibold text-sm", MEDALS[entry.rank - 1] ?? "text-subtle")}
      >
        #{entry.rank}
      </span>
      <span className="flex min-w-0 items-center gap-2.5">
        <Avatar name={entry.name} size={30} src={entry.avatarUrl} />
        <span className="truncate font-medium text-foreground text-sm">{entry.name}</span>
        {isMe && (
          <span className="rounded-full bg-primary px-1.5 py-0.5 font-semibold text-[9px] text-primary-foreground uppercase tracking-wider">
            you
          </span>
        )}
        <Modifiers entry={entry} />
      </span>
      <span className="text-right font-mono font-semibold text-foreground">
        {entry.wpm}
        <span className="ml-1 font-normal text-[10px] text-subtle">wpm</span>
      </span>
      <span className="text-right font-mono text-muted text-sm">{entry.accuracy}%</span>
      <span className="hidden text-right font-mono text-sm text-subtle sm:block">{entry.raw}</span>
      <span className="hidden text-right text-subtle text-xs sm:block">
        {timeAgo(entry.createdAt)}
      </span>
    </motion.li>
  );
}

export function LeaderboardView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { player } = usePlayer();
  const query = readQuery(searchParams);
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryKey = `${query.mode}:${query.detail}:${query.range}`;

  useEffect(() => {
    const [mode, detail, range] = queryKey.split(":");
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    api<LeaderboardResponse>(`/api/leaderboard?${new URLSearchParams({ mode, detail, range })}`, {
      signal: controller.signal,
    })
      .then((response) => {
        setData(response);
        setLoading(false);
      })
      .catch((caught: unknown) => {
        if (!controller.signal.aborted) {
          setError(caught instanceof Error ? caught.message : "Could not load the leaderboard");
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [queryKey]);

  const navigate = (patch: Partial<typeof query>) => {
    const next = { ...query, ...patch };
    if (patch.mode && patch.mode !== query.mode) {
      next.detail = patch.mode === "time" ? "30" : "25";
    }
    router.replace(`${pathname}?${new URLSearchParams(next)}`, { scroll: false });
  };

  const entries = data?.entries ?? [];
  const podium = entries.filter((entry) => entry.rank <= 3).slice(0, 3);
  const rest = entries.slice(podium.length);
  const meOutside = data?.me && !entries.some((entry) => entry.playerId === data.me?.playerId);

  return (
    <div className="flex w-full max-w-4xl flex-col gap-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-semibold text-3xl text-foreground tracking-tight sm:text-4xl">
          Leaderboard
        </h1>
        <p className="text-muted text-sm">
          Best run per player.{" "}
          {data ? `${data.total} ${data.total === 1 ? "player" : "players"} ranked.` : " "}
        </p>
      </div>

      <LayoutGroup id="leaderboard-filters">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className={pillGroupClass}>
            {RANKED_MODES.map((mode) => (
              <SelectPill
                active={query.mode === mode}
                key={mode}
                layoutId="lb-mode"
                onClick={() => navigate({ mode })}
              >
                {mode}
              </SelectPill>
            ))}
          </div>
          <div className={pillGroupClass}>
            {RANKED_DETAILS[query.mode].map((detail) => (
              <SelectPill
                active={query.detail === detail}
                key={detail}
                layoutId="lb-detail"
                onClick={() => navigate({ detail })}
              >
                {detail}
              </SelectPill>
            ))}
          </div>
          <div className={pillGroupClass}>
            {RANGES.map((range) => (
              <SelectPill
                active={query.range === range.value}
                key={range.value}
                layoutId="lb-range"
                onClick={() => navigate({ range: range.value })}
              >
                {range.label}
              </SelectPill>
            ))}
          </div>
        </div>
      </LayoutGroup>

      <AnimatePresence mode="wait">
        {error ? (
          <motion.div
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-2 py-16 text-danger text-sm"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            key="error"
          >
            <WarningCircle size={28} weight="duotone" />
            {error}
          </motion.div>
        ) : !data && loading ? (
          <motion.ul className="flex flex-col gap-2" exit={{ opacity: 0 }} key="skeleton">
            {Array.from({ length: 8 }, (_, index) => (
              <li className="h-[54px] animate-pulse rounded-2xl bg-surface" key={index} />
            ))}
          </motion.ul>
        ) : entries.length === 0 ? (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 rounded-3xl bg-surface px-6 py-16 text-center"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0, y: 8 }}
            key={`empty-${queryKey}`}
          >
            <Keyboard className="text-subtle" size={36} weight="duotone" />
            <div className="flex flex-col gap-1">
              <p className="font-medium text-foreground">No scores here yet</p>
              <p className="text-muted text-sm">
                Finish a {query.mode} {query.detail} test to claim the top spot.
              </p>
            </div>
            <Link className={buttonClass("primary")} href="/">
              start typing
            </Link>
          </motion.div>
        ) : (
          <motion.div
            animate={{ opacity: loading ? 0.55 : 1 }}
            className="flex flex-col gap-8"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            key={`board-${queryKey}`}
            transition={{ duration: 0.2 }}
          >
            <Podium entries={podium} meId={player?.id} />
            {rest.length > 0 && (
              <ul className="flex flex-col gap-1">
                {rest.map((entry, index) => (
                  <Row
                    entry={entry}
                    index={index}
                    isMe={entry.playerId === player?.id}
                    key={entry.playerId}
                  />
                ))}
              </ul>
            )}
            {meOutside && data?.me && (
              <div className="flex flex-col gap-1 border-border border-t border-dashed pt-4">
                <span className="px-3 text-[10px] text-subtle uppercase tracking-[0.18em]">
                  your best
                </span>
                <ul>
                  <Row entry={data.me} index={0} isMe />
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

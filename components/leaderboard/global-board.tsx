"use client";

import { WarningCircle } from "@phosphor-icons/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BoardSkeleton,
  EmptyBoard,
  LiveBadge,
  Podium,
  Row,
  TestFilters,
} from "@/components/leaderboard/board-parts";
import { usePlayer } from "@/components/player/player-provider";
import { LiveQuery } from "@/components/realtime/live-query";
import { pillGroupClass, SelectPill } from "@/components/ui/pills";
import { type GlobalBoardRow, globalRowToEntry } from "@/lib/client/live";
import type { LeaderboardRange } from "@/lib/client/types";
import { RANKED_DETAILS, RANKED_MODES, type RankedMode } from "@/lib/typing/options";

const RANGES: { value: LeaderboardRange; label: string }[] = [
  { value: "all", label: "all time" },
  { value: "weekly", label: "this week" },
  { value: "daily", label: "today" },
];

function readQuery(params: URLSearchParams) {
  const rawMode = params.get("mode") ?? "";
  const mode = (RANKED_MODES as readonly string[]).includes(rawMode)
    ? (rawMode as RankedMode)
    : "time";
  const rawDetail = params.get("detail") ?? "";
  const detail = RANKED_DETAILS[mode].includes(rawDetail)
    ? rawDetail
    : mode === "time"
      ? "30"
      : "25";
  const rawRange = params.get("range");
  const range = RANGES.some((item) => item.value === rawRange)
    ? (rawRange as LeaderboardRange)
    : "all";
  return { mode, detail, range };
}

export function GlobalBoard() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { player } = usePlayer();
  const query = readQuery(searchParams);

  const navigate = (patch: Partial<typeof query>) => {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries({ ...query, ...patch })) {
      params.set(key, value);
    }
    router.replace(`${pathname}?${params}`, { scroll: false });
  };

  return (
    <LiveQuery<GlobalBoardRow>
      body={{ ...query, limit: 50 }}
      endpoint={player ? "/api/leaderboard/live" : null}
    >
      {({ rows, status, error }) => {
        const all = (rows ?? []).map(globalRowToEntry);
        const entries = all.filter((entry) => entry.rank <= 50);
        const me = all.find((entry) => entry.playerId === player?.id);
        const meOutside = me && !entries.some((entry) => entry.playerId === me.playerId);
        const podium = entries.filter((entry) => entry.rank <= 3).slice(0, 3);
        const rest = entries.slice(podium.length);
        const total = rows?.[0]?.total ?? 0;

        return (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col items-center gap-2">
              <TestFilters
                detail={query.detail}
                idPrefix="global"
                mode={query.mode}
                onChange={(next) => navigate(next)}
              >
                <div className={pillGroupClass}>
                  {RANGES.map((range) => (
                    <SelectPill
                      active={query.range === range.value}
                      key={range.value}
                      layoutId="global-range"
                      onClick={() => navigate({ range: range.value })}
                    >
                      {range.label}
                    </SelectPill>
                  ))}
                </div>
              </TestFilters>
              <div className="flex items-center gap-2 text-muted text-xs">
                <LiveBadge status={status} />
                {rows && `${total} ${total === 1 ? "player" : "players"} ranked`}
              </div>
            </div>

            {status === "error" && !rows ? (
              <div className="flex flex-col items-center gap-2 py-16 text-danger text-sm">
                <WarningCircle size={28} weight="duotone" />
                {error}
              </div>
            ) : rows === undefined ? (
              <BoardSkeleton />
            ) : entries.length === 0 ? (
              <EmptyBoard
                body={`Finish a ${query.mode} ${query.detail} test to claim the top spot.`}
                title="No scores here yet"
              />
            ) : (
              <div className="flex flex-col gap-8">
                <Podium entries={podium} meId={player?.id} />
                {rest.length > 0 && (
                  <ul className="flex flex-col gap-1">
                    {rest.map((entry) => (
                      <Row
                        entry={entry}
                        isMe={entry.playerId === player?.id}
                        key={entry.playerId}
                      />
                    ))}
                  </ul>
                )}
                {meOutside && me && (
                  <div className="flex flex-col gap-1 border-border border-t border-dashed pt-4">
                    <span className="px-3 text-[10px] text-subtle uppercase tracking-[0.18em]">
                      your best
                    </span>
                    <ul>
                      <Row entry={me} isMe />
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }}
    </LiveQuery>
  );
}

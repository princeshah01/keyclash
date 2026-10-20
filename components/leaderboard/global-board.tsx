"use client";

import { WarningCircle } from "@phosphor-icons/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BOARD_TOP,
  BoardScope,
  BoardSkeleton,
  EmptyBoard,
  Podium,
  Row,
  splitBoard,
  TestFilters,
  YourRank,
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
      body={{ ...query, limit: BOARD_TOP }}
      endpoint={player ? "/api/leaderboard/live" : null}
    >
      {({ rows, status, error }) => {
        const all = (rows ?? []).map(globalRowToEntry);
        const { top, me } = splitBoard(all, player?.id);
        const podium = top.filter((entry) => entry.rank <= 3).slice(0, 3);
        const rest = top.slice(podium.length);

        return (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-3">
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
              <BoardScope />
            </div>

            {status === "error" && !rows ? (
              <div className="flex flex-col items-center gap-2 py-16 text-danger text-sm">
                <WarningCircle size={28} weight="duotone" />
                {error}
              </div>
            ) : rows === undefined ? (
              <BoardSkeleton />
            ) : top.length === 0 ? (
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
                {me && <YourRank entry={me} />}
              </div>
            )}
          </div>
        );
      }}
    </LiveQuery>
  );
}

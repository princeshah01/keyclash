"use client";

import { Hourglass, WarningCircle } from "@phosphor-icons/react";
import {
  BoardScope,
  BoardSkeleton,
  Podium,
  Row,
  splitBoard,
  YourRank,
} from "@/components/leaderboard/board-parts";
import { usePlayer } from "@/components/player/player-provider";
import { LiveQuery } from "@/components/realtime/live-query";
import { Avatar } from "@/components/ui/avatar";
import { type RoomBoardRow, rankRoomRows } from "@/lib/client/live";
import type { RankedMode } from "@/lib/typing/options";
import { cn } from "@/lib/utils";

interface RoomBoardProps {
  code: string;
  compact?: boolean;
  detail: string;
  mode: RankedMode;
  roomName: string;
}

export function RoomBoard({ code, compact = false, detail, mode, roomName }: RoomBoardProps) {
  const { player } = usePlayer();

  return (
    <LiveQuery<RoomBoardRow> body={{ mode, detail }} endpoint={`/api/rooms/${code}/live`}>
      {({ rows, status, error }) => {
        const { ranked, pending } = rankRoomRows(rows ?? []);
        const { top, me } = splitBoard(ranked, player?.id);
        const podium = compact ? [] : top.filter((entry) => entry.rank <= 3).slice(0, 3);
        const rest = top.slice(podium.length);

        return (
          <div className={cn("flex flex-col", compact ? "gap-3" : "gap-6")}>
            <BoardScope roomName={roomName} />

            {status === "error" && !rows ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center text-danger text-xs">
                <WarningCircle size={22} weight="duotone" />
                {error}
              </div>
            ) : rows === undefined ? (
              <BoardSkeleton compact={compact} rows={compact ? 4 : 6} />
            ) : (
              <>
                {podium.length > 0 && <Podium entries={podium} meId={player?.id} />}
                {rest.length > 0 && (
                  <ul className="flex flex-col gap-1">
                    {rest.map((entry) => (
                      <Row
                        compact={compact}
                        entry={entry}
                        isMe={entry.playerId === player?.id}
                        key={entry.playerId}
                      />
                    ))}
                  </ul>
                )}
                {me && <YourRank compact={compact} entry={me} />}
                {ranked.length === 0 && (
                  <p className="rounded-2xl bg-surface px-4 py-5 text-center text-muted text-xs">
                    No {mode} {detail} scores in this room yet. Finish one to take #1.
                  </p>
                )}
                {pending.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <span className="flex items-center gap-1.5 px-1 text-[10px] text-subtle uppercase tracking-[0.16em]">
                      <Hourglass size={11} weight="bold" />
                      waiting for a score
                    </span>
                    <ul className="flex flex-wrap gap-1.5">
                      {pending.map((member) => (
                        <li
                          className={cn(
                            "flex items-center gap-1.5 rounded-full bg-surface py-0.5 pr-2.5 pl-0.5 text-[11px] text-muted",
                            member.playerId === player?.id && "bg-primary-soft text-primary",
                          )}
                          key={member.playerId}
                        >
                          <Avatar name={member.name} size={18} src={member.avatarUrl} />
                          {member.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        );
      }}
    </LiveQuery>
  );
}

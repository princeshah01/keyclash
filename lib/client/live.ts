"use client";

import type { SealedLiveQuery } from "@neon/realtime/client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { avatarUrlFor } from "@/lib/avatar";
import type { LeaderboardEntry } from "@/lib/client/types";
import type { GlobalBoardRow, RoomBoardRow } from "@/lib/server/live";
import { api } from "./api";

export type { GlobalBoardRow, RoomBoardRow };

interface SealedState<Row> {
  attempt: number;
  error?: string;
  key: string;
  sealed?: SealedLiveQuery<Row>;
}

export function useSealedQuery<Row>(endpoint: string | null, body: unknown) {
  const bodyJson = JSON.stringify(body ?? {});
  const key = endpoint ? `${endpoint}|${bodyJson}` : "";
  const [state, setState] = useState<SealedState<Row>>();
  const [attempt, setAttempt] = useState(0);

  const refreshQuery = useCallback(() => {
    if (!endpoint) {
      return Promise.reject(new Error("No live query"));
    }
    return api<SealedLiveQuery<Row>>(endpoint, { method: "POST", body: bodyJson });
  }, [endpoint, bodyJson]);

  useEffect(() => {
    if (!endpoint) {
      return;
    }
    let cancelled = false;
    refreshQuery().then(
      (sealed) => {
        if (!cancelled) {
          setState({ key: `${endpoint}|${bodyJson}`, sealed, attempt });
        }
      },
      (error: unknown) => {
        if (!cancelled) {
          setState({
            key: `${endpoint}|${bodyJson}`,
            attempt,
            error: error instanceof Error ? error.message : "Could not open live updates",
          });
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [endpoint, bodyJson, refreshQuery, attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  const current = state?.key === key ? state : undefined;

  return useMemo(
    () => ({ sealed: current?.sealed, error: current?.error, refreshQuery, retry }),
    [current, refreshQuery, retry],
  );
}

function toIso(value: Date | string | null) {
  if (!value) {
    return new Date(0).toISOString();
  }
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export function globalRowToEntry(row: GlobalBoardRow): LeaderboardEntry {
  return {
    rank: row.rank,
    playerId: row.player_id,
    name: row.name,
    avatarUrl: avatarUrlFor({ id: row.player_id, avatarKey: row.avatar_key, image: row.image }),
    isGuest: row.auth_user_id === null,
    wpm: row.wpm,
    raw: row.raw,
    accuracy: row.accuracy,
    consistency: row.consistency,
    punctuation: row.punctuation,
    numbers: row.numbers,
    createdAt: toIso(row.created_at),
  };
}

export interface RoomStanding {
  pending: { avatarUrl: string | null; name: string; playerId: string }[];
  ranked: LeaderboardEntry[];
}

export function rankRoomRows(rows: readonly RoomBoardRow[]): RoomStanding {
  const scored = rows
    .filter((row) => row.wpm !== null)
    .sort(
      (a, b) =>
        (b.wpm ?? 0) - (a.wpm ?? 0) ||
        (b.accuracy ?? 0) - (a.accuracy ?? 0) ||
        new Date(toIso(a.achieved_at)).getTime() - new Date(toIso(b.achieved_at)).getTime(),
    );

  const ranked: LeaderboardEntry[] = [];
  scored.forEach((row, index) => {
    const previous = ranked[index - 1];
    const tied = previous && previous.wpm === row.wpm && previous.accuracy === (row.accuracy ?? 0);
    ranked.push({
      rank: tied ? previous.rank : index + 1,
      playerId: row.player_id,
      name: row.name,
      avatarUrl: avatarUrlFor({ id: row.player_id, avatarKey: row.avatar_key, image: row.image }),
      isGuest: row.auth_user_id === null,
      wpm: row.wpm ?? 0,
      raw: row.raw ?? 0,
      accuracy: row.accuracy ?? 0,
      consistency: row.consistency ?? 0,
      punctuation: row.punctuation ?? false,
      numbers: row.numbers ?? false,
      createdAt: toIso(row.achieved_at),
    });
  });

  const pending = rows
    .filter((row) => row.wpm === null)
    .sort((a, b) => toIso(a.joined_at).localeCompare(toIso(b.joined_at)))
    .map((row) => ({
      playerId: row.player_id,
      name: row.name,
      avatarUrl: avatarUrlFor({ id: row.player_id, avatarKey: row.avatar_key, image: row.image }),
    }));

  return { ranked, pending };
}

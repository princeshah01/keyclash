import type { LeaderboardRange } from "@/lib/server/leaderboard";
import type { PublicPlayer } from "@/lib/server/players";
import type { RankedMode, TestMode } from "@/lib/typing/options";

export type { LeaderboardRange, PublicPlayer };

export interface LeaderboardEntry {
  accuracy: number;
  avatarUrl: string | null;
  consistency: number;
  createdAt: string;
  isGuest: boolean;
  name: string;
  numbers: boolean;
  playerId: string;
  punctuation: boolean;
  rank: number;
  raw: number;
  wpm: number;
}

export interface LeaderboardResponse {
  detail: string;
  entries: LeaderboardEntry[];
  limit: number;
  me: LeaderboardEntry | null;
  mode: RankedMode;
  range: LeaderboardRange;
  total: number;
}

export interface SavedResult {
  id: string;
  isPersonalBest: boolean;
  previousBest: { accuracy: number; wpm: number } | null;
  rank: { rank: number; total: number } | null;
  ranked: boolean;
}

export interface RecentResult {
  accuracy: number;
  consistency: number;
  createdAt: string;
  elapsedSeconds: number;
  id: string;
  mode: TestMode;
  modeDetail: string;
  numbers: boolean;
  punctuation: boolean;
  raw: number;
  wpm: number;
}

export interface RecentResultsResponse {
  /** Id to pass as `cursor` for the next page, or null when finished. */
  nextCursor: string | null;
  results: RecentResult[];
}

export interface PlayerStats {
  bests: {
    accuracy: number;
    createdAt: string;
    mode: TestMode;
    modeDetail: string;
    wpm: number;
  }[];
  totals: {
    averageAccuracy: number;
    averageWpm: number;
    bestWpm: number;
    secondsTyped: number;
    tests: number;
  };
}

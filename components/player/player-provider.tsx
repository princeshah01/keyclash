"use client";

import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authClient } from "@/lib/auth/client";
import { api } from "@/lib/client/api";
import type { PublicPlayer } from "@/lib/client/types";

type Status = "loading" | "ready" | "error";

interface PlayerContextValue {
  player: PublicPlayer | null;
  refresh: () => Promise<PublicPlayer | null>;
  rename: (name: string) => Promise<PublicPlayer>;
  replace: (player: PublicPlayer) => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  status: Status;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<PublicPlayer | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  const refresh = useCallback(async () => {
    try {
      const { player: next } = await api<{ player: PublicPlayer }>("/api/me");
      setPlayer(next);
      setStatus("ready");
      return next;
    } catch {
      setStatus("error");
      return null;
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const rename = useCallback(async (name: string) => {
    const { player: next } = await api<{ player: PublicPlayer }>("/api/me", {
      method: "PATCH",
      body: JSON.stringify({ name }),
    });
    setPlayer(next);
    return next;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const next = `${window.location.pathname}${window.location.search}`;
    const callbackURL = new URL("/auth/callback", window.location.origin);
    callbackURL.searchParams.set("next", next);
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: callbackURL.toString(),
    });
    if (error) {
      throw new Error(error.message ?? "Google sign-in failed");
    }
  }, []);

  const signOut = useCallback(async () => {
    await authClient.signOut();
    await refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      player,
      status,
      refresh,
      rename,
      replace: setPlayer,
      signInWithGoogle,
      signOut,
    }),
    [player, status, refresh, rename, signInWithGoogle, signOut],
  );

  return <PlayerContext value={value}>{children}</PlayerContext>;
}

export function usePlayer() {
  const context = use(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used inside PlayerProvider");
  }
  return context;
}

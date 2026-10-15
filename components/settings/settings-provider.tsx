"use client";

import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useConsent } from "@/components/consent/consent-provider";
import { usePlayer } from "@/components/player/player-provider";
import { ApiError, api } from "@/lib/client/api";
import type { PublicPlayer } from "@/lib/client/types";
import {
  applyAppearance,
  applyMode,
  clearLocalPreferences,
  loadLocalPreferences,
  saveLocalPreferences,
} from "@/lib/settings/apply";
import { DEFAULT_PREFERENCES, type Preferences } from "@/lib/settings/options";

export type SettingsStorage = "account" | "browser" | "session";

interface SettingsContextValue {
  preferences: Preferences;
  storage: SettingsStorage;
  syncError: string | null;
  update: (patch: Partial<Preferences>) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);
const SYNC_DELAY_MS = 500;

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { player, replace } = usePlayer();
  const { consent } = useConsent();
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [syncError, setSyncError] = useState<string | null>(null);
  const preferencesRef = useRef(preferences);
  const syncedPlayerRef = useRef<string | null>(null);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isAccount = player !== null && !player.isGuest;
  const isAccountRef = useRef(isAccount);

  const commit = useCallback((next: Preferences) => {
    preferencesRef.current = next;
    setPreferences(next);
    applyAppearance(next);
  }, []);

  const push = useCallback(
    async (next: Preferences) => {
      try {
        const response = await api<{ player: PublicPlayer }>("/api/me/preferences", {
          method: "PUT",
          body: JSON.stringify(next),
        });
        setSyncError(null);
        replace(response.player);
      } catch (error) {
        setSyncError(error instanceof ApiError ? error.message : "Could not sync settings");
      }
    },
    [replace],
  );

  useEffect(() => {
    const local = loadLocalPreferences();
    if (local) {
      commit(local);
    }
    return () => clearTimeout(syncTimerRef.current);
  }, [commit]);

  useEffect(() => {
    isAccountRef.current = isAccount;
  }, [isAccount]);

  useEffect(() => {
    if (consent === "all") {
      saveLocalPreferences(preferences);
    } else if (consent === "essential") {
      clearLocalPreferences();
    }
  }, [consent, preferences]);

  useEffect(() => {
    if (!player || player.isGuest) {
      syncedPlayerRef.current = null;
      return;
    }
    if (syncedPlayerRef.current === player.id) {
      return;
    }
    syncedPlayerRef.current = player.id;
    if (player.preferences) {
      commit(player.preferences);
    } else {
      void push(preferencesRef.current);
    }
  }, [player, commit, push]);

  useEffect(() => {
    if (preferences.mode !== "system") {
      return;
    }
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyMode("system");
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, [preferences.mode]);

  const update = useCallback(
    (patch: Partial<Preferences>) => {
      commit({ ...preferencesRef.current, ...patch });
      if (!isAccountRef.current) {
        return;
      }
      clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(() => void push(preferencesRef.current), SYNC_DELAY_MS);
    },
    [commit, push],
  );

  let storage: SettingsStorage = "session";
  if (isAccount) {
    storage = "account";
  } else if (consent === "all") {
    storage = "browser";
  }

  const value = useMemo(
    () => ({ preferences, storage, syncError, update }),
    [preferences, storage, syncError, update],
  );

  return <SettingsContext value={value}>{children}</SettingsContext>;
}

export function useSettings() {
  const context = use(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used inside SettingsProvider");
  }
  return context;
}

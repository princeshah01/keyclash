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
import { api } from "@/lib/client/api";
import type { RoomSummary } from "@/lib/server/rooms";

export type { RoomSummary };

const STORAGE_KEY = "kc-room";

interface StoredRoomState {
  active: string | null;
  hidden: boolean;
}

interface RoomsContextValue {
  activeCode: string | null;
  activeRoom: RoomSummary | null;
  create: (name: string) => Promise<string>;
  join: (code: string) => Promise<void>;
  leave: (code: string) => Promise<void>;
  leaveAll: () => Promise<void>;
  panelHidden: boolean;
  refresh: () => Promise<RoomSummary[]>;
  rooms: RoomSummary[];
  setActive: (code: string | null) => void;
  setPanelHidden: (hidden: boolean) => void;
  status: "loading" | "ready" | "error";
}

const RoomsContext = createContext<RoomsContextValue | null>(null);

function readStored(): StoredRoomState {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as StoredRoomState | null;
    return {
      active: typeof raw?.active === "string" ? raw.active : null,
      hidden: raw?.hidden === true,
    };
  } catch {
    return { active: null, hidden: false };
  }
}

export function RoomsProvider({ children }: { children: ReactNode }) {
  const { player } = usePlayer();
  const { consent } = useConsent();
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [status, setStatus] = useState<RoomsContextValue["status"]>("loading");
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [panelHidden, setPanelHidden] = useState(false);
  const loadedRef = useRef(false);
  const playerId = player?.id;

  useEffect(() => {
    const stored = readStored();
    setActiveCode(stored.active);
    setPanelHidden(stored.hidden);
    loadedRef.current = true;
  }, []);

  useEffect(() => {
    if (!loadedRef.current) {
      return;
    }
    try {
      if (consent === "all") {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ active: activeCode, hidden: panelHidden }),
        );
      } else if (consent === "essential") {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      return;
    }
  }, [consent, activeCode, panelHidden]);

  const refresh = useCallback(async () => {
    try {
      const { rooms: next } = await api<{ rooms: RoomSummary[] }>("/api/rooms");
      setRooms(next);
      setStatus("ready");
      setActiveCode((current) =>
        current && next.some((room) => room.code === current) ? current : null,
      );
      return next;
    } catch {
      setStatus("error");
      return [];
    }
  }, []);

  useEffect(() => {
    if (playerId) {
      void refresh();
    }
  }, [playerId, refresh]);

  const setActive = useCallback((code: string | null) => {
    setActiveCode(code);
    if (code) {
      setPanelHidden(false);
    }
  }, []);

  const create = useCallback(
    async (name: string) => {
      const { room } = await api<{ room: { code: string } }>("/api/rooms", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      await refresh();
      return room.code;
    },
    [refresh],
  );

  const join = useCallback(
    async (code: string) => {
      await api(`/api/rooms/${code}/members`, { method: "POST" });
      await refresh();
      setActive(code);
    },
    [refresh, setActive],
  );

  const leave = useCallback(
    async (code: string) => {
      await api(`/api/rooms/${code}/members`, { method: "DELETE" });
      const next = await refresh();
      setActiveCode((current) => (current === code ? (next[0]?.code ?? null) : current));
    },
    [refresh],
  );

  const leaveAll = useCallback(async () => {
    await api("/api/rooms/memberships", { method: "DELETE" });
    setActiveCode(null);
    await refresh();
  }, [refresh]);

  const activeRoom = rooms.find((room) => room.code === activeCode) ?? null;

  const value = useMemo(
    () => ({
      rooms,
      status,
      activeCode,
      activeRoom,
      panelHidden,
      setPanelHidden,
      setActive,
      refresh,
      create,
      join,
      leave,
      leaveAll,
    }),
    [
      rooms,
      status,
      activeCode,
      activeRoom,
      panelHidden,
      setActive,
      refresh,
      create,
      join,
      leave,
      leaveAll,
    ],
  );

  return <RoomsContext value={value}>{children}</RoomsContext>;
}

export function useRooms() {
  const context = use(RoomsContext);
  if (!context) {
    throw new Error("useRooms must be used inside RoomsProvider");
  }
  return context;
}

export function inviteUrl(code: string) {
  return `${window.location.origin}/r/${code}`;
}

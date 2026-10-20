"use client";

import {
  CaretDown,
  CaretLeft,
  Check,
  CircleNotch,
  DoorOpen,
  Gear,
  SignOut,
  UsersThree,
  X,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { useChrome } from "@/components/layout/chrome-provider";
import { InviteButton } from "@/components/rooms/room-actions";
import { RoomBoard } from "@/components/rooms/room-board";
import { useRooms } from "@/components/rooms/rooms-provider";
import { Popover } from "@/components/ui/popover";
import { isRanked, type RankedMode } from "@/lib/typing/options";
import { cn } from "@/lib/utils";

const panelEase = [0.23, 1, 0.32, 1] as const;

function RoomSwitcher() {
  const { rooms, activeRoom, setActive } = useRooms();
  const [open, setOpen] = useState(false);

  return (
    <Popover
      align="start"
      className="w-64"
      label="Switch room"
      onOpenChange={setOpen}
      open={open}
      trigger={
        <button
          aria-expanded={open}
          className="flex min-w-0 max-w-44 items-center gap-1.5 rounded-xl px-2 py-1 text-left transition-colors hover:bg-surface"
          onClick={() => setOpen((value) => !value)}
          type="button"
        >
          <UsersThree className="shrink-0 text-primary" size={15} weight="duotone" />
          <span className="truncate font-semibold text-foreground text-sm">{activeRoom?.name}</span>
          <CaretDown className="shrink-0 text-subtle" size={11} weight="bold" />
        </button>
      }
    >
      <ul className="flex max-h-72 flex-col gap-0.5 overflow-y-auto">
        {rooms.map((room) => (
          <li key={room.code}>
            <button
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-[10px] px-2.5 py-2 text-left text-sm transition-colors hover:bg-surface",
                room.code === activeRoom?.code ? "text-foreground" : "text-muted",
              )}
              onClick={() => {
                setActive(room.code);
                setOpen(false);
              }}
              type="button"
            >
              <span className="flex min-w-0 flex-col">
                <span className="truncate">{room.name}</span>
                <span className="text-[11px] text-subtle">{room.memberCount} members</span>
              </span>
              {room.code === activeRoom?.code && (
                <Check className="shrink-0 text-primary" size={13} weight="bold" />
              )}
            </button>
          </li>
        ))}
      </ul>
      <Link
        className="mt-1 flex items-center gap-2 border-border border-t px-2.5 pt-2.5 pb-1.5 text-muted text-xs transition-colors hover:text-foreground"
        href="/leaderboard?tab=rooms"
        onClick={() => setOpen(false)}
      >
        <Gear size={13} weight="duotone" />
        Manage rooms
      </Link>
    </Popover>
  );
}

export function RoomPanel({ detail, mode }: { detail: string; mode: string }) {
  const { activeRoom, panelHidden, setPanelHidden, setActive, leave, leaveAll, rooms } = useRooms();
  const { typingActive } = useChrome();
  const [busy, setBusy] = useState<"leave" | "all" | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);
  if (!activeRoom) {
    return null;
  }

  const ranked = isRanked(mode, detail);
  const boardMode = (ranked ? mode : "time") as RankedMode;
  const boardDetail = ranked ? detail : "30";

  const run = async (kind: "leave" | "all") => {
    setBusy(kind);
    try {
      await (kind === "leave" ? leave(activeRoom.code) : leaveAll());
    } finally {
      setBusy(null);
      setConfirmAll(false);
    }
  };

  return (
    <AnimatePresence initial={false} mode="wait">
      {panelHidden ? (
        <motion.button
          animate={{ opacity: 1, x: 0 }}
          aria-label={`Show ${activeRoom.name} leaderboard`}
          className="fixed top-28 right-0 z-30 flex items-center gap-1.5 rounded-l-2xl border border-border border-r-0 bg-elevated py-2.5 pr-3 pl-2.5 text-muted text-xs shadow-lg transition-colors hover:text-foreground"
          exit={{ opacity: 0, x: 20 }}
          initial={{ opacity: 0, x: 20 }}
          key="tab"
          onClick={() => setPanelHidden(false)}
          transition={{ duration: 0.25, ease: panelEase }}
          type="button"
        >
          <CaretLeft size={12} weight="bold" />
          <UsersThree className="text-primary" size={15} weight="duotone" />
          <span className="max-w-28 truncate">{activeRoom.name}</span>
        </motion.button>
      ) : (
        <motion.aside
          animate={{ opacity: typingActive ? 0.3 : 1, x: 0 }}
          aria-label={`${activeRoom.name} leaderboard`}
          className="fixed top-24 right-4 z-30 flex max-h-[calc(100dvh-8rem)] w-[300px] flex-col rounded-3xl border border-border bg-elevated/95 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.3)] backdrop-blur-md transition-opacity hover:opacity-100"
          exit={{ opacity: 0, x: 24 }}
          initial={{ opacity: 0, x: 24 }}
          key="panel"
          transition={{ duration: 0.3, ease: panelEase }}
        >
          <header className="flex items-center justify-between gap-1 px-3 pt-3 pb-2">
            <RoomSwitcher />
            <div className="flex items-center">
              <InviteButton code={activeRoom.code} name={activeRoom.name} variant="icon" />
              <button
                aria-label="Hide room panel"
                className="flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-strong hover:text-foreground"
                onClick={() => setPanelHidden(true)}
                title="Hide"
                type="button"
              >
                <X size={14} weight="bold" />
              </button>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
            {!ranked && (
              <p className="mb-2 rounded-xl bg-surface px-3 py-2 text-[11px] text-muted">
                Rooms rank time and words tests. Showing time 30.
              </p>
            )}
            <RoomBoard
              code={activeRoom.code}
              compact
              detail={boardDetail}
              mode={boardMode}
              roomName={activeRoom.name}
            />
          </div>

          <footer className="flex items-center gap-1 border-border border-t px-2 py-2">
            <button
              className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-muted text-xs transition-colors hover:bg-surface hover:text-foreground"
              onClick={() => setActive(null)}
              title="Stop showing a room while you type"
              type="button"
            >
              <DoorOpen size={14} weight="duotone" />
              exit
            </button>
            <button
              className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-muted text-xs transition-colors hover:bg-danger/10 hover:text-danger"
              disabled={busy !== null}
              onClick={() => void run("leave")}
              type="button"
            >
              {busy === "leave" ? (
                <CircleNotch className="animate-spin" size={14} weight="bold" />
              ) : (
                <SignOut size={14} weight="duotone" />
              )}
              leave
            </button>
            {rooms.length > 1 && (
              <button
                className={cn(
                  "ml-auto flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs transition-colors",
                  confirmAll
                    ? "bg-danger/10 text-danger"
                    : "text-subtle hover:bg-danger/10 hover:text-danger",
                )}
                disabled={busy !== null}
                onBlur={() => setConfirmAll(false)}
                onClick={() => (confirmAll ? void run("all") : setConfirmAll(true))}
                type="button"
              >
                {busy === "all" && <CircleNotch className="animate-spin" size={14} weight="bold" />}
                {confirmAll ? "confirm leave all" : "leave all"}
              </button>
            )}
          </footer>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

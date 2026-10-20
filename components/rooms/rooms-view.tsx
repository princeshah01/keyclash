"use client";

import { CircleNotch, Crown, Play, SignOut, UsersThree } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { TestFilters } from "@/components/leaderboard/board-parts";
import { CreateRoomForm, InviteButton } from "@/components/rooms/room-actions";
import { RoomBoard } from "@/components/rooms/room-board";
import { type RoomSummary, useRooms } from "@/components/rooms/rooms-provider";
import { Button } from "@/components/ui/button";
import { RANKED_DETAILS, RANKED_MODES, type RankedMode } from "@/lib/typing/options";
import { cn } from "@/lib/utils";

function useConfirmingAction() {
  const [busy, setBusy] = useState<string | null>(null);
  const run = async (key: string, action: () => Promise<void>) => {
    setBusy(key);
    try {
      await action();
    } finally {
      setBusy(null);
    }
  };
  return { busy, run };
}

function RoomListItem({
  busy,
  onLeave,
  onSelect,
  room,
  selected,
}: {
  busy: boolean;
  onLeave: () => void;
  onSelect: () => void;
  room: RoomSummary;
  selected: boolean;
}) {
  return (
    <li
      className={cn(
        "group flex items-center gap-1 rounded-2xl pr-1 transition-colors",
        selected ? "bg-surface-strong" : "hover:bg-surface",
      )}
    >
      <button
        aria-current={selected}
        className="flex min-w-0 flex-1 flex-col items-start gap-0.5 py-2.5 pl-3 text-left"
        onClick={onSelect}
        type="button"
      >
        <span className="flex w-full items-center gap-1.5">
          <span
            className={cn(
              "truncate text-sm",
              selected ? "font-medium text-foreground" : "text-muted",
            )}
          >
            {room.name}
          </span>
          {room.isOwner && (
            <Crown
              aria-label="You created this room"
              className="shrink-0 text-gold"
              size={12}
              weight="fill"
            />
          )}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-subtle">
          <UsersThree size={11} weight="bold" />
          {room.memberCount} {room.memberCount === 1 ? "member" : "members"}
        </span>
      </button>
      <InviteButton code={room.code} name={room.name} variant="icon" />
      <button
        aria-label={`Leave ${room.name}`}
        className="flex size-8 items-center justify-center rounded-full text-subtle transition-colors hover:bg-danger/10 hover:text-danger"
        disabled={busy}
        onClick={onLeave}
        title="Leave room"
        type="button"
      >
        {busy ? (
          <CircleNotch className="animate-spin" size={14} weight="bold" />
        ) : (
          <SignOut size={14} weight="bold" />
        )}
      </button>
    </li>
  );
}

export function RoomsView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { rooms, status, leave, leaveAll, setActive, activeCode } = useRooms();
  const { busy, run } = useConfirmingAction();

  const requested = searchParams.get("room");
  const selected = rooms.find((room) => room.code === requested) ?? rooms[0] ?? null;
  const rawMode = searchParams.get("mode") ?? "";
  const mode = (RANKED_MODES as readonly string[]).includes(rawMode)
    ? (rawMode as RankedMode)
    : "time";
  const rawDetail = searchParams.get("detail") ?? "";
  const detail = RANKED_DETAILS[mode].includes(rawDetail)
    ? rawDetail
    : mode === "time"
      ? "30"
      : "25";

  const navigate = (patch: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", "rooms");
    for (const [key, value] of Object.entries(patch)) {
      params.set(key, value);
    }
    router.replace(`${pathname}?${params}`, { scroll: false });
  };

  const playHere = (code: string) => {
    setActive(code);
    router.push("/");
  };

  return (
    <div className="grid gap-6 md:grid-cols-[17rem_1fr]">
      <aside className="flex flex-col gap-3 md:sticky md:top-24 md:self-start">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[11px] text-subtle uppercase tracking-[0.18em]">your rooms</h2>
          {rooms.length > 0 && (
            <span className="font-mono text-[11px] text-subtle">{rooms.length}</span>
          )}
        </div>
        <CreateRoomForm onCreated={(code) => navigate({ room: code })} />
        {status === "loading" ? (
          <div className="flex flex-col gap-1.5">
            {[0, 1, 2].map((index) => (
              <div className="h-14 animate-pulse rounded-2xl bg-surface" key={index} />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <p className="rounded-2xl bg-surface px-4 py-5 text-muted text-xs leading-relaxed">
            Create a room, then share its link. Everyone who joins shows up on that room&apos;s live
            leaderboard.
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {rooms.map((room) => (
              <RoomListItem
                busy={busy === room.code}
                key={room.code}
                onLeave={() => void run(room.code, () => leave(room.code))}
                onSelect={() => navigate({ room: room.code })}
                room={room}
                selected={room.code === selected?.code}
              />
            ))}
          </ul>
        )}
        {rooms.length > 1 && (
          <Button
            className="self-start"
            disabled={busy !== null}
            onClick={() => void run("all", leaveAll)}
            size="sm"
            variant="danger"
          >
            {busy === "all" ? (
              <CircleNotch className="animate-spin" size={14} weight="bold" />
            ) : (
              <SignOut size={14} weight="bold" />
            )}
            leave all rooms
          </Button>
        )}
      </aside>

      <section className="flex min-w-0 flex-col gap-6">
        {selected ? (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-6"
            initial={{ opacity: 0, y: 8 }}
            key={selected.code}
            transition={{ duration: 0.25 }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 flex-col">
                <h2 className="truncate font-semibold text-2xl text-foreground tracking-tight">
                  {selected.name}
                </h2>
                <span className="text-muted text-xs">
                  {selected.memberCount} {selected.memberCount === 1 ? "member" : "members"} · code{" "}
                  <span className="font-mono">{selected.code}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <InviteButton code={selected.code} name={selected.name} />
                <Button onClick={() => playHere(selected.code)} size="sm" variant="primary">
                  <Play size={13} weight="fill" />
                  {activeCode === selected.code ? "playing here" : "play in this room"}
                </Button>
              </div>
            </div>
            <TestFilters
              detail={detail}
              idPrefix="room"
              mode={mode}
              onChange={(next) => navigate({ ...next, room: selected.code })}
            />
            <RoomBoard code={selected.code} detail={detail} mode={mode} roomName={selected.name} />
          </motion.div>
        ) : (
          status !== "loading" && (
            <div className="flex flex-col items-center gap-3 rounded-3xl bg-surface px-6 py-16 text-center">
              <UsersThree className="text-subtle" size={40} weight="duotone" />
              <p className="font-medium text-foreground">Race your friends</p>
              <p className="max-w-sm text-muted text-sm">
                Rooms are private leaderboards. Name one on the left, send the invite link, and
                watch everyone&apos;s best scores update live.
              </p>
            </div>
          )
        )}
      </section>
    </div>
  );
}

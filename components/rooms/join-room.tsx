"use client";

import { CircleNotch, Play, UsersThree, WarningCircle } from "@phosphor-icons/react";
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { usePlayer } from "@/components/player/player-provider";
import { useRooms } from "@/components/rooms/rooms-provider";
import { Button, buttonClass } from "@/components/ui/button";
import { ApiError, api } from "@/lib/client/api";

interface RoomPreview {
  code: string;
  isMember: boolean;
  memberCount: number;
  name: string;
}

export function JoinRoom({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const { player } = usePlayer();
  const { join, setActive } = useRooms();
  const [room, setRoom] = useState<RoomPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const playerId = player?.id;

  useEffect(() => {
    if (!playerId) {
      return;
    }
    let cancelled = false;
    api<{ room: RoomPreview }>(`/api/rooms/${code}`)
      .then(({ room: preview }) => !cancelled && setRoom(preview))
      .catch(
        (caught: unknown) =>
          !cancelled &&
          setError(caught instanceof ApiError ? caught.message : "Could not load this room"),
      );
    return () => {
      cancelled = true;
    };
  }, [code, playerId]);

  const enter = async () => {
    setJoining(true);
    setError(null);
    try {
      if (room?.isMember) {
        setActive(code);
      } else {
        await join(code);
      }
      router.push("/");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not join this room");
      setJoining(false);
    }
  };

  if (error && !room) {
    return (
      <div className="flex max-w-sm flex-col items-center gap-3 text-center">
        <WarningCircle className="text-subtle" size={40} weight="duotone" />
        <h1 className="font-semibold text-foreground text-xl">Room unavailable</h1>
        <p className="text-muted text-sm">{error}</p>
        <Link className={buttonClass("soft")} href="/">
          back to typing
        </Link>
      </div>
    );
  }

  if (!room) {
    return <CircleNotch className="animate-spin text-primary" size={24} weight="bold" />;
  }

  return (
    <motion.div
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="flex w-full max-w-sm flex-col items-center gap-5 rounded-3xl border border-border bg-elevated p-8 text-center shadow-[0_24px_60px_-20px_rgb(0_0_0/0.25)]"
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        <UsersThree size={28} weight="duotone" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-[11px] text-subtle uppercase tracking-[0.18em]">
          you&apos;re invited to
        </p>
        <h1 className="font-semibold text-2xl text-foreground tracking-tight">{room.name}</h1>
        <p className="text-muted text-sm">
          {room.memberCount} {room.memberCount === 1 ? "member" : "members"} racing on a live
          leaderboard
        </p>
      </div>
      <Button className="w-full" disabled={joining} onClick={enter} variant="primary">
        {joining ? (
          <CircleNotch className="animate-spin" size={16} weight="bold" />
        ) : (
          <Play size={14} weight="fill" />
        )}
        {room.isMember ? "open room" : "join room"}
      </Button>
      {player?.isGuest && (
        <p className="text-subtle text-xs">
          You&apos;ll join as <span className="text-muted">{player.name}</span>. Sign in anytime to
          keep your spot.
        </p>
      )}
      {error && <p className="text-danger text-xs">{error}</p>}
    </motion.div>
  );
}

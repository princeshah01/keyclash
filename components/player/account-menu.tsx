"use client";

import { CaretDown, ChartLineUp, CircleNotch, SignOut, Trophy } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { GoogleButton } from "@/components/player/google-button";
import { NameEditor } from "@/components/player/name-editor";
import { usePlayer } from "@/components/player/player-provider";
import { Avatar } from "@/components/ui/avatar";
import { Popover } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const itemClass =
  "flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-muted text-sm transition-colors hover:bg-surface hover:text-foreground";

export function AccountMenu() {
  const { player, status, signOut } = usePlayer();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  if (!player) {
    return (
      <div
        className={cn(
          "flex h-9 items-center gap-2 rounded-full bg-surface px-1.5 pr-3",
          status === "loading" && "animate-pulse",
        )}
      >
        <span className="size-6 rounded-full bg-surface-strong" />
        <span className="h-3 w-16 rounded bg-surface-strong" />
      </div>
    );
  }

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      setOpen(false);
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <Popover
      className="w-80"
      label="Account"
      onOpenChange={setOpen}
      open={open}
      trigger={
        <button
          aria-expanded={open}
          aria-haspopup="dialog"
          className="flex h-9 items-center gap-2 rounded-full bg-surface py-1 pr-3 pl-1.5 text-sm transition-colors hover:bg-surface-strong"
          onClick={() => setOpen((value) => !value)}
          type="button"
        >
          <Avatar name={player.name} size={26} src={player.avatarUrl} />
          <span className="hidden max-w-36 truncate font-medium sm:inline">{player.name}</span>
          {player.isGuest && (
            <span className="hidden rounded-full bg-surface-strong px-1.5 py-0.5 font-medium text-[10px] text-muted uppercase tracking-wider md:inline">
              guest
            </span>
          )}
          <CaretDown className="text-subtle" size={12} weight="bold" />
        </button>
      }
    >
      <div className="flex items-center gap-3 p-2.5">
        <Avatar name={player.name} size={44} src={player.avatarUrl} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <NameEditor />
          <p className="truncate text-subtle text-xs">
            {player.isGuest ? "Guest · scores saved to this browser" : player.email}
          </p>
        </div>
      </div>

      {player.isGuest && (
        <div className="mx-1 mb-1 rounded-xl bg-surface p-3">
          <p className="mb-2.5 text-muted text-xs leading-relaxed">
            Sign in to keep your scores across devices. Your guest history comes with you.
          </p>
          <GoogleButton />
        </div>
      )}

      <div className="flex flex-col gap-0.5 border-border border-t pt-1.5">
        <Link className={itemClass} href="/profile" onClick={() => setOpen(false)}>
          <ChartLineUp size={16} weight="duotone" />
          Profile &amp; stats
        </Link>
        <Link className={itemClass} href="/leaderboard" onClick={() => setOpen(false)}>
          <Trophy size={16} weight="duotone" />
          Leaderboard
        </Link>
        {!player.isGuest && (
          <button
            className={cn(itemClass, "hover:text-danger")}
            disabled={signingOut}
            onClick={handleSignOut}
            type="button"
          >
            {signingOut ? (
              <CircleNotch className="animate-spin" size={16} weight="bold" />
            ) : (
              <SignOut size={16} weight="duotone" />
            )}
            Sign out
          </button>
        )}
      </div>
    </Popover>
  );
}

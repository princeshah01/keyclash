"use client";

import { ChartLineUp, CircleNotch, SignOut, Trophy } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { GoogleButton } from "@/components/player/google-button";
import { NameEditor } from "@/components/player/name-editor";
import { usePlayer } from "@/components/player/player-provider";
import { AVATAR_ACCEPT, useAvatarUpload } from "@/components/player/use-avatar-upload";
import { Avatar } from "@/components/ui/avatar";
import { ImageUpload } from "@/components/ui/image-upload";
import { Popover } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const itemClass =
  "flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-muted text-sm transition-colors hover:bg-surface hover:text-foreground";

function MenuAvatar() {
  const { player, pending, error, upload, remove, canRemove } = useAvatarUpload();
  if (!player) {
    return null;
  }
  return (
    <div className="flex flex-col items-center">
      <ImageUpload
        accept={AVATAR_ACCEPT}
        loading={pending !== null}
        name={player.name}
        onRemove={canRemove ? remove : undefined}
        onSelect={upload}
        size="sm"
        src={player.avatarUrl}
      />
      {error && (
        <p className="mt-1 max-w-24 text-center text-[10px] text-danger leading-tight">{error}</p>
      )}
    </div>
  );
}

export function AccountMenu() {
  const { player, status, signOut } = usePlayer();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  if (!player) {
    return (
      <div
        className={cn(
          "flex size-9 items-center justify-center rounded-full bg-surface",
          status === "loading" && "animate-pulse",
        )}
      >
        <span className="size-7 rounded-full bg-surface-strong" />
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
          aria-label={`Account menu for ${player.name}`}
          className="flex size-9 items-center justify-center rounded-full transition-opacity hover:opacity-90"
          onClick={() => setOpen((value) => !value)}
          type="button"
        >
          <Avatar name={player.name} size={32} src={player.avatarUrl} />
        </button>
      }
    >
      <div className="flex items-center gap-3 p-2.5">
        <MenuAvatar />
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

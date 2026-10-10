"use client";

import { Camera, CircleNotch, Trash } from "@phosphor-icons/react";
import { type ChangeEvent, useRef, useState } from "react";
import { usePlayer } from "@/components/player/player-provider";
import { Avatar } from "@/components/ui/avatar";
import { ApiError, api } from "@/lib/client/api";
import type { PublicPlayer } from "@/lib/client/types";

const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_BYTES = 1024 * 1024;

export function AvatarUploader() {
  const { player, replace } = usePlayer();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!player) {
    return <div className="size-24 animate-pulse rounded-full bg-surface" />;
  }

  const run = async (request: () => Promise<{ player: PublicPlayer }>) => {
    setPending(true);
    setError(null);
    try {
      const { player: next } = await request();
      replace(next);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Upload failed");
    } finally {
      setPending(false);
    }
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    if (!ACCEPTED.includes(file.type)) {
      setError("Use a PNG, JPEG, WebP or GIF image");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Avatars must be 1 MB or smaller");
      return;
    }
    const body = new FormData();
    body.set("file", file);
    void run(() => api("/api/me/avatar", { method: "POST", body }));
  };

  const hasCustomAvatar = player.avatarUrl !== null && !player.avatarUrl.endsWith("v=oauth");

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="group relative">
        <Avatar className="size-24" name={player.name} size={96} src={player.avatarUrl} />
        <button
          aria-label="Upload avatar"
          className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100 disabled:opacity-100"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          {pending ? (
            <CircleNotch className="animate-spin" size={22} weight="bold" />
          ) : (
            <Camera size={22} weight="duotone" />
          )}
        </button>
        {hasCustomAvatar && !pending && (
          <button
            aria-label="Remove avatar"
            className="absolute -right-1 -bottom-1 flex size-8 items-center justify-center rounded-full border border-border bg-elevated text-muted shadow-sm transition-colors hover:text-danger"
            onClick={() => void run(() => api("/api/me/avatar", { method: "DELETE" }))}
            type="button"
          >
            <Trash size={14} weight="duotone" />
          </button>
        )}
        <input
          accept={ACCEPTED.join(",")}
          aria-label="Avatar file"
          className="hidden"
          onChange={handleFile}
          ref={inputRef}
          type="file"
        />
      </div>
      {error && <p className="max-w-48 text-center text-danger text-xs">{error}</p>}
    </div>
  );
}

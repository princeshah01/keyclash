"use client";

import { AVATAR_ACCEPT, useAvatarUpload } from "@/components/player/use-avatar-upload";
import { ImageUpload } from "@/components/ui/image-upload";

export function AvatarUploader() {
  const { player, pending, error, upload, remove, canRemove } = useAvatarUpload();

  if (!player) {
    return <div className="size-24 animate-pulse rounded-full bg-surface" />;
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <ImageUpload
        accept={AVATAR_ACCEPT}
        loading={pending !== null}
        name={player.name}
        onRemove={canRemove ? remove : undefined}
        onSelect={upload}
        size="lg"
        src={player.avatarUrl}
      />
      <span className="text-[11px] text-subtle">
        {pending === "upload"
          ? "uploading…"
          : pending === "remove"
            ? "removing…"
            : player.avatarUrl
              ? "hover to change or remove"
              : "click to add a photo"}
      </span>
      {error && <p className="max-w-48 text-center text-danger text-xs">{error}</p>}
    </div>
  );
}

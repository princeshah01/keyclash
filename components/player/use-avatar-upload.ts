"use client";

import { useCallback, useState } from "react";
import { usePlayer } from "@/components/player/player-provider";
import { ApiError, api } from "@/lib/client/api";
import type { PublicPlayer } from "@/lib/client/types";

export const AVATAR_ACCEPT = "image/png,image/jpeg,image/webp,image/gif";
const ACCEPTED = AVATAR_ACCEPT.split(",");
const MAX_BYTES = 1024 * 1024;

export function useAvatarUpload() {
  const { player, replace } = usePlayer();
  const [pending, setPending] = useState<"upload" | "remove" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (kind: "upload" | "remove", request: () => Promise<{ player: PublicPlayer }>) => {
      setPending(kind);
      setError(null);
      try {
        const { player: next } = await request();
        replace(next);
      } catch (caught) {
        setError(caught instanceof ApiError ? caught.message : "Something went wrong, try again");
      } finally {
        setPending(null);
      }
    },
    [replace],
  );

  const upload = useCallback(
    (file: File) => {
      if (!ACCEPTED.includes(file.type)) {
        setError("Use a PNG, JPEG, WebP or GIF image");
        return;
      }
      if (file.size > MAX_BYTES) {
        setError("Photos must be 1 MB or smaller");
        return;
      }
      const body = new FormData();
      body.set("file", file);
      void run("upload", () => api("/api/me/avatar", { method: "POST", body }));
    },
    [run],
  );

  const remove = useCallback(
    () => void run("remove", () => api("/api/me/avatar", { method: "DELETE" })),
    [run],
  );

  const canRemove = Boolean(player?.avatarUrl && !player.avatarUrl.endsWith("v=oauth"));

  return { player, pending, error, upload, remove, canRemove, clearError: () => setError(null) };
}

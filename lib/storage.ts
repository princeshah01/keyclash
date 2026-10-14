import { Files } from "files-sdk";
import { neon } from "files-sdk/neon";

export const AVATAR_MAX_BYTES = 1024 * 1024;

export const AVATAR_TYPES = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
} as const;

export type AvatarType = keyof typeof AVATAR_TYPES;

export const avatars = new Files({ adapter: neon({ bucket: "avatars" }) });

export const sounds = new Files({ adapter: neon({ bucket: "sounds" }) });

import { randomUUID } from "node:crypto";
import { HttpError, handleError, json } from "@/lib/server/http";
import { requirePlayer, setAvatarKey, toPublicPlayer } from "@/lib/server/players";
import { AVATAR_MAX_BYTES, AVATAR_TYPES, type AvatarType, avatars } from "@/lib/storage";

async function removeObject(key: string | null) {
  if (!key) {
    return;
  }
  await avatars.delete(key).catch((error: unknown) => console.error(error));
}

export async function POST(request: Request) {
  try {
    const player = await requirePlayer();
    const form = await request.formData().catch(() => null);
    const file = form?.get("file");

    if (!(file instanceof File)) {
      throw new HttpError(422, "missing_file", "Attach an image in the `file` field");
    }
    if (!(file.type in AVATAR_TYPES)) {
      throw new HttpError(415, "unsupported_type", "Use a PNG, JPEG, WebP or GIF image");
    }
    if (file.size > AVATAR_MAX_BYTES) {
      throw new HttpError(413, "file_too_large", "Avatars must be 1 MB or smaller");
    }

    const key = `${player.id}/${randomUUID()}.${AVATAR_TYPES[file.type as AvatarType]}`;
    await avatars.upload(key, new Uint8Array(await file.arrayBuffer()), {
      contentType: file.type,
    });

    const updated = await setAvatarKey(player, key);
    await removeObject(player.avatarKey);
    return json({ player: toPublicPlayer(updated) });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE() {
  try {
    const player = await requirePlayer();
    const updated = await setAvatarKey(player, null);
    await removeObject(player.avatarKey);
    return json({ player: toPublicPlayer(updated) });
  } catch (error) {
    return handleError(error);
  }
}

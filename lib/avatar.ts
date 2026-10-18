export interface AvatarSource {
  avatarKey: string | null;
  id: string;
  image: string | null;
}

export function avatarUrlFor(player: AvatarSource) {
  if (player.avatarKey) {
    const version = player.avatarKey.split("/").at(-1)?.split(".")[0] ?? "1";
    return `/api/avatars/${player.id}?v=${version}`;
  }
  return player.image ? `/api/avatars/${player.id}?v=oauth` : null;
}

import type { SoundPackId } from "@/lib/settings/options";

export const PACK_SAMPLES = ["down-1", "down-2", "down-3", "mod", "space", "enter", "up"] as const;
export const EFFECTS = ["faah"] as const;

export type PackSample = (typeof PACK_SAMPLES)[number];
export type Effect = (typeof EFFECTS)[number];
export type RemotePack = Exclude<SoundPackId, "synth">;

export const REMOTE_PACKS: readonly RemotePack[] = ["creamy", "clicky", "typewriter", "bubble"];

export const packKey = (pack: RemotePack, sample: PackSample) => `packs/${pack}/${sample}.wav`;
export const effectKey = (effect: Effect) => `effects/${effect}.wav`;

export const SOUND_KEYS: ReadonlySet<string> = new Set([
  ...REMOTE_PACKS.flatMap((pack) => PACK_SAMPLES.map((sample) => packKey(pack, sample))),
  ...EFFECTS.map(effectKey),
]);

export const soundUrl = (key: string) => `/api/sounds/${key}`;

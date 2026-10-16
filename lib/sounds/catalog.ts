import type { MistakeSoundId, SoundPackId } from "@/lib/settings/options";
import { MISTAKE_SOUNDS } from "@/lib/settings/options";

export const PACK_SAMPLES = ["down-1", "down-2", "down-3", "mod", "space", "enter", "up"] as const;

export type PackSample = (typeof PACK_SAMPLES)[number];
export type RemotePack = Exclude<SoundPackId, "synth">;

export const REMOTE_PACKS: readonly RemotePack[] = ["creamy", "clicky", "typewriter", "bubble"];

export const packKey = (pack: RemotePack, sample: PackSample) => `packs/${pack}/${sample}.wav`;
export const mistakeKey = (sound: MistakeSoundId) => `mistakes/${sound}.mp3`;

export const SOUND_KEYS: ReadonlySet<string> = new Set([
  ...REMOTE_PACKS.flatMap((pack) => PACK_SAMPLES.map((sample) => packKey(pack, sample))),
  ...MISTAKE_SOUNDS.map(mistakeKey),
]);

export const SOUND_CONTENT_TYPES: Record<string, string> = {
  wav: "audio/wav",
  mp3: "audio/mpeg",
};

export const soundUrl = (key: string) => `/api/sounds/${key}`;

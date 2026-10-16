import { config } from "dotenv";
import { MISTAKE_SOUNDS, type MistakeSoundId } from "../lib/settings/options";
import { mistakeKey } from "../lib/sounds/catalog";

config({ path: ".env.local", quiet: true });

const SOURCES: Record<MistakeSoundId, string> = {
  faaah: "https://www.myinstants.com/media/sounds/faaah.mp3",
  chalo: "https://www.myinstants.com/media/sounds/chalo.mp3",
  fart: "https://www.myinstants.com/media/sounds/dry-fart.mp3",
  punch: "https://www.myinstants.com/media/sounds/punch-gaming-sound-effect-hd_RzlG1GE.mp3",
  aayein: "https://www.myinstants.com/media/sounds/aayein-meme.mp3",
  rizz: "https://www.myinstants.com/media/sounds/rizz-sound-effect.mp3",
  "anime-ahh": "https://www.myinstants.com/media/sounds/anime-ahh.mp3",
  gunshot: "https://www.myinstants.com/media/sounds/gunshotjbudden.mp3",
};

const MAX_BYTES = 512 * 1024;

function isMp3(bytes: Uint8Array) {
  const id3 = bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33;
  const frame = bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0;
  return id3 || frame;
}

async function download(sound: MistakeSoundId) {
  const response = await fetch(SOURCES[sound], {
    headers: { "User-Agent": "Mozilla/5.0 (keyclash sound sync)" },
  });
  if (!response.ok) {
    throw new Error(`${sound}: HTTP ${response.status}`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length > MAX_BYTES || !isMp3(bytes)) {
    throw new Error(`${sound}: not a small mp3 (${bytes.length} bytes)`);
  }
  return bytes;
}

const { Files } = await import("files-sdk");
const { neon } = await import("files-sdk/neon");
const sounds = new Files({ adapter: neon({ bucket: "sounds" }) });

for (const sound of MISTAKE_SOUNDS) {
  const bytes = await download(sound);
  await sounds.upload(mistakeKey(sound), bytes, { contentType: "audio/mpeg" });
  console.log(`${mistakeKey(sound).padEnd(24)} ${(bytes.length / 1024).toFixed(1)} KB`);
}

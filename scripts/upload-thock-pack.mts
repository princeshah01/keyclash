/**
 * Build the `thock` keyboard pack from a source audio file and upload it.
 *
 *   npx tsx scripts/upload-thock-pack.mts [path-to-audio]
 *
 * Defaults to ~/Downloads/sound.ogg. Needs ffmpeg-static available.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { config } from "dotenv";
import { PACK_SAMPLES, packKey } from "../lib/sounds/catalog";

config({ path: ".env.local", quiet: true });

const source =
  process.argv[2] ??
  join(process.env.USERPROFILE ?? process.env.HOME ?? "", "Downloads", "sound.ogg");

const require = createRequire(import.meta.url);
const ffmpeg = require("ffmpeg-static") as string | null;
if (!ffmpeg) {
  throw new Error("ffmpeg-static is missing — run: npm install --no-save ffmpeg-static");
}

const work = join(tmpdir(), `keyclash-thock-${Date.now()}`);
mkdirSync(work, { recursive: true });

function run(args: string[]) {
  const result = spawnSync(ffmpeg!, args, { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(result.stderr || `ffmpeg failed: ${args.join(" ")}`);
  }
}

const base = join(work, "base.wav");
run([
  "-y",
  "-i",
  source,
  "-af",
  "silenceremove=start_periods=1:start_silence=0.01:start_threshold=-35dB:detection=peak,atrim=0:0.14,afade=t=out:st=0.09:d=0.05",
  "-ac",
  "1",
  "-ar",
  "44100",
  base,
]);

const variants: Record<(typeof PACK_SAMPLES)[number], string> = {
  "down-1": "asetrate=44100*0.97,aresample=44100",
  "down-2": "asetrate=44100*1.00,aresample=44100",
  "down-3": "asetrate=44100*1.03,aresample=44100",
  mod: "asetrate=44100*0.92,aresample=44100,volume=1.1",
  space: "asetrate=44100*0.85,aresample=44100,volume=1.15",
  enter: "asetrate=44100*0.8,aresample=44100,volume=1.2",
  up: "asetrate=44100*1.15,aresample=44100,volume=0.55,atrim=0:0.05",
};

const { Files } = await import("files-sdk");
const { neon } = await import("files-sdk/neon");
const sounds = new Files({ adapter: neon({ bucket: "sounds" }) });

for (const sample of PACK_SAMPLES) {
  const out = join(work, `${sample}.wav`);
  run(["-y", "-i", base, "-af", variants[sample], out]);
  const key = packKey("thock", sample);
  const bytes = readFileSync(out);
  await sounds.upload(key, new Uint8Array(bytes), { contentType: "audio/wav" });
  console.log(`${key.padEnd(28)} ${(bytes.length / 1024).toFixed(1)} KB`);
}

rmSync(work, { recursive: true, force: true });
console.log(`Uploaded thock pack from ${source}`);

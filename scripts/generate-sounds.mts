import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { config } from "dotenv";
import { PACK_SAMPLES, type PackSample, packKey, type RemotePack } from "../lib/sounds/catalog";

config({ path: ".env.local", quiet: true });

const RATE = 44_100;
type FilterType = "lowpass" | "highpass" | "bandpass";

function random(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function biquad(signal: Float32Array, type: FilterType, frequency: number, q: number) {
  const w = (2 * Math.PI * frequency) / RATE;
  const alpha = Math.sin(w) / (2 * q);
  const cos = Math.cos(w);
  let [b0, b1, b2] = [0, 0, 0];
  if (type === "lowpass") {
    [b0, b1, b2] = [(1 - cos) / 2, 1 - cos, (1 - cos) / 2];
  } else if (type === "highpass") {
    [b0, b1, b2] = [(1 + cos) / 2, -(1 + cos), (1 + cos) / 2];
  } else {
    [b0, b1, b2] = [alpha, 0, -alpha];
  }
  const [a0, a1, a2] = [1 + alpha, -2 * cos, 1 - alpha];
  const out = new Float32Array(signal.length);
  let [x1, x2, y1, y2] = [0, 0, 0, 0];
  for (let i = 0; i < signal.length; i++) {
    const x = signal[i];
    const y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    out[i] = y;
    [x2, x1, y2, y1] = [x1, x, y1, y];
  }
  return out;
}

class Track {
  readonly data: Float32Array;
  readonly rand: () => number;

  constructor(seconds: number, seed: number) {
    this.data = new Float32Array(Math.ceil(seconds * RATE));
    this.rand = random(seed);
  }

  jitter(value: number, amount: number) {
    return value * (1 + (this.rand() * 2 - 1) * amount);
  }

  tone(options: {
    amp: number;
    attack?: number;
    at?: number;
    decay: number;
    freq: number;
    glide?: number;
    to?: number;
  }) {
    const { amp, attack = 0.002, at = 0, decay, freq, glide = 0.05, to = freq } = options;
    const start = Math.floor(at * RATE);
    const length = Math.min(this.data.length - start, Math.ceil((attack + decay * 6) * RATE));
    let phase = 0;
    for (let i = 0; i < length; i++) {
      const t = i / RATE;
      const progress = Math.min(t / glide, 1);
      const current = freq * (to / freq) ** progress;
      phase += (2 * Math.PI * current) / RATE;
      const env = t < attack ? t / attack : Math.exp(-(t - attack) / decay);
      this.data[start + i] += Math.sin(phase) * env * amp;
    }
    return this;
  }

  noise(options: {
    amp: number;
    at?: number;
    decay: number;
    filter: FilterType;
    freq: number;
    q?: number;
  }) {
    const { amp, at = 0, decay, filter, freq, q = 0.8 } = options;
    const start = Math.floor(at * RATE);
    const length = Math.min(this.data.length - start, Math.ceil(decay * 7 * RATE));
    const raw = new Float32Array(length);
    for (let i = 0; i < length; i++) {
      raw[i] = this.rand() * 2 - 1;
    }
    const shaped = biquad(raw, filter, freq, q);
    for (let i = 0; i < length; i++) {
      const t = i / RATE;
      const env = t < 0.0015 ? t / 0.0015 : Math.exp(-(t - 0.0015) / decay);
      this.data[start + i] += shaped[i] * env * amp;
    }
    return this;
  }

  master(peak = 0.85) {
    let max = 0;
    for (const sample of this.data) {
      max = Math.max(max, Math.abs(sample));
    }
    const gain = max > 0 ? peak / max : 1;
    const fade = Math.floor(0.004 * RATE);
    for (let i = 0; i < this.data.length; i++) {
      const tail = Math.min(1, (this.data.length - 1 - i) / fade);
      this.data[i] = Math.tanh(this.data[i] * gain * 1.1) * tail;
    }
    return this.data;
  }
}

function creamy(sample: PackSample, seed: number) {
  const track = new Track(sample === "space" ? 0.32 : 0.22, seed);
  if (sample === "up") {
    return track
      .noise({
        amp: 0.35,
        decay: 0.012,
        filter: "bandpass",
        freq: track.jitter(1700, 0.08),
        q: 1.2,
      })
      .tone({ amp: 0.25, decay: 0.02, freq: 320, to: 260 })
      .master(0.45);
  }
  const base = { "down-1": 185, "down-2": 196, "down-3": 176, mod: 160, enter: 132, space: 108 }[
    sample
  ];
  const pitch = track.jitter(base, 0.04);
  track
    .tone({ amp: 1, decay: sample === "space" ? 0.06 : 0.035, freq: pitch, to: pitch * 0.55 })
    .noise({ amp: 0.7, decay: 0.03, filter: "lowpass", freq: 950, q: 0.7 })
    .noise({ amp: 0.28, decay: 0.008, filter: "bandpass", freq: track.jitter(2600, 0.1), q: 1 });
  if (sample === "space") {
    track.noise({ amp: 0.22, at: 0.028, decay: 0.02, filter: "bandpass", freq: 620, q: 2 });
  }
  return track.master();
}

function clicky(sample: PackSample, seed: number) {
  const track = new Track(0.2, seed);
  const click = (at: number, amp: number) =>
    track.noise({
      amp,
      at,
      decay: 0.0035,
      filter: "highpass",
      freq: track.jitter(3600, 0.1),
      q: 0.9,
    });
  if (sample === "up") {
    click(0, 0.7);
    click(0.006, 0.35);
    return track.master(0.5);
  }
  click(0, 1);
  click(track.jitter(0.011, 0.15), 0.75);
  const base = { "down-1": 280, "down-2": 300, "down-3": 265, mod: 240, enter: 210, space: 170 }[
    sample
  ];
  track
    .tone({ amp: 0.45, decay: 0.022, freq: track.jitter(base, 0.04), to: base * 0.7 })
    .tone({ amp: 0.08, decay: 0.012, freq: track.jitter(3300, 0.05) });
  return track.master();
}

function typewriter(sample: PackSample, seed: number) {
  const track = new Track(sample === "enter" ? 1.1 : 0.3, seed);
  if (sample === "up") {
    return track
      .noise({ amp: 0.4, decay: 0.006, filter: "bandpass", freq: 2800, q: 1.5 })
      .master(0.35);
  }
  const strike = () => {
    for (const [ratio, decay] of [
      [1, 0.05],
      [1.59, 0.04],
      [2.46, 0.03],
      [3.52, 0.02],
    ]) {
      track.tone({ amp: 0.22, decay, freq: track.jitter(860 * ratio, 0.03) });
    }
    track
      .noise({ amp: 0.9, decay: 0.012, filter: "bandpass", freq: track.jitter(1500, 0.1), q: 1.1 })
      .tone({ amp: 0.6, decay: 0.03, freq: 125, to: 80 });
  };
  strike();
  if (sample === "space") {
    for (let i = 1; i <= 4; i++) {
      track.noise({ amp: 0.35 / i, at: 0.03 * i, decay: 0.004, filter: "highpass", freq: 2400 });
    }
  }
  if (sample === "enter") {
    track
      .tone({ amp: 0.5, at: 0.06, attack: 0.001, decay: 0.22, freq: 2093 })
      .tone({ amp: 0.22, at: 0.06, attack: 0.001, decay: 0.14, freq: 2093 * 2.76 })
      .tone({ amp: 0.1, at: 0.06, attack: 0.001, decay: 0.09, freq: 2093 * 5.4 });
  }
  return track.master();
}

function bubble(sample: PackSample, seed: number) {
  const track = new Track(0.2, seed);
  if (sample === "up") {
    return track.tone({ amp: 0.35, decay: 0.012, freq: 880, glide: 0.02, to: 1300 }).master(0.4);
  }
  const base = { "down-1": 420, "down-2": 470, "down-3": 390, mod: 340, enter: 300, space: 240 }[
    sample
  ];
  const pitch = track.jitter(base, 0.05);
  track
    .tone({ amp: 1, attack: 0.003, decay: 0.022, freq: pitch, glide: 0.035, to: pitch * 2.1 })
    .noise({ amp: 0.08, decay: 0.006, filter: "bandpass", freq: 2000, q: 1 });
  if (sample === "enter") {
    track.tone({
      amp: 0.8,
      at: 0.045,
      attack: 0.003,
      decay: 0.03,
      freq: pitch * 1.5,
      glide: 0.035,
      to: pitch * 3,
    });
  }
  return track.master();
}

/** Packs synthesized here. Custom packs (e.g. `thock`) are uploaded from source audio. */
const RENDERERS: Partial<Record<RemotePack, (sample: PackSample, seed: number) => Float32Array>> = {
  creamy,
  clicky,
  typewriter,
  bubble,
};

function toWav(samples: Float32Array) {
  const buffer = Buffer.alloc(44 + samples.length * 2);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + samples.length * 2, 4);
  buffer.write("WAVEfmt ", 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(RATE, 24);
  buffer.writeUInt32LE(RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) {
    buffer.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * 32_767), 44 + i * 2);
  }
  return buffer;
}

async function main() {
  const outDir = process.argv.find((arg) => arg.startsWith("--out="))?.slice(6);
  const upload = process.argv.includes("--upload");
  const files: [string, Buffer][] = [];

  (Object.keys(RENDERERS) as RemotePack[]).forEach((pack, packIndex) => {
    const render = RENDERERS[pack];
    if (!render) {
      return;
    }
    PACK_SAMPLES.forEach((sample, sampleIndex) => {
      files.push([packKey(pack, sample), toWav(render(sample, packIndex * 100 + sampleIndex + 1))]);
    });
  });

  if (outDir) {
    for (const [key, data] of files) {
      const path = join(outDir, key);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, data);
    }
  }

  if (upload) {
    const { Files } = await import("files-sdk");
    const { neon } = await import("files-sdk/neon");
    const sounds = new Files({ adapter: neon({ bucket: "sounds" }) });
    for (const [key, data] of files) {
      await sounds.upload(key, new Uint8Array(data), { contentType: "audio/wav" });
    }
  }

  const total = files.reduce((sum, [, data]) => sum + data.length, 0);
  console.log(
    `${files.length} sounds · ${(total / 1024).toFixed(1)} KB${outDir ? ` · written to ${outDir}` : ""}${upload ? " · uploaded to the sounds bucket" : ""}`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

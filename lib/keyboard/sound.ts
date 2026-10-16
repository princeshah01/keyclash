import type { MistakeSoundId, SoundPackId } from "@/lib/settings/options";
import {
  mistakeKey,
  PACK_SAMPLES,
  type PackSample,
  packKey,
  type RemotePack,
  soundUrl,
} from "@/lib/sounds/catalog";
import type { SoundProfile } from "./layout";

interface Voice {
  click: number;
  clickGain: number;
  thock: number;
  thockGain: number;
}

const VOICES: Record<SoundProfile, Voice> = {
  alpha: { thock: 210, thockGain: 0.5, click: 3400, clickGain: 0.32 },
  mod: { thock: 175, thockGain: 0.55, click: 2700, clickGain: 0.28 },
  enter: { thock: 140, thockGain: 0.65, click: 2300, clickGain: 0.3 },
  space: { thock: 105, thockGain: 0.75, click: 1700, clickGain: 0.26 },
};

const ALPHA_SAMPLES = ["down-1", "down-2", "down-3"] as const;

let context: AudioContext | null = null;
let noise: AudioBuffer | null = null;
let decoder: OfflineAudioContext | null = null;
const buffers = new Map<string, Promise<AudioBuffer | null>>();
const decoded = new Map<string, AudioBuffer>();
let mistakeSource: AudioBufferSourceNode | null = null;

function jitter(value: number, amount: number) {
  return value * (1 + (Math.random() * 2 - 1) * amount);
}

function ensureContext() {
  if (typeof window === "undefined") {
    return null;
  }
  if (!context) {
    context = new AudioContext({ latencyHint: "interactive" });
    noise = context.createBuffer(1, Math.floor(context.sampleRate * 0.25), context.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }
  if (context.state === "suspended") {
    void context.resume();
  }
  return context;
}

function loadBuffer(key: string) {
  const existing = buffers.get(key);
  if (existing) {
    return existing;
  }
  decoder ??= new OfflineAudioContext(1, 1, 44_100);
  const pending = fetch(soundUrl(key))
    .then((response) => (response.ok ? response.arrayBuffer() : Promise.reject(response.status)))
    .then((bytes) => decoder?.decodeAudioData(bytes) ?? null)
    .then((buffer) => {
      if (buffer) {
        decoded.set(key, buffer);
      }
      return buffer;
    })
    .catch(() => {
      buffers.delete(key);
      return null;
    });
  buffers.set(key, pending);
  return pending;
}

export function preloadPack(pack: SoundPackId) {
  if (pack === "synth") {
    return Promise.resolve();
  }
  return Promise.all(PACK_SAMPLES.map((sample) => loadBuffer(packKey(pack, sample)))).then(
    () => undefined,
  );
}

export function preloadMistake(sound: MistakeSoundId) {
  return loadBuffer(mistakeKey(sound)).then(() => undefined);
}

function envelope(ctx: AudioContext, peak: number, attack: number, decay: number) {
  const gain = ctx.createGain();
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), now + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + attack + decay);
  return gain;
}

function noiseBurst(
  ctx: AudioContext,
  output: AudioNode,
  filter: BiquadFilterType,
  frequency: number,
  q: number,
  peak: number,
  decay: number,
) {
  if (!noise) {
    return;
  }
  const source = ctx.createBufferSource();
  source.buffer = noise;
  source.playbackRate.value = jitter(1, 0.15);
  const band = ctx.createBiquadFilter();
  band.type = filter;
  band.frequency.value = frequency;
  band.Q.value = q;
  const gain = envelope(ctx, peak, 0.002, decay);
  source.connect(band).connect(gain).connect(output);
  source.start(ctx.currentTime, Math.random() * 0.1);
  source.stop(ctx.currentTime + decay + 0.05);
}

function playSynth(
  ctx: AudioContext,
  output: AudioNode,
  profile: SoundProfile,
  phase: "down" | "up",
) {
  const voice = VOICES[profile];
  if (phase === "up") {
    noiseBurst(
      ctx,
      output,
      "bandpass",
      jitter(voice.click * 0.8, 0.12),
      1.4,
      voice.clickGain * 0.4,
      0.03,
    );
    return;
  }
  const now = ctx.currentTime;
  const body = ctx.createOscillator();
  body.type = "sine";
  const pitch = jitter(voice.thock, 0.06);
  body.frequency.setValueAtTime(pitch, now);
  body.frequency.exponentialRampToValueAtTime(pitch * 0.55, now + 0.07);
  const bodyGain = envelope(ctx, jitter(voice.thockGain, 0.1), 0.003, 0.09);
  body.connect(bodyGain).connect(output);
  body.start(now);
  body.stop(now + 0.15);
  noiseBurst(
    ctx,
    output,
    "bandpass",
    jitter(voice.click, 0.12),
    1.1,
    jitter(voice.clickGain, 0.15),
    0.028,
  );
  noiseBurst(ctx, output, "lowpass", jitter(900, 0.1), 0.7, voice.thockGain * 0.35, 0.06);
}

function sampleFor(profile: SoundProfile, phase: "down" | "up"): PackSample {
  if (phase === "up") {
    return "up";
  }
  if (profile === "alpha") {
    return ALPHA_SAMPLES[Math.floor(Math.random() * ALPHA_SAMPLES.length)];
  }
  return profile;
}

function playBuffer(ctx: AudioContext, output: AudioNode, buffer: AudioBuffer, rate: number) {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = rate;
  source.connect(output);
  source.start();
  return source;
}

function masterGain(ctx: AudioContext, volume: number) {
  const gain = ctx.createGain();
  gain.gain.value = volume;
  gain.connect(ctx.destination);
  return gain;
}

export function playKeySound(
  pack: SoundPackId,
  profile: SoundProfile,
  phase: "down" | "up",
  volume: number,
) {
  const ctx = ensureContext();
  if (!ctx || volume <= 0) {
    return;
  }
  const output = masterGain(ctx, volume);
  if (pack !== "synth") {
    const key = packKey(pack as RemotePack, sampleFor(profile, phase));
    const buffer = decoded.get(key);
    if (buffer) {
      playBuffer(ctx, output, buffer, jitter(1, 0.03));
      return;
    }
    void loadBuffer(key);
  }
  playSynth(ctx, output, profile, phase);
}

export function playMistake(sound: MistakeSoundId, volume: number) {
  const ctx = ensureContext();
  const buffer = decoded.get(mistakeKey(sound));
  if (!ctx || volume <= 0) {
    return;
  }
  if (!buffer) {
    void loadBuffer(mistakeKey(sound));
    return;
  }
  mistakeSource?.stop();
  mistakeSource = playBuffer(ctx, masterGain(ctx, volume), buffer, 1);
}

export function previewMistake(sound: MistakeSoundId, volume: number) {
  void preloadMistake(sound).then(() => playMistake(sound, volume));
}

export function previewPack(pack: SoundPackId, volume: number) {
  void preloadPack(pack).then(() => {
    const sequence: [SoundProfile, number][] = [
      ["alpha", 0],
      ["alpha", 110],
      ["alpha", 200],
      ["space", 330],
      ["alpha", 460],
      ["enter", 600],
    ];
    for (const [profile, delay] of sequence) {
      setTimeout(() => playKeySound(pack, profile, "down", volume), delay);
      setTimeout(() => playKeySound(pack, profile, "up", volume), delay + 70);
    }
  });
}

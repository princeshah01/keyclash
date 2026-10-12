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

let context: AudioContext | null = null;
let noise: AudioBuffer | null = null;

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

export function playKeySound(profile: SoundProfile, phase: "down" | "up", volume: number) {
  const ctx = ensureContext();
  if (!ctx || volume <= 0) {
    return;
  }
  const voice = VOICES[profile];
  const master = ctx.createGain();
  master.gain.value = volume;
  master.connect(ctx.destination);

  if (phase === "up") {
    noiseBurst(
      ctx,
      master,
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
  body.connect(bodyGain).connect(master);
  body.start(now);
  body.stop(now + 0.15);

  noiseBurst(
    ctx,
    master,
    "bandpass",
    jitter(voice.click, 0.12),
    1.1,
    jitter(voice.clickGain, 0.15),
    0.028,
  );
  noiseBurst(ctx, master, "lowpass", jitter(900, 0.1), 0.7, voice.thockGain * 0.35, 0.06);
}

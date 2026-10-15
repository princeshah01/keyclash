# Sounds (packs, faah, object storage)

## Pipeline

```
scripts/generate-sounds.mts  ──render WAVs──►  Neon bucket "sounds" (neon.ts)
                                                  │  packs/<pack>/<sample>.wav
                                                  │  effects/faah.wav
                                                  ▼
                           GET /api/sounds/[...path]  (allowlisted, cached)
                                                  │
                                                  ▼
            lib/keyboard/sound.ts  fetch → OfflineAudioContext.decodeAudioData → cache
                                                  │
                                                  ▼
              playKeySound(pack, profile, phase, volume) / playEffect("faah", volume)
```

- `lib/sounds/catalog.ts` is the single list of pack samples (`down-1..3`, `mod`, `space`, `enter`, `up`), effects, and object keys. The API route only serves keys in `SOUND_KEYS`.
- Files are same-origin through the route, so the browser can decode them without bucket CORS. Responses are cached (`s-maxage=31536000`).
- `synth` is not a file pack. It is generated live with Web Audio and is also the fallback while a pack's samples are still loading.
- Decoding uses `OfflineAudioContext`, so preloading never creates a real `AudioContext` before a user gesture.

## Profiles

Each key in `lib/keyboard/layout.ts` has a `sound` profile: `alpha`, `mod`, `space`, `enter`. Letter keys pick a random `down-1..3` sample with ±3% playback-rate jitter so fast typing doesn't sound robotic. Key-up plays `up`.

## Add a sound pack

1. `lib/settings/options.ts` — add the id to `SOUND_PACKS` and an entry in `SOUND_PACK_OPTIONS` (`remote: true`).
2. `lib/sounds/catalog.ts` — add it to `REMOTE_PACKS`.
3. `scripts/generate-sounds.mts` — add a renderer `(sample, seed) => Float32Array` to `RENDERERS`, built from `Track.tone` / `Track.noise`.
4. Upload: `npm run sounds:upload` (reads `.env.local`, writes to the `sounds` bucket).
5. Optional local listen: `npx tsx scripts/generate-sounds.mts --out=./tmp-sounds`.

The picker, preloading and preview pick it up automatically.

## Add an effect

Add the id to `EFFECTS` and a renderer to `EFFECT_RENDERERS`, upload, then call `playEffect(id, volume)`. Gate it on `preferences.soundEnabled` and its own preference, the way faah mode is gated in `components/typing/typing-test.tsx` (mistakes come from the `onMistake` callback of `useTypingTest`).

## Infra

The bucket is declared in `neon.ts` (`buckets.sounds`, private). After changing `neon.ts`, run `neon config plan` then `neon deploy`. Deploy also re-pulls env into `.env.local`.

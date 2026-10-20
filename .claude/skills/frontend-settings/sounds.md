# Sounds (packs, mistake sounds, object storage)

## Pipeline

```
scripts/generate-sounds.mts        ──render WAVs──┐
scripts/upload-mistake-sounds.mts  ──fetch MP3s──┴──►  Neon bucket "sounds" (neon.ts)
                                                  │  packs/<pack>/<sample>.wav
                                                  │  mistakes/<id>.mp3
                                                  ▼
                           GET /api/sounds/[...path]  (allowlisted, cached)
                                                  │
                                                  ▼
            lib/keyboard/sound.ts  fetch → OfflineAudioContext.decodeAudioData → cache
                                                  │
                                                  ▼
              playKeySound(pack, profile, phase, volume) / playMistake(id, volume)
```

- `lib/sounds/catalog.ts` is the single list of pack samples (`down-1..3`, `mod`, `space`, `enter`, `up`), mistake sound keys, and content types. The API route only serves keys in `SOUND_KEYS`.
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

### Custom sample pack (`thock`)

`thock` is built from a source audio file (trimmed to a short key hit) rather than synthesized:

```bash
npm install --no-save ffmpeg-static   # once, for conversion
npm run sounds:thock -- path/to/sound.ogg
```

## Mistake sounds (faah mode)

Faah mode plays `preferences.mistakeSound` on every wrong key (default `faaah`). The clips are short meme MP3s from myinstants.com. They are **not** committed to git: `scripts/upload-mistake-sounds.mts` lists each source URL, downloads it, checks it is a small MP3, and uploads it to `mistakes/<id>.mp3`.

```bash
npm run sounds:mistakes
```

Add a clip:

1. `lib/settings/options.ts` — add the id to `MISTAKE_SOUNDS` and a label to `MISTAKE_SOUND_OPTIONS`.
2. `scripts/upload-mistake-sounds.mts` — add its direct `.mp3` URL to `SOURCES`.
3. `npm run sounds:mistakes`.

The picker (`components/settings/mistake-sound-list.tsx`) and the typing test pick it up automatically. Mistakes come from the `onMistake` callback of `useTypingTest`; `components/typing/typing-test.tsx` gates playback on `soundEnabled && faahMode` and preloads the selected clip.

These clips are third-party uploads with unknown licensing. Before a public launch, replace them with clips you have rights to (same ids, same script).

## Infra

The bucket is declared in `neon.ts` (`buckets.sounds`, private). After changing `neon.ts`, run `neon config plan` then `neon deploy`. Deploy also re-pulls env into `.env.local`.

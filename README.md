# keyclash

A fast, minimal typing test with guest profiles, Google sign-in and a global leaderboard.

## Features

- **Test modes**: time (15/30/60/120s), words (10/25/50/100), quote (short/medium/long), zen
- **Modifiers**: punctuation, numbers, easy/hard word pools
- **Results**: WPM, raw, accuracy, consistency, per-second chart, personal bests
- **Guest profiles**: every new visitor gets a guest player stored in an httpOnly cookie, with an editable name
- **Google sign-in**: guest history is claimed by (or merged into) the account
- **Leaderboard**: best run per player for time and words, all-time / weekly / daily — updates live via Neon Realtime
- **Rooms**: private leaderboards with invite links (`/r/<code>`), a Rooms tab with every room you're in, and a live room panel while you type
- **Profile**: avatar upload, overview stats, personal bests, recent tests
- **Cookie banner**: essential-only or accept all (remembers settings in this browser)
- **Settings** (Ctrl/⌘+K): light/dark/system, 7 themes, 9 app fonts, audio, volume, sound packs, faah mode with 8 mistake sounds, show keyboard, live stats — saved locally for guests and in Postgres for signed-in players
- **Mechanical keyboard**: 75% board with an LCD and a pixel cat, themed by your accent, with synthesized or streamed key sounds
- **Anti-cheat**: client and server validation for impossible speeds, bursts, flat pacing and idle runs

## Stack

| Layer | Tech |
| --- | --- |
| App | Next.js 16 (App Router, Cache Components), React 19, TypeScript |
| UI | Tailwind CSS v4, Motion, Phosphor icons, Web Audio |
| Database | Neon Postgres via `pg` + Drizzle ORM |
| Live data | Neon Realtime (`@neon/realtime`, `@neon/realtime-react`) |
| Auth | Neon Auth (managed Better Auth) with Google OAuth |
| Storage | Neon Object Storage (avatars, sound packs) via `files-sdk` |
| Tooling | Biome, drizzle-kit, Neon CLI |

## Getting started

```bash
npm install
npm i -g neon@latest
neon login
neon deploy
```

`neon deploy` provisions the services declared in `neon.ts` and writes `DATABASE_URL`, `NEON_AUTH_BASE_URL`, and the `AWS_*` storage credentials to `.env.local`. Then add a cookie secret:

```bash
echo "NEON_AUTH_COOKIE_SECRET=$(openssl rand -base64 32)" >> .env.local
```

Run the migrations, upload the sound packs and start the dev server:

```bash
npm run db:migrate
npm run sounds:upload
npm run sounds:mistakes
npm run dev
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Lint and format check with Biome |
| `npm run lint:fix` | Apply Biome fixes |
| `npm run typecheck` | TypeScript check |
| `npm run db:generate` | Generate a migration from `lib/db/schema.ts` |
| `npm run db:migrate` | Apply migrations (uses the unpooled URL) |
| `npm run neon:deploy` | Apply `neon.ts` to the linked branch |
| `npm run sounds:upload` | Render the sound packs and upload them to the `sounds` bucket |
| `npm run sounds:mistakes` | Download the mistake sound clips and upload them to the `sounds` bucket |

## API

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/me` | Resolve or create the current player, link Google sessions |
| `PATCH` | `/api/me` | Rename the player |
| `PUT` | `/api/me/preferences` | Save settings to the signed-in player |
| `GET` | `/api/me/stats` | Totals, personal bests and recent tests |
| `POST` `DELETE` | `/api/me/avatar` | Upload or remove an avatar |
| `GET` | `/api/avatars/:playerId` | Redirect to the avatar image |
| `POST` | `/api/results` | Submit a validated test result |
| `GET` | `/api/leaderboard?mode=&detail=&range=` | Ranked best runs plus your own rank |
| `POST` | `/api/leaderboard/live` | Seal the live global board query |
| `GET` `POST` | `/api/rooms` | List your rooms / create one |
| `GET` | `/api/rooms/:code` | Room preview for an invite link |
| `POST` `DELETE` | `/api/rooms/:code/members` | Join / leave a room |
| `DELETE` | `/api/rooms/memberships` | Leave every room |
| `POST` | `/api/rooms/:code/live` | Seal the live room board query (members only) |
| `POST` | `/api/consent` | Store the cookie consent choice |
| `GET` | `/api/sounds/*` | Stream a sound pack sample or mistake sound from storage |
| `*` | `/api/auth/*` | Neon Auth proxy |

## Production checklist

- Add your own Google OAuth credentials (the shared Neon keys are for development):
  `neon neon-auth oauth-provider update`
- Trust your production origin: `neon neon-auth domain add https://your-domain.com`
- Add the same origin to `preview.realtime.allowedOrigins` in `neon.ts`, then `neon deploy --update-existing`
- Set `NEXT_PUBLIC_NEON_REALTIME_URL` (same value as `NEON_REALTIME_URL`) in your host's environment
- Set `NEON_AUTH_COOKIE_SECRET` and the Neon variables in your host's environment
- `NEXT_PUBLIC_SITE_URL` defaults to `https://keyclash.princeshah.me` (canonical URLs, sitemap, `robots.txt`, OG images); submit `/sitemap.xml` in Google Search Console

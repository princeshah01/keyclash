---
name: rooms-realtime
description: How keyclash's multiplayer rooms and live leaderboards work - rooms and room_members tables, invite links at /r/<code>, Neon Realtime live queries sealed on the server, useSealedQuery and LiveQuery on the client, the Rooms tab, and the in-game RoomPanel. Use when changing rooms, invites, membership, live leaderboards, the room panel, or anything that uses @neon/realtime.
---

# Rooms + live leaderboards

Rooms are private leaderboards. Anyone can create one, share `/r/<code>`, and every member's **best** run per test (time 15–120, words 10–100) is ranked live. A worse run never replaces a better one.

## Map

| Piece | File |
|---|---|
| Tables | `lib/db/schema.ts` → `rooms` (code, name, owner_id), `room_members` (PK `room_id, player_id`) |
| Room service | `lib/server/rooms.ts` → create / join / leave / leaveAll / list / requireMembership, caps (50 rooms per player, 100 members per room) |
| Live queries | `lib/server/live.ts` → `realtime`, `globalBoardQuery`, `roomBoardQuery`, `rangeStart` |
| Seal endpoints | `app/api/leaderboard/live`, `app/api/rooms/[code]/live`, `app/api/thocks/live` (site-wide thock total for the header `ThockBadge`) |
| Room API | `app/api/rooms` (GET list, POST create), `[code]` (GET preview), `[code]/members` (POST join, DELETE leave), `memberships` (DELETE leave all) |
| Client plumbing | `components/realtime/realtime-root.tsx`, `components/realtime/live-query.tsx`, `lib/client/live.ts`, `lib/client/live-session.ts` (warm session cache) |
| State | `components/rooms/rooms-provider.tsx` → rooms, active room, panel hidden |
| UI | `components/leaderboard/*` (Global/Rooms tabs), `components/rooms/*` (rooms view, board, panel, invite page) |

## Rules for live queries

1. **Seal on the server only.** `NEON_REALTIME_SECRET` never reaches the browser; only `NEXT_PUBLIC_NEON_REALTIME_URL` does.
2. **Authorize inside the SQL.** `roomBoardQuery` returns rows only while the viewer is in `room_members`, so leaving revokes live access instantly. The seal endpoint also calls `requireMembership`.
3. **Deterministic only.** No `now()` / `gen_random_uuid()` in live SQL. Pass times as `pgParam.timestamptz(...)`. Weekly/daily cutoffs come from `rangeStart()`, which rounds to UTC days so renewals (every ~50 s) seal the **same** query.
4. **Same query on renewal.** The warm session entry posts the same body for `refreshQuery`. If a subscription errors, `LiveQuery` retries a fresh seal.
5. **Stable row keys.** Rows are keyed by `player_id`.
6. **Validate with the CLI** before wiring a new query: `neon realtime subscribe "SELECT ..." --output json > out.txt` (write to a file; piping buffers).

`int8`/`numeric` arrive as strings, so cast counts and ranks to `::int` in SQL.

## Client

- `RealtimeRoot` creates one client in the browser only (`createRealtimeClient` uses `Math.random`, which Cache Components rejects during prerender).
- Render live data with `<LiveQuery endpoint body>{({ rows, status, error }) => ...}</LiveQuery>`. Boards show top 10 + your rank; caption via `BoardScope` (`top 10 players · worldwide` or `· in {room}`), right-aligned — no live/connecting badge.
- **Warm for the page session.** `LiveQuery` uses `getWarmLiveEntry` so the first open seals + subscribes; unmount (Global↔Rooms tab, leaving `/leaderboard`, hiding the home room panel) only detaches React listeners. The wire subscription and capability renewals (~10s before expiry) keep running in the background. A full page refresh clears the module cache; the next mount seals again. Applies to global board, room boards, and the home `RoomPanel` gadget (all share `LiveQuery` / `RoomBoard`).
- `rankRoomRows` ranks members client-side (ties share a rank) and lists members with no score as "waiting".

## Room panel

`RoomPanel` lives inside `TypingTest` (same position in both the test and results branches, so the subscription survives). It follows the current test; quote/zen fall back to time 30. Exit clears the active room, leave/leave all remove membership, hide collapses to a tab. The panel is fixed overlay — it must not pad or shift `main`.

## Guests and sign-in

Guests can create and join rooms. When a guest merges into an existing account, `mergeGuestInto` moves memberships and room ownership to the account.

## Infra

`neon.ts` → `preview.realtime.allowedOrigins`. Add the production origin there before deploying, then `neon deploy --update-existing` (it only changes the listed origins).

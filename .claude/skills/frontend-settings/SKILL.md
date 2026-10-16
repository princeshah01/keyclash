---
name: frontend-settings
description: How keyclash's settings drawer is structured - SettingsButton entry with Ctrl/⌘+K, SettingsPanel sections and subpages, the SettingsProvider that applies appearance and persists preferences (localStorage for guests, Neon Postgres for signed-in players), multi-theme CSS via data-accent, the app-wide font via data-font, sound packs in Neon Object Storage, and how to add a new setting, theme, font or sound pack. Use when changing the header Audio/Settings buttons, the settings panel, appearance, themes, accents, fonts, sounds, faah mode, show keyboard, live stats, or anything under components/settings or lib/settings.
---

# Frontend settings (keyclash)

All settings UI lives in `components/settings`. Do not build a second settings surface; extend this one.

## Map

| Piece | File | Job |
|---|---|---|
| Header entry + shortcut | `components/settings/settings-button.tsx` | Gear + "Settings" + kbd hint; owns open state; toggles on Ctrl/⌘+K |
| Header audio | `components/settings/audio-button.tsx` | Icon + "Audio" label; master sound switch (`soundEnabled`) |
| Drawer | `components/settings/settings-panel.tsx` | `Section` / `Row` / `SubpageRow`, subpage stack, Escape, footer |
| Provider | `components/settings/settings-provider.tsx` | `useSettings()` → `{ preferences, update, storage, syncError }` |
| Options + schema | `lib/settings/options.ts` | Ids, labels, swatches, `preferencesSchema` (zod), defaults, `parsePreferences` |
| DOM + storage | `lib/settings/apply.ts` | `applyMode` / `applyAccent` / `applyFont`, local load/save, `BOOT_SCRIPT` |
| Pickers | `theme-grid.tsx`, `font-list.tsx`, `sound-pack-list.tsx` | Presentational: `active` + `onSelect` |
| Controls | `controls.tsx` | `Switch`, `ModeSwitcher`, `VolumeSlider` |
| Server | `app/api/me/preferences/route.ts`, `lib/server/players.ts` (`savePreferences`) | `PUT` full preferences for signed-in players |

Provider order (`components/providers.tsx`): `ConsentProvider > PlayerProvider > SettingsProvider > ChromeProvider`. Settings needs both consent and the player.

## One preferences object

```ts
interface Preferences {
  mode: "light" | "dark" | "system";
  accent: Accent;          // theme
  font: FontId;            // font for the whole app
  soundEnabled: boolean;   // master audio (header Audio button)
  soundPack: SoundPackId;  // "synth" | remote packs
  volume: number;          // 0..1
  faahMode: boolean;       // faah on mistakes, only when soundEnabled
  showKeyboard: boolean;
  liveStats: boolean;      // wpm + accuracy while typing
}
```

`preferencesSchema` in `lib/settings/options.ts` is the single source of truth. The client and `PUT /api/me/preferences` both validate with it. `parsePreferences` keeps every valid field and falls back per field, so a bad value never wipes the rest.

## Where preferences are saved

| Who | Where | Rule |
|---|---|---|
| Guest, consent `all` | `localStorage["kc-settings"]` | Written on every change |
| Guest, consent `essential` / unanswered | Memory only | Cleared from storage on `essential` |
| Signed-in player | `players.preferences` (jsonb) in Neon Postgres | Debounced `PUT` (500 ms) after `update()` |

Sync rules in `SettingsProvider`:

- When a signed-in player loads: adopt `player.preferences` if present, otherwise push the current (guest) preferences so they carry over on first sign-in.
- Sync runs once per player id (`syncedPlayerRef`), so `replace(player)` after a save does not loop.
- The footer shows the mode: "Synced to your account" / "Saved in this browser" / "Not saved".

Never call `fetch` for appearance from components. Always go through `update()`.

## First paint (no theme flash)

`app/layout.tsx` renders `<Script strategy="beforeInteractive">{BOOT_SCRIPT}</Script>`. The script reads `kc-settings` and sets `class="dark"`, `data-accent` and `data-font` on `<html>` before hydration. It is generated from the same id lists in `options.ts`, so new ids are picked up automatically. `<html>` keeps `suppressHydrationWarning`.

## How to write code

### Add an inline setting (switch, slider)

1. Add the field to `preferencesSchema` and `DEFAULT_PREFERENCES` in `lib/settings/options.ts`.
2. Add a `Row` in `MainPage` (`settings-panel.tsx`):

```tsx
<Row label="Smooth caret" hint="Animate the caret between letters">
  <Switch
    checked={preferences.smoothCaret}
    label="Smooth caret"
    onChange={(smoothCaret) => update({ smoothCaret })}
  />
</Row>
```

3. Read it where it matters with `const { preferences } = useSettings()`.

No migration is needed. `players.preferences` is jsonb, and `parsePreferences` fills defaults for stored rows that predate the field.

### Add a subpage picker

1. Add a `Page` id and title in `settings-panel.tsx` (`TITLES`).
2. Build a presentational list taking `active` + `onSelect`.
3. Render it from `SubPage`, and add a `SubpageRow` with a short preview in `MainPage`.

Subpage titles match the row label. Back and Escape return to the main page; Escape on the main page closes.

## Themes

Themes are named accents on `<html data-accent>`; light/dark is `class="dark"`. Full recipe: [themes.md](themes.md).

## Sounds

Keyboard sound packs and the faah effect are WAVs in the Neon `sounds` bucket, rendered by `scripts/generate-sounds.mts`. Full recipe: [sounds.md](sounds.md).

## Rules of thumb

- Shortcut handling stays in `SettingsButton`, not the panel.
- Pickers stay presentational; persistence stays in the provider.
- The panel is `role="dialog"`. The typing test skips refocusing its hidden input while any dialog is open, so keep that role.
- Use tokens (`bg-primary`, `text-muted`, `var(--primary)`), never hard-coded theme colors in components.
- `soundEnabled` is the master switch. Faah and keyboard sounds both check it.

## Checklist

1. Field in `preferencesSchema` + `DEFAULT_PREFERENCES`.
2. `Row` or `SubpageRow` in `settings-panel.tsx`.
3. Consumer reads `useSettings().preferences`.
4. If it changes the DOM before paint (like mode/accent/font), extend `apply.ts` and `BOOT_SCRIPT`.
5. `npm run lint && npm run typecheck && npm run build`.

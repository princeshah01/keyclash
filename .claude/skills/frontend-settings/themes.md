# Themes (accents + keyboard colors)

## Mental model

```
THEME_OPTIONS (lib/settings/options.ts)
        │
        ▼
ThemeGrid onSelect(id) ──► update({ accent }) ──► localStorage / Neon (see SKILL.md)
                                  │
                                  ▼
                 <html data-accent="mint" class="dark?">
                                  │
                                  ▼
       :root[data-accent="mint"] { --primary, --sw-*, --ink-* }   (app/globals.css)
  :root.dark[data-accent="mint"] { --primary }
                                  │
                                  ▼
        Tailwind tokens + .kb keyboard + LCD read the variables
```

- **Accent** = which palette (`keyclash`, `classic`, `mint`, `royal`, `dolch`, `sand`, `scarlet`). Default `keyclash`.
- **Mode** = light / dark / system, applied as `.dark`. Every accent works in both.

## Channels each accent sets

| Variable | Used for |
|---|---|
| `--primary` | Buttons, caret, active pills, links, LCD screen (light and dark values) |
| `--sw-light` | Letter keys (alpha) and the first picker swatch |
| `--sw-dark` | Modifier keys (tab, shift, F5–F8, arrows) and the second swatch |
| `--sw-accent` | Esc / Enter keys and the third swatch |
| `--ink-light` / `--ink-dark` / `--ink-accent` | Legend color on each key group |

Derived automatically — do not set per theme:

- `--primary-soft` and `--page` (page tint) come from `--primary` via `color-mix`.
- Keycap sides and edges in `.kb` are `color-mix` of each swatch with black; dark mode dims letter keys.

The keyboard metaphor is the point: the three swatches in Settings → Themes are exactly the three key colors on the mechanical keyboard.

## Add a theme

Replace `ocean` with the new id.

1. `lib/settings/options.ts` — append to `ACCENTS` and add
   `{ id: "ocean", label: "Ocean", colors: ["#light", "#dark", "#accent"] }` to `THEME_OPTIONS`.
2. `app/globals.css` — next to the other accents:

```css
:root[data-accent="ocean"] {
  --primary: oklch(0.58 0.12 230);
  --sw-light: #eef3f7;
  --sw-dark: #2b4a63;
  --sw-accent: #4fb3d9;
  --ink-light: oklch(0.4 0.04 230);
  --ink-dark: oklch(0.95 0.01 230);
  --ink-accent: oklch(0.25 0.05 230);
}
:root.dark[data-accent="ocean"] {
  --primary: oklch(0.76 0.11 225);
}
```

3. Nothing else. `ThemeGrid` maps `THEME_OPTIONS`, `BOOT_SCRIPT` and `preferencesSchema` read `ACCENTS`.
4. Verify: pick it in Settings → Themes, check `data-accent` on `<html>`, reload and confirm no flash.

Pick ink colors for contrast against each swatch. Royal and Dolch have dark letter keys, so their `--ink-light` is near white.

## Fonts

Same pattern with `data-font`:

1. Load the font in `app/layout.tsx` with `next/font/google` as its own module-level `const` (Next rejects font loaders inside arrays). Give it a `variable`, add it to `fontVariables`.
2. Add `{ id, label, variable }` to `FONT_OPTIONS` and the id to `FONTS`.
3. Add `:root[data-font="id"] { --typing-font: var(--font-…); }` in `globals.css`.

The typing area uses `font-[family-name:var(--typing-font)]`.

## Anti-patterns

- Hard-coding hex colors in components instead of tokens.
- Adding an accent only in CSS: storage and the schema reject unknown ids.
- Treating light/dark as separate accents.
- Using `data-theme`; this app uses `data-accent`.

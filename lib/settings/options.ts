import { z } from "zod";

export const MODES = ["light", "dark", "system"] as const;
export const ACCENTS = [
  "keyclash",
  "classic",
  "mint",
  "royal",
  "dolch",
  "sand",
  "scarlet",
] as const;
export const FONTS = [
  "space-grotesk",
  "geist-mono",
  "jetbrains-mono",
  "fira-code",
  "ibm-plex-mono",
  "source-code-pro",
  "space-mono",
  "roboto-mono",
  "lexend",
] as const;
export const SOUND_PACKS = ["synth", "creamy", "clicky", "typewriter", "bubble", "thock"] as const;
export const MISTAKE_SOUNDS = [
  "faaah",
  "chalo",
  "fart",
  "punch",
  "aayein",
  "rizz",
  "anime-ahh",
  "gunshot",
] as const;

export type ColorMode = (typeof MODES)[number];
export type Accent = (typeof ACCENTS)[number];
export type FontId = (typeof FONTS)[number];
export type SoundPackId = (typeof SOUND_PACKS)[number];
export type MistakeSoundId = (typeof MISTAKE_SOUNDS)[number];

export interface ThemeOption {
  colors: [light: string, dark: string, accent: string];
  id: Accent;
  label: string;
}

export const THEME_OPTIONS: readonly ThemeOption[] = [
  { id: "keyclash", label: "Keyclash", colors: ["#F4F1EA", "#2F3A4C", "#DCC19A"] },
  { id: "classic", label: "Classic", colors: ["#F5F5F5", "#737373", "#F57644"] },
  { id: "mint", label: "Mint", colors: ["#EEEEEE", "#447B82", "#86C8AC"] },
  { id: "royal", label: "Royal", colors: ["#324974", "#3A3B35", "#E4D440"] },
  { id: "dolch", label: "Dolch", colors: ["#4F5E78", "#3E3B4C", "#D73E42"] },
  { id: "sand", label: "Sand", colors: ["#EFEFEF", "#893D36", "#C94E41"] },
  { id: "scarlet", label: "Scarlet", colors: ["#E4D7D7", "#D5868A", "#E1E1E1"] },
];

export const FONT_OPTIONS: readonly { id: FontId; label: string; variable: string }[] = [
  { id: "space-grotesk", label: "Space Grotesk", variable: "--font-grotesk" },
  { id: "geist-mono", label: "Geist Mono", variable: "--font-geist-mono" },
  { id: "jetbrains-mono", label: "JetBrains Mono", variable: "--font-jetbrains-mono" },
  { id: "fira-code", label: "Fira Code", variable: "--font-fira-code" },
  { id: "ibm-plex-mono", label: "IBM Plex Mono", variable: "--font-ibm-plex-mono" },
  { id: "source-code-pro", label: "Source Code Pro", variable: "--font-source-code-pro" },
  { id: "space-mono", label: "Space Mono", variable: "--font-space-mono" },
  { id: "roboto-mono", label: "Roboto Mono", variable: "--font-roboto-mono" },
  { id: "lexend", label: "Lexend", variable: "--font-lexend" },
];

export const SOUND_PACK_OPTIONS: readonly {
  description: string;
  id: SoundPackId;
  label: string;
  remote: boolean;
}[] = [
  { id: "synth", label: "Live synth", description: "Generated in your browser", remote: false },
  { id: "creamy", label: "Creamy", description: "Deep, muted thock", remote: true },
  { id: "clicky", label: "Clicky", description: "Crisp tactile click", remote: true },
  { id: "typewriter", label: "Typewriter", description: "Metal strike with a bell", remote: true },
  { id: "bubble", label: "Bubble", description: "Soft popping keys", remote: true },
  { id: "thock", label: "Thock", description: "Custom deep thock sample", remote: true },
];

export const MISTAKE_SOUND_OPTIONS: readonly { id: MistakeSoundId; label: string }[] = [
  { id: "faaah", label: "Faaah" },
  { id: "chalo", label: "Chalo" },
  { id: "fart", label: "Fart" },
  { id: "punch", label: "Punch" },
  { id: "aayein", label: "Aayein" },
  { id: "rizz", label: "Rizz" },
  { id: "anime-ahh", label: "Anime ahh" },
  { id: "gunshot", label: "Gunshot" },
];

export const preferencesSchema = z.object({
  mode: z.enum(MODES),
  accent: z.enum(ACCENTS),
  font: z.enum(FONTS),
  soundEnabled: z.boolean(),
  soundPack: z.enum(SOUND_PACKS),
  volume: z.number().min(0).max(1),
  faahMode: z.boolean(),
  mistakeSound: z.enum(MISTAKE_SOUNDS),
  showKeyboard: z.boolean(),
  liveStats: z.boolean(),
});

export type Preferences = z.infer<typeof preferencesSchema>;

export const DEFAULT_PREFERENCES: Preferences = {
  mode: "system",
  accent: "keyclash",
  font: "space-grotesk",
  soundEnabled: true,
  soundPack: "synth",
  volume: 0.6,
  faahMode: false,
  mistakeSound: "faaah",
  showKeyboard: true,
  liveStats: true,
};

export function parsePreferences(raw: unknown): Preferences {
  const candidate = { ...DEFAULT_PREFERENCES, ...(typeof raw === "object" && raw ? raw : {}) };
  const parsed = preferencesSchema.safeParse(candidate);
  if (parsed.success) {
    return parsed.data;
  }
  const clean = { ...DEFAULT_PREFERENCES };
  for (const key of Object.keys(DEFAULT_PREFERENCES) as (keyof Preferences)[]) {
    const field = preferencesSchema.shape[key].safeParse(candidate[key]);
    if (field.success) {
      Object.assign(clean, { [key]: field.data });
    }
  }
  return clean;
}

export const SETTINGS_STORAGE_KEY = "kc-settings";

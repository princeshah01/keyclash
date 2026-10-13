import {
  ACCENTS,
  type Accent,
  type ColorMode,
  DEFAULT_PREFERENCES,
  FONTS,
  type FontId,
  MODES,
  type Preferences,
  parsePreferences,
  SETTINGS_STORAGE_KEY,
} from "./options";

export function prefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyMode(mode: ColorMode) {
  const dark = mode === "dark" || (mode === "system" && prefersDark());
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
}

export function applyAccent(accent: Accent) {
  document.documentElement.setAttribute("data-accent", accent);
}

export function applyFont(font: FontId) {
  document.documentElement.setAttribute("data-font", font);
}

export function applyAppearance(preferences: Preferences) {
  applyMode(preferences.mode);
  applyAccent(preferences.accent);
  applyFont(preferences.font);
}

export function loadLocalPreferences(): Preferences | null {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    return raw ? parsePreferences(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function saveLocalPreferences(preferences: Preferences) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    return;
  }
}

export function clearLocalPreferences() {
  try {
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
  } catch {
    return;
  }
}

export const BOOT_SCRIPT = `(function(){try{var d=${JSON.stringify({
  mode: DEFAULT_PREFERENCES.mode,
  accent: DEFAULT_PREFERENCES.accent,
  font: DEFAULT_PREFERENCES.font,
})},m=${JSON.stringify(MODES)},a=${JSON.stringify(ACCENTS)},f=${JSON.stringify(FONTS)},s={};try{s=JSON.parse(localStorage.getItem(${JSON.stringify(SETTINGS_STORAGE_KEY)})||"{}")||{}}catch(e){}var mode=m.indexOf(s.mode)>-1?s.mode:d.mode,accent=a.indexOf(s.accent)>-1?s.accent:d.accent,font=f.indexOf(s.font)>-1?s.font:d.font,dark=mode==="dark"||(mode==="system"&&matchMedia("(prefers-color-scheme: dark)").matches),r=document.documentElement;r.classList.toggle("dark",dark);r.style.colorScheme=dark?"dark":"light";r.setAttribute("data-accent",accent);r.setAttribute("data-font",font)}catch(e){}})()`;

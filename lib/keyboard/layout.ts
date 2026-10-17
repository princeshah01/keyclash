export type KeyTone = "alpha" | "mod" | "accent";
export type KeyIcon = "up" | "down" | "left" | "right" | "paw";
export type SoundProfile = "alpha" | "mod" | "space" | "enter";

export interface KeyDef {
  code: string;
  icon?: KeyIcon;
  legend?: string;
  shift?: string;
  sound: SoundProfile;
  tone: KeyTone;
  w: number;
  x: number;
  y: number;
}

export const BOARD = { width: 16, height: 6 } as const;
export const DISPLAY = { x: 13.06, y: 0, w: 2.94, h: 1 } as const;

const ROW_Y = [0, 1, 2, 3, 4, 5] as const;

type Spec = [
  code: string,
  w: number,
  tone: KeyTone,
  legend?: string,
  shift?: string,
  icon?: KeyIcon,
];

function soundFor(code: string, tone: KeyTone): SoundProfile {
  if (code === "Space") {
    return "space";
  }
  if (code === "Enter" || code === "Backspace" || code.startsWith("Shift")) {
    return "enter";
  }
  return tone === "alpha" ? "alpha" : "mod";
}

function row(y: number, specs: (Spec | number)[]): KeyDef[] {
  const keys: KeyDef[] = [];
  let x = 0;
  for (const spec of specs) {
    if (typeof spec === "number") {
      x += spec;
      continue;
    }
    const [code, w, tone, legend, shift, icon] = spec;
    keys.push({ code, x, y, w, tone, legend, shift, icon, sound: soundFor(code, tone) });
    x += w;
  }
  return keys;
}

const letters = (codes: string) =>
  [...codes].map((letter): Spec => [`Key${letter}`, 1, "alpha", letter]);

const fn = (from: number, to: number, tone: KeyTone) =>
  Array.from({ length: to - from + 1 }, (_, i): Spec => [`F${from + i}`, 1, tone, `F${from + i}`]);

export const KEYS: KeyDef[] = [
  ...row(ROW_Y[0], [
    ["Escape", 1, "accent", "esc"],
    ...fn(1, 4, "alpha"),
    ...fn(5, 8, "mod"),
    ...fn(9, 12, "alpha"),
  ]),
  ...row(ROW_Y[1], [
    ["Backquote", 1, "alpha", "`", "~"],
    ["Digit1", 1, "alpha", "1", "!"],
    ["Digit2", 1, "alpha", "2", "@"],
    ["Digit3", 1, "alpha", "3", "#"],
    ["Digit4", 1, "alpha", "4", "$"],
    ["Digit5", 1, "alpha", "5", "%"],
    ["Digit6", 1, "alpha", "6", "^"],
    ["Digit7", 1, "alpha", "7", "&"],
    ["Digit8", 1, "alpha", "8", "*"],
    ["Digit9", 1, "alpha", "9", "("],
    ["Digit0", 1, "alpha", "0", ")"],
    ["Minus", 1, "alpha", "-", "_"],
    ["Equal", 1, "alpha", "=", "+"],
    ["Backspace", 2, "mod", "backspace"],
    ["Home", 1, "mod", "home"],
  ]),
  ...row(ROW_Y[2], [
    ["Tab", 1.5, "mod", "tab"],
    ...letters("QWERTYUIOP"),
    ["BracketLeft", 1, "alpha", "[", "{"],
    ["BracketRight", 1, "alpha", "]", "}"],
    ["Backslash", 1.5, "alpha", "\\", "|"],
    ["PageUp", 1, "mod", "pgup"],
  ]),
  ...row(ROW_Y[3], [
    ["CapsLock", 1.75, "mod", "caps"],
    ...letters("ASDFGHJKL"),
    ["Semicolon", 1, "alpha", ";", ":"],
    ["Quote", 1, "alpha", "'", '"'],
    ["Enter", 2.25, "accent", "enter", undefined, "paw"],
    ["PageDown", 1, "mod", "pgdn"],
  ]),
  ...row(ROW_Y[4], [
    ["ShiftLeft", 2.25, "mod", "shift"],
    ...letters("ZXCVBNM"),
    ["Comma", 1, "alpha", ",", "<"],
    ["Period", 1, "alpha", ".", ">"],
    ["Slash", 1, "alpha", "/", "?"],
    ["ShiftRight", 1.75, "mod", "shift"],
    ["ArrowUp", 1, "mod", undefined, undefined, "up"],
    ["End", 1, "mod", "end"],
  ]),
  ...row(ROW_Y[5], [
    ["ControlLeft", 1.25, "mod", "ctrl"],
    ["MetaLeft", 1.25, "mod", "win"],
    ["AltLeft", 1.25, "mod", "alt"],
    ["Space", 6.25, "alpha"],
    ["AltRight", 1, "mod", "alt"],
    ["Fn", 1, "mod", "fn"],
    ["ControlRight", 1, "mod", "ctrl"],
    ["ArrowLeft", 1, "mod", undefined, undefined, "left"],
    ["ArrowDown", 1, "mod", undefined, undefined, "down"],
    ["ArrowRight", 1, "mod", undefined, undefined, "right"],
  ]),
];

export const KEY_BY_CODE = new Map(KEYS.map((key) => [key.code, key]));

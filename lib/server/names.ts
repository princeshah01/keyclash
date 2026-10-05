const ADJECTIVES = [
  "swift",
  "nimble",
  "brisk",
  "quiet",
  "lucky",
  "clever",
  "rapid",
  "steady",
  "bold",
  "calm",
  "eager",
  "fuzzy",
  "jolly",
  "keen",
  "lively",
  "mellow",
  "nifty",
  "plucky",
  "snappy",
  "sunny",
  "witty",
  "zesty",
  "cosmic",
  "frosty",
];

const NOUNS = [
  "otter",
  "falcon",
  "lynx",
  "panda",
  "heron",
  "badger",
  "fox",
  "koala",
  "gecko",
  "raven",
  "marten",
  "puffin",
  "comet",
  "keycap",
  "switch",
  "spacebar",
  "pixel",
  "rocket",
  "maple",
  "ember",
];

export const NAME_PATTERN = /^[a-zA-Z0-9_.-]{3,20}$/;

function pick<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

export function randomGuestName() {
  const suffix = Math.floor(Math.random() * 900) + 100;
  return `${pick(ADJECTIVES)}-${pick(NOUNS)}-${suffix}`;
}

export function nameFromProfile(displayName: string | null | undefined) {
  const base = (displayName ?? "")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 14);
  if (base.length < 3) {
    return randomGuestName();
  }
  return `${base}-${Math.floor(Math.random() * 900) + 100}`;
}

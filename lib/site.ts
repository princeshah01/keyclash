/** Canonical origin for metadata, sitemap and OG URLs. Override with NEXT_PUBLIC_SITE_URL. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://keyclash.princeshah.me"
).replace(/\/+$/, "");

export const SITE_NAME = "keyclash";

export const SITE_TITLE = "keyclash — free typing test & live global leaderboard";

export const SITE_DESCRIPTION =
  "Free online typing test. Check your typing speed in WPM and accuracy across time, words, quote and zen modes, race friends in private rooms and climb the live global leaderboard.";

export const SITE_KEYWORDS = [
  "keyclash",
  "typing test",
  "typing speed test",
  "wpm test",
  "words per minute",
  "online typing test",
  "free typing test",
  "typing practice",
  "typing game",
  "keyboard test",
  "typing leaderboard",
];

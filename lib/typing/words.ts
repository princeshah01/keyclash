import quotes from "@/data/quotes.json";
import type { QuoteLength } from "./options";

const PUNCTUATION = [".", ",", "!", "?", ";", ":"] as const;

const QUOTE_BOUNDS: Record<QuoteLength, [number, number]> = {
  short: [40, 130],
  medium: [131, 199],
  long: [200, 600],
};

const poolCache = new Map<string, string[]>();

function randomInt(max: number) {
  return Math.floor(Math.random() * max);
}

function shuffle<T>(items: T[]) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function pickWithoutRepeats(pool: string[], count: number) {
  const unique = [...new Set(pool)];
  const out: string[] = [];
  let deck = shuffle([...unique]);
  let cursor = 0;

  while (out.length < count) {
    if (cursor >= deck.length) {
      const previous = out.at(-1);
      deck = shuffle([...unique]);
      cursor = 0;
      if (deck.length > 1 && deck[0] === previous) {
        const swap = 1 + randomInt(deck.length - 1);
        [deck[0], deck[swap]] = [deck[swap], deck[0]];
      }
    }
    out.push(deck[cursor]);
    cursor += 1;
  }

  return out;
}

function decorate(word: string, punctuation: boolean, numbers: boolean) {
  if (numbers && Math.random() < 0.15) {
    return String(randomInt(10_000));
  }
  if (!punctuation) {
    return word;
  }
  const roll = Math.random();
  if (roll < 0.1) {
    return word + PUNCTUATION[randomInt(PUNCTUATION.length)];
  }
  if (roll < 0.15) {
    return `"${word}"`;
  }
  if (roll < 0.2) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }
  return word;
}

export async function loadWordPool(hard: boolean) {
  const key = hard ? "english_1k" : "english";
  const cached = poolCache.get(key);
  if (cached) {
    return cached;
  }
  const response = await fetch(`/languages/${key}.json`);
  if (!response.ok) {
    throw new Error(`Unable to load ${key} word list`);
  }
  const { words } = (await response.json()) as { words: string[] };
  poolCache.set(key, words);
  return words;
}

export async function generateWords(
  count: number,
  options: { hard: boolean; numbers: boolean; punctuation: boolean },
) {
  const pool = await loadWordPool(options.hard);
  return pickWithoutRepeats(pool, count).map((word) =>
    decorate(word, options.punctuation, options.numbers),
  );
}

export function pickQuote(length: QuoteLength) {
  const [min, max] = QUOTE_BOUNDS[length];
  const pool = quotes.filter((quote) => quote.text.length >= min && quote.text.length <= max);
  const quote = pool[randomInt(pool.length)];
  return { words: quote.text.split(" "), author: quote.from };
}

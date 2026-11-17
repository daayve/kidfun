// Turns each kid's config into the actual questions and words the games use.

export const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export function parseWords(text) {
  const seen = new Set();
  return String(text || '')
    .split(/[\n,]+/)
    .map((w) => w.trim().toLowerCase().replace(/[^a-z' -]/g, ''))
    .filter((w) => w && !seen.has(w) && seen.add(w));
}

const SHORT_WORDS = ['cat', 'dog', 'sun', 'run', 'big', 'red', 'the', 'and', 'you', 'see', 'fun', 'mom', 'dad', 'yes'];
const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');
const HOME_ROW = 'asdfjkl'.split('');

// Level 1: single letters (home row shows up most). Level 2: tiny words.
// Level 3: words up to 5 letters. Level 4+: the whole list, falling faster.
export function typingPool(kid, level) {
  const words = (kid.config.words || []).map((w) => w.replace(/[^a-z]/g, '')).filter(Boolean);
  if (level <= 1) return [...LETTERS, ...HOME_ROW, ...HOME_ROW];
  if (level === 2) {
    const short = words.filter((w) => w.length <= 3);
    return short.length >= 6 ? short : [...short, ...SHORT_WORDS];
  }
  if (level === 3) {
    const mid = words.filter((w) => w.length <= 5);
    return mid.length >= 6 ? mid : words.length >= 6 ? words : [...words, ...SHORT_WORDS];
  }
  return words.length >= 4 ? words : [...words, ...SHORT_WORDS];
}

// Number ranges open up as the level goes up, capped at what the parent set.
export function mathQuestion(cfg, level) {
  const ops = ['add', 'sub', 'mul'].filter((o) => cfg[o]);
  const op = ops.length ? pick(ops) : 'add';
  const cap = Math.max(5, Number(cfg.addMax) || 20);
  const max = Math.max(5, Math.round(cap * Math.min(1, level / 4)));
  if (op === 'mul') {
    const all = cfg.tables && cfg.tables.length ? cfg.tables : [2, 5, 10];
    const tables = all.slice(0, 2 + level);
    const a = pick(tables);
    const b = rand(1, 10);
    const [x, y] = Math.random() < 0.5 ? [a, b] : [b, a];
    return { text: `${x} × ${y}`, answer: x * y };
  }
  if (op === 'sub') {
    const a = rand(2, max);
    const b = rand(1, a - 1);
    return { text: `${a} − ${b}`, answer: a - b };
  }
  const a = rand(1, max - 1);
  const b = rand(1, max - a);
  return { text: `${a} + ${b}`, answer: a + b };
}

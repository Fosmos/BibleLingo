// Real glyph-width text measurement for the parchment's own serif font, via an offscreen
// canvas — replaces the old words-per-line DENSITY HEURISTIC (a single calibrated ratio,
// empirically tuned against one viewport and one chapter, that drifted badly wrong on any
// other viewport/chapter — see lib/chapterPagination.ts's own doc comment). Canvas
// `measureText` reports the SAME glyph metrics the browser's own text layout uses, so a line
// this reports as N words wide is, by construction, the same N words the real `<p
// className="font-serif">` would actually wrap there — no calibration, no drift.

let cachedFontFamily: string | null = null;

// Resolves `font-serif`'s real computed font-family (Playfair Display's own generated local
// name, via next/font — a CSS custom property canvas's own `font` string can't reliably read
// itself) once, off a throwaway probe element, rather than hand-duplicating the Tailwind
// class's fallback chain here.
function resolveSerifFontFamily(): string {
  if (cachedFontFamily) return cachedFontFamily;
  if (typeof document === "undefined") return "Georgia, serif";
  const probe = document.createElement("span");
  probe.className = "font-serif";
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  document.body.appendChild(probe);
  cachedFontFamily = getComputedStyle(probe).fontFamily || "Georgia, serif";
  document.body.removeChild(probe);
  return cachedFontFamily;
}

let measureCtx: CanvasRenderingContext2D | null | undefined;
let ctxFontKey = "";
// `${fontSizePx}:${word}` -> measured px width, so re-paginating (a page-flip, a resize) never
// re-measures a word this session already has the real answer for.
const widthCache = new Map<string, number>();

function getMeasureContext(fontSizePx: number): CanvasRenderingContext2D | null {
  if (typeof document === "undefined") return null;
  if (measureCtx === undefined) measureCtx = document.createElement("canvas").getContext("2d");
  const fontKey = `${fontSizePx}px ${resolveSerifFontFamily()}`;
  if (measureCtx && ctxFontKey !== fontKey) {
    measureCtx.font = fontKey;
    ctxFontKey = fontKey;
  }
  return measureCtx;
}

// Falls back to a rough char-count estimate only when canvas genuinely isn't available (SSR) —
// transient, corrected the moment this runs client-side for real.
function fallbackWidth(text: string, fontSizePx: number): number {
  return text.length * fontSizePx * 0.5;
}

export function measureTextWidth(text: string, fontSizePx: number): number {
  if (text.length === 0) return 0;
  const key = `${fontSizePx}:${text}`;
  const cached = widthCache.get(key);
  if (cached !== undefined) return cached;
  const ctx = getMeasureContext(fontSizePx);
  const width = ctx ? ctx.measureText(text).width : fallbackWidth(text, fontSizePx);
  widthCache.set(key, width);
  return width;
}

// Greedy word-wrap — the same algorithm real inline text layout uses (keep adding
// word-plus-space until the next word would overflow the column, then break) — run against
// REAL measured widths, so it agrees with the actual rendered wrap instead of approximating
// it. Returns how many of `words` land on each line; `words.length === 0` returns `[]`.
export function wrapWordsIntoLines(words: string[], columnWidthPx: number, fontSizePx: number): number[] {
  if (words.length === 0) return [];
  const spaceWidth = measureTextWidth(" ", fontSizePx) || fontSizePx * 0.28;
  const lines: number[] = [];
  let lineWidth = 0;
  let lineWordCount = 0;
  for (const word of words) {
    const wordWidth = measureTextWidth(word, fontSizePx);
    const widthWithWord = lineWordCount === 0 ? wordWidth : lineWidth + spaceWidth + wordWidth;
    if (lineWordCount > 0 && widthWithWord > columnWidthPx) {
      lines.push(lineWordCount);
      lineWidth = wordWidth;
      lineWordCount = 1;
    } else {
      lineWidth = widthWithWord;
      lineWordCount += 1;
    }
  }
  if (lineWordCount > 0) lines.push(lineWordCount);
  return lines;
}

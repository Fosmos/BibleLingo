import { getChapterVerses, formatChapterLabel } from "@/lib/chapterContent";
import { getCachedPericopes, setCachedPericopes, type Pericope } from "@/lib/pericopeCache";

export interface PericopeInfo {
  // e.g. "Mark 1:1-8"
  label: string;
  // e.g. "John the Baptist Prepares the Way"
  heading: string;
  book: string;
  chapter: number;
  // The covering pericope's own first verse — lets a caller tell "this verse is SOMEWHERE
  // inside a pericope" (any verse in range) apart from "this verse IS where a pericope
  // starts" (verseNumber === startVerse).
  startVerse: number;
  // Derived (see buildPericopeInfo below), same value already folded into `label`.
  endVerse: number;
}

// One shared in-flight promise per book|chapter so simultaneous callers (e.g. this verse's
// header and a neighboring one in the same chapter) don't each fire their own fetch.
const inFlight = new Map<string, Promise<void>>();

// Fire-and-forget: a failed heading fetch just means no pericope line shows anywhere for this
// chapter — decorative content, never something worth surfacing an error for or blocking a
// caller on.
export function ensurePericopesLoaded(book: string, chapter: number): Promise<void> {
  if (getCachedPericopes(book, chapter)) return Promise.resolve();
  const key = `${book}|${chapter}`;
  const existing = inFlight.get(key);
  if (existing) return existing;

  const promise = fetch(`/api/bible/pericopes?book=${encodeURIComponent(book)}&chapter=${chapter}`)
    .then((response) => response.json())
    .then((json: { pericopes?: Pericope[] }) => {
      if (Array.isArray(json.pericopes)) {
        setCachedPericopes(book, chapter, json.pericopes);
      }
    })
    .catch(() => {})
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, promise);
  return promise;
}

// A pericope's own end isn't stored — it's the next pericope's startVerse - 1, or the
// chapter's last verse for the final one — so this derives it (and the display label) from
// the full cached list plus this pericope's own index in it.
function buildPericopeInfo(pericopes: Pericope[], index: number, book: string, chapter: number): PericopeInfo {
  const covering = pericopes[index];
  const next = pericopes[index + 1];
  const lastVerseInChapter = getChapterVerses(book, chapter)?.length ?? covering.startVerse;
  const endVerse = next ? next.startVerse - 1 : lastVerseInChapter;

  const chapterLabel = formatChapterLabel(book, chapter);
  const label = covering.startVerse === endVerse ? `${chapterLabel}:${covering.startVerse}` : `${chapterLabel}:${covering.startVerse}-${endVerse}`;

  return { label, heading: covering.heading, book, chapter, startVerse: covering.startVerse, endVerse };
}

// Every pericope in a chapter, in order — the whole-chapter counterpart to getPericopeForVerse
// below (ScripturalMindMap.tsx's own Chapter node needs the full list, not just whichever one
// covers a single verse). Same pure-cache-read contract: [] until ensurePericopesLoaded has
// resolved at least once for this book/chapter (or if it genuinely has no headings).
export function getAllPericopesForChapter(book: string, chapter: number): PericopeInfo[] {
  const pericopes = getCachedPericopes(book, chapter);
  if (!pericopes) return [];
  return pericopes.map((_, index) => buildPericopeInfo(pericopes, index, book, chapter));
}

// Pure cache read — undefined until ensurePericopesLoaded has resolved at least once for this
// book/chapter (or if that chapter genuinely has no headings).
export function getPericopeForVerse(book: string, chapter: number, verseNumber: number): PericopeInfo | undefined {
  const pericopes = getCachedPericopes(book, chapter);
  if (!pericopes || pericopes.length === 0) return undefined;

  let coveringIndex = -1;
  pericopes.forEach((pericope, index) => {
    if (pericope.startVerse <= verseNumber) coveringIndex = index;
  });
  if (coveringIndex === -1) return undefined;

  return buildPericopeInfo(pericopes, coveringIndex, book, chapter);
}

import type { MemorizedEntity } from "@/types";
import { boxDisplayNumber, isDue } from "@/lib/srs";

// One memory state per verse (design_handoff_chapter_path_view/shelf_path): due — in a spaced-review
// range that's due now; rooted — in one at box 4 or later; growing — in an earlier box, or learned
// on a path but not in spaced review yet; open — none of these. Plus the roll-ups the shelves,
// chapter spines, pericope cards and action bar show.
export type MemoryState = "due" | "growing" | "rooted" | "open";
export type MemoryCounts = Record<MemoryState, number> & { total: number };
export type MemoryIndex = Map<string, Map<number, MemoryState>>;

const ROOTED_FROM_BOX = 4;
// A verse in several ranges takes the most urgent: any overdue range wins.
const RANK: Record<MemoryState, number> = { due: 3, growing: 2, rooted: 1, open: 0 };
const indexKey = (book: string, chapter: number) => `${book}|${chapter}`;

// `learnedIndex` is lib/memorizedVerseIndex.ts's book|chapter → verses (every held verse).
export function buildMemoryIndex(entities: MemorizedEntity[], learnedIndex: Map<string, Set<number>>, now: Date): MemoryIndex {
  const index: MemoryIndex = new Map();
  const put = (key: string, verse: number, state: MemoryState) => {
    const chapter = index.get(key) ?? new Map<number, MemoryState>();
    if (RANK[state] > RANK[chapter.get(verse) ?? "open"]) chapter.set(verse, state);
    index.set(key, chapter);
  };
  for (const entity of entities) {
    const state: MemoryState = isDue(entity.srs, now) ? "due" : boxDisplayNumber(entity.srs.box) >= ROOTED_FROM_BOX ? "rooted" : "growing";
    for (let verse = entity.startVerse; verse <= entity.endVerse; verse++) put(indexKey(entity.book, entity.chapter), verse, state);
  }
  // The learned index holds spaced-review verses too — only the ones not in review yet are growing.
  for (const [key, verses] of learnedIndex) {
    for (const verse of verses) if (!index.get(key)?.has(verse)) put(key, verse, "growing");
  }
  return index;
}

export function stateOf(index: MemoryIndex, book: string, chapter: number, verse: number): MemoryState {
  return index.get(indexKey(book, chapter))?.get(verse) ?? "open";
}

// Book / chapter roll-ups count held verses only — a chapter's length may not be loaded yet.
export function countHeld(index: MemoryIndex, book: string, chapter?: number): MemoryCounts {
  const counts: MemoryCounts = { due: 0, growing: 0, rooted: 0, open: 0, total: 0 };
  for (const [key, verses] of index) {
    const separator = key.lastIndexOf("|");
    if (key.slice(0, separator) !== book || (chapter !== undefined && Number(key.slice(separator + 1)) !== chapter)) continue;
    for (const state of verses.values()) {
      counts[state]++;
      counts.total++;
    }
  }
  return counts;
}

export const heldCount = (counts: MemoryCounts) => counts.due + counts.growing + counts.rooted;

// [3, 4, 28, 29, 30] → [[3, 4], [28, 30]]
export function verseRuns(verses: number[]): [number, number][] {
  const sorted = [...verses].sort((a, b) => a - b);
  const runs: [number, number][] = [];
  for (const verse of sorted) {
    const last = runs[runs.length - 1];
    if (last && verse === last[1] + 1) last[1] = verse;
    else runs.push([verse, verse]);
  }
  return runs;
}

// [3, 4, 28, 29, 30] → "3–4, 28–30"
export const formatRuns = (verses: number[]) => verseRuns(verses).map(([start, end]) => (start === end ? `${start}` : `${start}–${end}`)).join(", ");

// The one action a pericope card offers: review what's due, else choose / learn what's open, else rooted.
export type CardAction = { kind: "review" | "chooseAll" | "learn"; verses: number[] } | { kind: "rooted" };
export function cardAction(states: [number, MemoryState][], chosen: Set<number>): CardAction {
  const due = states.filter(([, state]) => state === "due").map(([verse]) => verse);
  if (due.length) return { kind: "review", verses: due };
  const open = states.filter(([, state]) => state === "open").map(([verse]) => verse);
  if (!open.length) return { kind: "rooted" };
  const picked = open.filter((verse) => chosen.has(verse));
  return picked.length ? { kind: "learn", verses: picked } : { kind: "chooseAll", verses: open };
}

// A spine's fill, bottom-up, in px — rooted, then growing, then due, in proportion.
export function spineSegments(counts: MemoryCounts, fillPx: number): { state: MemoryState; px: number }[] {
  const held = heldCount(counts);
  if (!held) return [];
  return (["rooted", "growing", "due"] as const).filter((state) => counts[state]).map((state) => ({ state, px: Math.max(3, Math.round((fillPx * counts[state]) / held)) }));
}

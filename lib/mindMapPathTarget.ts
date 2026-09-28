import type { MindMapDatum } from "@/lib/mindMapHierarchy";
import { parsePathKey, pathKey } from "@/lib/memorizationContent";

// A path the reader can start by tapping its node on the Mind Map — a whole book, one chapter,
// or one verse (the same three kinds GuidedPathFlow.tsx builds; topics have no place on the map).
export type PathTarget =
  | { kind: "book"; book: string }
  | { kind: "chapter"; book: string; chapter: number }
  | { kind: "verse"; book: string; chapter: number; verse: number };

// The same identifier GuidedPathFlow.tsx/lib/useLearnIntensityFlow.ts build for each kind.
export function pathTargetIdentifier(target: PathTarget): string {
  if (target.kind === "book") return target.book;
  if (target.kind === "chapter") return `${target.book}|${target.chapter}`;
  return `${target.book}|${target.chapter}|${target.verse}`;
}

export function pathTargetKey(target: PathTarget): string {
  return pathKey(target.kind, pathTargetIdentifier(target));
}

export function pathTargetLabel(target: PathTarget): string {
  if (target.kind === "book") return target.book;
  if (target.kind === "chapter") return `${target.book} ${target.chapter}`;
  return `${target.book} ${target.chapter}:${target.verse}`;
}

// Book and chapter rings map to a path; every broader ring (testament, genre, theme) doesn't.
export function pathTargetForDatum(datum: MindMapDatum): PathTarget | undefined {
  if (datum.kind === "book") return { kind: "book", book: datum.name };
  if (datum.kind === "chapter") return { kind: "chapter", book: datum.book, chapter: datum.chapter };
  return undefined;
}

// The book/chapter/verse a path key covers — its identifier split back apart. Undefined for a
// topic path (or none), which covers nothing on the map.
export function activePathScope(activeKey: string | null): { kind: string; book: string; chapter?: number; verse?: number } | undefined {
  if (!activeKey) return undefined;
  const { kind, identifier } = parsePathKey(activeKey);
  if (kind !== "book" && kind !== "chapter" && kind !== "verse") return undefined;
  const [book, chapter, verse] = identifier.split("|");
  return { kind, book, chapter: chapter ? Number(chapter) : undefined, verse: verse ? Number(verse) : undefined };
}

// Whether `target` already sits inside the active path — a chapter of the book being memorized,
// say — in which case tapping it just navigates (or opens its lesson) instead of offering a new
// path.
export function isCoveredByActivePath(target: PathTarget, activeKey: string | null): boolean {
  const scope = activePathScope(activeKey);
  if (!scope || scope.book !== target.book) return false;
  if (scope.kind === "book") return true;
  if (target.kind === "book") return false;
  if (scope.kind === "chapter") return scope.chapter === target.chapter;
  return target.kind === "verse" && scope.chapter === target.chapter && scope.verse === target.verse;
}

// The book name a book/chapter/verse path key belongs to (its identifier's first part).
export function pathBookName(key: string): string {
  return parsePathKey(key).identifier.split("|")[0];
}

// Whether one of the reader's OTHER active paths (not the focused one the map is showing) lives
// at this book/chapter ring — the map marks it (see MindMapRingNode.tsx's `pathMark`) so every
// path in progress stays findable while only one is on the map in full.
export function isOtherActivePathAt(datum: MindMapDatum, activeKeys: string[], focusedKey: string | null): boolean {
  if (datum.kind !== "book" && datum.kind !== "chapter") return false;
  return activeKeys.some((key) => {
    if (key === focusedKey) return false;
    const scope = activePathScope(key);
    if (!scope) return false;
    if (datum.kind === "book") return scope.book === datum.name;
    return scope.book === datum.book && scope.chapter === datum.chapter;
  });
}

const SCOPE_BREADTH: Record<string, number> = { book: 0, chapter: 1, verse: 2 };

// Whether path `outerKey` contains everything path `innerKey` does — the whole book, or the one
// chapter a chapter/verse path sits in.
function pathCovers(outerKey: string, innerKey: string): boolean {
  const outer = activePathScope(outerKey);
  const inner = activePathScope(innerKey);
  if (!outer || !inner || outer.book !== inner.book) return false;
  if (outer.kind === "book") return true;
  if (outer.kind === "chapter") return inner.kind !== "book" && inner.chapter === outer.chapter;
  return outerKey === innerKey;
}

// The path the Mind Map draws while `focusedKey` is focused: the broadest active path containing
// it. A single verse picked out of a book you're already memorizing ("Learn just vN") stays on
// that book's map — the rest of its chapter and all the book's progress stay in view — rather
// than shrinking the map down to that one verse.
export function mapHostPathKey(focusedKey: string, activeKeys: string[]): string {
  let host = focusedKey;
  for (const key of activeKeys) {
    if (!pathCovers(key, focusedKey)) continue;
    const breadth = SCOPE_BREADTH[activePathScope(key)?.kind ?? ""] ?? 3;
    if (breadth < (SCOPE_BREADTH[activePathScope(host)?.kind ?? ""] ?? 3)) host = key;
  }
  return host;
}

// The map target a path key names (its book, chapter or verse) — undefined for a topic path.
export function pathTargetOfKey(key: string): PathTarget | undefined {
  const scope = activePathScope(key);
  if (!scope) return undefined;
  if (scope.kind === "book") return { kind: "book", book: scope.book };
  if (scope.chapter === undefined) return undefined;
  if (scope.kind === "chapter") return { kind: "chapter", book: scope.book, chapter: scope.chapter };
  return scope.verse === undefined ? undefined : { kind: "verse", book: scope.book, chapter: scope.chapter, verse: scope.verse };
}

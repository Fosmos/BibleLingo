import type { PericopeCardStatus } from "@/lib/pericopeCardState";

// The Mind Map's own Bible -> Testament -> Genre -> (Subgenre ->) Book -> (Theme ->) Chapter ->
// Pericope tree shape — split out of lib/mindMapHierarchy.ts (which builds real trees of this
// shape) purely to keep both files under this codebase's own 200-line cap (see CLAUDE.md).

export interface MindMapPericopeDatum {
  kind: "pericope";
  id: string;
  label: string;
  // e.g. "v9–11", or "v9" for a single-verse pericope — undefined only alongside the capstone
  // case dayNumber's own doc comment already describes, or while pericope data itself is still
  // loading (see PathZone.startVerse/endVerse).
  verseRange?: string;
  status: PericopeCardStatus;
  // Which book this pericope belongs to — lets BookMindMap.tsx's own pericope-tap handler tell
  // a real active-book pericope (opens that chapter's parchment view) apart from a browsed
  // (non-active) book's own pericope (offers to switch there instead — see onSwitchBook).
  book: string;
  // The chapter this pericope belongs to — tapping the card opens that chapter's own
  // parchment view (see BookMindMap.tsx's onSelectChapter) rather than jumping straight into
  // a lesson; the parchment view is where an individual verse run's own tap opens the actual
  // Learn/Practice session (see PericopeCard.tsx/ChapterReadingView.tsx).
  chapter: number;
  // This pericope's own first verse — carried through to DayPathDiagram.tsx's own
  // `targetVerse` so the parchment view opens straight to the real page holding THIS
  // pericope, not wherever the chapter's own "today's lesson" default would otherwise land.
  // Undefined only alongside verseRange's own doc comment (pericope data still loading).
  startVerse?: number;
  // The lesson day this pericope's card represents — computed by lib/pericopeCardState.ts's
  // computeZoneCardState, the same established logic PericopeCard.tsx/BuildingRoomView
  // already use, so this reads identically everywhere in the app. Undefined for a browsed
  // (non-active) book's own pericope — there's no lesson day to speak of until the reader
  // actually switches their active path to that book (see BookMindMap.tsx's onSwitchBook).
  dayNumber?: number;
  actionKind: "select" | "practice";
  children?: never;
}

export interface MindMapChapterDatum {
  kind: "chapter";
  id: string;
  label: string;
  // The real chapter number — distinct from `label`'s own display string, since
  // BookMindMap.tsx's own initial-centering logic needs to pick out today's specific chapter
  // node by number, not parse it back out of display text.
  chapter: number;
  status: PericopeCardStatus;
  children: MindMapPericopeDatum[];
}

export interface MindMapThemeDatum {
  kind: "theme";
  id: string;
  // e.g. "Galilean Ministry" — one of lib/bookThemes.ts's own hand-authored literary sections.
  label: string;
  // The chapter span this theme covers, as plain digits (e.g. "2–8", or "16" for a
  // single-chapter theme like Leviticus' Day of Atonement) — MindMapNodeCard.tsx renders it as
  // a small caption under `label` ("Ch 2–8"), the "reference" a theme node carries the same way
  // a pericope card carries its own verseRange.
  reference: string;
  // Same chapter-graduated completion math as MindMapBookDatum's own `percent`, just scoped to
  // this theme's own chapter range (see lib/canonTree.ts's themeCompletionPercent) rather than
  // the whole book.
  percent: number;
  // Real for the active book's own theme nodes, AND for whichever single non-active book is
  // currently being browsed (see MindMapBookDatum's own doc comment) — every other book has no
  // theme nodes at all, since it has no BOOK_THEMES-independent reason to exist without real
  // chapters to group; see lib/mindMapHierarchy.ts's own buildBook.
  children: MindMapChapterDatum[];
}

export interface MindMapBookDatum {
  kind: "book";
  id: string;
  // Same plain book name as `name` below — a book node's own circle shows just "Mark," not a
  // ceremonial "The Gospel of Mark," so the two happen to hold identical text. Kept as its own
  // field anyway (rather than reusing `name` for display too) so MindMapNodeCard.tsx never
  // needs a book-specific special case to find "the text this node displays," the same way
  // every other kind in this union already works.
  label: string;
  // The plain book name (e.g. "Mark") — this is the value BookMindMap.tsx's own onSwitchBook
  // needs to build a path key/route with; kept distinct from `label` since a route-building
  // value and a display value are different concerns even when their text happens to match.
  name: string;
  // Whether this IS the path's own currently active book — tapping any OTHER book's own card
  // reveals its real chapter/pericope tree too now (see BookMindMap.tsx's own "browse" support),
  // but only the active book's own tree reflects real lesson/SRS progress; a browsed book's own
  // chapters/pericopes read purely structurally (locked/completed by chapter-graduation only,
  // never "today's lesson" active) until the reader actually switches their active path to it.
  active: boolean;
  // Chapter-graduated completion, 0-100 — real for every book (see
  // lib/canonTree.ts's bookCompletionPercent, backed only by localStorage progress, no fetch
  // needed), not just the active one.
  percent: number;
  // A book long enough to have a lib/bookThemes.ts entry gets its own Theme layer between it and
  // its chapters (see buildBook below); a shorter book — its own chapter list is already easy
  // enough to scan — skips straight to MindMapChapterDatum children, same shape this always had.
  // Empty for a book that's neither active nor currently browsed.
  children: MindMapThemeDatum[] | MindMapChapterDatum[];
}

// The optional Pauline/General Epistles or Major/Minor Prophets split (see
// lib/canonTree.ts's subgenresForGenre) — only Epistles and Prophets ever produce this level;
// every other genre's own children skip straight to MindMapBookDatum, same shape it always had.
export interface MindMapSubgenreDatum {
  kind: "subgenre";
  id: string;
  label: string;
  percent: number;
  children: MindMapBookDatum[];
}

export interface MindMapGenreDatum {
  kind: "genre";
  id: string;
  label: string;
  percent: number;
  children: MindMapBookDatum[] | MindMapSubgenreDatum[];
}

export interface MindMapTestamentDatum {
  kind: "testament";
  id: string;
  label: string;
  percent: number;
  children: MindMapGenreDatum[];
}

export interface MindMapRootDatum {
  kind: "root";
  id: "root";
  label: string;
  children: MindMapTestamentDatum[];
}

export type MindMapDatum =
  | MindMapRootDatum
  | MindMapTestamentDatum
  | MindMapGenreDatum
  | MindMapSubgenreDatum
  | MindMapBookDatum
  | MindMapThemeDatum
  | MindMapChapterDatum
  | MindMapPericopeDatum;

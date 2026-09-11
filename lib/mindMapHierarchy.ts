import type { ChapterNode } from "@/lib/useMindMapData";
import { computeZoneCardState, type PericopeCardStatus } from "@/lib/pericopeCardState";
import { fullBookTitle } from "@/lib/bibleBookTitles";

export interface MindMapPericopeDatum {
  kind: "pericope";
  id: string;
  label: string;
  // e.g. "v9–11", or "v9" for a single-verse pericope — undefined only alongside the capstone
  // case dayNumber's own doc comment already describes, or while pericope data itself is still
  // loading (see PathZone.startVerse/endVerse).
  verseRange?: string;
  status: PericopeCardStatus;
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
  // already use, so this reads identically everywhere in the app. That function keys
  // completion off the zone's LAST day (not its first) — a pericope spanning several lesson
  // days only turns "completed" once every one of them is done, not just the first (a zone
  // with no day of its own at all — see PathZone.spilloverVerses — is instead judged by the
  // last spillover day that touched it).
  dayNumber?: number;
  // Mirrors PericopeCardState.actionKind — kept for callers that still want it, though
  // BookMindMap.tsx's own tap handler no longer needs it now that a tap opens the chapter's
  // parchment view rather than routing straight to a specific lesson/practice URL.
  actionKind: "select" | "practice";
  children?: never;
}

export interface MindMapChapterDatum {
  kind: "chapter";
  id: string;
  label: string;
  status: PericopeCardStatus;
  children: MindMapPericopeDatum[];
}

export interface MindMapBookDatum {
  kind: "book";
  id: string;
  label: string;
  children: MindMapChapterDatum[];
}

export type MindMapDatum = MindMapBookDatum | MindMapChapterDatum | MindMapPericopeDatum;

function verseRangeLabel(startVerse: number | undefined, endVerse: number | undefined): string | undefined {
  if (startVerse === undefined || endVerse === undefined) return undefined;
  return startVerse === endVerse ? `v${startVerse}` : `v${startVerse}–${endVerse}`;
}

// Reshapes useMindMapData.ts's own ChapterNode[] into a plain Book -> Chapter -> Pericope
// tree — the shape lib/mindMapTreeLayout.ts's own explicit placement walks directly.
// Deliberately stops at the pericope level rather than enumerating individual verses under
// it: a real book can carry hundreds of verses, and a tree with that many leaves next to only
// 3 levels of depth stretches its own sibling axis out far more than its depth axis, which is
// what was crushing the whole canvas into an unreadably flat line (see
// lib/mindMapTreeLayout.ts's own comment for the other half of that fix). A pericope node
// carries enough of its own status/dayNumber to be the tree's tap target directly — verse-
// level detail (now also its own verse REFERENCE, shown right on the card) lives one tap
// away, on the real Path
// screen a pericope click opens.
export function buildMindMapTree(bookLabel: string, chapters: ChapterNode[], completedDays: number, todaysDay: number): MindMapBookDatum {
  return {
    kind: "book",
    id: "book",
    label: fullBookTitle(bookLabel),
    children: chapters.map((chapter) => ({
      kind: "chapter",
      id: `ch-${chapter.chapter}`,
      label: `${chapter.chapter}`,
      status: chapter.status,
      children: chapter.zones.map((zone) => {
        const cardState = computeZoneCardState(zone, completedDays, todaysDay);
        return {
          kind: "pericope",
          id: `z-${chapter.chapter}-${zone.zoneNumber}`,
          label: zone.heading || zone.label || `Section ${zone.zoneNumber}`,
          verseRange: verseRangeLabel(zone.startVerse, zone.endVerse),
          status: cardState.status,
          chapter: chapter.chapter,
          startVerse: zone.startVerse,
          dayNumber: cardState.actionDay?.dayNumber,
          actionKind: cardState.actionKind,
        };
      }),
    })),
  };
}

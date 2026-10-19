import { create } from "zustand";
import type { Peek } from "@/lib/peek";

// What the Mind Map lesson sheet's header shows (LessonSheetHeader.tsx): the stage's name, the
// verse(s) it drills, and where it sits among its group of stages (the step bar).
export interface SheetStage {
  label: string;
  reference: string;
  step: number;
  steps: number;
  // No stage label — just the reference, beside the close button (spaced review).
  compact?: boolean;
  // A spaced review's live score (0–100) and the score that moves it up a box (SrsAccuracyTracker.tsx).
  accuracy?: number;
  threshold?: number;
}

export interface LessonFocusVerse {
  book: string;
  chapter: number;
  verseNumber: number;
}

interface LessonSessionState {
  activeCount: number;
  // The verse currently being drilled inside PathOverviewScreen.tsx's own in-place lesson
  // bottom sheet (see LessonBottomSheet.tsx) — read by lib/useMindMapVerseFocusLock.ts to zoom
  // the REAL Mind Map canvas onto it, written by LearnVerseSpotlightChrome.tsx (only when its
  // own `embeddedInMindMap` prop is set) as the lesson advances verse to verse. Same "ambient
  // cross-cutting lesson state, read by an unrelated distant component with zero prop
  // threading" role `activeCount` already plays for AuthGate.tsx's tab-bar hiding — null means
  // no sheet-embedded lesson is currently focused on any one verse.
  focusVerse: LessonFocusVerse | null;
  // A verse the Mind Map should bring into view once, then let go (see lib/useMindMapArrival.ts)
  // — Home's Needs Reviewing links land here. Unlike focusVerse, the view stays free afterwards.
  arrivalVerse: LessonFocusVerse | null;
  // The sheet header's stage (see SheetStage) — null when nothing in the sheet reports one.
  sheetStage: SheetStage | null;
  // The real DOM node lib/useMindMapSenseCardSlot.ts measures for PathOverviewScreen.tsx's own
  // in-place lesson sheet's dedicated "sense lines only" card (see LessonBottomSheet.tsx) —
  // LessonPageCard.tsx portals its card straight into this node instead of rendering inline
  // whenever it's set, and `senseCardFillHeightPx` (that same slot's own real measured height)
  // feeds both that portaled card's `fill` sizing AND lib/useChapterReadingLayout.ts's own
  // `fixedFillHeightPx` override, so pagination and the card's real on-screen size never
  // disagree. Both null on the standalone `/day/[dayNumber]` route, which has no such slot.
  senseCardPortalNode: HTMLElement | null;
  senseCardFillHeightPx: number | null;
  // That same slot's own real measured WIDTH — feeds lib/useChapterPagination.ts's own
  // `fixedColumnWidthPx` override the exact same way `senseCardFillHeightPx` feeds its height
  // override, so the portaled card's real line-wrapping matches its real on-screen width too.
  senseCardColumnWidthPx: number | null;
  // MindMapSheetBreadcrumb.tsx's own reference-lookup slot (see lib/useMindMapVerseViewSlot.ts)
  // — LessonControlBar.tsx portals its "View First Letters"/"View Verse" pair straight into it
  // instead of rendering them among the sheet's own essential drill controls, the exact
  // same portal-into-a-published-node shape `senseCardPortalNode` already establishes above.
  // Null on the standalone `/day/[dayNumber]` route, which has no breadcrumb slot to portal into.
  verseViewPortalNode: HTMLDivElement | null;
  // LessonBottomSheet.tsx's own drill zone (see lib/useMindMapDrillSlot.ts) — every stage's
  // controls (LessonControlBar.tsx) and the verse preview's action button portal into it via
  // SheetDrillPortal.tsx. `drillPortalUsers` counts how many are mounted there right now: while
  // any are, the rest of the lesson tree (stage names, info tips, attribution) stays invisible;
  // at zero, the sheet shows that tree instead, for a screen with no drill controls of its own.
  drillPortalNode: HTMLDivElement | null;
  drillPortalUsers: number;
  // How many mounted screens want the verse zone to take ALL the room above the drill zone's
  // own content (the verse preview, a workspace stage — see lib/useExpandedVerseZone.ts),
  // instead of the lesson's even 30/30 split.
  expandedVerseZoneUsers: number;
  // 0..1 through the current in-sheet lesson's steps, drawn as a thin bar under
  // MindMapSheetBreadcrumb.tsx; null outside a lesson (the verse preview, or no sheet at all).
  lessonProgress: number | null;
  // A path just finished (see lib/completeDayEffects.ts) — PathCompleteCelebration.tsx shows it
  // once no lesson is on screen, then clears it.
  completedPath: string | null;
  // The lesson page (PathLessonPage.tsx) or the reader's lesson dock (PathLessonDock.tsx) is open —
  // its drill tray carries the help chips (DrillHelpChips.tsx), which stand in for the reference
  // lookup and the testing shortcut.
  lessonPageOpen: boolean;
  // The verse zone is a verse's own row in the chapter reader (PathLessonVerseSlot.tsx): the verse
  // at the reader's size, no ghost lines (its neighbours are right there).
  verseInRow: boolean;
  // The slot in the reader's lesson top bar (PathLessonTopBar.tsx) a recalled reference shows in.
  referenceBarNode: HTMLElement | null;
  // The reader row's verse zone is inline, mid-paragraph (sense lines off — ReaderProseRun.tsx):
  // the stage's words flow in the paragraph in the verse's own place.
  verseInline: boolean;
  // Letters / Verse help chips: the tab of the verse open, first letters or whole (lib/peek.ts).
  peek: Peek;
  // The verse zone has gone compact to fit (lib/useVerseFit.ts) — the stage label hides.
  verseCompactFit: boolean;
  // The current stage's skip (its AutoCompleteButton.tsx callback), for the Skip chip.
  skipStage: (() => void) | null;
  // The Speak / Type chip on a drill that can be done either way (lib/useInputSwap.ts): which way
  // it switches to, and how.
  inputSwap: { to: "speak" | "type"; choose: (input: "speak" | "type") => void } | null;
  // The verse the lesson page shows (lib/usePublishHelpVerse.ts), for the help chips' tabs.
  helpVerseText: string | null;
}

interface LessonSessionActions {
  begin: () => void;
  end: () => void;
  setFocusVerse: (verse: LessonFocusVerse) => void;
  clearFocusVerse: () => void;
  setArrivalVerse: (verse: LessonFocusVerse | null) => void;
  setSheetStage: (stage: SheetStage | null) => void;
  setSenseCardPortalNode: (node: HTMLElement | null) => void;
  setSenseCardFillHeightPx: (px: number | null) => void;
  setSenseCardColumnWidthPx: (px: number | null) => void;
  setVerseViewPortalNode: (node: HTMLDivElement | null) => void;
  setDrillPortalNode: (node: HTMLDivElement | null) => void;
  addDrillPortalUser: () => void;
  removeDrillPortalUser: () => void;
  addExpandedVerseZoneUser: () => void;
  removeExpandedVerseZoneUser: () => void;
  setLessonProgress: (progress: number | null) => void;
  setCompletedPath: (pathKey: string | null) => void;
  setLessonPageOpen: (open: boolean) => void;
  setVerseInRow: (inRow: boolean) => void;
  setReferenceBarNode: (node: HTMLElement | null) => void;
  setVerseInline: (inline: boolean) => void;
  setPeek: (peek: Peek) => void;
  setVerseCompactFit: (compact: boolean) => void;
  setSkipStage: (skip: (() => void) | null) => void;
  setInputSwap: (swap: LessonSessionState["inputSwap"]) => void;
  setHelpVerseText: (text: string | null) => void;
}

type LessonSessionStore = LessonSessionState & LessonSessionActions;

// Deliberately NOT persisted (unlike store/useProgressStore.ts) — this only ever tracks
// whether a LessonControlBar.tsx is currently mounted in its docked/fill-parchment mode
// (Learn, SRS Review, Relearn, Practice all render through it — see LessonControlBar.tsx's
// own doc comment), so AuthGate.tsx can hide the bottom tab bar for the DURATION of that one
// session and nothing survives a reload to get stuck "on". A COUNT rather than a plain
// boolean because a stage transition can briefly mount the next LessonControlBar before the
// previous one unmounts; two overlapping sessions still means "still in a session" until both
// clear, instead of one's cleanup wrongly flipping it back off underneath the other.
export const useLessonSessionStore = create<LessonSessionStore>((set) => ({
  activeCount: 0,
  focusVerse: null,
  arrivalVerse: null,
  sheetStage: null,
  senseCardPortalNode: null,
  senseCardFillHeightPx: null,
  senseCardColumnWidthPx: null,
  verseViewPortalNode: null,
  drillPortalNode: null,
  drillPortalUsers: 0,
  expandedVerseZoneUsers: 0,
  lessonProgress: null,
  completedPath: null,
  lessonPageOpen: false,
  verseInRow: false,
  referenceBarNode: null,
  verseInline: false,
  peek: null,
  verseCompactFit: false,
  skipStage: null,
  inputSwap: null,
  helpVerseText: null,
  begin: () => set((state) => ({ activeCount: state.activeCount + 1 })),
  end: () => set((state) => ({ activeCount: Math.max(0, state.activeCount - 1) })),
  setFocusVerse: (verse) => set({ focusVerse: verse }),
  clearFocusVerse: () => set({ focusVerse: null }),
  setArrivalVerse: (verse) => set({ arrivalVerse: verse }),
  setSheetStage: (stage) => set({ sheetStage: stage }),
  setSenseCardPortalNode: (node) => set({ senseCardPortalNode: node }),
  setSenseCardFillHeightPx: (px) => set({ senseCardFillHeightPx: px }),
  setSenseCardColumnWidthPx: (px) => set({ senseCardColumnWidthPx: px }),
  setVerseViewPortalNode: (node) => set({ verseViewPortalNode: node }),
  setDrillPortalNode: (node) => set({ drillPortalNode: node }),
  addDrillPortalUser: () => set((state) => ({ drillPortalUsers: state.drillPortalUsers + 1 })),
  removeDrillPortalUser: () => set((state) => ({ drillPortalUsers: Math.max(0, state.drillPortalUsers - 1) })),
  addExpandedVerseZoneUser: () => set((state) => ({ expandedVerseZoneUsers: state.expandedVerseZoneUsers + 1 })),
  removeExpandedVerseZoneUser: () => set((state) => ({ expandedVerseZoneUsers: Math.max(0, state.expandedVerseZoneUsers - 1) })),
  setLessonProgress: (progress) => set({ lessonProgress: progress }),
  setLessonPageOpen: (open) => set({ lessonPageOpen: open }),
  setVerseInRow: (inRow) => set({ verseInRow: inRow }),
  setReferenceBarNode: (node) => set({ referenceBarNode: node }),
  setVerseInline: (inline) => set({ verseInline: inline }),
  setPeek: (peek) => set({ peek }),
  setVerseCompactFit: (compact) => set({ verseCompactFit: compact }),
  setSkipStage: (skip) => set({ skipStage: skip }),
  setInputSwap: (swap) => set({ inputSwap: swap }),
  setHelpVerseText: (text) => set({ helpVerseText: text }),
  setCompletedPath: (pathKey) => set({ completedPath: pathKey }),
}));

export function useIsLessonSessionActive(): boolean {
  return useLessonSessionStore((state) => state.activeCount > 0);
}

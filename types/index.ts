// Single source of truth for shared types — component-local, props-only types live next to their component instead.

// ---------------------------------------------------------------------------
// Verses & Bible reference data
// ---------------------------------------------------------------------------

export interface VerseSegment {
  id: string;
  text: string;
  reference: string;
  book: string;
  chapter: number;
  verseNumber: number;
}

export interface WordDiffToken {
  word: string;
  correct: boolean;
}

export interface BibleBook {
  name: string;
  testament: "old" | "new";
  chapterCount: number;
  bookId: string;
}

// ---------------------------------------------------------------------------
// Memorization Paths (book/chapter/verse/topic — one lesson per verse, plus a
// final full-review day and a boss-battle day)
// ---------------------------------------------------------------------------

export type PathKind = "book" | "chapter" | "verse" | "topic";

export type DayKind = "learn" | "chapter_review" | "boss_battle" | "chapter_boss_battle" | "weekly_review" | "monthly_review";

export interface ReviewStage {
  label: string;
  verses: VerseSegment[];
}

export interface MemorizationDay {
  dayNumber: number;
  kind: DayKind;
  newVerses: VerseSegment[];
  reviewVerses: VerseSegment[];
  // Optional ordered breakdown of reviewVerses into separate, sequentially-completed
  // stages run BEFORE today's new verse (e.g. book mode's daily-rotation chapter). Falls
  // back to a single "Review" stage over all of reviewVerses when absent.
  reviewStages?: ReviewStage[];
  // Book mode only: the sliding-window chapter review (previous chapter in full, plus the
  // current chapter's progress so far) — run AFTER today's new verse is learned rather than
  // before it, so review of what's already known doesn't stand between the user and the
  // new material.
  postLearnReviewStages?: ReviewStage[];
  // Book-mode only: the chapter this day belongs to, used to group the path into
  // one-chapter-at-a-time views. Undefined for the final whole-book capstone (and for
  // every non-book path kind, which has no chapter grouping concept).
  chapterGroup?: number;
  // "chapter_review" days and "learn" days (every path kind): the newVerses of the
  // immediately preceding learn day — reviewed in ReviewChain format as the very first
  // part of the lesson/day, so recall of what was "just learned yesterday" gets checked on
  // its own before anything else. Empty when there was no preceding learn day.
  previousVerses?: VerseSegment[];
}

export interface PathProgress {
  version: string;
  completedDays: number;
  // Set for "book" and "chapter" kind paths — verse/topic paths stay one verse per lesson.
  versesPerDay?: number;
}

// ---------------------------------------------------------------------------
// Spaced Repetition (long-term review of verses that have graduated into the
// Memorized section — separate from a path's own day-to-day Review section)
// ---------------------------------------------------------------------------

export interface SRSState {
  repetitionCount: number;
  intervalDays: number;
  lastReviewedAt: string | null;
  nextDueAt: string | null;
}

// A contiguous, gap-free run of verses within a single book+chapter that have all been
// memorized and reviewed. Scoped to one chapter — it never spans across chapters.
export interface MemorizedEntity {
  id: string;
  book: string;
  chapter: number;
  startVerse: number;
  endVerse: number;
  srs: SRSState;
  // True for verses added directly by the user (already memorized before using the app),
  // as opposed to ones derived from completed path progress. Manual entries are never
  // rebuilt/discarded by syncMemorizedEntities, since it only knows about path progress.
  manual: boolean;
  // The translation this range was actually memorized in — a book+chapter's cache slot
  // holds only one translation's text at a time (see lib/bibleContentCache.ts), and other
  // browsing/fetching can silently overwrite it with a different one, so SRS review must
  // fetch by this stored version rather than trusting whatever's currently cached there.
  version: string;
}

// ---------------------------------------------------------------------------
// Accounts (local-only sign-in — no backend; each account's UserProgress is
// stored under its own localStorage key, see lib/storage.ts)
// ---------------------------------------------------------------------------

export interface AccountRecord {
  id: string;
  // Lowercased/trimmed for case-insensitive lookup; this is also what's shown in the UI.
  username: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Streak
// ---------------------------------------------------------------------------

export interface StreakFreezeState {
  inventory: number;
}

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastCompletedAt: string | null;
  freeze: StreakFreezeState;
}

export interface UserProgress {
  schemaVersion: number;
  streak: StreakState;
  paths: Record<string, PathProgress>;
  stickers: string[];
  activePathKey: string | null;
  memorizedEntities: MemorizedEntity[];
  shekels: number;
  includeVerseReferences: boolean;
  // Best chapter-review word-recall accuracy ever recorded per pathKey (a "chapter_review"
  // day's ReviewChain score) — 0-100.
  chapterReviewBestAccuracy: Record<string, number>;
  // Resume points for in-progress lessons/SRS reviews, keyed by a session id (e.g. a
  // "pathKey:dayNumber" day, or "srs:entityId"). Each session's checkpoint is a small map of
  // named indices (e.g. verseIndex, phaseIndex) written on every change so leaving mid-way —
  // by any means, not just a clean exit — resumes at the same point instead of restarting.
  sessionCheckpoints: Record<string, Record<string, number>>;
  // Highest Mastery Mode level (1-5) ever cleared per passage, keyed by
  // `${pathKey}|${version}` (see lib/masteryMode.ts) — Mastery Mode runs on any arbitrary
  // verse/chapter/book selection, not just tracked SRS entities, so this can't reuse
  // MemorizedEntity ids the way chapterReviewBestAccuracy reuses pathKey.
  masteryLevels: Record<string, number>;
}

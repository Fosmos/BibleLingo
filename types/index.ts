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

export type DayKind =
  | "learn"
  | "chapter_review"
  | "boss_battle"
  | "section_boss_battle"
  | "weekly_review"
  | "monthly_review";

export interface ReviewStage {
  label: string;
  verses: VerseSegment[];
}

export interface MemorizationDay {
  dayNumber: number;
  kind: DayKind;
  newVerses: VerseSegment[];
  reviewVerses: VerseSegment[];
  // Book mode only: the sliding-window chapter review (previous chapter in full, plus the
  // current chapter's progress so far) — run AFTER today's new verse is learned rather than
  // before it, so review of what's already known doesn't stand between the user and the
  // new material.
  postLearnReviewStages?: ReviewStage[];
  // Book-mode only: the chapter this day belongs to, used to group the path into
  // one-chapter-at-a-time views. Undefined for the final whole-book capstone (and for
  // every non-book path kind, which has no chapter grouping concept).
  chapterGroup?: number;
  // "learn" days (every path kind): reviewed in ReviewChain format as the very first part of
  // the lesson, so recall of recently-learned material gets checked on its own before
  // anything else. For chapter/verse/topic paths (lib/dayPlan.ts), this is just the newVerses
  // of the immediately preceding learn day. For book mode (lib/bookDayPlan.ts), it's the
  // current chapter's own verses learned so far — or, when today's chunk opens a brand new
  // chapter (so there's nothing yet learned in it), the previous chapter in full instead, so
  // the check always has real content to bridge the chapter gap with. Empty when there was no
  // preceding learn day.
  previousVerses?: VerseSegment[];
}

// A scope a location tag can be attached to (see UserProgress.locationTags) — chosen per
// path, any combination at once, at path-creation time (see
// components/gamification/LocationTagLevelPicker.tsx).
export type LocationTagLevel = "book" | "chapter" | "pericope" | "verse";

export interface PathProgress {
  version: string;
  completedDays: number;
  // Set for "book" and "chapter" kind paths — verse/topic paths stay one verse per lesson.
  versesPerDay?: number;
  // Which scopes get an "add location tag" option in this path's Building view — any
  // combination, chosen once at path-creation time. Undefined (an older path, or Building
  // view was off when this one was made) means none.
  locationTagLevels?: LocationTagLevel[];
}

// ---------------------------------------------------------------------------
// Spaced Repetition (long-term review of verses that have graduated into the
// Memorized section — separate from a path's own day-to-day Review section)
// ---------------------------------------------------------------------------

// The "Sword of the Spirit" Leitner-box review system — 4 boxes, each its own fixed cadence
// (see lib/srs.ts's BOX_INTERVAL_DAYS). A 90%+ accuracy review promotes one box; anything
// below sends it all the way back to Box 1, however far up it had climbed.
export type SrsBox = 1 | 2 | 3 | 4 | 5;

export interface SRSState {
  box: SrsBox;
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
// Memory palace (Building-view mnemonics — the reader's own Loci/Peg/Who/Action
// scene per verse, and their own free-text location tags at whichever scopes
// they picked for a path)
// ---------------------------------------------------------------------------

// The reader's own Who/Action/(optional text prop) for one verse, plus the resulting scene
// sentence — either generated by Gemini (see lib/geminiScene.ts) from those fields together
// with the verse's own Loci (its own location tag, if the "verse" level is tagged for this
// path — see UserProgress.locationTags) and Peg (verse-number word), or typed by hand — see
// components/drills/VerseOrientationSummaryRep.tsx. Loci is always read fresh from
// locationTags rather than stored here. Peg starts from lib/pegSystem.ts's recommendation but
// the reader can overwrite it with their own word, so — unlike Loci — that choice IS stored
// here (pegWord); absent/blank means "use the recommendation."
export interface VersePOA {
  who: string;
  action: string;
  additionalInfo: string;
  scene: string;
  pegWord?: string;
}

// ---------------------------------------------------------------------------
// Clause roles (Understand/Orientation stage — the reader's own tags, per book)
// ---------------------------------------------------------------------------

// One reader-defined clause role (e.g. "Command", "Warning") — there is no fixed/preset
// catalog; every role is typed and colored by the reader themselves (see
// components/drills/CustomRoleEditor.tsx). `id` is stable so an edit (rename/recolor) can
// find-and-replace this exact entry rather than appending a duplicate. Tailwind needs class
// names known at build time, so the color is one of lib/verseHighlights.ts's curated
// CUSTOM_ROLE_COLOR_OPTIONS rather than a free hex value.
export interface CustomClauseRole {
  id: string;
  label: string;
  swatchClassName: string;
  washClassName: string;
  blockClassName: string;
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
  // Whether the path view renders BuildingRoomView (the same lesson list as the plain view,
  // with an "add location tag" option at whichever scopes this path picked — see
  // PathProgress.locationTagLevels) instead of the plain list — see
  // components/gamification/DayPathDiagram.tsx.
  buildingViewEnabled: boolean;
  // The reader's own Who/Action/scene for a verse (see VersePOA above), keyed by
  // lib/verseKey.ts's verseKey — shown as that verse's DayCircle icon (alongside its room
  // item) and recalled later as the first, gentlest level of VerseRevealHelp's hint sequence
  // (the scene, then first letters, then the full word).
  versePOA: Record<string, VersePOA>;
  // The reader's own free-text location tags, keyed by lib/locationTags.ts's locationTagKey —
  // one flat map covering every scope (book/chapter/pericope/verse), no predefined
  // suggestions of any kind. A scope with no entry here yet just shows an "add location tag"
  // option instead of a tag; a verse reached before its own tag is set just proceeds with no
  // Loci context in Visualize.
  locationTags: Record<string, string>;
  // Whether the Major/peg number-to-consonant system (see lib/pegSystem.ts) is on — when it
  // is, Visualize pre-fills an editable peg-word field for the verse number alongside the
  // reader's own POA (the reader's own choice IS written back into it — see VersePOA.pegWord),
  // and a short "Learn the system" overview/quiz becomes available wherever Building view is.
  pegSystemEnabled: boolean;
  // The last calendar date (YYYY-MM-DD, local) a Building-view chapter review was shown —
  // gates DailyChapterReviewGate.tsx to at most once per day per the reader's own clock,
  // not tied to any specific path/chapter.
  buildingViewLastReviewDate: string | null;
  // Best chapter-review word-recall accuracy ever recorded per pathKey (a "chapter_review"
  // day's ReviewChain score) — 0-100.
  chapterReviewBestAccuracy: Record<string, number>;
  // Best accuracy (0-100) ever recorded reviewing a memorized entity in SRS, keyed by
  // MemorizedEntity.id — shown when picking among due verse groups, same convention as
  // chapterReviewBestAccuracy above.
  srsBestAccuracy: Record<string, number>;
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
  // The reader's own clause roles for the Understand/Orientation stage, keyed by Bible book
  // name — see CustomClauseRole above. Scoped per book (not per verse/chapter) so a role
  // defined once while working through a book keeps showing up as a quick-select option for
  // every later lesson in that same book, without redefining it each time.
  customClauseRoles: Record<string, CustomClauseRole[]>;
  // Whether an SRS review of a chapter/book verse group that opens a new pericope requires
  // typing that section's heading, blind, before the verse itself (see
  // components/gamification/SrsEntityRecall.tsx) — off skips straight to the verse recall,
  // same as an entity that doesn't open a pericope.
  pericopeHeadingRecallEnabled: boolean;
  // Every individual verse whose most recent SRS review accuracy fell below
  // PROBLEM_VERSE_ACCURACY_THRESHOLD (lib/problemVerses.ts), keyed by lib/verseKey.ts's
  // verseKey — a standing "needs extra practice" list (see components/gamification/
  // ProblemVersesBin.tsx). A multi-verse SRS entity is judged per verse, not as a whole, so
  // one weak verse in an otherwise-strong group still lands here. A verse leaves this list
  // either by scoring PROMOTION_ACCURACY_THRESHOLD or higher (lib/srs.ts) on a later SRS
  // review, or by fully relearning it (components/gamification/RelearnSession.tsx) — a
  // review that lands strictly between the two thresholds changes nothing either way.
  problemVerses: Record<string, ProblemVerseEntry>;
  // Whether a Learn day's "Understand" stage (clause tagging — see VerseOrientationRep) runs
  // at all. Off skips straight to Visualize (orientation_summary) — every later stage already
  // tolerates empty wordAnnotations, the same as an entity that simply never got tagged.
  understandStageEnabled: boolean;
  // Whether a Learn day's "Visualize" stage (Loci/Peg + Who/Action/scene — see
  // VerseOrientationSummaryRep) runs at all. Off skips straight to each verse's own Rhythm
  // stage — every later stage/component already tolerates a verse with no versePOA saved for
  // it, the same as one simply never visualized.
  visualizeStageEnabled: boolean;
  // Whether each verse's "Write First Letter" stage (the handwriting-recognition canvas —
  // see DrawFirstLetterRep) runs during Learn. Off skips straight from Rhythm to the Speak
  // (first-letter hint) stage for every verse that day.
  writeFirstLetterStageEnabled: boolean;
}

// One verse flagged into the Problem Verses bin — see UserProgress.problemVerses above for
// the two ways out (a later strong review, or fully relearning it).
export interface ProblemVerseEntry {
  book: string;
  chapter: number;
  verseNumber: number;
  // Which translation to relearn it in — the entity's own version at the time it was flagged.
  version: string;
  // ISO timestamp of the review that (most recently) flagged this verse.
  flaggedAt: string;
}

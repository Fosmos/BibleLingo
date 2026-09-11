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
  // Set only on a page FRAGMENT of a verse split across two pages — lib/chapterPagination.ts's
  // own paginateSegments, once a verse no longer has to fit a single page whole (the parchment
  // is a fixed size; packing every page as full as the word budget allows means a long verse
  // occasionally straddles the page break, its `text` here holding just this fragment's own
  // slice). How many of this verse's OWN words (lib/verseWords.ts's tokenizeVerseWords count —
  // the same unit every word-reveal drill already indexes by) come before this fragment.
  // Undefined for an ordinary whole verse, or the first fragment of a split one — every reader
  // that isn't specifically rendering a paginated page (drilling/scoring/audio, which always
  // work from real, unfragmented verses fetched directly) never sees this set at all.
  wordOffset?: number;
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
  // When true (and "pericope" is one of locationTagLevels above and pegSystemEnabled is on),
  // each pericope card's header shows a SECOND peg chip pegged to the section's own last verse
  // number, alongside the usual one pegged to its first verse — chosen once at path-creation
  // time, right alongside locationTagLevels (see LocationTagLevelPicker.tsx). Undefined means
  // off, same "never asked/older path" convention as locationTagLevels.
  sectionEndPegEnabled?: boolean;
  // ISO timestamp of the last time completeDay bumped this path's completedDays — the gate
  // behind lib/dayRollover.ts's activeDayNumber: a lesson finished today shouldn't reveal
  // tomorrow's as "today's active lesson" until an actual calendar day boundary passes, even
  // though completedDays itself (real, permanent progress) advances immediately. Undefined for
  // a path with no completion yet, or one completed before this field existed — both read as
  // "no completion today," same self-healing convention this app already uses elsewhere.
  lastCompletedAt?: string;
}

// ---------------------------------------------------------------------------
// Spaced Repetition (long-term review of verses that have graduated into the
// Memorized section — separate from a path's own day-to-day Review section)
// ---------------------------------------------------------------------------

// The "Sword of the Spirit" Leitner-box review system — 5 boxes, each its own fixed cadence
// (see lib/srs.ts's BOX_INTERVAL_DAYS). A review's accuracy is graded into an Again/Hard/Good/
// Easy rating (see lib/srsRating.ts) and steps the box up or down by that rating's own amount
// (see lib/srs.ts's stepBox) — a graduated move by 1 or 2 boxes, not a reset to Box 1.
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
  // A dual-coding companion to locationTags above — one small icon (a Lucide icon id, see
  // lib/verseIcons.ts) per verse, keyed the same way (lib/locationTags.ts's locationTagKey,
  // "verse" scope only). Shown as a margin glyph in the same slot as the loci/peg markers
  // (see ChapterVerseRun.tsx) and as the tap target in IconTagField.tsx.
  iconTags: Record<string, string>;
  // The reader's own Master Peg List — one word per NUMBER (0-99, zero-padded key — see
  // lib/pegSystem.ts's pegMasterListKey), not per scope: unlike locationTags, this is the same
  // single flat map whether it's edited from the Master Peg List settings page
  // (app/profile/peg-list/page.tsx) or inline from any PegTagField.tsx chip in a path view — an
  // edit either place changes that number's word everywhere it's used. A number with no entry
  // here falls back to lib/pegSystem.ts's own Major-System recommendation (see resolvePegWord).
  pegMasterList: Record<string, string>;
  // Whether the Major/peg number-to-consonant system (see lib/pegSystem.ts) is on — when it
  // is, Visualize pre-fills an editable peg-word field for the verse number alongside the
  // reader's own POA (the reader's own choice IS written back into it — see VersePOA.pegWord),
  // and a short "Learn the system" overview/quiz plus the Master Peg List (pegMasterList
  // above) become available from Profile — including the Memory Palace tag view, where it
  // shows an editable PegTagField right next to every location tag spot the reader picked.
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
  // Whether SRS review's own verse-recall step is driven by speaking the verse aloud (see
  // components/drills/FirstLetterSpeakRep.tsx / lib/useFirstLetterSpeaking.ts) instead of
  // typing its first letters (FirstLetterTypeRep.tsx) — both reveal the same way, word by
  // word, one by keystroke and one by recognized speech. Off (typing) by default, matching
  // every other stage in this app defaulting to the option that needs no microphone.
  srsSpeakModeEnabled: boolean;
  // User-configurable override for lib/srs.ts's PROMOTION_ACCURACY_THRESHOLD default (90) —
  // how high an SRS review's accuracy must be to promote a box instead of dropping back to
  // Box 1. Optional (rather than bumped in alongside a schema version) so an existing saved
  // profile missing it just falls back to that same default at every read site, the same
  // self-healing convention SRSState.box already uses — never requires wiping progress.
  srsPromotionThreshold?: number;
  // Every individual verse the reader had to explicitly reveal a letter for during its most
  // recent SRS review (see VerseAccuracy.neededHint in lib/verseAccuracyBreakdown.ts), keyed
  // by lib/verseKey.ts's verseKey — a standing "needs extra practice" list (see
  // components/gamification/
  // ProblemVersesBin.tsx). A multi-verse SRS entity is judged per verse, not as a whole, so
  // one weak verse in an otherwise-strong group still lands here. A verse leaves this list
  // either by scoring PROMOTION_ACCURACY_THRESHOLD or higher (lib/srs.ts) on a later SRS
  // review, or by fully relearning it (components/gamification/RelearnSession.tsx) — a
  // review that lands strictly between the two thresholds changes nothing either way.
  problemVerses: Record<string, ProblemVerseEntry>;
  // Cumulative per-word SRS miss counts, keyed by lib/verseKey.ts's verseKey — see
  // lib/stumbleTracking.ts. Powers the Stumble Map heat-map view (surfaced from
  // ProblemVersesBin.tsx): which exact words in a verse are the reader's actual weak points,
  // not just which whole verses. Grows across every review, never resets — a word that was
  // hard once but has since improved fades relative to a currently weak one rather than
  // staying permanently flagged.
  wordStumbleCounts: Record<string, number[]>;
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
  // see DrawFirstLetterRep) runs during Learn. Off skips straight from Rhythm (or Listen, if
  // Rhythm itself is off — see rhythmStageEnabled) to the Speak (first-letter hint) stage for
  // every verse that day.
  writeFirstLetterStageEnabled: boolean;
  // Whether each verse's "Fill in the Blank" stage (the word-bank tap exercise — see
  // FillInTheBlankRep) runs during Learn, right before the Speak hint. Off skips straight to
  // the Speak hint (from Rhythm, or from Write First Letter if that's on) for every verse
  // that day.
  fillInTheBlankStageEnabled: boolean;
  // Whether each verse's own "Rhythm" stage (tap-through-the-words pacing drill) runs during
  // Learn — OPTIONAL, defaulting off: Listen (kineticTextStageEnabled below) is the default
  // whole-day introduction to a fresh verse now, and Rhythm is the deliberate, opt-in
  // alternative/addition for a reader who still wants that per-verse tap-through pacing too.
  // Off skips straight from Visualize to Write First Letter (or the Speak hint, if that's also
  // off) for every verse that day — the same "just don't insert the step" convention every
  // other optional stage here follows.
  rhythmStageEnabled: boolean;
  // Whether a Learn day's "Listen" stage (the whole day's text narrated aloud via the Web
  // Speech API, each word highlighted in real time as it's spoken — see KineticTextRep) runs
  // at all. Sits right after Visualize (orientation_summary), before the first verse's own
  // per-verse stages — the DEFAULT introduction to a fresh verse (see rhythmStageEnabled
  // above, its own now-optional counterpart). Off skips straight to whichever per-verse stage
  // is first, same "just don't insert the step" convention every other optional whole-day
  // stage here follows.
  kineticTextStageEnabled: boolean;
  // The reader's own weekly day off (0 = Sunday ... 6 = Saturday), or null for no rest day
  // set (the default — every day behaves as it always has). On that calendar day: a lapse in
  // streakActions.ts's evaluateStreakOnLoad that would otherwise cost the streak is forgiven
  // instead of spending a freeze or resetting it, and lib/srs.ts's scheduleReview never lands
  // a fresh review's next due date exactly on it (pushed a day later instead) — so neither the
  // streak nor the SRS queue pressures the reader to show up on their own chosen day off.
  restDayOfWeek: number | null;
  // The reader's own local wind-down hour (0-23), or null for off (the default) — Home offers
  // to switch into Vespers mode (components/gamification/VespersView.tsx) once the local
  // clock reaches this hour, same optional-scheduling convention as restDayOfWeek above.
  vespersHour: number | null;
  // Date key (see lib/dateKey.ts's todayDateKey) of the last time the reader dismissed the
  // Vespers prompt with "Not tonight" — stops it re-offering again the same calendar day;
  // self-clears the next day since it's compared against, not decremented.
  vespersPromptDismissedDate: string | null;
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

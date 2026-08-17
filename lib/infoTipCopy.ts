// Centralized copy for every InfoTip in the app — kept in one file so component files stay
// short and a tester/reviewer can scan or edit all the explanations in one place rather than
// hunting through 25+ component files.
export const INFO_TIPS = {
  speakRep:
    "Speak the verse aloud. Uses your browser's speech recognition (Chrome/Edge only) to check what you said against the verse text — no exact match required, close is fine.",
  writeRep:
    "Type the verse from memory (or copy it, on the first rep when it's shown). Checked with fuzzy matching, so minor typos/punctuation differences still pass.",
  wordBankRound:
    "Tap the missing words, in order, from the bank below — tiles are listed alphabetically with punctuation stripped. A wrong tap restarts this round from its first blank.",
  firstLetterTypeRep:
    "Type just the first letter of each word, in order, to reveal it. A wrong letter restarts this pass through the verse from word 1.",
  reviewChain:
    "Same first-letter mechanic as above, chained across every verse being reviewed here, with an accuracy score at the end.",
  chapterReviewStage:
    "A multi-part review before moving on: yesterday's verses (if any), the full chapter's words, then a spoken recitation of the whole thing.",
  bossBattleStage:
    "Type every verse in the chapter/path word-for-word, back to back, with 5 lives per attempt. Run out of lives and it restarts from the beginning.",
  practiceChain:
    "A redoable, no-stakes replay of the Boss Battle's word-for-word typing — doesn't touch progress or lock state, just for practice.",
  masteryChaseRound:
    "Type the first letter of each word to keep your runner ahead of the pursuing chariots, which close in on their own pace. A wrong letter doesn't set you back — it jumps the chariots closer instead, and you still need to get that word right.",
  pathKindPicker:
    "Choose what scope to memorize: a whole book, one chapter, a single verse, or a curated topic. Each has its own lesson structure.",
  versionPicker: "Pick which Bible translation to memorize this passage in.",
  versesPerDayPicker:
    "Sets how many new verses each lesson introduces. Larger amounts mean fewer, bigger lessons; smaller amounts mean more, shorter ones.",
  bookChapterGrid:
    "Pick a book, then a chapter, to build a memorization path from. Content is fetched and cached the first time you select it.",
  masteryPassagePicker: "Choose the verse, chapter, or book (and translation) to test in Mastery Mode.",
  masteryLevelPicker:
    "5 difficulty levels — Level 1 is a slow chaser with a big head start; Level 5 requires a quick, near-mistake-free pace and grants the Mastery sticker for this passage.",
  streakCounter: "Days in a row you've completed at least one lesson. Resets if a full day is missed without a streak freeze.",
  streakFreezeBadge: "Streak freezes auto-protect one missed day. You earn one every time you hit a streak milestone.",
  shekelCounter: "In-app currency earned by completing lessons, boss battles, and perfect SRS reviews. Currently cosmetic/for tracking only.",
  dayPathDiagram:
    "Each circle is one lesson in order — filled/checked means done, ringed means it's next up, greyed-out with a lock is still ahead (but tappable to preview). A slim bar under the current lesson shows how far into it you got before you left.",
  srsOverview:
    "Spaced-repetition review for verses you've fully learned — due verses are surfaced on a schedule so they stay memorized long-term.",
  stickerBook: "A collectible record of every path, boss battle, and Mastery level you've cleared.",
  includeVerseReferencesToggle:
    'When on, shows the verse number/reference inline in the text (e.g. "1:1 Paul and Timotheus...") wherever a verse is displayed.',
  resetProgressButton: "Erases all progress for this account — paths, streak, stickers, memorized verses. Cannot be undone.",
  signOutButton: "Signs out of this account. Your progress stays saved and reloads next time you sign back in.",
} as const;

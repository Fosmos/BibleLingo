// Centralized copy for every InfoTip in the app — kept in one file so component files stay
// short and a tester/reviewer can scan or edit all the explanations in one place rather than
// hunting through 25+ component files.
export const INFO_TIPS = {
  verseOrientationRep:
    "The passage starts as one unified card — tap a word to split it into clauses yourself (tap the last word of a clause to merge it back), and drag a card by its handle to reorder it. To classify a clause, tap its card to select it, then tap a color in the row above the list — there's no preset list of roles, so tap \"+ Custom\" to name and color your own (e.g. Command, Promise, Warning); once saved it's remembered for this whole book, so it shows up ready to reuse in every later lesson here too. Tap the same color again to undo, or \"Edit\" beneath a role to rename or recolor it. Not graded, just a way to actively work out the passage's structure before drilling into it — the roles stay visible for the rest of this lesson.",
  verseOrientationSummaryRep:
    "Read the verse once more in full, then fill in Who and Action (plus any extra detail) — alongside this verse's fixed Loci (room item) and Peg (verse-number word, when that's on). Tap \"Generate scene\" to have those turned into one vivid sentence, or type your own. Not graded, just a way to build a vivid, personal picture before drilling into it.",
  rhythmRep:
    "Every noun and verb in the verse is shown in bold capitals. One word is highlighted at a time — tap the bar below to move to the next word (it plays aloud as you go), bold words included.",
  fillInTheBlankRep:
    "Two rounds: first with every other word blanked, then with every word blanked. Tap the missing ones, in order, from the bank below — tiles are listed alphabetically with punctuation stripped, so their position never hints at the answer. A wrong tap flashes red and reverts to the last checkpoint (every 4 blanks) rather than all the way back to the start.",
  drawFirstLetterRep:
    "The whole verse is shown with the current item highlighted — not just words, but punctuation marks and verse-number markers too, each getting their own turn. Draw whatever's current with your finger, Apple Pencil, or mouse; handwriting recognition auto-advances once it detects you've drawn something legible (not auto-graded — it only checks that something was drawn, never whether it's correct). Punctuation and verse numbers auto-reveal on their own with nothing to draw. Either way, Next reveals the real printed item (a word's first letter, or the mark/number itself) in a growing strip under the verse and clears the canvas for what's next — tap it yourself any time if recognition is slow.",
  prayRep:
    "Start the timer (30 seconds, or 1 minute on a day with more than 3 new verses) and take that time to pray about the verse — what it means, and how you want to respond to it. Continue unlocks once the timer finishes. The lesson's very last stage, right before whatever review follows.",
  speakRep:
    "Speak the verse aloud. Uses your browser's speech recognition to check what you said against the verse text — no exact match required, close is fine. When only first letters are shown, hover (or tap) one to reveal that word if you're stuck. If microphone access is declined, you can skip to the next exercise.",
  writeRep:
    "Type the verse from memory (or copy it, on the first rep when it's shown). Checked with fuzzy matching, so minor typos/punctuation differences still pass.",
  kineticTextRep:
    "The whole day's text read aloud by your browser's own voice, one word highlighted at a time as it's actually spoken. Tap Listen to play (Pause to stop partway); tap it again anytime to listen once more before continuing. Not graded — just a synced read-along pass before drilling into each verse.",
  listenVerseRep:
    "This verse read aloud by your browser's own voice, one word highlighted at a time as it's actually spoken — the automatic first pass on every verse, before its own Rhythm/Write/Speak/Type stages. Tap Listen to play (Pause to stop partway); tap it again anytime to listen once more before continuing. Not graded.",
  firstLetterTypeRep:
    "Type just the first letter of each word, in order, to reveal it. A wrong letter restarts this pass through the verse from word 1.",
  reviewChain:
    "Same first-letter mechanic as above, chained across every verse being reviewed here. A wrong letter, a wrong reference number, or revealing the whole word bounces you back to the start of just that one verse (every earlier verse in the chain stays revealed) — so the review only finishes once every verse has, in the end, been typed correctly in one clean pass. \"Reveal next letter\" alone is a free hint, no restart. The accuracy score at the end reflects every miss along the way, even ones you later got right.",
  chapterReviewStage:
    "A multi-part review before moving on: the full chapter's words, then a spoken recitation of the whole thing.",
  bossBattleStage:
    "Recite every verse in the section/path, back to back — a section boss battle only needs each word's first letter, the whole-path finale needs the full word. 5 lives per attempt, except a section boss battle (every 8 chapters, book mode) gets 20 for its longer recitation. Run out of lives and it restarts from the beginning.",
  practiceChain:
    "A redoable, no-stakes replay of the word-for-word typing — doesn't touch progress or lock state. For a boss battle, it's practice before/after the real attempt; for a completed lesson's own Review button, it's just a quick way to revisit those verses.",
  masteryChaseRound:
    "Type the first letter of each word to keep your runner ahead of the pursuing chariots, which close in on their own pace. A wrong letter doesn't set you back — it jumps the chariots closer instead, and you still need to get that word right.",
  pathKindPicker:
    "Choose what scope to memorize: a whole book, one chapter, a single verse, or a curated topic. Each has its own lesson structure.",
  versionPicker: "Pick which Bible translation to memorize this passage in.",
  versesPerDayPicker:
    "Sets how many new verses each lesson introduces. Larger amounts mean fewer, bigger lessons; smaller amounts mean more, shorter ones.",
  learnIntensitySlider:
    "How many encoding stages each new verse gets during Learn, from a quick pass (Rhythm, Speak hint, Type by first letter, Speak with nothing) up to every stage this app offers. Each step up adds one more stage and takes longer per verse, but tends to make the verse stick harder. Review, Pray, and cumulative review are unaffected either way — this only changes how a verse is first learned. Changing it here changes your Fill in the Blank / Visualize / Write First Letter / Understand settings for every future lesson, not just this path.",
  customizeStagesToggle:
    "Pick each stage individually instead of using one of the slider's presets — starts from whatever's on right now.",
  memoryPalaceToggle:
    "Add free-text location tags at whichever scopes you pick next (book, chapter, section, or verse) — no suggestions, just your own words. Leave this off to skip straight to creating the path.",
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
  swordOfTheSpirit:
    "A Leitner box system: every verse or chapter enters Box 1 (every 1 day) the moment it's memorized. Score 90% or higher on a review's first-letter typing to move up a box — Box 2 (every 3 days), Box 3 (every 7 days), Box 4 (every 14 days), then Box 5 (every 30 days). Fall below 90% and it drops back just one box, not all the way to Box 1.",
  stickerBook: "A collectible record of every path, boss battle, and Mastery level you've cleared.",
  includeVerseReferencesToggle:
    'When on, shows the verse number/reference inline in the text (e.g. "1:1 Paul and Timotheus...") wherever a verse is displayed.',
  buildingViewToggle:
    "When on, the path view lets you add free-text \"location tags\" wherever you like — starting a book or chapter path with this on adds one more step: pick which scopes (Book, Chapter, Pericope, Verse) get an \"add location tag\" option, any combination, none required, plus a Pegs checkbox that adds a peg-word badge alongside each one. No suggestions of any kind — whatever you type is saved as-is, and you can tap a tag again anytime to change it. When off, the path view is the plain lesson list with no tags at all. Lessons are grouped the same way either way — the \"how many verses per day\" step sets how many verses one lesson teaches, same as the plain view; a lesson covering several verses just gets a location tag field for each one.",
  locationTagLevelPicker:
    "Which scopes get an \"add location tag\" option in this path's Building view — any combination of Book, Chapter, Pericope, and Verse, or none at all. Plain free text, no suggestions — tap a tag again anytime to change it. Chosen once, now, for this path.",
  pegSystemToggle:
    "The classic Major/peg mnemonic system: each digit (0-9) maps to a consonant sound and a picturable word (e.g. 1 = T/D = \"Tie\"). When on, the Visualize stage pre-fills a peg-system word for the verse number alongside (not instead of) your own Person/Action/Object scene — edit it if you'd rather use a different word. It also adds an editable peg word chip next to the chapter, pericope, and verse location tag spots the Memory Palace step's own scopes turned on — the chapter number, the verse the section starts with, or the verse number itself (never the book tag — a book has no natural number to peg). Every peg chip pulls from (and edits) your own Master Peg List — one word per number, 01-99 — so changing a number's word anywhere changes it everywhere that number shows up; edit the whole list at once from \"Edit peg words.\" Tap \"Learn the system\" for a quick overview and quiz.",
  sectionEndPegToggle:
    "Only shown when Pericope tags and Pegs are both on. Adds a second peg chip to each section, pegged to the verse it ENDS with (its own start-verse peg is always shown) — handy for a two-ended mnemonic route through a longer section. Off by default; chosen once per path, same as the tag scopes above.",
  understandStageToggle:
    "When off, a Learn day skips straight to Visualize (or straight to Listen/each verse's own first stage, if that's off too) — no clause-tagging step. Turn it back on any time to bring it back for later lessons.",
  visualizeStageToggle:
    "When off, a Learn day skips straight to Listen (or each verse's own first stage, if that's off too) — no Loci/Peg + Who/Action/scene step. Verses learned with it off just show no room item, peg word, or scene wherever those would otherwise appear (their circle, SRS review, etc.). Turn it back on any time to bring it back for later lessons.",
  writeFirstLetterStageToggle:
    "When off, each verse's Learn stages skip straight from Rhythm (or straight to Speak, the first-letter hint, if Rhythm is off too) — no handwriting-recognition canvas. Turn it back on any time to bring it back for later lessons.",
  fillInTheBlankStageToggle:
    "When off, each verse's Learn stages skip straight to the Speak hint (from Rhythm or Write First Letter, whichever ran last) — no word-bank tap exercise beforehand. Turn it back on any time to bring it back for later lessons.",
  kineticTextStageToggle:
    "When on, adds a \"Listen\" step right after Visualize (or right after Understand, or first thing, if those are off) — the whole day's text read aloud with each word highlighted as it's spoken. On by default, as the introduction to each fresh verse. Uses your browser's own built-in voice — no audio files, nothing downloaded.",
  rhythmStageToggle:
    "When on, adds a \"Rhythm\" step for each verse — tap through its words at your own pace before Write First Letter/Speak. Off by default now that Listen (above) is the default whole-day introduction to a fresh verse; turn this back on for the per-verse tap-through pacing too.",
  srsPromotionThresholdSlider:
    "How high an SRS review's first-letter typing accuracy must be to promote a verse group up a box (Sword of the Spirit) instead of dropping it back one box. Defaults to 90%.",
  srsSpeakModeToggle:
    "When on, SRS review's verse-recall step listens to you recite the verse aloud instead of typing its first letters — words reveal as you say them, the same word-by-word way. When off (the default), review uses the on-screen keyboard as usual. Needs microphone access.",
  restDayPicker:
    "Pick one day a week to always have off. On that day, missing your streak doesn't cost a freeze or reset it, and a fresh SRS review never comes due exactly on it either — everything just picks back up the next day. Tap the same day again to clear it.",
  vespersHourPicker:
    "Pick a local hour, and Home offers a quiet, warm-toned prompt to recall a few previous lessons' verses by first letter once the clock reaches it — a calm retrieval moment, not a graded one, and it never affects your progress, SRS boxes, or streak. Tap \"Not tonight\" to skip it for the rest of that day; it'll offer again the next evening.",
  problemVersesBin:
    "Any individual verse whose most recent SRS review accuracy fell below 80% lands here — a standing list, separate from its Sword of the Spirit box, so a weak verse in an otherwise-strong group still stands out for extra practice. It clears back out once a later review scores 90% or higher, or tap Relearn to run through the full Learn flow for that verse again.",
  stumbleMapsSection:
    "Every verse you've reviewed at least once, worst first — tap one to see exactly which words have tripped you up, color-coded by how many times each word's been missed (1-2 misses, 3-4, or 5+). The scale is fixed and the same for every verse, so a color always means the same thing everywhere, not just \"worse than the rest of this verse.\"",
  resetProgressButton: "Erases all progress for this account — paths, streak, stickers, memorized verses. Cannot be undone.",
  signOutButton: "Signs out of this account. Your progress stays saved and reloads next time you sign back in.",
  signInButton:
    "Create a username + password (or sign into an existing one) so your progress is saved to a named account instead of just this device's local profile — your current progress carries over automatically when you create one. Everything still works without this; it's optional.",
} as const;

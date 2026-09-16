// The literary-section grouping the Mind Map inserts between Book and Chapter for a long
// enough book — Bible -> Testament -> Genre -> Book -> Theme -> Chapter -> Pericope. A book
// short enough that its own chapter list is already easy to scan (see the cutoff this file's
// own coverage below implies — 6+ chapters) simply has no entry here at all;
// lib/mindMapHierarchy.ts's own buildBook falls straight back to today's Book -> Chapter ->
// Pericope shape for it, same as before this level existed. Every entry that DOES exist covers
// its book's full chapter range exactly once, contiguously, 1..chapterCount (see
// lib/__debug_bookThemes.ts-style checks run during development) — chapter-level, not
// verse-level, since verse counts for a non-active book's later chapters aren't loaded
// synchronously (only the active book's own real day-plan data is — see
// lib/mindMapHierarchy.ts's own doc comment on that same rule).
export interface BookTheme {
  id: string;
  label: string;
  startChapter: number;
  endChapter: number;
}

export const BOOK_THEMES: Record<string, BookTheme[]> = {
  // ---- Old Testament ----
  Genesis: [
    { id: "primeval-history", label: "Primeval History", startChapter: 1, endChapter: 11 },
    { id: "abraham", label: "Abraham", startChapter: 12, endChapter: 25 },
    { id: "jacob", label: "Jacob", startChapter: 26, endChapter: 36 },
    { id: "joseph", label: "Joseph", startChapter: 37, endChapter: 50 },
  ],
  Exodus: [
    { id: "egypt-and-exodus", label: "Israel in Egypt & the Exodus", startChapter: 1, endChapter: 15 },
    { id: "wilderness-to-sinai", label: "Wilderness Journey to Sinai", startChapter: 16, endChapter: 18 },
    { id: "sinai-covenant", label: "Covenant at Sinai", startChapter: 19, endChapter: 24 },
    { id: "tabernacle", label: "The Tabernacle", startChapter: 25, endChapter: 40 },
  ],
  Leviticus: [
    { id: "sacrifice-laws", label: "Laws of Sacrifice", startChapter: 1, endChapter: 7 },
    { id: "priesthood-ordained", label: "Priesthood Ordained", startChapter: 8, endChapter: 10 },
    { id: "clean-unclean", label: "Clean and Unclean", startChapter: 11, endChapter: 15 },
    { id: "day-of-atonement", label: "Day of Atonement", startChapter: 16, endChapter: 16 },
    { id: "holiness-code", label: "Call to Holiness", startChapter: 17, endChapter: 27 },
  ],
  Numbers: [
    { id: "preparing-at-sinai", label: "Preparing to Leave Sinai", startChapter: 1, endChapter: 10 },
    { id: "wilderness-rebellion", label: "Wilderness Rebellion", startChapter: 11, endChapter: 25 },
    { id: "new-generation-moab", label: "New Generation in Moab", startChapter: 26, endChapter: 36 },
  ],
  Deuteronomy: [
    { id: "moses-recalls", label: "Moses Recalls the Journey", startChapter: 1, endChapter: 4 },
    { id: "law-renewed", label: "The Law Renewed", startChapter: 5, endChapter: 26 },
    { id: "blessings-curses", label: "Blessings and Curses", startChapter: 27, endChapter: 30 },
    { id: "moses-final-words", label: "Moses' Final Words", startChapter: 31, endChapter: 34 },
  ],
  Joshua: [
    { id: "conquest", label: "Conquest of Canaan", startChapter: 1, endChapter: 12 },
    { id: "dividing-the-land", label: "Dividing the Land", startChapter: 13, endChapter: 21 },
    { id: "covenant-renewed", label: "Covenant Renewed", startChapter: 22, endChapter: 24 },
  ],
  Judges: [
    { id: "incomplete-conquest", label: "Incomplete Conquest", startChapter: 1, endChapter: 2 },
    { id: "cycles-of-judges", label: "Cycles of the Judges", startChapter: 3, endChapter: 16 },
    { id: "moral-decline", label: "Israel's Moral Decline", startChapter: 17, endChapter: 21 },
  ],
  "1 Samuel": [
    { id: "samuel-the-judge", label: "Samuel the Judge", startChapter: 1, endChapter: 7 },
    { id: "saul-made-king", label: "Saul Made King", startChapter: 8, endChapter: 15 },
    { id: "saul-and-david", label: "Saul and David", startChapter: 16, endChapter: 31 },
  ],
  "2 Samuel": [
    { id: "david-becomes-king", label: "David Becomes King", startChapter: 1, endChapter: 10 },
    { id: "davids-sin", label: "David's Sin and Its Cost", startChapter: 11, endChapter: 20 },
    { id: "davids-final-years", label: "David's Final Years", startChapter: 21, endChapter: 24 },
  ],
  "1 Kings": [
    { id: "solomons-reign", label: "Solomon's Reign", startChapter: 1, endChapter: 11 },
    { id: "kingdom-divides", label: "The Kingdom Divides", startChapter: 12, endChapter: 16 },
    { id: "elijah", label: "Elijah", startChapter: 17, endChapter: 22 },
  ],
  "2 Kings": [
    { id: "elisha", label: "Elisha's Ministry", startChapter: 1, endChapter: 8 },
    { id: "israel-judah-kings", label: "Israel and Judah's Kings", startChapter: 9, endChapter: 17 },
    { id: "judah-until-exile", label: "Judah Until the Exile", startChapter: 18, endChapter: 25 },
  ],
  "1 Chronicles": [
    { id: "genealogies", label: "Genealogies", startChapter: 1, endChapter: 9 },
    { id: "sauls-death", label: "Saul's Death", startChapter: 10, endChapter: 10 },
    { id: "davids-reign", label: "David's Reign", startChapter: 11, endChapter: 29 },
  ],
  "2 Chronicles": [
    { id: "solomons-reign", label: "Solomon's Reign", startChapter: 1, endChapter: 9 },
    { id: "kings-of-judah", label: "Kings of Judah", startChapter: 10, endChapter: 36 },
  ],
  Ezra: [
    { id: "return-from-exile", label: "Return from Exile", startChapter: 1, endChapter: 6 },
    { id: "ezras-reforms", label: "Ezra's Reforms", startChapter: 7, endChapter: 10 },
  ],
  Nehemiah: [
    { id: "rebuilding-the-wall", label: "Rebuilding the Wall", startChapter: 1, endChapter: 7 },
    { id: "renewing-the-covenant", label: "Renewing the Covenant", startChapter: 8, endChapter: 13 },
  ],
  Esther: [
    { id: "esther-becomes-queen", label: "Esther Becomes Queen", startChapter: 1, endChapter: 2 },
    { id: "hamans-plot", label: "Haman's Plot", startChapter: 3, endChapter: 7 },
    { id: "deliverance", label: "Deliverance of the Jews", startChapter: 8, endChapter: 10 },
  ],
  Job: [
    { id: "jobs-suffering", label: "Job's Suffering", startChapter: 1, endChapter: 3 },
    { id: "dialogues-with-friends", label: "Dialogues with Friends", startChapter: 4, endChapter: 31 },
    { id: "elihu-speaks", label: "Elihu Speaks", startChapter: 32, endChapter: 37 },
    { id: "the-lord-answers", label: "The LORD Answers Job", startChapter: 38, endChapter: 42 },
  ],
  Psalms: [
    { id: "book-1", label: "Book I", startChapter: 1, endChapter: 41 },
    { id: "book-2", label: "Book II", startChapter: 42, endChapter: 72 },
    { id: "book-3", label: "Book III", startChapter: 73, endChapter: 89 },
    { id: "book-4", label: "Book IV", startChapter: 90, endChapter: 106 },
    { id: "book-5", label: "Book V", startChapter: 107, endChapter: 150 },
  ],
  Proverbs: [
    { id: "solomons-wisdom", label: "Solomon's Wisdom", startChapter: 1, endChapter: 9 },
    { id: "proverbs-of-solomon", label: "Proverbs of Solomon", startChapter: 10, endChapter: 29 },
    { id: "words-of-the-wise", label: "Words of the Wise", startChapter: 30, endChapter: 31 },
  ],
  Ecclesiastes: [
    { id: "lifes-vanity", label: "Life's Vanity", startChapter: 1, endChapter: 6 },
    { id: "wisdoms-limits", label: "Wisdom's Limits", startChapter: 7, endChapter: 12 },
  ],
  "Song of Solomon": [
    { id: "courtship", label: "Courtship", startChapter: 1, endChapter: 3 },
    { id: "wedding", label: "The Wedding", startChapter: 4, endChapter: 5 },
    { id: "enduring-love", label: "Enduring Love", startChapter: 6, endChapter: 8 },
  ],
  Isaiah: [
    { id: "judgment-on-judah", label: "Judgment on Judah & the Nations", startChapter: 1, endChapter: 39 },
    { id: "comfort-for-gods-people", label: "Comfort for God's People", startChapter: 40, endChapter: 55 },
    { id: "zions-future-glory", label: "Zion's Future Glory", startChapter: 56, endChapter: 66 },
  ],
  Jeremiah: [
    { id: "judgment-on-judah", label: "Judgment on Judah", startChapter: 1, endChapter: 25 },
    { id: "jeremiahs-life", label: "Jeremiah's Life & Suffering", startChapter: 26, endChapter: 45 },
    { id: "judgment-on-nations", label: "Judgment on the Nations", startChapter: 46, endChapter: 51 },
    { id: "fall-of-jerusalem", label: "Fall of Jerusalem", startChapter: 52, endChapter: 52 },
  ],
  Ezekiel: [
    { id: "judgment-on-judah", label: "Judgment on Judah", startChapter: 1, endChapter: 24 },
    { id: "judgment-on-nations", label: "Judgment on the Nations", startChapter: 25, endChapter: 32 },
    { id: "israels-restoration", label: "Israel's Restoration", startChapter: 33, endChapter: 48 },
  ],
  Daniel: [
    { id: "daniel-at-court", label: "Daniel at Babylon's Court", startChapter: 1, endChapter: 6 },
    { id: "daniels-visions", label: "Daniel's Visions", startChapter: 7, endChapter: 12 },
  ],
  Hosea: [
    { id: "hoseas-marriage", label: "Hosea's Marriage", startChapter: 1, endChapter: 3 },
    { id: "israels-unfaithfulness", label: "Israel's Unfaithfulness", startChapter: 4, endChapter: 10 },
    { id: "restoration-promised", label: "Restoration Promised", startChapter: 11, endChapter: 14 },
  ],
  Amos: [
    { id: "judgment-on-nations", label: "Judgment on the Nations", startChapter: 1, endChapter: 2 },
    { id: "judgment-on-israel", label: "Judgment on Israel", startChapter: 3, endChapter: 6 },
    { id: "visions-of-judgment", label: "Visions of Judgment", startChapter: 7, endChapter: 9 },
  ],
  Micah: [
    { id: "judgment-on-israel-judah", label: "Judgment on Israel & Judah", startChapter: 1, endChapter: 3 },
    { id: "promise-of-restoration", label: "Promise of Restoration", startChapter: 4, endChapter: 5 },
    { id: "call-to-justice", label: "Call to Justice", startChapter: 6, endChapter: 7 },
  ],
  Zechariah: [
    { id: "visions-of-restoration", label: "Visions of Restoration", startChapter: 1, endChapter: 6 },
    { id: "messages-on-fasting", label: "Messages on Fasting", startChapter: 7, endChapter: 8 },
    { id: "the-coming-king", label: "The Coming King", startChapter: 9, endChapter: 14 },
  ],

  // ---- New Testament ----
  Matthew: [
    { id: "birth-and-preparation", label: "Birth and Preparation", startChapter: 1, endChapter: 4 },
    { id: "sermon-on-the-mount", label: "Sermon on the Mount", startChapter: 5, endChapter: 7 },
    { id: "galilean-ministry", label: "Ministry in Galilee", startChapter: 8, endChapter: 18 },
    { id: "journey-to-jerusalem", label: "Journey to Jerusalem", startChapter: 19, endChapter: 20 },
    { id: "passion-week", label: "Passion Week", startChapter: 21, endChapter: 27 },
    { id: "resurrection", label: "The Resurrection", startChapter: 28, endChapter: 28 },
  ],
  Mark: [
    { id: "the-beginning", label: "The Beginning", startChapter: 1, endChapter: 1 },
    { id: "galilean-ministry", label: "Galilean Ministry", startChapter: 2, endChapter: 8 },
    { id: "on-the-way-to-jerusalem", label: "On the Way to Jerusalem", startChapter: 9, endChapter: 10 },
    { id: "passion-week", label: "Passion Week in Jerusalem", startChapter: 11, endChapter: 15 },
    { id: "resurrection", label: "The Resurrection", startChapter: 16, endChapter: 16 },
  ],
  Luke: [
    { id: "birth-and-childhood", label: "Birth and Childhood", startChapter: 1, endChapter: 2 },
    { id: "preparation-for-ministry", label: "Preparation for Ministry", startChapter: 3, endChapter: 4 },
    { id: "galilean-ministry", label: "Galilean Ministry", startChapter: 5, endChapter: 9 },
    { id: "journey-to-jerusalem", label: "Journey to Jerusalem", startChapter: 10, endChapter: 19 },
    { id: "passion-week", label: "Passion Week", startChapter: 20, endChapter: 23 },
    { id: "resurrection", label: "The Resurrection", startChapter: 24, endChapter: 24 },
  ],
  John: [
    { id: "prologue", label: "Prologue", startChapter: 1, endChapter: 1 },
    { id: "signs-and-discourses", label: "Signs and Discourses", startChapter: 2, endChapter: 11 },
    { id: "passion-week-begins", label: "Passion Week Begins", startChapter: 12, endChapter: 13 },
    { id: "upper-room-discourse", label: "The Upper Room Discourse", startChapter: 14, endChapter: 17 },
    { id: "crucifixion", label: "Crucifixion", startChapter: 18, endChapter: 19 },
    { id: "resurrection", label: "The Resurrection", startChapter: 20, endChapter: 21 },
  ],
  Acts: [
    { id: "church-in-jerusalem", label: "The Church in Jerusalem", startChapter: 1, endChapter: 7 },
    { id: "spreading-out", label: "Spreading to Judea & Samaria", startChapter: 8, endChapter: 12 },
    { id: "pauls-first-journey", label: "Paul's First Journey", startChapter: 13, endChapter: 14 },
    { id: "jerusalem-council", label: "The Jerusalem Council", startChapter: 15, endChapter: 15 },
    { id: "pauls-later-journeys", label: "Paul's Later Journeys", startChapter: 16, endChapter: 20 },
    { id: "pauls-arrest", label: "Paul's Arrest and Trials", startChapter: 21, endChapter: 26 },
    { id: "paul-reaches-rome", label: "Paul Reaches Rome", startChapter: 27, endChapter: 28 },
  ],
  Romans: [
    { id: "sin-and-righteousness", label: "Sin and Righteousness", startChapter: 1, endChapter: 4 },
    { id: "life-in-the-spirit", label: "Life in the Spirit", startChapter: 5, endChapter: 8 },
    { id: "israels-place", label: "Israel's Place in God's Plan", startChapter: 9, endChapter: 11 },
    { id: "living-faith", label: "Living Faith", startChapter: 12, endChapter: 16 },
  ],
  "1 Corinthians": [
    { id: "divisions-in-the-church", label: "Divisions in the Church", startChapter: 1, endChapter: 4 },
    { id: "moral-and-legal-issues", label: "Moral and Legal Issues", startChapter: 5, endChapter: 7 },
    { id: "christian-freedom", label: "Christian Freedom", startChapter: 8, endChapter: 11 },
    { id: "gifts-and-love", label: "Spiritual Gifts and Love", startChapter: 12, endChapter: 14 },
    { id: "the-resurrection", label: "The Resurrection", startChapter: 15, endChapter: 16 },
  ],
  "2 Corinthians": [
    { id: "pauls-ministry", label: "Paul's Ministry Explained", startChapter: 1, endChapter: 7 },
    { id: "collection-for-jerusalem", label: "The Collection for Jerusalem", startChapter: 8, endChapter: 9 },
    { id: "paul-defends-apostleship", label: "Paul Defends His Apostleship", startChapter: 10, endChapter: 13 },
  ],
  Galatians: [
    { id: "paul-defends-gospel", label: "Paul Defends His Gospel", startChapter: 1, endChapter: 2 },
    { id: "justified-by-faith", label: "Justified by Faith", startChapter: 3, endChapter: 4 },
    { id: "freedom-in-the-spirit", label: "Freedom in the Spirit", startChapter: 5, endChapter: 6 },
  ],
  Ephesians: [
    { id: "riches-in-christ", label: "Riches in Christ", startChapter: 1, endChapter: 3 },
    { id: "walking-in-unity", label: "Walking in Unity", startChapter: 4, endChapter: 6 },
  ],
  "1 Timothy": [
    { id: "sound-doctrine-and-order", label: "Sound Doctrine and Order", startChapter: 1, endChapter: 3 },
    { id: "instructions-for-ministry", label: "Instructions for Ministry", startChapter: 4, endChapter: 6 },
  ],
  Hebrews: [
    { id: "christ-superior", label: "Christ Superior to All", startChapter: 1, endChapter: 7 },
    { id: "new-covenant", label: "The New Covenant", startChapter: 8, endChapter: 10 },
    { id: "faith-in-action", label: "Faith in Action", startChapter: 11, endChapter: 13 },
  ],
  Revelation: [
    { id: "seven-churches", label: "Letters to the Seven Churches", startChapter: 1, endChapter: 3 },
    { id: "throne-room-vision", label: "The Throne Room Vision", startChapter: 4, endChapter: 5 },
    { id: "seals-and-trumpets", label: "The Seven Seals & Trumpets", startChapter: 6, endChapter: 11 },
    { id: "dragon-and-beasts", label: "The Dragon and the Beasts", startChapter: 12, endChapter: 14 },
    { id: "bowls-of-wrath", label: "Bowls of Wrath", startChapter: 15, endChapter: 18 },
    { id: "return-of-christ", label: "The Return of Christ", startChapter: 19, endChapter: 20 },
    { id: "new-creation", label: "The New Creation", startChapter: 21, endChapter: 22 },
  ],
};

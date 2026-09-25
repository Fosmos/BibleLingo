import { landmarkIconById } from "@/lib/landmarkIcons";
import type { VerseIconOption } from "@/lib/verseIcons";

// One fixed emblem per book — a crest on its Mind Map ring, recognizable from far out ("I'm in
// Romans country") — each drawn from something the book is remembered for, and no two books alike.
const BOOK_EMBLEMS: Record<string, string> = {
  Genesis: "globe", Exodus: "waves", Leviticus: "flame", Numbers: "people", Deuteronomy: "scroll", Joshua: "flag", Judges: "judge",
  Ruth: "wheat", "1 Samuel": "bell", "2 Samuel": "crown", "1 Kings": "temple", "2 Kings": "water", "1 Chronicles": "library",
  "2 Chronicles": "castle", Ezra: "hand", Nehemiah: "hammer", Esther: "gem", Job: "hourglass", Psalms: "music", Proverbs: "lightbulb",
  Ecclesiastes: "leaf", "Song of Solomon": "grape", Isaiah: "glory", Jeremiah: "rain", Lamentations: "moon", Ezekiel: "eye",
  Daniel: "lock", Hosea: "handshake", Joel: "sun", Amos: "scale", Obadiah: "mountain", Jonah: "fish", Micah: "signpost",
  Nahum: "battle", Habakkuk: "tree", Zephaniah: "sunrise", Haggai: "coins", Zechariah: "power", Malachi: "healing",
  Matthew: "key", Mark: "footprints", Luke: "baby", John: "bird", Acts: "wind", Romans: "gift", "1 Corinthians": "church",
  "2 Corinthians": "door", Galatians: "sprout", Ephesians: "sword", Philippians: "trophy", Colossians: "cross",
  "1 Thessalonians": "proclaim", "2 Thessalonians": "warning", "1 Timothy": "book", "2 Timothy": "milestone", Titus: "compass",
  Philemon: "mail", Hebrews: "anchor", James: "mercy", "1 Peter": "ship", "2 Peter": "lamp", "1 John": "heart", "2 John": "map",
  "3 John": "tent", Jude: "shield", Revelation: "star",
};

export function bookEmblem(bookName: string): VerseIconOption | undefined {
  return landmarkIconById(BOOK_EMBLEMS[bookName]);
}

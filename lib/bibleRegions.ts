import type { BibleBook } from "@/types";
import { BIBLE_BOOKS } from "@/lib/bibleBooks";
import { bookGenre } from "@/lib/canonTree";

// The Path tab's whole-Bible board (design_handoff_chapter_path_view/BIBLE_TAB.md, level 0): eight
// regions laid out treemap-style on a 370×490 board, roughly sized by how many books each holds.

export type BibleRegionId = "Law" | "History" | "Wisdom" | "Prophets" | "Gospels" | "Acts" | "Letters" | "Revelation";

export interface BibleRegion {
  id: BibleRegionId;
  x: number;
  y: number;
  w: number;
  h: number;
  fillClass: string;
}

export const BIBLE_REGIONS: BibleRegion[] = [
  { id: "Law", x: 14, y: 24, w: 164, h: 112, fillClass: "bg-brand-100" },
  { id: "History", x: 192, y: 24, w: 164, h: 146, fillClass: "bg-sage-100" },
  { id: "Wisdom", x: 14, y: 148, w: 164, h: 120, fillClass: "bg-sage-200" },
  { id: "Prophets", x: 192, y: 182, w: 164, h: 112, fillClass: "bg-brand-200" },
  { id: "Gospels", x: 14, y: 318, w: 164, h: 96, fillClass: "bg-sage-200" },
  { id: "Letters", x: 192, y: 318, w: 164, h: 172, fillClass: "bg-sage-100" },
  { id: "Acts", x: 14, y: 426, w: 76, h: 64, fillClass: "bg-brand-100" },
  { id: "Revelation", x: 102, y: 426, w: 76, h: 64, fillClass: "bg-brand-200" },
];

export function regionOfBook(book: BibleBook): BibleRegionId {
  if (book.name === "Acts") return "Acts";
  const genre = bookGenre(book);
  return genre === "law" ? "Law" : genre === "history" ? "History" : genre === "wisdom" ? "Wisdom" : genre === "prophets" ? "Prophets" : genre === "gospels" ? "Gospels" : genre === "epistles" ? "Letters" : "Revelation";
}

export const booksInRegion = (region: BibleRegionId): BibleBook[] => BIBLE_BOOKS.filter((book) => regionOfBook(book) === region);

const ABBREVIATIONS: Record<string, string> = {
  Philippians: "Php", Philemon: "Phm", Judges: "Jdg", Jude: "Jde", "Song of Solomon": "Sng", Ezekiel: "Ezk",
  Joel: "Jol", John: "Jhn", Mark: "Mrk", Nahum: "Nam", Obadiah: "Oba",
};

// A book's three-letter tile label — "1Co", "1Jn" for numbered books.
export function bookAbbreviation(name: string): string {
  if (ABBREVIATIONS[name]) return ABBREVIATIONS[name];
  const numbered = /^(\d) (.*)$/.exec(name);
  if (numbered) return numbered[1] + (numbered[2] === "John" ? "Jn" : numbered[2].slice(0, 2));
  return name.slice(0, 3);
}

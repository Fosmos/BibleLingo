// A book's short label for the Path tab's Bible circles (BibleProgressLevel.tsx).

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

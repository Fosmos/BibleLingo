import type { BuiltLocus, BuiltPalace, BuiltRoom, PalaceVerseRange } from "@/types";

// Where a verse sits in the reader's built palaces (the Palace tab — lib/builtPalaces.ts), and the palace one
// would go into: a lesson opens a verse on a spot by walking to it (PalacePlaceStep.tsx), and the spot rides along as its cue through the lesson and its
// spaced reviews (PalacePlacementChip.tsx). Pure.

export interface VerseRef {
  book: string;
  chapter: number;
  verseNumber: number;
}

export interface Placement {
  palace: BuiltPalace;
  room: BuiltRoom;
  locus: BuiltLocus;
}

const order = (chapter: number, verse: number) => chapter * 1000 + verse;
const holds = (range: PalaceVerseRange | undefined, ref: VerseRef) =>
  !!range && range.book === ref.book && order(ref.chapter, ref.verseNumber) >= order(range.startChapter, range.startVerse) && order(ref.chapter, ref.verseNumber) <= order(range.endChapter, range.endVerse);

export function findPlacement(palaces: BuiltPalace[], ref: VerseRef): Placement | undefined {
  for (const palace of palaces) for (const room of palace.rooms) for (const locus of room.loci) if (holds(locus.range, ref)) return { palace, room, locus };
  return undefined;
}

// The palace a verse not placed yet goes into: one whose range (or one of whose rooms) holds it, else
// one built for the path being learned, else one already holding verses of its chapter.
export const palaceToPlaceIn = (palaces: BuiltPalace[], ref: VerseRef, pathKey: string | null) =>
  palaces.find((palace) => holds(palace.range, ref) || palace.rooms.some((room) => holds(room.range, ref))) ??
  palaces.find((palace) => palace.pathKey === pathKey) ??
  palaces.find((palace) => palace.rooms.some((room) => room.loci.some((locus) => locus.range?.book === ref.book && locus.range.startChapter <= ref.chapter && locus.range.endChapter >= ref.chapter)));

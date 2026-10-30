import type { BuiltLocus, BuiltPalace, BuiltRoom, PalaceVerseRange } from "@/types";
import { newPalaceId } from "@/lib/builtPalaces";

// Where a verse sits in the reader's built palaces (the Palace tab — lib/builtPalaces.ts), and placing
// it there as it's learned: a lesson opens each verse by placing it on a spot, or walking to the spot
// it's on (PalacePlaceStep.tsx), and the spot then rides along as its cue through the lesson and its
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

// The spot that ends on the verse just before it — where it can go on, "assigned as you go".
export function spotBefore(palace: BuiltPalace, ref: VerseRef): { room: BuiltRoom; locus: BuiltLocus } | undefined {
  for (const room of palace.rooms)
    for (const locus of room.loci)
      if (locus.range && locus.range.book === ref.book && locus.range.endChapter === ref.chapter && locus.range.endVerse === ref.verseNumber - 1) return { room, locus };
  return undefined;
}

// The room a new spot for the verse goes in by default: one whose range holds it, else the last.
export const roomFor = (palace: BuiltPalace, ref: VerseRef) => palace.rooms.find((room) => holds(room.range, ref)) ?? palace.rooms[palace.rooms.length - 1];

const single = (ref: VerseRef): PalaceVerseRange => ({ book: ref.book, startChapter: ref.chapter, startVerse: ref.verseNumber, endChapter: ref.chapter, endVerse: ref.verseNumber });

// The verse put on with the verse before it on its spot.
export function extendSpot(palace: BuiltPalace, roomId: string, locusId: string, ref: VerseRef): BuiltPalace {
  return {
    ...palace,
    rooms: palace.rooms.map((room) =>
      room.id !== roomId ? room : { ...room, loci: room.loci.map((locus) => (locus.id === locusId && locus.range ? { ...locus, range: { ...locus.range, endChapter: ref.chapter, endVerse: ref.verseNumber } } : locus)) },
    ),
  };
}

// The verse on a new spot of its own, in room `roomId` (or a new room when there's none yet).
export function newSpot(palace: BuiltPalace, roomId: string | null, ref: VerseRef, name: string, scene: string): BuiltPalace {
  const locus: BuiltLocus = { id: newPalaceId(), name, range: single(ref), scene: scene || undefined };
  const target = palace.rooms.find((room) => room.id === roomId);
  if (!target) return { ...palace, rooms: [...palace.rooms, { id: newPalaceId(), name: `Room ${palace.rooms.length + 1}`, loci: [locus] }] };
  return { ...palace, rooms: palace.rooms.map((room) => (room.id === target.id ? { ...room, loci: [...room.loci, locus] } : room)) };
}

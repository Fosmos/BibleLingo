import type { BuiltLocus, BuiltPalace, BuiltRoom, PalaceVerseRange, VerseSegment } from "@/types";

// The reader's own memory palaces (UserProgress.builtPalaces, built in the Palace tab): a real place the reader knows, its
// rooms and each room's spots, every level able to hold a verse range of its path. Verses are
// assigned as they go — a new room or spot starts at the next verse of the path not yet on a spot.
// Pure; every edit returns a new palace for store/builtPalaceActions.ts's saveBuiltPalace.

export const newPalaceId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

// A verse's place in the book, for comparing.
const order = (chapter: number, verse: number) => chapter * 1000 + verse;
const startOf = (range: PalaceVerseRange) => order(range.startChapter, range.startVerse);
const endOf = (range: PalaceVerseRange) => order(range.endChapter, range.endVerse);

export const inRange = (verse: VerseSegment, range: PalaceVerseRange | undefined) =>
  !range || (verse.book === range.book && order(verse.chapter, verse.verseNumber) >= startOf(range) && order(verse.chapter, verse.verseNumber) <= endOf(range));

export const versesInRange = (verses: VerseSegment[], range: PalaceVerseRange | undefined) => verses.filter((verse) => inRange(verse, range));

export function rangeFrom(from: VerseSegment, to: VerseSegment): PalaceVerseRange {
  return { book: from.book, startChapter: from.chapter, startVerse: from.verseNumber, endChapter: to.chapter, endVerse: to.verseNumber };
}

// "3:1–4", "3:14–4:2" or "3:5" — the book left out, since a palace is one path's.
export function rangeLabel(range: PalaceVerseRange): string {
  const start = `${range.startChapter}:${range.startVerse}`;
  if (range.startChapter !== range.endChapter) return `${start}–${range.endChapter}:${range.endVerse}`;
  return range.startVerse === range.endVerse ? start : `${start}–${range.endVerse}`;
}

const allLoci = (palace: BuiltPalace) => palace.rooms.flatMap((room) => room.loci);

// The verses already on a spot somewhere in the palace.
export function placedVerseIds(palace: BuiltPalace, verses: VerseSegment[]): Set<string> {
  return new Set(allLoci(palace).flatMap((locus) => (locus.range ? versesInRange(verses, locus.range).map((verse) => verse.id) : [])));
}

// The first verse (within `within`, if given) not on any spot yet — where the next spot starts.
export function nextUnplaced(palace: BuiltPalace, verses: VerseSegment[], within?: PalaceVerseRange): VerseSegment | undefined {
  const placed = placedVerseIds(palace, verses);
  return versesInRange(verses, within ?? palace.range).find((verse) => !placed.has(verse.id));
}

const startingRange = (palace: BuiltPalace, verses: VerseSegment[], within?: PalaceVerseRange) => {
  const next = nextUnplaced(palace, verses, within);
  return next ? rangeFrom(next, next) : undefined;
};

export function addRoom(palace: BuiltPalace, verses: VerseSegment[] = []): { palace: BuiltPalace; room: BuiltRoom } {
  const room: BuiltRoom = { id: newPalaceId(), name: `Room ${palace.rooms.length + 1}`, range: startingRange(palace, verses), loci: [] };
  return { palace: { ...palace, rooms: [...palace.rooms, room] }, room };
}

export const updateRoom = (palace: BuiltPalace, roomId: string, patch: Partial<BuiltRoom>): BuiltPalace => ({
  ...palace,
  rooms: palace.rooms.map((room) => (room.id === roomId ? { ...room, ...patch } : room)),
});

export const removeRoom = (palace: BuiltPalace, roomId: string): BuiltPalace => ({ ...palace, rooms: palace.rooms.filter((room) => room.id !== roomId) });

export function addLocus(palace: BuiltPalace, roomId: string, verses: VerseSegment[]): BuiltPalace {
  const room = palace.rooms.find((entry) => entry.id === roomId);
  if (!room) return palace;
  const locus: BuiltLocus = { id: newPalaceId(), name: "", range: startingRange(palace, verses, room.range) };
  return updateRoom(palace, roomId, { loci: [...room.loci, locus] });
}

export function updateLocus(palace: BuiltPalace, roomId: string, locusId: string, patch: Partial<BuiltLocus>): BuiltPalace {
  const room = palace.rooms.find((entry) => entry.id === roomId);
  return room ? updateRoom(palace, roomId, { loci: room.loci.map((locus) => (locus.id === locusId ? { ...locus, ...patch } : locus)) }) : palace;
}

export function removeLocus(palace: BuiltPalace, roomId: string, locusId: string): BuiltPalace {
  const room = palace.rooms.find((entry) => entry.id === roomId);
  return room ? updateRoom(palace, roomId, { loci: room.loci.filter((locus) => locus.id !== locusId) }) : palace;
}

// A spot moved to another room, onto the end of its walking order.
export function moveLocus(palace: BuiltPalace, fromRoomId: string, locusId: string, toRoomId: string): BuiltPalace {
  const locus = palace.rooms.find((room) => room.id === fromRoomId)?.loci.find((entry) => entry.id === locusId);
  if (!locus || fromRoomId === toRoomId) return palace;
  const without = removeLocus(palace, fromRoomId, locusId);
  return { ...without, rooms: without.rooms.map((room) => (room.id === toRoomId ? { ...room, loci: [...room.loci, locus] } : room)) };
}

// A verse's first few words, as the cue for the spot.
export function openingWords(text: string, count = 4): string {
  const words = text.trim().split(/\s+/);
  return words.length > count ? `${words.slice(0, count).join(" ")}…` : words.join(" ");
}

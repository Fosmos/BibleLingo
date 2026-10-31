import type { BuiltLocus, BuiltPalace, BuiltRoom } from "@/types";
import { newPalaceId } from "@/lib/builtPalaces";

// A locus of the reader's built palaces that holds verses of one chapter, with those verses.
export interface ChapterLocus {
  palace: BuiltPalace;
  room: BuiltRoom;
  locus: BuiltLocus;
  from: number;
  to: number;
}

export interface ChapterLocusInput {
  book: string;
  chapter: number;
  from: number;
  to: number;
  roomName: string;
  name: string;
  scene: string;
  // The room to use, when the chapter has one already.
  roomId?: string;
  // The locus being edited, when it isn't a new one.
  locusId?: string;
  pathKey: string;
}

// The loci holding verses of this chapter, in verse order. `to` is past the end for a locus that runs on into the next chapter.
export function chapterLoci(palaces: BuiltPalace[], book: string, chapter: number): ChapterLocus[] {
  const found: ChapterLocus[] = [];
  for (const palace of palaces) {
    for (const room of palace.rooms) {
      for (const locus of room.loci) {
        const range = locus.range;
        if (!range || range.book !== book || range.startChapter > chapter || range.endChapter < chapter) continue;
        found.push({ palace, room, locus, from: range.startChapter === chapter ? range.startVerse : 1, to: range.endChapter === chapter ? range.endVerse : Number.MAX_SAFE_INTEGER });
      }
    }
  }
  return found.sort((a, b) => a.from - b.from);
}

// "1–2", or "3" for one verse.
export const locusVerses = (from: number, to: number, lastVerse: number) => {
  const end = Math.min(to, lastVerse);
  return from === end ? `${from}` : `${from}–${end}`;
};

// Adds or edits a locus on a chapter's verses, in the chapter's room (renamed if its name changed), or
// a room of that name, or a new one. With no palace yet, it starts one. Returns the palace to save.
export function saveChapterLocus(palace: BuiltPalace | undefined, input: ChapterLocusInput): BuiltPalace {
  const base = palace ?? { id: newPalaceId(), name: "My palace", pathKey: input.pathKey, rooms: [], createdAt: new Date().toISOString() };
  const range = { book: input.book, startChapter: input.chapter, startVerse: input.from, endChapter: input.chapter, endVerse: input.to };
  const fields = { name: input.name, scene: input.scene || undefined, range };
  const sameName = (room: BuiltRoom) => room.name.toLowerCase() === input.roomName.toLowerCase();
  const room = base.rooms.find((entry) => entry.id === input.roomId) ?? base.rooms.find(sameName);
  if (!room) return { ...base, rooms: [...base.rooms, { id: newPalaceId(), name: input.roomName, loci: [{ id: newPalaceId(), ...fields }] }] };
  const loci = input.locusId ? room.loci.map((locus) => (locus.id === input.locusId ? { ...locus, ...fields } : locus)) : [...room.loci, { id: newPalaceId(), ...fields }];
  return { ...base, rooms: base.rooms.map((entry) => (entry.id === room.id ? { ...entry, name: input.roomName, loci } : entry)) };
}

import type { VerseSegment } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";

// A reader who has to open View First Letters or View Verse while reviewing a verse didn't
// recall it on their own, so it goes into the Problem Verses bin (see
// store/problemVerseActions.ts), and the Mind Map marks its chip (MindMapVerseStream.tsx). The
// bin needs a translation to relearn it in: the SRS range holding the verse, if any, or else the
// focused path's own.
export function flagPeekedVerse(verse: VerseSegment): void {
  const state = useProgressStore.getState();
  const holder = state.memorizedEntities.find(
    (entity) => entity.book === verse.book && entity.chapter === verse.chapter && verse.verseNumber >= entity.startVerse && verse.verseNumber <= entity.endVerse,
  );
  const pathVersion = state.activePathKey ? state.paths[state.activePathKey]?.version : undefined;
  state.flagProblemVerse(verse.book, verse.chapter, verse.verseNumber, holder?.version ?? pathVersion ?? "ESV");
}

// Verses to relearn — the full Learn flow run again over them in the Mind Map sheet
// (InPlaceRelearnSession.tsx). One chapter, `startVerse`..`endVerse`, in the translation they
// were memorized in.
export interface RelearnTarget {
  book: string;
  chapter: number;
  startVerse: number;
  endVerse: number;
  version: string;
}

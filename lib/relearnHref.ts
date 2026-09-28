// The Relearn screen's link (app/memorized/relearn/page.tsx): the full Learn flow run again for
// one verse, or for verses `verseNumber`..`endVerse` of one chapter. `from` is where finishing
// returns to (the Memorized page when omitted).
export function relearnHref(book: string, chapter: number, verseNumber: number, version: string, endVerse?: number, from?: string): string {
  const query = new URLSearchParams({ book, chapter: String(chapter), verse: String(verseNumber), version });
  if (endVerse !== undefined && endVerse > verseNumber) query.set("to", String(endVerse));
  if (from) query.set("from", from);
  return `/memorized/relearn?${query}`;
}

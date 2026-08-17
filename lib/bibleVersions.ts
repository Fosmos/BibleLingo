export interface BibleVersion {
  code: string;
  name: string;
}

// Fetched on demand from api.bible when a version is selected — see
// lib/bibleApiClient.ts and app/api/bible/chapter/route.ts. A version can still fail
// to load at fetch time (e.g. not present in the configured api.bible account), which
// surfaces as an error in the picker rather than being precomputed here.
export const BIBLE_VERSIONS: BibleVersion[] = [
  { code: "KJV", name: "King James Version" },
  { code: "NIV", name: "New International Version" },
  { code: "ESV", name: "English Standard Version" },
  { code: "NASB", name: "New American Standard Bible" },
  { code: "NLT", name: "New Living Translation" },
];

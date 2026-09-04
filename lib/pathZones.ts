import type { MemorizationDay, VerseSegment } from "@/types";
import { getPericopeForVerse } from "@/lib/chapterPericopes";
import { formatVerseRangeLabel } from "@/lib/chapterContent";

export interface PathZone {
  zoneNumber: number;
  // e.g. "Mark 1:1-8" for a pericope zone, or the verse range a capstone day covers (e.g.
  // "Mark 1:1-45" for a whole-chapter Full Review) — see buildPathZones.
  label: string;
  // e.g. "John the Baptist Prepares the Way" — blank for a capstone day's own card, which
  // has no pericope name of its own.
  heading: string;
  // The verse this zone's pericope-level location tag is keyed to — always the anchor of
  // whichever "learn" day started this zone.
  anchorBook: string;
  anchorChapter: number;
  // The pericope's own full verse range (e.g. 9-11 for "The Baptism of Jesus") — undefined
  // for a capstone day's own card or the pericope-data-not-loaded-yet placeholder, neither
  // of which has one real pericope to speak of. Drives PericopeCard.tsx's per-verse grid.
  startVerse?: number;
  endVerse?: number;
  days: MemorizationDay[];
  // Verses from a day whose OWN button lives in a LATER zone (a lesson's one "Learn" button
  // always lives wherever its LAST verse falls — see buildPathZones) but which also touches
  // this zone's own pericope, since a lesson always teaches exactly the number of verses
  // picked per day regardless of section boundaries (see lib/chapterChunking.ts). One entry
  // per contributing day (almost always just one) — the reader (see PericopeCard.tsx) shows
  // whichever entry's own day is the currently active one as "Today's Verse(s)" too, same as
  // the zone that actually owns the button, so every verse in TODAY's lesson displays in its
  // own real section without opening a second entry point for the same one lesson. A day
  // that's since finished (or hasn't come up yet) contributes no visible entry here, same as
  // its own home zone dropping its verse text once it's no longer the active lesson either.
  spilloverVerses?: { dayNumber: number; verses: VerseSegment[] }[];
}

interface PericopeSegment {
  key: string;
  label: string;
  heading: string;
  book: string;
  chapter: number;
  startVerse: number;
  endVerse: number;
  verses: VerseSegment[];
}

// Splits `verses` into consecutive runs sharing the same pericope, in order — e.g. a
// 5-verse lesson spanning a section break becomes two segments, the earlier section's
// tail-end and the later section's own opening (three or more if it crosses two breaks).
// Returns null (degrade to "don't split") wherever pericope data isn't cached yet for any
// of the verses' chapters, same convention every other pericope consumer in this codebase
// follows.
export function versesByPericopeSegment(verses: VerseSegment[]): PericopeSegment[] | null {
  const segments: PericopeSegment[] = [];
  for (const verse of verses) {
    const pericope = getPericopeForVerse(verse.book, verse.chapter, verse.verseNumber);
    if (!pericope) return null;
    const key = `${verse.book}|${verse.chapter}|${pericope.label}`;
    const last = segments[segments.length - 1];
    if (last && last.key === key) {
      last.verses.push(verse);
    } else {
      segments.push({
        key,
        label: pericope.label,
        heading: pericope.heading,
        book: verse.book,
        chapter: verse.chapter,
        startVerse: pericope.startVerse,
        endVerse: pericope.endVerse,
        verses: [verse],
      });
    }
  }
  return segments;
}

// Groups a day plan's days into pericope-based zones (see components/gamification/
// PathDayList.tsx and BuildingRoomView.tsx). A "learn" day walks its own verses segment by
// segment (see versesByPericopeSegment) rather than as one block — every distinct pericope
// it touches gets (or continues) its own zone here, even a short one it only ever passes
// through on the way to a later section, so every verse still shows up in its real section.
// Only the LAST segment counts as that day's actual card (its one "Learn" button, and the
// day itself for progress/unlock purposes); every earlier segment's verses are recorded as
// that zone's own spilloverVerses instead. Verses are strictly sequential, so a pericope
// already passed is never revisited by a later day — reusing/advancing off of just the most
// recently touched zone (`currentKey`) is always correct, no broader search needed.
//
// A review/boss-battle capstone day (chapter_review, boss_battle, and — book mode only —
// weekly_review/monthly_review/section_boss_battle) belongs to no pericope at all — it
// covers a whole chapter, several chapters, or the entire path — so it always gets its own
// standalone card, right where it chronologically falls, rather than disappearing into
// whichever pericope zone happened to precede it. That's what actually puts a book/chapter
// path's closing Full Review and Boss Battle at the very end of the list as their own
// clearly separate steps, instead of looking like just another action on the last
// pericope's own card. A "learn" day whose pericope data isn't cached yet degrades the same
// way it always has: it inherits whatever zone came before it (or starts an unlabeled
// placeholder zone if none exists yet) rather than splitting into a fresh one, since that's
// just a transient loading state, not a genuinely different kind of day.
export function buildPathZones(days: MemorizationDay[]): PathZone[] {
  const zones: PathZone[] = [];
  let currentKey: string | undefined;

  function zoneFor(segment: PericopeSegment): PathZone {
    if (segment.key === currentKey) return zones[zones.length - 1];
    currentKey = segment.key;
    const zone: PathZone = {
      zoneNumber: zones.length + 1,
      label: segment.label,
      heading: segment.heading,
      anchorBook: segment.book,
      anchorChapter: segment.chapter,
      startVerse: segment.startVerse,
      endVerse: segment.endVerse,
      days: [],
    };
    zones.push(zone);
    return zone;
  }

  for (const day of days) {
    if (day.kind !== "learn") {
      currentKey = undefined;
      const anchor = day.reviewVerses[0];
      zones.push({
        zoneNumber: zones.length + 1,
        label: anchor ? formatVerseRangeLabel(day.reviewVerses) : "",
        heading: "",
        anchorBook: anchor?.book ?? "",
        anchorChapter: anchor?.chapter ?? 1,
        days: [day],
      });
      continue;
    }

    const segments = versesByPericopeSegment(day.newVerses);

    if (segments && segments.length > 0) {
      segments.forEach((segment, index) => {
        const zone = zoneFor(segment);
        if (index === segments.length - 1) {
          zone.days.push(day);
        } else {
          zone.spilloverVerses = [...(zone.spilloverVerses ?? []), { dayNumber: day.dayNumber, verses: segment.verses }];
        }
      });
      continue;
    }

    const current = zones[zones.length - 1];
    if (current) {
      current.days.push(day);
    } else {
      zones.push({ zoneNumber: 1, label: "", heading: "", anchorBook: day.newVerses[0]?.book ?? "", anchorChapter: day.newVerses[0]?.chapter ?? 1, days: [day] });
      currentKey = undefined;
    }
  }

  return zones;
}

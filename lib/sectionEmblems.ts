import type { TrailSection } from "@/lib/trailStops";
import { getPericopeForVerse } from "@/lib/chapterPericopes";
import { hallEmblemKeyFor, themeEmblem } from "@/lib/hallEmblems";

// The symbol a section's stone wears on the Path map (PericopeMapScreen.tsx), a landmark id
// (lib/landmarkIcons.ts). A pericope — and its review — wears its hall's emblem: the one the reader
// chose on the Mind Map (UserProgress.iconTags), else the one its heading suggests (lib/hallEmblems.ts),
// so a passage looks the same in both places. A chapter review wears a library (its pericopes
// together), the finish line a banner, any other section the theme its title or verses suggest.
export function sectionEmblem(section: TrailSection, iconTags: Record<string, string>): string {
  if (section.reviewOf === "chapter") return "library";
  if (section.reviewOf === "final") return "flag";
  const verses = section.stops.flatMap((stop) => stop.verses);
  const first = verses[0];
  if (!first) return "milestone";
  const pericope = getPericopeForVerse(first.book, first.chapter, first.verseNumber);
  if (pericope) return iconTags[hallEmblemKeyFor(pericope.label)] ?? themeEmblem(pericope.heading, pericope.book, pericope.chapter, pericope.startVerse, pericope.endVerse);
  const last = verses[verses.length - 1];
  return themeEmblem(section.title, first.book, first.chapter, first.verseNumber, last.chapter === first.chapter ? last.verseNumber : undefined);
}

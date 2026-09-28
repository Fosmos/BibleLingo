import type { MindMapPericopeDatum } from "@/lib/mindMapTypes";
import { getChapterVerses } from "@/lib/chapterContent";

// Themes and the words that signal them, most specific first — a heading's own words are
// checked in this order and the first theme found wins (so "Jesus Calms the Storm" is the storm,
// not a generic "Jesus"). The same list scores a section's verses when its heading says nothing.
const THEME_EMBLEMS: [RegExp, string][] = [
  [/\b(farewell|final|conclu\w*|closing|benediction)\b/i, "mail"],
  [/\b(greet\w*|salutation)\b/i, "hand"],
  [/\b(storm|sea|waves?|boat|water|baptiz\w*|baptism|jordan)\b/i, "waves"],
  [/\b(risen|resurrect\w*|rose again|empty tomb|raised)\b/i, "sunrise"],
  [/\b(crucif\w*|cross)\b/i, "cross"],
  [/\b(heal\w*|sick|leprosy|leper|paraly\w*|fever|cure\w*)\b/i, "healing"],
  [/\b(blind|sight|eyes?|see)\b/i, "eye"],
  [/\b(bread|feed\w*|loaves|harvest|grain|wheat|sower|seed)\b/i, "wheat"],
  [/\b(vine\w*|wine|wedding|grapes?)\b/i, "grape"],
  [/\b(parable|grow\w*|mustard|fig tree|fruit)\b/i, "sprout"],
  [/\b(pray\w*|intercession)\b/i, "mercy"],
  [/\b(temple|tabernacle|house of god|altar|sacrifice\w*)\b/i, "temple"],
  [/\b(church|elders|overseers|deacons|body of christ|congregation)\b/i, "church"],
  [/\b(king|kingdom|throne|reign\w*|crown)\b/i, "crown"],
  [/\b(law|commandments?|statutes|scripture|written)\b/i, "scroll"],
  [/\b(spirit|dove|pentecost)\b/i, "bird"],
  [/\b(beatitudes?|blessed|blessings?)\b/i, "mountain"],
  [/\b(den(y|ies|ied|ial)|rooster)\b/i, "bell"],
  [/\b(word|flesh|incarnat\w*)\b/i, "book"],
  [/\b(armor|shield|faith|stand firm)\b/i, "shield"],
  [/\b(hope|anchor|steadfast)\b/i, "anchor"],
  [/\b(light|lamp|darkness|salt)\b/i, "lamp"],
  [/\b(love|beloved)\b/i, "heart"],
  [/\b(truth|true)\b/i, "key"],
  [/\b(walk\w*|journey|way|road|path|follow\w*|calls?|calling)\b/i, "footprints"],
  [/\b(false|warning|deceiv\w*|antichrist|wolves|tempt\w*|temptation)\b/i, "warning"],
  [/\b(judg\w*|wrath|condemn\w*|trial|arrest\w*|accus\w*)\b/i, "judge"],
  [/\b(money|rich|riches|wealth|treasure|tax|coins?|silver|gold|betray\w*)\b/i, "coins"],
  [/\b(song|psalm|praise|hymn|worship|sing\w*|doxolog\w*)\b/i, "music"],
  [/\b(covenant|promise\w*|oath|marriage|divorce)\b/i, "handshake"],
  [/\b(wisdom|wise|understanding|knowledge|teach\w*|sermon|instruct\w*)\b/i, "lightbulb"],
  [/\b(birth|born|child\w*|son of|genealogy)\b/i, "baby"],
  [/\b(disciples|apostles|twelve|crowds?|nations|gentiles|people)\b/i, "people"],
  [/\b(creation|created|world|heavens|earth)\b/i, "globe"],
  [/\b(hospitality|welcome|receive\w*|door|guest)\b/i, "door"],
  [/\b(fire|flame|zeal)\b/i, "flame"],
  [/\b(mountain|mount|sinai|zion|hill)\b/i, "mountain"],
  [/\b(fish\w*|nets?)\b/i, "fish"],
  [/\b(glory|glorif\w*|transfigur\w*)\b/i, "glory"],
  [/\b(battle|war|fight\w*|enemy|enemies|victory)\b/i, "battle"],
  [/\b(gift|grace|generos\w*|support\w*|fellow workers?)\b/i, "gift"],
  [/\b(oppos\w*|trouble|suffer\w*|persecut\w*|trials?|endur\w*|patien\w*)\b/i, "hourglass"],
  [/\b(joy|rejoic\w*|glad)\b/i, "sun"],
  [/\b(peace|rest|sabbath)\b/i, "moon"],
  [/\b(freedom|free|slave\w*|bondage|chains?)\b/i, "lock"],
  [/\b(new life|born again|new creation|renew\w*|living|life)\b/i, "leaf"],
  [/\b(serv\w*|humil\w*|wash\w*)\b/i, "hand"],
  [/\b(run|race|prize|goal)\b/i, "trophy"],
  [/\b(work|labor|idle|build\w*)\b/i, "hammer"],
  [/\b(preach\w*|proclaim\w*|gospel|good news|witness\w*)\b/i, "proclaim"],
];

// A hall with no theme found in its heading or its verses stands behind a plain door — the
// palace's own "a room" — rather than a random picture that would mean nothing.
const FALLBACK_EMBLEM = "door";

function versesText(pericope: MindMapPericopeDatum): string {
  const verses = getChapterVerses(pericope.book, pericope.chapter);
  const { rangeStartVerse: start, rangeEndVerse: end } = pericope;
  if (!verses || start === undefined || end === undefined) return "";
  return verses.slice(start - 1, end).map((verse) => verse.text).join(" ");
}

// The emblem a hall shows until the reader picks their own — one that fits what the section is
// about: first from its heading (the first theme its words name); failing that, the theme its
// verses mention most (e.g. a heading like "Support and Opposition" whose verses talk about
// receiving and welcoming the brothers); failing that, a plain door.
export function autoHallEmblem(pericope: MindMapPericopeDatum): string {
  const fromHeading = THEME_EMBLEMS.find(([pattern]) => pattern.test(pericope.label));
  if (fromHeading) return fromHeading[1];
  const text = versesText(pericope);
  let best: { emblem: string; count: number } | undefined;
  for (const [pattern, emblem] of THEME_EMBLEMS) {
    const count = text.match(new RegExp(pattern.source, "gi"))?.length ?? 0;
    if (count > (best?.count ?? 0)) best = { emblem, count };
  }
  return best?.emblem ?? FALLBACK_EMBLEM;
}

// Where a reader's own chosen emblem for a hall is saved (store/locationTagActions.ts's iconTags):
// keyed by the section's stable verse-range label, so it survives a change of translation.
export function hallEmblemKey(pericope: MindMapPericopeDatum): string {
  return `hall:${pericope.tagLabel}`;
}

// The doorway silhouette a hall is drawn with (its card's corners, and how far the plaque's text
// is inset to clear them), cycling through five by hall number — so neighbouring halls always
// look different, and a given hall always looks the same.
const HALL_SHAPES = [
  { card: "rounded-t-[18px] rounded-b-md", plaque: "px-3" }, // arched door
  { card: "rounded-md", plaque: "px-1.5" }, // square gate
  { card: "rounded-[22px]", plaque: "px-4" }, // round portal
  { card: "rounded-t-lg rounded-b-none border-b-4 border-b-black/20", plaque: "px-2" }, // tower on a plinth
  { card: "rounded-t-md rounded-b-[18px]", plaque: "px-1.5" }, // vaulted hall
];

export function hallShape(hallNumber: number | undefined): { card: string; plaque: string } {
  return HALL_SHAPES[((hallNumber ?? 1) - 1) % HALL_SHAPES.length];
}

// Where a hall's custom name is saved (store/locationTagActions.ts's locationTags). A hall that
// already has a Memory Palace place tag keeps its name alongside it (`${tagKey}#hall`, the key
// names were first saved under); otherwise it's keyed by the section's stable verse-range label.
export function hallNameKey(pericope: MindMapPericopeDatum, tagKey: string | undefined): string {
  return tagKey ? `${tagKey}#hall` : `hallname:${pericope.tagLabel}`;
}

export function hallDefaultName(hallNumber: number | undefined): string {
  return `Hall ${String(hallNumber ?? 1).padStart(2, "0")}`;
}

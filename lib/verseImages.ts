import {
  Anchor, Award, BadgeCheck, Baby, Bell, BookOpen, Castle, Church, Cloud, Coins, Compass, Crown, Cross, DoorOpen, Droplets, Ear, Eye, Feather, Fish,
  Flag, Flame, Flower2, Footprints, Gem, Gift, Globe, Grape, Hammer, Hand, HandHeart, Handshake, Heart, Hourglass, House, Key, Lamp, Landmark,
  Leaf, Lightbulb, Lock, Map, Megaphone, MessageCircle, Moon, Mountain, Music, PawPrint, Rainbow, Sailboat, Scale, ScrollText, Shield, Shirt, Skull,
  Smile, Sparkles, Sprout, Star, Sun, Swords, Tent, TreeDeciduous, Trophy, UserRound, Users, Utensils, Waves, Wheat, Wine, Worm, Bird, Apple, Amphora,
  type LucideIcon,
} from "lucide-react";
import { verseKey } from "@/lib/verseKey";
import { splitIntoLines } from "@/lib/senseLineSplitting";

// Dual coding: every verse gets a picture — an icon — to be learned with its words (the Palace's book
// structure — BookStructureScreen.tsx — the reader's passage headings and the lessons). Picked from
// what the verse says (bread a sheaf of wheat, light a lamp, sheep a paw print — the most specific
// thing it names first), unless the reader chose their own, saved in UserProgress.iconTags under
// verseImageKey. Pure.

export interface VersePicture {
  id: string;
  label: string;
  Icon: LucideIcon;
}

const p = (id: string, label: string, Icon: LucideIcon): VersePicture => ({ id, label, Icon });

// Words a verse can say, and the picture each calls up — most specific first.
const WORD_PICTURES: [RegExp, VersePicture][] = [
  [/\b(crucif\w*|cross)\b/i, p("cross", "Cross", Cross)],
  [/\b(sheep|shepherd|flock|lambs?)\b/i, p("flock", "Flock", PawPrint)],
  [/\b(bread|loaf|loaves|seed|sow\w*|harvest|grain|wheat|reap\w*)\b/i, p("wheat", "Wheat", Wheat)],
  [/\b(wine|vine\w*|grapes?|vineyard)\b/i, p("grapes", "Grapes", Grape)],
  [/\b(cup|drink\w*|thirst\w*)\b/i, p("cup", "Cup", Wine)],
  [/\b(eat\w*|food\w*|feast|meal|hunger|hungry)\b/i, p("meal", "Meal", Utensils)],
  [/\b(light|lamp|shine\w*|darkness)\b/i, p("lamp", "Lamp", Lamp)],
  [/\b(fire|flame\w*|burn\w*)\b/i, p("fire", "Fire", Flame)],
  [/\b(water|rivers?|springs?|baptiz\w*)\b/i, p("water", "Water", Droplets)],
  [/\b(sea|ships?|boats?|waves|storm)\b/i, p("boat", "Boat", Sailboat)],
  [/\b(fish\w*|nets?)\b/i, p("fish", "Fish", Fish)],
  [/\b(fruit\w*|figs?|olive\w*)\b/i, p("fruit", "Fruit", Apple)],
  [/\b(tree|root\w*|branch\w*)\b/i, p("tree", "Tree", TreeDeciduous)],
  [/\b(flower\w*|grass|lil(y|ies))\b/i, p("flower", "Flower", Flower2)],
  [/\b(kings?|kingdom|thrones?|reign\w*|crown\w*)\b/i, p("crown", "Crown", Crown)],
  [/\b(sword|battle|war\w*|fight\w*|enem(y|ies))\b/i, p("swords", "Swords", Swords)],
  [/\b(armor|shield|guard\w*|faith|believ\w*|trust\w*)\b/i, p("shield", "Shield", Shield)],
  [/\b(pray\w*|intercession\w*|supplication\w*|petition\w*)\b/i, p("prayer", "Prayer", HandHeart)],
  [/\b(sing\w*|song\w*|hymn\w*|psalm\w*|praise\w*)\b/i, p("song", "Song", Music)],
  [/\b(rejoic\w*|joy\w*|glad\w*)\b/i, p("joy", "Joy", Smile)],
  [/\b(temple|church|house of god|altar|sacrifice\w*|offering\w*)\b/i, p("church", "Church", Church)],
  [/\b(law|commandments?|scriptures?|written|decree)\b/i, p("scroll", "Scroll", ScrollText)],
  [/\b(teach\w*|doctrine|instruct\w*|learn\w*|book)\b/i, p("book", "Book", BookOpen)],
  [/\b(wisdom|wise|understand\w*|knowledge)\b/i, p("wisdom", "Wisdom", Lightbulb)],
  [/\b(money|riches|rich|wealth|gold|silver|treasure\w*|gain)\b/i, p("coins", "Coins", Coins)],
  [/\b(gift\w*|grace|mercy|kindness)\b/i, p("gift", "Gift", Gift)],
  [/\b(hope|anchor|steadfast)\b/i, p("anchor", "Anchor", Anchor)],
  [/\b(peace|rest|quiet\w*|dove|spirit)\b/i, p("dove", "Dove", Bird)],
  [/\b(heart\w*|love[ds]?|loving|beloved)\b/i, p("heart", "Heart", Heart)],
  [/\b(marr\w*|wi(fe|ves)|husbands?|bride\w*)\b/i, p("ring", "Ring", Gem)],
  [/\b(child\w*|sons?|daughters?|born|birth)\b/i, p("child", "Child", Baby)],
  [/\b(widows?|mothers?|fathers?|household|family)\b/i, p("household", "Household", House)],
  [/\b(elders?|overseers?|deacons?|leaders?)\b/i, p("elder", "Elder", UserRound)],
  [/\b(servants?|slaves?|masters?|serve\w*|work\w*|labor\w*)\b/i, p("work", "Work", Hammer)],
  [/\b(death|die[ds]?|dead|grave|blood)\b/i, p("death", "Death", Skull)],
  [/\b(life|live[ds]?|living|alive)\b/i, p("life", "Life", Sprout)],
  [/\b(sin\w*|evil|wicked\w*|serpent|devil|satan)\b/i, p("serpent", "Serpent", Worm)],
  [/\b(angels?|heaven\w*|glory)\b/i, p("glory", "Glory", Sparkles)],
  [/\b(stars?|sky)\b/i, p("star", "Star", Star)],
  [/\b(time|hour|seasons?|ages?|eternal)\b/i, p("hourglass", "Hourglass", Hourglass)],
  [/\b(rock|stone\w*|foundation|mountains?|hills?)\b/i, p("mountain", "Mountain", Mountain)],
  [/\b(door|gate\w*|enter\w*)\b/i, p("door", "Door", DoorOpen)],
  [/\b(key|open\w*)\b/i, p("key", "Key", Key)],
  [/\b(truth|true|faithful\w*|trustworthy)\b/i, p("truth", "Truth", BadgeCheck)],
  [/\b(see\w*|sight|eyes?|blind|appear\w*)\b/i, p("eye", "Eye", Eye)],
  [/\b(hear\w*|ears?|listen\w*|voice)\b/i, p("ear", "Ear", Ear)],
  [/\b(speak\w*|words?|tongue|mouth|spoke)\b/i, p("speech", "Speech", MessageCircle)],
  [/\b(walk\w*|feet|foot|way|path|run\w*|race)\b/i, p("footprints", "Footprints", Footprints)],
  [/\b(clothe\w*|garments?|robes?|dress\w*|apparel)\b/i, p("robe", "Robe", Shirt)],
  [/\b(oil|anoint\w*)\b/i, p("jar", "Jar", Amphora)],
  [/\b(city|jerusalem|nations?|world|gentiles)\b/i, p("world", "World", Globe)],
  [/\b(godliness|holy|holiness|pure|purity)\b/i, p("holy", "Holy", Sun)],
  [/\b(command\w*|charge|urge\w*)\b/i, p("command", "Command", Megaphone)],
  [/\b(judg\w*|just\w*|righteous\w*)\b/i, p("scales", "Scales", Scale)],
  [/\b(god|lord|father)\b/i, p("heavens", "Heavens", Cloud)],
];

// Plain pictures that mean nothing in particular — a verse's when its words call up nothing new
// (never a word picture, which would suggest something it doesn't say) — and more to choose from.
const NEUTRAL: VersePicture[] = [
  p("castle", "Castle", Castle), p("tent", "Tent", Tent), p("bell", "Bell", Bell), p("rainbow", "Rainbow", Rainbow), p("moon", "Moon", Moon),
  p("waves", "Waves", Waves), p("leaf", "Leaf", Leaf), p("feather", "Feather", Feather), p("hand", "Hand", Hand), p("handshake", "Handshake", Handshake),
  p("lock", "Lock", Lock), p("map", "Map", Map), p("compass", "Compass", Compass), p("trophy", "Trophy", Trophy), p("flag", "Flag", Flag),
  p("award", "Award", Award), p("landmark", "Landmark", Landmark), p("users", "People", Users),
];

// Every picture a reader can choose from.
export const PICTURE_LIBRARY: VersePicture[] = [...new globalThis.Map([...WORD_PICTURES.map(([, picture]) => picture), ...NEUTRAL].map((picture) => [picture.id, picture])).values()];

export const pictureById = (id: string | undefined): VersePicture | undefined => PICTURE_LIBRARY.find((picture) => picture.id === id);

export const verseImageKey = (book: string, chapter: number, verseNumber: number): string => `picture|${verseKey(book, chapter, verseNumber)}`;

// The picture a verse's words call up that `used` doesn't hold yet; failing that, a neutral one.
export function autoVerseImage(text: string, used: Set<string> = new Set()): string {
  return WORD_PICTURES.find(([pattern, picture]) => !used.has(picture.id) && pattern.test(text))?.[1].id ?? NEUTRAL.find((picture) => !used.has(picture.id))?.id ?? "book";
}

interface PictureVerse {
  book: string;
  chapter: number;
  verseNumber: number;
  text: string;
}

// The picture ids of one passage's verses, in order — so no picture repeats within a passage, each
// verse takes the most specific one its first sense line calls up that the verses before it haven't
// (the picture cues the verse's start), or failing that the rest of the verse; the reader's own
// choice always wins. Every place that shows a verse's picture works it out over its
// whole passage this way, so a verse shows the same picture everywhere.
export function passagePictures(verses: PictureVerse[], chosen: Record<string, string>): string[] {
  const used = new Set<string>();
  return verses.map((verse) => {
    const own = chosen[verseImageKey(verse.book, verse.chapter, verse.verseNumber)];
    const firstLine = splitIntoLines(verse.text)[0] ?? verse.text;
    const fromFirstLine = WORD_PICTURES.find(([pattern, candidate]) => !used.has(candidate.id) && pattern.test(firstLine))?.[1].id;
    const picture = own && pictureById(own) ? own : (fromFirstLine ?? autoVerseImage(verse.text, used));
    used.add(picture);
    return picture;
  });
}


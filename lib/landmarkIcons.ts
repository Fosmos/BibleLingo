import {
  Hand, Footprints, Lamp, Mail, Scale, Wheat, Grape, Sprout, Eye, Music, Handshake, DoorOpen, Sunrise, Cross, Church, Lightbulb,
  CloudRain, Globe, Baby, Users, HeartPulse, TriangleAlert, Fish, Tent, Wine, Gem, Sparkles, Castle, Landmark, Ship, Feather, Lock,
  Bell, Hourglass, Gift, Trophy, Flag, Map, Milestone, Swords, Moon, Leaf, Droplets, Zap, Hammer, Gavel, Coins, Wind, Signpost,
  HandHeart, Megaphone, Library,
} from "lucide-react";
import { VERSE_ICON_OPTIONS, type VerseIconOption } from "@/lib/verseIcons";

// The Mind Map's landmark vocabulary — the icons a hall (section) or a book wears as its emblem
// (see lib/hallEmblems.ts, lib/bookEmblems.ts). The verse icons (lib/verseIcons.ts) come first, so
// a shape the reader already uses on a verse means the same thing on a hall; the rest widen the set
// enough that no two neighbouring halls, and no two books, ever need to share one.
export const LANDMARK_ICONS: VerseIconOption[] = [
  ...VERSE_ICON_OPTIONS,
  ...(
    [
      ["hand", "Hand", Hand], ["footprints", "Footprints", Footprints], ["lamp", "Lamp", Lamp], ["mail", "Letter", Mail],
      ["scale", "Scales", Scale], ["wheat", "Wheat", Wheat], ["grape", "Grapes", Grape], ["sprout", "Sprout", Sprout],
      ["eye", "Eye", Eye], ["music", "Song", Music], ["handshake", "Covenant", Handshake], ["door", "Door", DoorOpen],
      ["sunrise", "Sunrise", Sunrise], ["cross", "Cross", Cross], ["church", "Church", Church], ["lightbulb", "Wisdom", Lightbulb],
      ["rain", "Rain", CloudRain], ["globe", "World", Globe], ["baby", "Child", Baby], ["people", "People", Users],
      ["healing", "Healing", HeartPulse], ["warning", "Warning", TriangleAlert], ["fish", "Fish", Fish], ["tent", "Tent", Tent],
      ["wine", "Wine", Wine], ["gem", "Jewel", Gem], ["glory", "Glory", Sparkles], ["castle", "Fortress", Castle],
      ["temple", "Temple", Landmark], ["ship", "Ship", Ship], ["feather", "Feather", Feather], ["lock", "Lock", Lock],
      ["bell", "Bell", Bell], ["hourglass", "Hourglass", Hourglass], ["gift", "Gift", Gift], ["trophy", "Prize", Trophy],
      ["flag", "Banner", Flag], ["map", "Map", Map], ["milestone", "Milestone", Milestone], ["battle", "Battle", Swords],
      ["moon", "Moon", Moon], ["leaf", "Leaf", Leaf], ["water", "Water", Droplets], ["power", "Power", Zap],
      ["hammer", "Hammer", Hammer], ["judge", "Gavel", Gavel], ["coins", "Coins", Coins], ["wind", "Wind", Wind],
      ["signpost", "Signpost", Signpost], ["mercy", "Mercy", HandHeart], ["proclaim", "Proclaim", Megaphone], ["library", "Library", Library],
    ] as const
  ).map(([id, label, Icon]) => ({ id, label, Icon })),
];

export function landmarkIconById(id: string | undefined): VerseIconOption | undefined {
  return LANDMARK_ICONS.find((option) => option.id === id);
}

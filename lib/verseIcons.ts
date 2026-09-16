import { Shield, Sword, Flame, Anchor, Heart, Crown, Mountain, Sun, Star, Bird, Waves, TreePine, Key, ScrollText, Compass, BookOpen, type LucideIcon } from "lucide-react";

export interface VerseIconOption {
  id: string;
  label: string;
  Icon: LucideIcon;
}

// A small curated set of dual-coding anchors — not a color highlight, a distinct SHAPE the
// reader picks to associate with a verse (see IconTagField.tsx). Deliberately a fixed, short
// list rather than every Lucide icon: a memory hook works better as a small, reused vocabulary
// the reader can recognize at a glance across many verses than as an unbounded picker no two
// verses would end up sharing.
export const VERSE_ICON_OPTIONS: VerseIconOption[] = [
  { id: "shield", label: "Shield", Icon: Shield },
  { id: "sword", label: "Sword", Icon: Sword },
  { id: "flame", label: "Flame", Icon: Flame },
  { id: "anchor", label: "Anchor", Icon: Anchor },
  { id: "heart", label: "Heart", Icon: Heart },
  { id: "crown", label: "Crown", Icon: Crown },
  { id: "mountain", label: "Mountain", Icon: Mountain },
  { id: "sun", label: "Sun", Icon: Sun },
  { id: "star", label: "Star", Icon: Star },
  { id: "bird", label: "Dove", Icon: Bird },
  { id: "waves", label: "Waves", Icon: Waves },
  { id: "tree", label: "Tree", Icon: TreePine },
  { id: "key", label: "Key", Icon: Key },
  { id: "scroll", label: "Scroll", Icon: ScrollText },
  { id: "compass", label: "Compass", Icon: Compass },
  { id: "book", label: "Book", Icon: BookOpen },
];

export function verseIconById(id: string | undefined): VerseIconOption | undefined {
  return VERSE_ICON_OPTIONS.find((option) => option.id === id);
}

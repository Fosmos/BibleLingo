import { BookOpen, Compass, FileText, Quote, type LucideIcon } from "lucide-react";
import type { PathKind } from "@/types";

// Each path type's icon and name (design_handoff_path_picker).
export const PATH_TYPE_META: Record<PathKind, { icon: LucideIcon; name: string }> = {
  verse: { icon: Quote, name: "Verse" },
  chapter: { icon: FileText, name: "Chapter" },
  book: { icon: BookOpen, name: "Book" },
  topic: { icon: Compass, name: "Topic" },
};

// "Book · ESV · 3 a day" — a verse path has no pace.
export function pathKicker(kind: PathKind, version: string, versesPerDay: number | undefined): string {
  const parts = [PATH_TYPE_META[kind].name, version];
  if (kind !== "verse") parts.push(`${versesPerDay ?? (kind === "book" ? 5 : 1)} a day`);
  return parts.join(" · ");
}

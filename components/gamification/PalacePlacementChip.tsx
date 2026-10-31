import { MapPin } from "lucide-react";
import { useVersePlacement } from "@/lib/useVersePlacement";
import { useProgressStore } from "@/store/useProgressStore";
import type { VerseRef } from "@/lib/palacePlacement";

interface PalacePlacementChipProps {
  verse: VerseRef;
  className?: string;
}

// Where a verse sits in the reader's built palace — "Kitchen › Fridge", with the scene they picture
// there on hover — the cue that rides along through its lesson (PathLessonTopBar.tsx) and its
// spaced reviews (SrsReviewTopBar.tsx). Nothing when it isn't on a spot, or with the setting off
// (Profile > Advanced > Memory palace in lessons).
export function PalacePlacementChip({ verse, className = "" }: PalacePlacementChipProps) {
  const { placement } = useVersePlacement(verse);
  const enabled = useProgressStore((state) => state.palaceInLessons) ?? false;
  if (!enabled || !placement) return null;
  return (
    <span title={placement.locus.scene} className={`flex min-w-0 items-center gap-1 text-[11px] font-bold text-brand-700 dark:text-brand-300 ${className}`}>
      <MapPin size={12} strokeWidth={2.75} className="shrink-0" />
      <span className="truncate">
        {placement.room.name} › {placement.locus.name || "its spot"}
        {placement.locus.scene ? ` — ${placement.locus.scene}` : ""}
      </span>
    </span>
  );
}

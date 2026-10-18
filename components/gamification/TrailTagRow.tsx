"use client";

import type { TrailTag } from "@/lib/trailTags";
import { LOCATION_TAG_LEVEL_LABELS } from "@/lib/locationTags";
import { LocationTagField } from "@/components/gamification/LocationTagField";

interface TrailTagRowProps {
  tags: TrailTag[];
  className?: string;
}

// A row of Memory Palace tag chips on the Path tab's map and trail (lib/trailTags.ts) — each one
// "+ Pericope tag" / "+ Chapter tag" / "+ Book tag" until set, then the tag, tap to edit.
export function TrailTagRow({ tags, className }: TrailTagRowProps) {
  if (!tags.length) return null;
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className ?? ""}`}>
      {tags.map((tag) => (
        <LocationTagField key={tag.key} tagKey={tag.key} addLabel={`${LOCATION_TAG_LEVEL_LABELS[tag.level]} tag`} />
      ))}
    </div>
  );
}

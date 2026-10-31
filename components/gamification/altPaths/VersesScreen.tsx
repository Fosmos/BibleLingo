"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import type { LocationTagLevel, MemorizationDay, PathKind } from "@/types";
import { readerHref } from "@/lib/readerHref";
import { useStartStop } from "@/lib/altPaths/useStartStop";
import { pathTags, sectionTags } from "@/lib/trailTags";
import type { TrailSection } from "@/lib/trailStops";
import { useTrailSections } from "@/lib/useTrailSections";
import { useProgressStore } from "@/store/useProgressStore";
import { BookGridScreen } from "@/components/gamification/altPaths/BookGridScreen";

interface VersesScreenProps {
  pathKey: string;
  kind: PathKind;
  label: string;
  days: MemorizationDay[];
  version: string;
  completedDays: number;
  versesIntoDay?: number;
}

const LEVELS: LocationTagLevel[] = ["book", "chapter", "pericope"];

// The Verses list, one of the other path views: its sections, tags and lesson links (BookGridScreen.tsx).
export function VersesScreen({ pathKey, kind, label, days, version, completedDays, versesIntoDay }: VersesScreenProps) {
  const router = useRouter();
  const sections = useTrailSections(pathKey, kind, days, completedDays, versesIntoDay);
  const levels = useProgressStore((state) => state.locationTagLevels) ?? LEVELS;
  const headerTags = useMemo(() => pathTags(kind, sections, levels), [kind, sections, levels]);
  const { start } = useStartStop(pathKey, version, kind, "verses");
  if (!sections.length) return null;
  return <BookGridScreen label={label} sections={sections} headerTags={headerTags} tagsFor={(section: TrailSection) => sectionTags(section, levels)} onStart={(stop) => start(stop, false)} onPractise={(stop) => start(stop, true)} onReview={(ids) => router.push(readerHref(pathKey, version, { review: ids }, "verses"))} />;
}

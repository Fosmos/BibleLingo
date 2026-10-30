"use client";

import { useMemo } from "react";
import type { VerseSegment } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { findPlacement } from "@/lib/palacePlacement";
import type { StructurePassage } from "@/components/gamification/BookStructureScreen";
import type { PalaceContext } from "@/components/gamification/BookStructureChapter";

// The reader's built palace for a path, with what the Palace tab's passages need to show and edit
// its spots (BookStructureChapter.tsx): the path's verses, their pictures, which are learned, each
// verse's spot name, and saving. Undefined until they've started a palace for the path.
export function usePalaceContext(pathKey: string, passages: StructurePassage[]): PalaceContext | undefined {
  const palace = useProgressStore((state) => state.builtPalaces?.find((entry) => entry.pathKey === pathKey));
  const onSave = useProgressStore((state) => state.saveBuiltPalace);
  return useMemo(() => {
    if (!palace) return undefined;
    const pathVerses = passages.flatMap((passage) => passage.lessons.map((stop) => stop.verse!));
    const pictures = new Map(passages.flatMap((passage) => passage.lessons.map((stop, at) => [stop.verse!.id, passage.pictures[at]] as const)));
    const learnedIds = new Set(passages.flatMap((passage) => passage.lessons.filter((stop) => stop.state === "done").map((stop) => stop.verse!.id)));
    const spotOf = (verse: VerseSegment) => {
      const placement = findPlacement([palace], verse);
      return placement && (placement.locus.name || placement.room.name);
    };
    return { palace, pathVerses, pictureOf: (verse: VerseSegment) => pictures.get(verse.id) ?? "book", learnedIds, spotOf, onSave };
  }, [palace, passages, onSave]);
}

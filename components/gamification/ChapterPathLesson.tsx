"use client";

import { useEffect, useRef } from "react";
import type { MemorizationDay, VerseSegment } from "@/types";
import { narrateText } from "@/lib/narrateText";
import type { PassageReview } from "@/lib/trailReviews";
import { PathLessonDock } from "@/components/gamification/PathLessonDock";
import { InPlaceLessonSession } from "@/components/gamification/InPlaceLessonSession";
import { InPlaceSrsReview } from "@/components/gamification/InPlaceSrsReview";
import { MindMapVersePreview } from "@/components/gamification/MindMapVersePreview";

export type ChapterLesson =
  // `page`: a lesson on another path than the screen's own (a verse learned on its own — lib/versePathLesson.ts).
  // `onlyVerse`: just that verse of the day, each verse its own lesson (lib/dayVerseProgress.ts).
  // `passage`: a practice of a trail's pericope or chapter review instead of the day's verses.
  | { kind: "lesson"; verseNumber: number; dayNumber: number; mode: "select" | "practice"; page?: ChapterPathPage; onlyVerse?: { chapter: number; verseNumber: number }; passage?: PassageReview }
  | { kind: "srs"; verseNumber: number; entityIds: string[] }
  | { kind: "preview"; verseNumber: number; verse: VerseSegment };

export interface ChapterPathPage {
  pathKey: string;
  label: string;
  days: MemorizationDay[];
  verses: VerseSegment[];
  version: string;
  completedDays: number;
  todaysDay: number;
}

interface ChapterPathLessonProps {
  lesson: ChapterLesson;
  page: ChapterPathPage;
  onClose: () => void;
}

// A lesson on the chapter path, run in place in the reader: its controls in the bottom dock
// (PathLessonDock.tsx), its verse in the verse's own row (PathLessonVerseSlot.tsx) — the verse's
// lesson, its spaced review, or, for a verse ahead, a read-and-listen preview.
export function ChapterPathLesson({ lesson, page, onClose }: ChapterPathLessonProps) {
  const stopNarration = useRef<(() => void) | null>(null);
  useEffect(() => () => stopNarration.current?.(), []);

  function listen(verse: VerseSegment) {
    stopNarration.current?.();
    stopNarration.current = narrateText(verse.text, () => {}, () => {
      stopNarration.current = null;
    });
  }

  return (
    <PathLessonDock onClose={onClose}>
      {lesson.kind === "lesson" ? (
        <InPlaceLessonSession
          key={`${page.pathKey}:${lesson.dayNumber}:${lesson.mode}:${lesson.onlyVerse?.chapter}:${lesson.onlyVerse?.verseNumber}:${lesson.passage?.key}`}
          pathKey={page.pathKey}
          label={page.label}
          days={page.days}
          verses={page.verses}
          version={page.version}
          completedDays={page.completedDays}
          todaysDay={page.todaysDay}
          dayNumber={lesson.dayNumber}
          mode={lesson.mode}
          onlyVerse={lesson.onlyVerse}
          passage={lesson.passage}
          embeddedInMindMap
          onExit={onClose}
        />
      ) : lesson.kind === "srs" ? (
        <InPlaceSrsReview entityIds={lesson.entityIds} onExit={onClose} />
      ) : (
        <MindMapVersePreview verse={lesson.verse} learned={false} actionLabel={undefined} onAction={() => {}} secondary={{ label: "Listen", onClick: () => listen(lesson.verse) }} />
      )}
    </PathLessonDock>
  );
}

"use client";

import type { MemorizationDay, VerseSegment } from "@/types";
import { resolveCompletingChapterVerses } from "@/lib/completingChapterVerses";
import { useChapterScopedReadingLayout } from "@/lib/useChapterScopedReadingLayout";
import { DaySessionController } from "@/components/gamification/DaySessionController";
import { PracticeChain } from "@/components/drills/PracticeChain";
import { EsvAttribution } from "@/components/ui/EsvAttribution";

// A stable placeholder so useChapterScopedReadingLayout (a hook — can't be called after the
// `!day` early return below) always has a real MemorizationDay to key off of, even on the one
// render where `dayNumber` doesn't actually match anything in `days` — its own resulting
// layout is simply never used in that case, since the component returns null right after.
const FALLBACK_DAY: MemorizationDay = { dayNumber: -1, kind: "learn", newVerses: [], reviewVerses: [] };

interface InPlaceLessonSessionProps {
  pathKey: string;
  label: string;
  days: MemorizationDay[];
  verses: VerseSegment[];
  version: string;
  // This whole PATH's own completedDays/todaysDay — not scoped to just this one lesson day —
  // threaded down to DaySessionController so its own parchment can lay out against the SAME
  // real chapter pages/uniform font size the reading view underneath it just showed (see
  // lib/useChapterReadingLayout.ts), rather than a smaller, differently-sized excerpt.
  completedDays: number;
  todaysDay: number;
  dayNumber: number;
  mode: "select" | "practice";
  onExit: () => void;
}

// PathOverviewScreen.tsx's own in-place lesson/practice session — rendered right there,
// still mounted under the same parchment view it was reached from, instead of navigating to
// the standalone `/day/[dayNumber]`(`/practice`) routes DayLoader.tsx/PracticeLoader.tsx
// still serve as a fallback (a bookmarked or shared link, say). `onExit` is the one way back:
// it just clears PathOverviewScreen's own lessonDay state, so the exact same parchment view
// reappears underneath rather than a browser-history "back" landing somewhere else entirely.
export function InPlaceLessonSession({ pathKey, label, days, verses, version, completedDays, todaysDay, dayNumber, mode, onExit }: InPlaceLessonSessionProps) {
  const day = days.find((candidate) => candidate.dayNumber === dayNumber);
  // Called unconditionally, alongside every other hook here, since hooks can't be called
  // after an early return — see FALLBACK_DAY's own doc comment.
  const layout = useChapterScopedReadingLayout(days, day ?? FALLBACK_DAY, completedDays, todaysDay);
  if (!day) return null;

  if (mode === "practice") {
    // Matches whichever button got the reader here — DayCircle.tsx's Practice (boss battles)
    // or Review (a completed learn lesson's own verses) — see PracticeLoader.tsx's own
    // identical logic, which this mirrors for the standalone-route fallback. See
    // PracticeChain.tsx's own doc comment on why Review always drills first-letter while
    // Practice stays full-word.
    const practiceVerses = day.newVerses.length > 0 ? day.newVerses : day.reviewVerses;
    if (practiceVerses.length === 0) return null;
    const isReview = day.kind === "learn";
    const drillLabel = isReview ? "Review" : "Practice";
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
        <PracticeChain
          verses={practiceVerses}
          label={drillLabel}
          mode={isReview ? "firstLetter" : "fullWord"}
          onExit={onExit}
          sessionKey={`${pathKey}:${dayNumber}:practice`}
          layout={layout}
        />
      </div>
    );
  }

  return (
    <>
      <DaySessionController
        pathKey={pathKey}
        label={label}
        day={day}
        allDays={days}
        completedDays={completedDays}
        todaysDay={todaysDay}
        totalDays={days.length}
        completingChapterVerses={resolveCompletingChapterVerses(day, days, verses)}
        onExit={onExit}
      />
      <EsvAttribution visible={version === "ESV"} />
    </>
  );
}

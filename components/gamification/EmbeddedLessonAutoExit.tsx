"use client";

import { useEffect } from "react";
import { StreakMilestoneModal } from "@/components/gamification/StreakMilestoneModal";

interface EmbeddedLessonAutoExitProps {
  milestoneStreak: number | null;
  onExit: () => void;
}

// A finished lesson inside the Mind Map sheet goes straight back to the map — the completion
// celebration has already played by now (see DaySessionController.tsx), so a separate "Lesson
// complete! / Back to path" screen would just be one more tap. A streak milestone, if this lesson
// earned one, still gets its modal first; closing it is what returns to the map.
export function EmbeddedLessonAutoExit({ milestoneStreak, onExit }: EmbeddedLessonAutoExitProps) {
  useEffect(() => {
    if (milestoneStreak === null) onExit();
  }, [milestoneStreak, onExit]);

  return <StreakMilestoneModal open={milestoneStreak !== null} streakCount={milestoneStreak ?? 0} onClose={onExit} />;
}

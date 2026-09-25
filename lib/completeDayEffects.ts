import type { MemorizationDay, VerseSegment } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { playStreakSfx } from "@/lib/audio";
import { STREAK_MILESTONES } from "@/lib/streak";
import { SHEKELS_PER_VERSE_COMPLETED, SHEKELS_PER_BOSS_BATTLE } from "@/lib/economy";
import { isPathLearned } from "@/lib/pathCompletion";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";

// The store-level side effects of finishing one day — completeDay, book mode's direct
// per-chapter SRS graduation, streak increment (+ SFX, and a freeze on a milestone), and
// shekels. Shared by DaySessionController.tsx's real finish flow and DayPathDiagram.tsx's
// "Next day (testing)" shortcut, which skips the lesson UI entirely but still needs the exact
// same bookkeeping so progress stays consistent either way it's reached. Returns the new
// streak count when a milestone was just hit, or null otherwise — the only side effect a
// caller ever needs to react to further (a StreakMilestoneModal).
//
// With `allDays` (the path's whole plan), finishing its last learn day also completes the path:
// it leaves the active paths and PathCompleteCelebration.tsx shows what was memorized.
export function applyDayCompletion(pathKey: string, day: MemorizationDay, completingChapterVerses?: VerseSegment[], allDays?: MemorizationDay[]): number | null {
  const store = useProgressStore.getState();
  const wasLearned = allDays ? isPathLearned(allDays, store.paths[pathKey]?.completedDays ?? 0) : true;
  store.completeDay(pathKey, day.dayNumber);
  if (!wasLearned && allDays && isPathLearned(allDays, useProgressStore.getState().paths[pathKey]?.completedDays ?? 0)) {
    store.removeActivePath(pathKey);
    useLessonSessionStore.getState().setCompletedPath(pathKey);
  }
  const plan = useProgressStore.getState().paths[pathKey];
  if (completingChapterVerses && completingChapterVerses.length > 0 && plan) {
    store.completeBookChapter(completingChapterVerses, plan.version);
  }
  const previousStreak = useProgressStore.getState().streak.currentStreak;
  store.incrementStreak();
  const newStreak = useProgressStore.getState().streak.currentStreak;
  let milestone: number | null = null;
  if (newStreak !== previousStreak) {
    playStreakSfx();
    if (STREAK_MILESTONES.includes(newStreak)) {
      store.addStreakFreeze(1);
      milestone = newStreak;
    }
  }
  if (day.newVerses.length > 0) {
    store.earnShekels(day.newVerses.length * SHEKELS_PER_VERSE_COMPLETED);
  }
  if (day.kind === "boss_battle" || day.kind === "section_boss_battle") {
    store.earnShekels(SHEKELS_PER_BOSS_BATTLE);
  }
  if (day.kind === "boss_battle") {
    store.awardSticker(pathKey);
  }
  return milestone;
}

import { create } from "zustand";

interface LessonSessionState {
  activeCount: number;
}

interface LessonSessionActions {
  begin: () => void;
  end: () => void;
}

type LessonSessionStore = LessonSessionState & LessonSessionActions;

// Deliberately NOT persisted (unlike store/useProgressStore.ts) — this only ever tracks
// whether a LessonControlBar.tsx is currently mounted in its docked/fill-parchment mode
// (Learn, SRS Review, Relearn, Practice all render through it — see LessonControlBar.tsx's
// own doc comment), so AuthGate.tsx can hide the bottom tab bar for the DURATION of that one
// session and nothing survives a reload to get stuck "on". A COUNT rather than a plain
// boolean because a stage transition can briefly mount the next LessonControlBar before the
// previous one unmounts; two overlapping sessions still means "still in a session" until both
// clear, instead of one's cleanup wrongly flipping it back off underneath the other.
export const useLessonSessionStore = create<LessonSessionStore>((set) => ({
  activeCount: 0,
  begin: () => set((state) => ({ activeCount: state.activeCount + 1 })),
  end: () => set((state) => ({ activeCount: Math.max(0, state.activeCount - 1) })),
}));

export function useIsLessonSessionActive(): boolean {
  return useLessonSessionStore((state) => state.activeCount > 0);
}

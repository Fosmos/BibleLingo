"use client";

import { useEffect, useRef, useState } from "react";
import { useProgressStore } from "@/store/useProgressStore";
import { useAuthStore } from "@/store/useAuthStore";
import { StreakLossModal } from "@/components/gamification/StreakLossModal";

interface StreakLossState {
  open: boolean;
  previousStreak: number;
}

export function ProgressInitializer() {
  const currentUserId = useAuthStore((state) => state.currentUserId);
  const [streakLoss, setStreakLoss] = useState<StreakLossState>({ open: false, previousStreak: 0 });
  // evaluateStreakOnLoad() is a "did a day get skipped since last check" query that mutates
  // state (consumes a freeze / resets the streak) as part of answering — it is NOT safe to
  // run twice for the same account. This ref (rather than a module-level boolean) tracks
  // which user id was last checked, so switching accounts within one session still runs the
  // check again for the newly signed-in account, but re-renders for the same account don't.
  const checkedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!currentUserId || checkedUserIdRef.current === currentUserId) return;
    checkedUserIdRef.current = currentUserId;

    const { status, previousStreak } = useProgressStore.getState().evaluateStreakOnLoad();
    if (status === "lost") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStreakLoss({ open: true, previousStreak });
    }
  }, [currentUserId]);

  return (
    <StreakLossModal
      open={streakLoss.open}
      previousStreak={streakLoss.previousStreak}
      onClose={() => setStreakLoss((prev) => ({ ...prev, open: false }))}
    />
  );
}

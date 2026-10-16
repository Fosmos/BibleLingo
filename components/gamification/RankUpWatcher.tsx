"use client";

import { useEffect, useState } from "react";
import { useProgressStore } from "@/store/useProgressStore";
import { useAuthStore } from "@/store/useAuthStore";
import { computeMemorizedStats } from "@/lib/progressSummary";
import { rankStanding } from "@/lib/ranks";
import { playSectionCompleteSfx } from "@/lib/audio";
import { RankUpModal } from "@/components/gamification/RankUpModal";

// Celebrates each new rank (lib/ranks.ts) once, the moment the verses memorized reach it — after
// a stone on the trail finishes, say. Waits for a signed-in account, so it never acts on the
// defaults before saved progress loads. The first time it sees an account it just records the
// rank already held, so an existing reader isn't greeted with a rank they earned long ago.
export function RankUpWatcher() {
  const userId = useAuthStore((state) => state.currentUserId);
  const entities = useProgressStore((state) => state.memorizedEntities);
  const celebrated = useProgressStore((state) => state.rankCelebrated);
  const markRankCelebrated = useProgressStore((state) => state.markRankCelebrated);
  const [showing, setShowing] = useState<number | null>(null);
  const index = rankStanding(computeMemorizedStats(entities).verses).index;

  useEffect(() => {
    if (!userId) return;
    if (celebrated === undefined) {
      markRankCelebrated(index);
    } else if (index > celebrated) {
      markRankCelebrated(index);
      playSectionCompleteSfx();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- a one-off reaction to the store's count crossing a rank
      setShowing(index);
    }
  }, [userId, index, celebrated, markRankCelebrated]);

  return <RankUpModal index={showing} onClose={() => setShowing(null)} />;
}

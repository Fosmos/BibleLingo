"use client";

import { useTodayLabel } from "@/lib/useTodayLabel";

import { useAuthStore } from "@/store/useAuthStore";
import { useProgressStore } from "@/store/useProgressStore";
import { useActivePathKeys } from "@/lib/useActivePathKeys";
import { StreakCounter } from "@/components/gamification/StreakCounter";
import { TodayVersesCard } from "@/components/gamification/TodayVersesCard";
import { NeedsReviewingCard } from "@/components/gamification/NeedsReviewingCard";
import { VespersPromptCard } from "@/components/gamification/VespersPromptCard";
import { SleepTimerCard } from "@/components/gamification/SleepTimerCard";
import { PageHeading } from "@/components/ui/PageHeading";

export default function Home() {
  // Only resolves to a real name once auth is in use and signed in with a tracked account —
  // falls back to a generic greeting otherwise (e.g. the local-profile/no-auth mode).
  const username = useAuthStore((state) => state.currentUsername);
  // "Welcome back" reads oddly on the very first visit a reader has never actually been here
  // before to come BACK from — activePathKey stays null until they finish the guided path
  // flow at least once, the one signal on this screen that's true "never engaged" rather than
  // "engaged but nothing due today" (which TodayVersesCard's own no-path state already covers
  // with its own copy).
  const activePathKey = useProgressStore((state) => state.activePathKey);
  const isFirstVisit = activePathKey === null;
  // One "today's verses" card per active path — each keeps its own day count and lesson.
  const activePathKeys = useActivePathKeys();
  const today = useTodayLabel();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-[22px] px-5 pb-4 pt-6">
      <div className="flex items-start justify-between gap-3">
        {/* Today's date over the greeting, "back" picked out in the accent. */}
        <PageHeading kicker={today}>
          Welcome{!isFirstVisit && <span className="text-brand-600"> back</span>}
          {username ? `, ${username}` : ""}!
        </PageHeading>
        <StreakCounter pill className="mt-1.5" />
      </div>
      {/* Today's lesson first, then whatever's due for review — each with a pin straight to it on
          the map. The fuller review tools (Sword of the Spirit, Problem Verses) stay on the
          Memorized tab (see app/memorized/page.tsx). */}
      <div className="flex flex-1 flex-col gap-[22px]">
        {activePathKeys.length === 0 ? <TodayVersesCard /> : activePathKeys.map((key) => <TodayVersesCard key={key} pathKey={key} />)}
        <NeedsReviewingCard />
        <VespersPromptCard />
        <SleepTimerCard />
      </div>
    </div>
  );
}

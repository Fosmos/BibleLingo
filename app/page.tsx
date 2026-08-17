"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { StreakCounter } from "@/components/gamification/StreakCounter";
import { TodayVersesCard } from "@/components/gamification/TodayVersesCard";
import { ReviewNeededCard } from "@/components/gamification/ReviewNeededCard";

export default function Home() {
  // Only resolves to a real name once auth is in use and signed in with a tracked account —
  // falls back to a generic greeting otherwise (e.g. the local-profile/no-auth mode).
  const username = useAuthStore((state) => state.accounts.find((account) => account.id === state.currentUserId)?.username);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-title">Welcome back{username ? `, ${username}` : ""}!</h1>
        <StreakCounter pill />
      </div>
      <div className="flex flex-1 flex-col gap-4">
        <TodayVersesCard />
        <ReviewNeededCard />
      </div>
    </div>
  );
}

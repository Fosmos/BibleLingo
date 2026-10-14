"use client";

import { PathHomeList } from "@/components/gamification/PathHomeList";
import { NeedsReviewingCard } from "@/components/gamification/NeedsReviewingCard";
import { VespersPromptCard } from "@/components/gamification/VespersPromptCard";
import { SleepTimerCard } from "@/components/gamification/SleepTimerCard";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-[22px] px-[18px] pb-7 pt-1.5">
      {/* "Your paths" (design_handoff_path_picker) — a card per path, then Start a new path — with
          what's due for review, Vespers and the sleep timer below. */}
      <PathHomeList />
      <NeedsReviewingCard />
      <VespersPromptCard />
      <SleepTimerCard />
    </div>
  );
}

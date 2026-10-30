"use client";

import { PathHomeList } from "@/components/gamification/PathHomeList";
import { VespersPromptCard } from "@/components/gamification/VespersPromptCard";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-[22px] overflow-x-clip px-[18px] pb-7 pt-1.5">
      {/* What's due, then your paths with the next lesson first. Vespers appears only at its hour. */}
      <PathHomeList />
      <VespersPromptCard />
    </div>
  );
}

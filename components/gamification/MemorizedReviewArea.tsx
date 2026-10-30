"use client";

import Link from "next/link";
import { ChevronRight, Trophy } from "lucide-react";
import { NeedsReviewingCard } from "@/components/gamification/NeedsReviewingCard";
import { RecallQuizButton } from "@/components/gamification/RecallQuizButton";
import { WhereYouStumble } from "@/components/gamification/WhereYouStumble";

// The Memorized tab's one place for going back over verses: what's due, where you stumble (each
// spot opening Relearn), then the Recall quiz and Mastery mode.
export function MemorizedReviewArea() {
  return (
    <section id="review" aria-label="Review" className="flex flex-col gap-3.5">
      <NeedsReviewingCard />
      <WhereYouStumble />
      <RecallQuizButton />
      <Link href="/memorized/mastery" className="flex items-center gap-3 rounded-[22px] bg-sand-100 px-4 py-3.5 dark:bg-zinc-900">
        <Trophy size={20} strokeWidth={2.5} className="shrink-0 text-brand-600" />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="font-heading text-[17px] leading-tight text-ink dark:text-zinc-100">Mastery mode</span>
          <span className="text-xs font-extrabold text-ink-muted">Test a passage from memory, level by level</span>
        </span>
        <ChevronRight size={18} strokeWidth={2.75} className="shrink-0 text-sand-500" />
      </Link>
    </section>
  );
}

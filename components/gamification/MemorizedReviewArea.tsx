"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import { TOOL_ROW } from "@/lib/memorizedShelf";
import { RecallQuizButton } from "@/components/gamification/RecallQuizButton";
import { WhereYouStumble } from "@/components/gamification/WhereYouStumble";

const ARROW = "text-sand-500";

// The Memorized tab's tools, as plain rows under your books: where you stumble (each spot opening
// Relearn), then the Recall quiz, Mastery mode and the Bible reader.
export function MemorizedReviewArea() {
  const [stumblesOpen, setStumblesOpen] = useState(false);
  return (
    <section id="review" aria-label="Review tools" className="flex flex-col border-t border-sand-200 dark:border-zinc-900">
      <button type="button" aria-expanded={stumblesOpen} onClick={() => setStumblesOpen(!stumblesOpen)} className={TOOL_ROW}>
        Where you stumble
        <ChevronDown size={18} strokeWidth={2.75} className={`${ARROW} transition-transform ${stumblesOpen ? "rotate-180" : ""}`} />
      </button>
      {stumblesOpen && (
        <div className="border-b border-sand-200 py-3 dark:border-zinc-900">
          <WhereYouStumble />
        </div>
      )}
      <RecallQuizButton plain />
      <Link href="/memorized/mastery" className={TOOL_ROW}>
        Mastery mode
        <ChevronRight size={18} strokeWidth={2.75} className={ARROW} />
      </Link>
      <Link href="/memorized?view=bible" className={TOOL_ROW}>
        Open your Bible
        <ChevronRight size={18} strokeWidth={2.75} className={ARROW} />
      </Link>
    </section>
  );
}

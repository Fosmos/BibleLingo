"use client";

import { useMemo, useState } from "react";
import { Shuffle } from "lucide-react";
import { useProgressStore } from "@/store/useProgressStore";
import { buildMemorizedVerseIndex } from "@/lib/memorizedVerseIndex";
import { buildRecallPool } from "@/lib/recallQuiz";
import { RecallQuiz } from "@/components/gamification/RecallQuiz";

interface RecallQuizButtonProps {
  // Quiz just this book's verses; the whole Bible without it.
  book?: string;
}

// The Bible and Book screens' "Recall quiz" — random verses you know, reference ↔ text.
export function RecallQuizButton({ book }: RecallQuizButtonProps) {
  const paths = useProgressStore((state) => state.paths);
  const entities = useProgressStore((state) => state.memorizedEntities);
  const pool = useMemo(() => buildRecallPool(buildMemorizedVerseIndex(paths, entities), entities, paths, book), [paths, entities, book]);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!pool.length}
        className="flex items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-[15px] font-extrabold text-paper shadow-organic-md hover:bg-ink-soft disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
      >
        <Shuffle size={18} strokeWidth={2.5} />
        Recall quiz
        <span className="text-xs font-bold opacity-70">· {pool.length} {pool.length === 1 ? "verse" : "verses"}</span>
      </button>
      {open && <RecallQuiz pool={pool} scopeLabel={book ?? "Your Bible"} onClose={() => setOpen(false)} />}
    </>
  );
}

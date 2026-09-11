"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PEG_DIGITS } from "@/lib/pegSystem";
import { PegSystemQuiz } from "@/components/gamification/PegSystemQuiz";
import { PageHeading } from "@/components/ui/PageHeading";
import { TAP_SCALE } from "@/lib/motionTokens";

type Mode = "overview" | "quiz" | "result";

export default function PegSystemPage() {
  const [mode, setMode] = useState<Mode>("overview");
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <Link href="/profile" className="self-start text-sm font-medium text-brand-600 hover:underline">
        ← Back to Profile
      </Link>
      <PageHeading kicker="Memory Palace">The Peg System</PageHeading>
      <p className="text-sm text-ink-muted">
        Each digit maps to a consonant sound. Chain two digits&apos; sounds with vowels between and you get a real,
        picturable word — e.g. 2 = N, 4 = R, so 24 = &quot;Noir&quot;. Learn the 10 base sounds below, then quiz yourself.
      </p>

      {mode === "overview" && (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {Object.entries(PEG_DIGITS).map(([digit, peg]) => (
              <div
                key={digit}
                className="flex flex-col items-center gap-1 rounded-xl bg-brand-50 p-3 text-center dark:bg-zinc-900"
              >
                <span className="text-title text-brand-600">{digit}</span>
                <span className="text-xs font-semibold text-ink-soft dark:text-zinc-300">{peg.consonants}</span>
                <span className="text-2xl">{peg.emoji}</span>
                <span className="text-xs text-ink-muted">{peg.word}</span>
              </div>
            ))}
          </div>
          <motion.button
            type="button"
            whileTap={TAP_SCALE}
            onClick={() => setMode("quiz")}
            className="self-start rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white"
          >
            Start Quiz
          </motion.button>
        </>
      )}

      {mode === "quiz" && (
        <PegSystemQuiz
          onComplete={(score, total) => {
            setResult({ score, total });
            setMode("result");
          }}
        />
      )}

      {mode === "result" && result && (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-brand-50 p-6 text-center shadow-sm dark:border dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
          <p className="text-title text-brand-600">
            {result.score} / {result.total}
          </p>
          <p className="text-sm text-ink-muted">
            {result.score === result.total ? "Perfect! You know your pegs." : "Review the table above and try again anytime."}
          </p>
          <Link href="/profile" className="text-sm font-medium text-brand-600 hover:underline">
            Done
          </Link>
        </div>
      )}
    </div>
  );
}

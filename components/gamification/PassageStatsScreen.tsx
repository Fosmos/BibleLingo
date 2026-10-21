"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { toRow } from "@/lib/memorizedLibrary";
import { useHasMounted } from "@/lib/useHasMounted";
import { useReviewHref } from "@/lib/useReviewHref";
import { FetchLoading } from "@/components/ui/FetchStatus";
import { SEAL_TIERS } from "@/lib/srsSeals";
import { accuracySummary, reviewHistory, troubleWords } from "@/lib/passageStats";
import { PROMOTION_ACCURACY_THRESHOLD } from "@/lib/srs";
import { useProgressStore } from "@/store/useProgressStore";
import { SrsSeal } from "@/components/ui/SrsSeal";
import { ReviewAccuracyChart } from "@/components/gamification/ReviewAccuracyChart";

const SECTION = "flex flex-col gap-2 rounded-[20px] bg-sand-100 p-3.5 dark:bg-zinc-800/70";
const HEADING = "text-[11px] font-black uppercase tracking-[.08em] text-sage-800 dark:text-sage-300";
const ago = (at: string | null) => {
  if (!at) return "Not reviewed yet";
  const days = Math.floor((Date.now() - new Date(at).getTime()) / 86_400_000);
  return days <= 0 ? "Last reviewed today" : days === 1 ? "Last reviewed yesterday" : `Last reviewed ${days} days ago`;
};

// A passage's stats page (`/memorized/passage?id=`), reached by tapping it in the Memorized tab's
// list (MemorizedBooksList.tsx): its review accuracy over past reviews (ReviewAccuracyChart.tsx),
// when it's due, how strong it's held (its seal, by box), its last / best / average score and its
// most-missed words — then Review it, or open it in the reader.
export function PassageStatsScreen() {
  const mounted = useHasMounted();
  const id = useSearchParams().get("id");
  const entity = useProgressStore((state) => state.memorizedEntities.find((candidate) => candidate.id === id));
  const threshold = useProgressStore((state) => state.srsPromotionThreshold) ?? PROMOTION_ACCURACY_THRESHOLD;
  const best = useProgressStore((state) => (id ? state.srsBestAccuracy[id] : undefined));
  const stumbles = useProgressStore((state) => state.wordStumbleCounts);
  const reviewHref = useReviewHref();
  const [now] = useState(() => new Date());
  if (!mounted) return <FetchLoading label="Loading…" />;
  if (!entity) {
    return (
      <div className="flex flex-col items-start gap-3 px-[18px] pt-4">
        <BackLink />
        <p className="text-sm font-semibold text-ink-muted">This passage isn&apos;t in your memorized verses.</p>
      </div>
    );
  }

  const row = toRow(entity, now);
  const history = reviewHistory(entity);
  const accuracy = accuracySummary(history, best);
  const trouble = troubleWords(entity, stumbles);
  const seal = SEAL_TIERS[Math.min(row.seal, SEAL_TIERS.length) - 1];

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-3 px-[18px] pb-28 pt-[calc(0.5rem+env(safe-area-inset-top))]">
      <BackLink />
      <div className="flex items-center gap-3">
        <SrsSeal tier={row.seal} size={44} />
        <div className="flex min-w-0 flex-1 flex-col">
          <h1 className="truncate font-heading text-[26px] leading-tight text-ink dark:text-zinc-100">{row.label}</h1>
          <span className="text-xs font-extrabold text-ink-muted">
            {row.verseCount} {row.verseCount === 1 ? "verse" : "verses"} · {entity.version}
          </span>
        </div>
      </div>

      <section className={SECTION}>
        <h3 className={HEADING}>Review accuracy</h3>
        <ReviewAccuracyChart history={history} threshold={threshold} />
      </section>

      <div className="grid grid-cols-2 gap-3">
        <section className={SECTION}>
          <h3 className={HEADING}>Review status</h3>
          <span className={`text-[17px] font-black ${row.tone === "due" ? "text-brand-700 dark:text-brand-300" : "text-ink dark:text-zinc-100"}`}>{row.dueText}</span>
          <span className="text-xs font-semibold text-ink-muted">{ago(entity.srs.lastReviewedAt)}</span>
        </section>
        <section className={SECTION}>
          <h3 className={HEADING}>Strength</h3>
          <span className="text-[17px] font-black text-ink dark:text-zinc-100">{seal.name}</span>
          <span className="text-xs font-semibold text-ink-muted">
            Box {row.seal} of {SEAL_TIERS.length}
          </span>
        </section>
      </div>

      <section className={SECTION}>
        <h3 className={HEADING}>Accuracy</h3>
        <div className="grid grid-cols-3 gap-2 text-center">
          {(
            [
              ["Last", accuracy.last],
              ["Best", accuracy.best],
              ["Average", accuracy.average],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="flex flex-col">
              <span className="text-[20px] font-black text-ink dark:text-zinc-100">{value === null ? "—" : `${value}%`}</span>
              <span className="text-[11px] font-bold text-ink-muted">{label}</span>
            </div>
          ))}
        </div>
        <h3 className={`${HEADING} pt-1`}>Trouble words</h3>
        {trouble.length ? (
          <div className="flex flex-wrap gap-1.5">
            {trouble.map((word) => (
              <span key={`${word.verseNumber}-${word.word}`} className="rounded-full bg-paper px-2.5 py-1 text-[13px] font-bold text-ink dark:bg-zinc-900 dark:text-zinc-100">
                {word.word} <span className="text-ink-muted">v{word.verseNumber} · missed {word.misses}×</span>
              </span>
            ))}
          </div>
        ) : (
          <span className="text-sm font-semibold text-ink-muted">None yet — no words missed in review.</span>
        )}
      </section>

      <div className="flex gap-2 pt-1">
        <Link href={reviewHref([entity.id], false) ?? "/memorized"} className="flex-1 rounded-2xl border-2 border-sand-300 bg-white py-3 text-center text-[13px] font-black uppercase tracking-[.06em] text-ink shadow-[0_3px_0_#DCD3C4] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
          Open in reader
        </Link>
        <Link href={reviewHref([entity.id], true) ?? "/memorized/review"} className="flex-1 rounded-2xl bg-brand-500 py-3 text-center text-[13px] font-black uppercase tracking-[.06em] text-white shadow-[0_3px_0_#8C491A]">
          Review
        </Link>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/memorized" className="flex items-center gap-1 self-start rounded-xl py-1.5 pr-2 text-sm font-black text-sand-700 hover:text-ink dark:text-zinc-400">
      <ChevronLeft size={18} strokeWidth={2.75} /> Memorized
    </Link>
  );
}

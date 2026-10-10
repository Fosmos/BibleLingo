"use client";

import { ArrowRight, BookOpen, Compass, MoonStar, RotateCcw, Zap } from "lucide-react";
import { useTodaysDay } from "@/lib/useTodaysDay";
import { formatVerseRangeLabel } from "@/lib/chapterContent";
import { parsePathKey, resolvePathLabel } from "@/lib/memorizationContent";
import { practiceArrivalHref } from "@/lib/usePracticeArrival";
import { Button } from "@/components/ui/Button";

const DAY_KIND_LABELS: Record<string, string> = {
  chapter_review: "Time for a full review!",
  boss_battle: "Time for your boss battle!",
  section_boss_battle: "Time for your section boss battle!",
  weekly_review: "Time for your weekly review!",
  monthly_review: "Time for your monthly review!",
};

// today=1 tells PathOverviewScreen to jump book-mode paths straight to today's verse instead
// of landing on the Mind Map (see PathOverviewScreen.tsx's own jumpToToday doc comment) —
// every other path kind already opens there by default, so the param is a harmless no-op for
// them.
function pathHref(activePathKey: string, version: string): string {
  return `/path/${encodeURIComponent(activePathKey)}?version=${encodeURIComponent(version)}&today=1`;
}

// Review today's finished lesson: book, chapter and verse paths run it on the Path tab, in place
// on the verse like a spaced review (lib/usePracticeArrival.ts); a topic path has no chapter view,
// so it keeps the standalone practice route.
function practiceHref(activePathKey: string, version: string, dayNumber: number): string {
  if (parsePathKey(activePathKey).kind === "topic") return `/path/${encodeURIComponent(activePathKey)}/day/${dayNumber}/practice`;
  return practiceArrivalHref(activePathKey, version, dayNumber);
}

interface TodayVersesCardProps {
  // Which active path this card is for — Home shows one per path (see app/page.tsx). Omitted:
  // the focused one (and the "no path yet" state when there is none).
  pathKey?: string;
}

// A rough lesson length for the card's "about N min" — a few minutes a verse, never under 3.
const lessonMinutes = (verseCount: number) => Math.max(3, verseCount * 3);

export function TodayVersesCard({ pathKey }: TodayVersesCardProps) {
  const { activePathKey, plan, currentDay, restingUntilTomorrow, lastCompletedDay, error, retry } = useTodaysDay(pathKey);
  const label = activePathKey ? resolvePathLabel(activePathKey) : undefined;

  return (
    // A warm-tinted "hero" card, not a plain white one — the one thing on Home actually
    // worth memorizing right now, so it gets more visual weight than everything below it
    // (see ReviewNeededCard.tsx, which deliberately stays plain/secondary by comparison).
    <div className="relative overflow-hidden rounded-organic bg-sage-200 p-[22px] text-sage-900 dark:bg-zinc-900 dark:text-zinc-100">
      {/* The Organic restyle's soft decorative circle in the card's top-right corner. */}
      <div aria-hidden="true" className="pointer-events-none absolute -right-[60px] -top-[70px] h-[190px] w-[190px] rounded-full bg-sage-300 dark:bg-zinc-800" />
      <div className="relative flex flex-col gap-3.5">
      <div className="flex items-center gap-2">
        <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-sage-600 text-sage-100">
          <BookOpen size={17} strokeWidth={2.75} />
        </span>
        <p className="text-[13px] font-bold uppercase tracking-[.06em] text-sage-800 dark:text-sage-300">Today&apos;s Verses</p>
      </div>
      {currentDay && activePathKey && plan ? (
        <>
          {currentDay.newVerses.length > 0 ? (
            // One flowing preview, not a repeated reference+text block per verse — matches
            // the Path view's own continuous-reading treatment (see ChapterReadingView.tsx)
            // rather than reading as a list of near-identical rows. Serif + bold + full ink,
            // not the muted sans label treatment — the verse text is the actual point of this
            // card, so it reads as the loudest thing in it, same editorial-contrast principle
            // this app already uses for headings (see globals.css).
            <div className="flex flex-col gap-1.5">
              <p className="font-serif text-[22px] leading-tight">{formatVerseRangeLabel(currentDay.newVerses)}</p>
              {/* No line-clamp — this card grows to fit however many verses today's lesson
                  holds instead of cropping a longer one mid-sentence. */}
              <p className="font-reading text-lg font-medium leading-normal">{currentDay.newVerses.map((verse) => verse.text).join(" ")}</p>
              <p className="mt-1 flex items-center gap-1.5 text-[13px] font-semibold text-sage-800 dark:text-sage-300">
                <Zap size={14} strokeWidth={2.75} />
                Day {currentDay.dayNumber} · about {lessonMinutes(currentDay.newVerses.length)} min
              </p>
            </div>
          ) : (
            <p className="text-sm text-sage-800 dark:text-zinc-400">{DAY_KIND_LABELS[currentDay.kind] ?? "Continue your path"}</p>
          )}
          <Button
            // The version query param is what the path overview page treats as the source
            // of truth (see app/path/[key]/page.tsx) — omitting it would default to KJV and
            // silently overwrite an already-selected translation via PathOverviewScreen's
            // sync effect.
            href={pathHref(activePathKey, plan.version)}
            fullWidth
          >
            Go to your path <ArrowRight size={18} strokeWidth={2.75} />
          </Button>
        </>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 py-2 text-center">
          <p className="text-sm text-heart-700 dark:text-heart-300">{error}</p>
          <button type="button" onClick={retry} className="text-sm font-medium text-brand-600 hover:underline">
            Try again
          </button>
        </div>
      ) : restingUntilTomorrow && lastCompletedDay && activePathKey && plan ? (
        // Today's own lesson is already done — the next one only opens up once a real
        // calendar day passes (see lib/dayRollover.ts), so this deliberately never previews
        // tomorrow's not-yet-taught verses the way it briefly used to the instant a lesson
        // finished. Shows what was actually just learned today instead of going blank, same
        // preview treatment as the normal in-progress state above.
        <>
          {lastCompletedDay.newVerses.length > 0 ? (
            <div>
              <p className="text-sm font-semibold text-sage-800 dark:text-zinc-300">
                Completed today · {formatVerseRangeLabel(lastCompletedDay.newVerses)}
              </p>
              <p className="font-reading text-lg font-medium leading-normal">
                {lastCompletedDay.newVerses.map((verse) => verse.text).join(" ")}
              </p>
            </div>
          ) : (
            <p className="text-sm text-sage-800 dark:text-zinc-400">Completed today.</p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-sage-800 dark:text-zinc-400">
              <MoonStar size={13} className="mr-1 inline -translate-y-px text-brand-400 dark:text-brand-600" />
              Come back tomorrow for more.
            </p>
            {/* flex-wrap on the row above matters together with Button.tsx's own shrink-0 (so
                a button's own label never gets squeezed into a multi-line stack — see its own
                doc comment): this row's total content can genuinely exceed a narrow viewport's
                width now that neither button will shrink, so flex-wrap is what lets the button
                group drop to its own line below the caption in that case instead of overflowing
                the card. */}
            <div className="flex shrink-0 items-center gap-2">
              {lastCompletedDay.kind === "learn" && (
                <Button href={practiceHref(activePathKey, plan.version, lastCompletedDay.dayNumber)} variant="secondary">
                  <RotateCcw size={14} className="mr-1 inline -translate-y-px" />
                  Review
                </Button>
              )}
              <Button href={pathHref(activePathKey, plan.version)}>Go to your path</Button>
            </div>
          </div>
        </>
      ) : restingUntilTomorrow ? (
        // Same gate as above, minus a resolvable lastCompletedDay (e.g. its chapter has since
        // been evicted from the content cache) — falls back to the plain message rather than
        // a stuck spinner, which the next branch down would otherwise show forever.
        <div className="flex flex-col items-center gap-2 py-2 text-center">
          <MoonStar size={28} strokeWidth={1.5} className="text-brand-300 dark:text-brand-700" />
          <p className="text-sm text-sage-800 dark:text-zinc-400">You&apos;ve completed today&apos;s verses. Come back tomorrow for more.</p>
        </div>
      ) : activePathKey && plan ? (
        <div className="flex flex-col items-center gap-2 py-2 text-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <p className="text-sm text-sage-800 dark:text-zinc-400">Loading {label ?? "your path"}…</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-2 text-center">
          <Compass size={28} strokeWidth={1.5} className="text-brand-300 dark:text-brand-700" />
          <p className="text-sm text-sage-800 dark:text-zinc-400">You haven&apos;t chosen a path yet.</p>
          <Button href="/begin" className="mt-1">
            Choose your path
          </Button>
        </div>
      )}
      </div>
    </div>
  );
}

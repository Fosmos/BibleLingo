"use client";

import { BookOpen, Compass, MoonStar } from "lucide-react";
import { useTodaysDay } from "@/lib/useTodaysDay";
import { formatVerseRangeLabel } from "@/lib/chapterContent";
import { resolvePathLabel } from "@/lib/memorizationContent";
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

export function TodayVersesCard() {
  const { activePathKey, plan, currentDay, restingUntilTomorrow, lastCompletedDay, error, retry } = useTodaysDay();
  const label = activePathKey ? resolvePathLabel(activePathKey) : undefined;

  return (
    // A warm-tinted "hero" card, not a plain white one — the one thing on Home actually
    // worth memorizing right now, so it gets more visual weight than everything below it
    // (see ReviewNeededCard.tsx, which deliberately stays plain/secondary by comparison).
    <div
      className={`flex flex-col gap-3 rounded-2xl bg-brand-50 p-5 shadow-sm dark:border dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none ${currentDay || restingUntilTomorrow ? "flex-1" : ""}`}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
          <BookOpen size={16} />
        </span>
        <p className="text-caption font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">Today&apos;s Verses</p>
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
            <div>
              <p className="text-sm font-semibold text-ink-soft dark:text-zinc-300">{formatVerseRangeLabel(currentDay.newVerses)}</p>
              {/* No line-clamp — this card grows to fit however many verses today's lesson
                  holds instead of cropping a longer one mid-sentence. */}
              <p className="font-serif text-lg font-semibold leading-snug text-ink dark:text-zinc-100">
                {currentDay.newVerses.map((verse) => verse.text).join(" ")}
              </p>
            </div>
          ) : (
            <p className="text-sm text-ink-muted">{DAY_KIND_LABELS[currentDay.kind] ?? "Continue your path"}</p>
          )}
          <Button
            // The version query param is what the path overview page treats as the source
            // of truth (see app/path/[key]/page.tsx) — omitting it would default to KJV and
            // silently overwrite an already-selected translation via PathOverviewScreen's
            // sync effect.
            href={pathHref(activePathKey, plan.version)}
            className="self-start"
          >
            Go to your path
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
              <p className="text-sm font-semibold text-ink-soft dark:text-zinc-300">
                Completed today · {formatVerseRangeLabel(lastCompletedDay.newVerses)}
              </p>
              <p className="font-serif text-lg font-semibold leading-snug text-ink dark:text-zinc-100">
                {lastCompletedDay.newVerses.map((verse) => verse.text).join(" ")}
              </p>
            </div>
          ) : (
            <p className="text-sm text-ink-muted">Completed today.</p>
          )}
          <div className="flex flex-1 items-end justify-between gap-2">
            <p className="text-xs text-ink-muted">
              <MoonStar size={13} className="mr-1 inline -translate-y-px text-brand-400 dark:text-brand-600" />
              Come back tomorrow for more.
            </p>
            <Button href={pathHref(activePathKey, plan.version)} className="self-start">
              Go to your path
            </Button>
          </div>
        </>
      ) : restingUntilTomorrow ? (
        // Same gate as above, minus a resolvable lastCompletedDay (e.g. its chapter has since
        // been evicted from the content cache) — falls back to the plain message rather than
        // a stuck spinner, which the next branch down would otherwise show forever.
        <div className="flex flex-col items-center gap-2 py-2 text-center">
          <MoonStar size={28} strokeWidth={1.5} className="text-brand-300 dark:text-brand-700" />
          <p className="text-sm text-ink-muted">You&apos;ve completed today&apos;s verses. Come back tomorrow for more.</p>
        </div>
      ) : activePathKey && plan ? (
        <div className="flex flex-col items-center gap-2 py-2 text-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <p className="text-sm text-ink-muted">Loading {label ?? "your path"}…</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-2 text-center">
          <Compass size={28} strokeWidth={1.5} className="text-brand-300 dark:text-brand-700" />
          <p className="text-sm text-ink-muted">You haven&apos;t chosen a path yet.</p>
          <Button href="/begin" className="mt-1">
            Choose your path
          </Button>
        </div>
      )}
    </div>
  );
}

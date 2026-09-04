"use client";

import { useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { VerseSegment } from "@/types";
import { tokenizeVerseWords } from "@/lib/verseWords";
import type { MasteryLevelConfig } from "@/lib/masteryMode";
import { useMasteryChase } from "@/lib/useMasteryChase";
import { useViewportHeight } from "@/lib/useViewportHeight";
import { MOTION_DURATION } from "@/lib/motionTokens";
import { MasteryTrack } from "@/components/drills/MasteryTrack";
import { MasteryVerseCard } from "@/components/drills/MasteryVerseCard";
import { MasteryKeyboard } from "@/components/drills/MasteryKeyboard";
import { ReferenceNumberEntry } from "@/components/drills/ReferenceNumberEntry";
import { AutoCompleteButton } from "@/components/ui/AutoCompleteButton";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";

interface MasteryChaseRoundProps {
  label: string;
  verses: VerseSegment[];
  levelConfig: MasteryLevelConfig;
  onComplete: (cleared: boolean) => void;
}

// Finds which verse a global word index falls into, given each verse's word-count-derived
// starting offset — the last verse whose start is at or before the index.
function verseIndexForWord(wordIndex: number, verseStarts: number[]): number {
  let index = 0;
  for (let i = 0; i < verseStarts.length; i += 1) {
    if (verseStarts[i] <= wordIndex) index = i;
    else break;
  }
  return index;
}

// The core Mastery Mode mechanic: type the first letter of each word to propel a runner
// across the dried Red Sea bed, ahead of pursuing chariots. The runner's own position is a
// continuously-simulated momentum value (lib/masteryPhysics.ts, driven by lib/useMasteryChase.ts)
// that glides toward each newly-revealed word on an impulse from the correct keystroke, then
// decays through friction if the player pauses — so hesitating costs ground even without an
// outright mistake. A wrong letter never sets the player back; it jumps the chariots forward
// instead, and the same word must still be answered correctly. Reports only a pass/fail
// boolean upward, same contract as every other drill component.
export function MasteryChaseRound({ label, verses, levelConfig, onComplete }: MasteryChaseRoundProps) {
  const verseWordLists = useMemo(() => verses.map((v) => tokenizeVerseWords(v.text)), [verses]);
  const words = useMemo(() => verseWordLists.flat(), [verseWordLists]);
  const verseStarts = useMemo(() => {
    const starts: number[] = [];
    let offset = 0;
    for (const list of verseWordLists) {
      starts.push(offset);
      offset += list.length;
    }
    return starts;
  }, [verseWordLists]);
  const chase = useMasteryChase({ words, levelConfig, onComplete });
  // dvh alone isn't reliable everywhere (some iPad/Safari builds fail to resolve it once
  // nested inside a few layers of flex containers, silently collapsing the element) — this
  // measures the real viewport in JS instead, which works identically on every device.
  // Tailwind can't generate a class for a per-render pixel value (its scanner only sees the
  // literal source text, not runtime-interpolated strings), so this is set imperatively on
  // the DOM node via a ref instead — the same pattern MasteryTrack.tsx already uses for the
  // canvas's own backing-store size. The h-[50dvh] class below is only the pre-measurement
  // fallback for the very first paint; the effect overrides it as soon as it runs.
  const chaseContainerRef = useRef<HTMLDivElement>(null);
  const viewportHeight = useViewportHeight();
  useEffect(() => {
    const el = chaseContainerRef.current;
    if (!el) return;
    el.style.height = viewportHeight > 0 ? `${Math.round(viewportHeight / 2)}px` : "";
  }, [viewportHeight]);

  if (!chase.currentWord && chase.phase === "playing") return null;

  const currentVerseIndex = verseIndexForWord(chase.wordIndex, verseStarts);
  const currentVerse = verses[currentVerseIndex];
  const currentVerseWords = verseWordLists[currentVerseIndex] ?? [];
  const relativeWordIndex = chase.wordIndex - (verseStarts[currentVerseIndex] ?? 0);

  return (
    <div className="flex flex-col gap-3">
      {/* Full-bleed to the actual screen edges regardless of the page's own max-width/padding
          (the mx-[calc(50%-50vw)] trick — see https://css-tricks.com/full-width-containers-limited-width-parents/),
          and pulled up flush against the top of the content area, canceling the -mt-6 against
          this page's own p-6 top padding (app/memorized/mastery/page.tsx) — so the graphic
          itself runs border-to-border, top of screen to exactly half the real viewport height,
          with the level/passage label overlaid on top of it instead of sitting above it. */}
      <div ref={chaseContainerRef} className="relative -mt-6 h-[50dvh] mx-[calc(50%-50vw)] overflow-hidden">
        <div className="absolute left-4 top-4 z-10 rounded-2xl bg-white/85 px-3 py-1.5 backdrop-blur dark:bg-zinc-950/80">
          <p className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-brand-500">
            {levelConfig.label} — {levelConfig.tagline} <InfoTip text={INFO_TIPS.masteryChaseRound} />
          </p>
          <p className="text-sm font-semibold text-ink dark:text-zinc-100">{label}</p>
        </div>
        <div className="flex h-full flex-col gap-2">
          <MasteryTrack
            playerPercent={chase.playerPercent}
            chaserPercent={chase.chaserPercent}
            advanceTick={chase.advanceTick}
            surgeTick={chase.surgeTick}
            gapWords={chase.gapWords}
          />
          {chase.phase === "cleared" && (
            <p className="text-center text-sm font-semibold text-brand-600">You reached the far shore!</p>
          )}
          {chase.phase === "caught" && (
            <p className="text-center text-sm font-semibold text-heart-600">Caught! Give it another go.</p>
          )}
        </div>
      </div>
      {chase.phase === "playing" && chase.currentWord && currentVerse && (
        <div className="flex flex-1 flex-col justify-end gap-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentVerseIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: MOTION_DURATION.fast }}
            >
              <MasteryVerseCard reference={currentVerse.reference} words={currentVerseWords} wordIndex={relativeWordIndex} />
            </motion.div>
          </AnimatePresence>
          {chase.referenceMatch ? (
            <ReferenceNumberEntry
              key={chase.currentWord}
              chapter={chase.referenceMatch[1]}
              verse={chase.referenceMatch[2]}
              onDone={() => chase.revealCurrentWord(false)}
              onMistake={chase.punishMistake}
            />
          ) : (
            <MasteryKeyboard onKeyPress={chase.handleLetterPress} />
          )}
          {!chase.referenceMatch && chase.showError && chase.wrongLetterExpected && (
            <p className="text-center text-sm font-medium text-heart-600">
              Not quite — the next word starts with &quot;{chase.wrongLetterExpected}&quot;. The chariots gained ground!
            </p>
          )}
          <AutoCompleteButton onClick={chase.forceClear} />
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import type { CSSProperties } from "react";
import type { VerseSegment } from "@/types";
import { buildBookPages, SPOTS_PER_WALL, stillOf, type BookObject } from "@/lib/palaceBook";
import { useProgressStore } from "@/store/useProgressStore";
import { PalaceBookSheet } from "@/components/gamification/PalaceBookSheet";
import { PathViewSwitch } from "@/components/ui/PathViewSwitch";

interface PalaceBookScreenProps {
  label: string;
  verses: VerseSegment[];
}

const TURN = { duration: 0.24, ease: "easeInOut" } as const;
const SWIPE = 60;

// The Palace tab's Walk view: a ready-made building read like a book. Each page is one wall, a painted
// still with verses waiting on its objects in order. An arrow or a swipe turns the page to the next wall.
export function PalaceBookScreen({ label, verses }: PalaceBookScreenProps) {
  const entities = useProgressStore((state) => state.memorizedEntities);
  const real = useMemo(() => verses.filter((verse) => verse.text.trim()), [verses]);
  const pages = useMemo(() => buildBookPages(real), [real]);
  const isLearned = (verse: VerseSegment) => entities.some((entity) => entity.book === verse.book && entity.chapter === verse.chapter && entity.startVerse <= verse.verseNumber && entity.endVerse >= verse.verseNumber);
  const next = real.find((verse) => !isLearned(verse));
  // Opens on the wall holding the next verse to learn.
  const [at, setAt] = useState(() => (next ? Math.floor(real.indexOf(next) / SPOTS_PER_WALL) : 0));
  const [direction, setDirection] = useState(1);
  const [open, setOpen] = useState<{ object: BookObject; verse: VerseSegment } | null>(null);
  const still = useReducedMotion();
  const page = pages[at];
  const turn = (by: number) => {
    if (!pages[at + by]) return;
    setDirection(by);
    setAt(at + by);
  };
  const endSwipe = (_: unknown, { offset }: PanInfo) => {
    if (offset.x < -SWIPE) turn(1);
    else if (offset.x > SWIPE) turn(-1);
  };
  // The next and previous stills, ready before their page turns.
  useEffect(() => {
    [pages[at + 1], pages[at - 1]].forEach((neighbour) => {
      if (neighbour) new window.Image().src = stillOf(neighbour.wall);
    });
  }, [at, pages]);
  const arrow = "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sand-200 text-ink disabled:opacity-30 dark:bg-zinc-800 dark:text-zinc-100";

  return (
    <div className="-mb-28 flex h-[100dvh] w-full flex-col">
      <header className="flex shrink-0 items-center gap-2 px-4 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))]">
        <Link href="/" aria-label="Back to your paths" className="-ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] text-sand-600 hover:bg-sand-100 dark:text-zinc-400 dark:hover:bg-zinc-900">
          <ArrowLeft size={20} strokeWidth={2.75} />
        </Link>
        <span className="min-w-0 flex-1 truncate font-heading text-[22px] leading-none text-ink dark:text-zinc-100">{label}</span>
        <PathViewSwitch className="shrink-0" />
      </header>
      {page && (
        <>
          <div className="relative mx-auto aspect-[3/4] w-[min(100%,calc((100dvh-225px)*0.75))] shrink-0 overflow-hidden bg-zinc-950 [perspective:1400px]">
            <AnimatePresence initial={false} mode="wait" custom={direction}>
              <motion.div
                key={at}
                drag="x"
                dragSnapToOrigin
                dragElastic={0.18}
                onDragEnd={endSwipe}
                initial={still ? { opacity: 0 } : { rotateY: direction > 0 ? 70 : -70, opacity: 0.4 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={still ? { opacity: 0 } : { rotateY: direction > 0 ? -70 : 70, opacity: 0.4 }}
                transition={still ? { duration: 0 } : TURN}
                className={`absolute inset-0 ${direction > 0 ? "origin-left" : "origin-right"}`}
              >
                <Image src={stillOf(page.wall)} alt={`${page.wall.room}, ${page.wall.wall}`} fill sizes="(max-width: 600px) 100vw, 600px" priority draggable={false} className="object-cover" />
                {page.verses.map((verse, spot) => {
                  const object = page.wall.objects[spot];
                  const learned = isLearned(verse);
                  const up = verse === next;
                  const place = { "--x": `${object.left}%`, "--y": `${object.top}%` } as CSSProperties;
                  return (
                    <button key={verse.id} type="button" style={place} onClick={() => setOpen({ object, verse })} aria-label={`${verse.reference}${up ? ", up next" : learned ? ", learned" : ""}`} className={`absolute left-[var(--x)] top-[var(--y)] flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white/90 text-[13px] font-extrabold shadow-[0_2px_8px_rgba(0,0,0,0.55)] ${up ? "bg-brand-500 text-white" : learned ? "bg-sage-600 text-white" : "bg-black/55 text-white"}`}>
                      {verse.verseNumber}
                    </button>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="mx-auto flex w-full max-w-md shrink-0 items-center gap-2 px-4 pt-2.5">
            <button type="button" aria-label="Previous wall" disabled={at === 0} onClick={() => turn(-1)} className={arrow}>
              <ChevronLeft size={24} strokeWidth={2.75} />
            </button>
            <div className="flex min-w-0 flex-1 flex-col items-center text-center">
              <span className="max-w-full truncate font-heading text-[18px] leading-tight text-ink dark:text-zinc-100">{page.wall.room}</span>
              <span className="text-xs font-bold text-ink-muted">
                {page.wall.wall}
                {page.round > 1 ? ` · Round ${page.round}` : ""} · {at + 1} of {pages.length}
              </span>
            </div>
            <button type="button" aria-label="Next wall" disabled={at === pages.length - 1} onClick={() => turn(1)} className={arrow}>
              <ChevronRight size={24} strokeWidth={2.75} />
            </button>
          </div>
        </>
      )}
      {open && page && <PalaceBookSheet key={open.verse.id} object={open.object} room={page.wall.room} verse={open.verse} onClose={() => setOpen(null)} />}
    </div>
  );
}

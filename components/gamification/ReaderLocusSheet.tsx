"use client";

import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import type { BuiltPalace, VerseSegment } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { removeLocus } from "@/lib/builtPalaces";
import { saveChapterLocus, type ChapterLocus } from "@/lib/chapterLoci";
import { palaceToPlaceIn } from "@/lib/palacePlacement";
import { formatChapterLabel } from "@/lib/chapterContent";
import { MOTION_DURATION, MOTION_EASE } from "@/lib/motionTokens";

interface ReaderLocusSheetProps {
  book: string;
  chapter: number;
  verses: VerseSegment[];
  loci: ChapterLocus[];
  // The locus being edited; unset adds a new one, starting on `startVerse` if it's free.
  editing?: ChapterLocus;
  startVerse?: number;
  // Above the fields: choosing the chapter, when opened on a whole book (BookLocusSheet.tsx).
  picker?: ReactNode;
  animateIn?: boolean;
  onClose: () => void;
}

const NONE: BuiltPalace[] = [];
const FIELD = "w-full rounded-xl border border-sand-300 bg-paper px-3 py-2.5 text-[15px] font-medium text-ink dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";
const LABEL = "flex flex-col gap-1 text-[13px] font-extrabold text-sand-700 dark:text-zinc-400";

// Adds a locus to a chapter's verses, or edits one, from the chapter reader: the chapter's room, which
// verses (tap the first, then the last; verses on another locus can't be picked), where it is, and
// what's happening there.
export function ReaderLocusSheet({ book, chapter, verses, loci, editing, startVerse, picker, animateIn = true, onClose }: ReaderLocusSheetProps) {
  const palaces = useProgressStore((state) => state.builtPalaces) ?? NONE;
  const activePathKey = useProgressStore((state) => state.activePathKey);
  const save = useProgressStore((state) => state.saveBuiltPalace);
  const taken = (verseNumber: number) => loci.some((entry) => entry !== editing && verseNumber >= entry.from && verseNumber <= entry.to);
  const firstFree = (startVerse !== undefined && !taken(startVerse) ? startVerse : verses.find((verse) => !taken(verse.verseNumber))?.verseNumber) ?? null;
  const [from, setFrom] = useState<number | null>(editing?.from ?? firstFree);
  const [to, setTo] = useState<number | null>(editing ? Math.min(editing.to, verses[verses.length - 1]?.verseNumber ?? editing.to) : firstFree);
  const room = editing?.room ?? loci[0]?.room;
  const [roomName, setRoomName] = useState(room?.name ?? "");
  const [name, setName] = useState(editing?.locus.name ?? "");
  const [scene, setScene] = useState(editing?.locus.scene ?? "");
  const ready = from !== null && to !== null && roomName.trim() !== "" && name.trim() !== "";

  const tapVerse = (verseNumber: number) => {
    const between = from !== null && from === to && verseNumber > from && !verses.some((verse) => verse.verseNumber > from && verse.verseNumber < verseNumber && taken(verse.verseNumber));
    if (between) return setTo(verseNumber);
    setFrom(verseNumber);
    setTo(verseNumber);
  };
  const submit = () => {
    if (from === null || to === null) return;
    const palace = editing?.palace ?? loci[0]?.palace ?? palaceToPlaceIn(palaces, { book, chapter, verseNumber: from }, activePathKey);
    save(saveChapterLocus(palace, { book, chapter, from, to, roomName: roomName.trim(), name: name.trim(), scene: scene.trim(), roomId: room?.id, locusId: editing?.locus.id, pathKey: activePathKey ?? "" }));
    onClose();
  };
  const remove = () => {
    if (editing) save(removeLocus(editing.palace, editing.room.id, editing.locus.id));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink/35" />
      <motion.div initial={animateIn ? { y: "100%" } : false} animate={{ y: 0 }} transition={{ duration: MOTION_DURATION.base, ease: MOTION_EASE.enter }} className="relative mx-auto flex max-h-[88dvh] w-full max-w-2xl flex-col gap-3 overflow-y-auto rounded-t-[32px] bg-paper px-[22px] pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-5 shadow-organic-lg dark:bg-zinc-950">
        <h2 className="font-heading text-[24px] leading-tight text-ink dark:text-zinc-100">{editing ? "Edit locus" : "Add a locus"}</h2>
        {picker}
        <label className={LABEL}>
          Room for {formatChapterLabel(book, chapter)}
          <input value={roomName} onChange={(event) => setRoomName(event.target.value)} placeholder="Kitchen" className={FIELD} />
        </label>
        <div className={LABEL}>
          Verses: tap the first, then the last
          <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-10">
            {verses.map(({ verseNumber }) => {
              const picked = from !== null && to !== null && verseNumber >= from && verseNumber <= to;
              return (
                <button key={verseNumber} type="button" disabled={taken(verseNumber)} aria-pressed={picked} aria-label={`Verse ${verseNumber}`} onClick={() => tapVerse(verseNumber)} className={`h-11 rounded-xl text-[15px] font-extrabold text-[#000] disabled:opacity-35 ${picked ? "bg-brand-300" : "bg-sand-200 dark:bg-zinc-500"}`}>
                  {verseNumber}
                </button>
              );
            })}
          </div>
        </div>
        <label className={LABEL}>
          Locus
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Fridge" className={FIELD} />
        </label>
        <label className={LABEL}>
          What&apos;s happening there
          <textarea value={scene} onChange={(event) => setScene(event.target.value)} rows={2} placeholder="A man walks past the fridge, refusing to stop and sit" className={`${FIELD} resize-none`} />
        </label>
        <button type="button" disabled={!ready} onClick={submit} className="min-h-14 rounded-full bg-brand-500 text-base font-extrabold text-white shadow-[0_5px_0_#8C491A] disabled:opacity-40">
          Save
        </button>
        {editing && (
          <button type="button" onClick={remove} className="min-h-11 text-[14px] font-extrabold text-heart-600">
            Remove this locus
          </button>
        )}
      </motion.div>
    </div>
  );
}

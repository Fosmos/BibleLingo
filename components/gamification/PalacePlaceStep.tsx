"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import type { VerseSegment } from "@/types";
import type { ChapterReadingLayout } from "@/lib/useChapterReadingLayout";
import type { SenseLineWordRange } from "@/lib/senseLineWordRanges";
import { useProgressStore } from "@/store/useProgressStore";
import { useVersePlacement } from "@/lib/useVersePlacement";
import { extendSpot, newSpot, roomFor, spotBefore } from "@/lib/palacePlacement";
import { LessonPageCard } from "@/components/gamification/LessonPageCard";
import { LessonControlBar } from "@/components/gamification/LessonControlBar";

interface PalacePlaceStepProps {
  verse: VerseSegment;
  layout: ChapterReadingLayout;
  onComplete: () => void;
}

const FIELD = "w-full rounded-xl border border-sand-300 bg-paper px-3 py-2 text-[14px] text-ink dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";
const PRIMARY = "rounded-full bg-brand-500 px-6 py-2 text-sm font-black text-white shadow-[0_3px_0_#8C491A]";

// A Learn lesson's first stage for each verse, when the reader has built a palace for the path (the
// Palace tab — lib/learnSteps.ts): the verse on its page, and below it, its place in the palace.
// Already on a spot, it's "walk to it" — the room and spot, and the scene to picture (editable).
// Not yet, it's placed now: on with the verse before it on that one's spot, or on a new spot (a room,
// where, the scene) — verses go into the palace as they're learned. "Not now" skips it.
export function PalacePlaceStep({ verse, layout, onComplete }: PalacePlaceStepProps) {
  const ref = { book: verse.book, chapter: verse.chapter, verseNumber: verse.verseNumber };
  const { placement, palace } = useVersePlacement(ref);
  const save = useProgressStore((state) => state.saveBuiltPalace);
  const before = palace && !placement ? spotBefore(palace, ref) : undefined;
  const [choice, setChoice] = useState<"extend" | "new">(before ? "extend" : "new");
  const [roomId, setRoomId] = useState<string | null>(() => (palace ? (roomFor(palace, ref)?.id ?? null) : null));
  const [name, setName] = useState("");
  const [scene, setScene] = useState(placement?.locus.scene ?? "");
  const [error, setError] = useState<string | null>(null);
  const renderActiveVerse = (_: VerseSegment, range: SenseLineWordRange) => <>{range.clause.text}</>;

  const place = () => {
    if (!palace) return onComplete();
    if (choice === "extend" && before) save(extendSpot(palace, before.room.id, before.locus.id, ref));
    else if (!name.trim()) return setError("Say where it goes, like “the fridge”.");
    else save(newSpot(palace, roomId, ref, name.trim(), scene.trim()));
    onComplete();
  };
  const walkOn = () => {
    if (placement && scene.trim() !== (placement.locus.scene ?? "")) {
      const { palace: built, room, locus } = placement;
      save({ ...built, rooms: built.rooms.map((entry) => (entry.id !== room.id ? entry : { ...entry, loci: entry.loci.map((spot) => (spot.id === locus.id ? { ...spot, scene: scene.trim() || undefined } : spot)) })) });
    }
    onComplete();
  };

  return (
    <div className="flex flex-col gap-3">
      <LessonPageCard layout={layout} activeVerse={verse} renderActiveVerse={renderActiveVerse} />
      <LessonControlBar dockRef={layout.dockRef} verseText={verse.text}>
        <div className="flex w-full max-w-md flex-col gap-2 self-center">
          <span className="flex items-center gap-1.5 text-[13px] font-black text-brand-700 dark:text-brand-300">
            <MapPin size={16} strokeWidth={2.75} />
            {placement ? `Walk to ${placement.room.name} › ${placement.locus.name || "its spot"}` : `Place ${verse.chapter}:${verse.verseNumber} in ${palace?.name ?? "your palace"}`}
          </span>
          {!placement && before && (
            <div role="radiogroup" aria-label="Where it goes" className="flex gap-1.5">
              {(["extend", "new"] as const).map((option) => (
                <button key={option} type="button" role="radio" aria-checked={choice === option} onClick={() => setChoice(option)} className={`flex-1 rounded-xl border-2 px-2 py-1.5 text-[12.5px] font-bold ${choice === option ? "border-brand-500 bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-100" : "border-sand-300 text-sand-700 dark:border-zinc-700 dark:text-zinc-400"}`}>
                  {option === "extend" ? `With ${before.locus.name || "the verse before"}` : "A new spot"}
                </button>
              ))}
            </div>
          )}
          {!placement && palace && choice === "new" && (
            <div className="flex gap-1.5">
              <select aria-label="Room" className={`${FIELD} w-auto max-w-[45%]`} value={roomId ?? ""} onChange={(event) => setRoomId(event.target.value || null)}>
                {palace.rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
                <option value="">New room</option>
              </select>
              <input aria-label="Spot" placeholder="Where? The fridge" className={FIELD} value={name} onChange={(event) => (setName(event.target.value), setError(null))} />
            </div>
          )}
          {(placement || choice === "new") && (
            <textarea aria-label="Scene" rows={2} placeholder="Picture it there — a crown stuck to the fridge door" className={`${FIELD} resize-none italic`} value={scene} onChange={(event) => setScene(event.target.value)} />
          )}
          {error && <span className="text-[13px] font-bold text-heart-600">{error}</span>}
          <div className="flex items-center justify-center gap-3">
            {!placement && (
              <button type="button" onClick={onComplete} className="text-[13px] font-black text-sand-600 dark:text-zinc-400">
                Not now
              </button>
            )}
            <button type="button" onClick={placement ? walkOn : place} className={PRIMARY}>
              {placement ? "Continue" : "Place it"}
            </button>
          </div>
        </div>
      </LessonControlBar>
    </div>
  );
}

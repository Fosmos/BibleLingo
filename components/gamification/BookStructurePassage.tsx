"use client";

import { useState } from "react";
import type { TrailStop } from "@/lib/trailStops";
import { useProgressStore } from "@/store/useProgressStore";
import { parseToSenseLines } from "@/lib/senseLines";
import { roomThemeFor } from "@/lib/palaceRoomThemes";
import { usePalaceViewStore, type PalaceView } from "@/store/usePalaceViewStore";
import type { StructurePassage } from "@/components/gamification/BookStructureScreen";
import { LocationTagField } from "@/components/gamification/LocationTagField";
import { PalaceRoom } from "@/components/gamification/PalaceRoom";
import { BookStructureStoryboard } from "@/components/gamification/BookStructureStoryboard";
import { VersePictureTile } from "@/components/gamification/VersePictureTile";

interface BookStructurePassageProps {
  passage: StructurePassage;
  open: boolean;
  // The passage you're up to — highlighted in orange, open or not.
  current: boolean;
  onToggle: () => void;
  onStart: (stop: TrailStop) => void;
}

const VIEWS: PalaceView[] = ["storyboard", "room"];

// One passage in the book's palace (BookStructureScreen.tsx), under its heading: its spot in the
// chapter's room, its verses' picture tiles — and, opened, its storyboard (BookStructureStoryboard.tsx —
// a picture panel per verse that flips to the verse) or its own room (PalaceRoom.tsx — each verse's
// picture on a piece of furniture along a walking route; tap one to read it under the room), with a
// button to start the verse you're up to (or practise it again).
export function BookStructurePassage({ passage, open, current, onToggle, onStart }: BookStructurePassageProps) {
  const next = passage.lessons.find((stop) => stop.state === "current");
  const learned = passage.lessons.every((stop) => stop.state === "done");
  const spotName = useProgressStore((state) => (passage.spotKey ? state.locationTags[passage.spotKey] : undefined));
  // The verse being read in the room — the one you're up to, to begin with.
  const [reading, setReading] = useState(() => Math.max(0, passage.lessons.findIndex((stop) => stop.state === "current")));
  const verse = passage.lessons[reading];
  const theme = roomThemeFor(passage.lessons[0]?.verse?.book ?? "", passage.index);
  const view = usePalaceViewStore((state) => state.view);
  const setView = usePalaceViewStore((state) => state.setView);
  const highlight = open || current;

  return (
    <div className={`mb-2 flex flex-col gap-2 border-l-2 pb-2 pl-3 pr-1 pt-1 ${highlight ? "rounded-br-[16px] border-brand-500 bg-brand-100/60 dark:bg-brand-900/25" : "border-sand-300 dark:border-zinc-700"}`}>
      {passage.spotKey && (spotName || open) && <LocationTagField tagKey={passage.spotKey} addLabel="Name this spot" className="self-start" />}
      {!open && (
        <button type="button" onClick={onToggle} aria-label={`Open ${passage.section.title}`} className="flex flex-wrap gap-1.5">
          {passage.lessons.map((stop, at) => (
            <VersePictureTile key={stop.key} pictureId={passage.pictures[at]} verseNumber={stop.verse!.verseNumber} learned={stop.state === "done"} />
          ))}
        </button>
      )}
      {open && verse && (
        <div className="flex flex-col gap-2.5">
          <div role="radiogroup" aria-label="Show the passage as" className="flex self-center rounded-full bg-sand-200 p-0.5 dark:bg-zinc-800">
            {VIEWS.map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={view === option}
                onClick={() => setView(option)}
                className={`rounded-full px-3.5 py-1 text-[12px] font-black capitalize ${view === option ? "bg-paper text-ink shadow-sm dark:bg-zinc-950 dark:text-zinc-100" : "text-sand-700 dark:text-zinc-400"}`}
              >
                {option}
              </button>
            ))}
          </div>
          {view === "storyboard" && <BookStructureStoryboard lessons={passage.lessons} pictures={passage.pictures} />}
          {view === "room" && (
            <>
              <div className="flex flex-col">
                <PalaceRoom lessons={passage.lessons} pictures={passage.pictures} selected={reading} onSelect={setReading} theme={theme} />
                <span className="-mt-3 self-center text-[11px] font-black uppercase tracking-[.08em] text-sand-600 dark:text-zinc-500">{theme.name}</span>
              </div>
              <div className="grid grid-cols-[34px_minmax(0,1fr)] gap-2.5 rounded-[16px] bg-paper p-3 dark:bg-zinc-900">
                <VersePictureTile pictureId={passage.pictures[reading]} verseNumber={verse.verse!.verseNumber} learned={verse.state === "done"} />
                <div className={`flex flex-col gap-1 text-[15.5px] leading-[1.5] ${verse.state === "locked" ? "text-ink-muted" : "text-ink dark:text-zinc-100"}`}>
                  {parseToSenseLines(verse.verse!.text).map((line, index) => (
                    <p key={index} className="pl-4 -indent-4">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            </>
          )}
          {next || learned ? (
            <button
              type="button"
              onClick={() => onStart(next ?? passage.lessons[0])}
              className={`self-stretch rounded-2xl py-3 text-[13px] font-black uppercase tracking-[.06em] ${next ? "bg-brand-500 text-white shadow-[0_3px_0_#8C491A]" : "bg-sand-200 text-ink dark:bg-zinc-800 dark:text-zinc-100"}`}
            >
              {next ? `Start ${next.label}` : `Practise ${passage.lessons[0].label}`}
            </button>
          ) : (
            <p className="text-center text-xs font-bold text-ink-muted">Learn the passages before this one first.</p>
          )}
        </div>
      )}
    </div>
  );
}

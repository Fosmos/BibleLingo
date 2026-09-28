"use client";

import { Keyboard, Mic } from "lucide-react";
import { useProgressStore } from "@/store/useProgressStore";

const SEGMENT_CLASS = "flex h-7 w-8 items-center justify-center rounded-full transition-colors";

// Type-or-speak switch for SRS review: recite each word by typing its first letter, or by saying
// the verse aloud (FirstLetterSpeakRep.tsx). The same reader setting as Profile > Advanced's
// "Speak mode", surfaced on the Mind Map's review list and inside the review itself.
export function SrsInputModeToggle() {
  const speak = useProgressStore((state) => state.srsSpeakModeEnabled);
  const setSpeak = useProgressStore((state) => state.setSrsSpeakModeEnabled);
  const tone = (active: boolean) => (active ? "bg-brand-500 text-white" : "text-ink-muted hover:bg-mist dark:text-zinc-400 dark:hover:bg-zinc-800");

  return (
    <div role="radiogroup" aria-label="Review by" className="flex items-center gap-0.5 rounded-full border border-line p-0.5 dark:border-zinc-700">
      <button type="button" role="radio" aria-checked={!speak} aria-label="Type first letters" title="Type first letters" onClick={() => setSpeak(false)} className={`${SEGMENT_CLASS} ${tone(!speak)}`}>
        <Keyboard size={15} />
      </button>
      <button type="button" role="radio" aria-checked={speak} aria-label="Speak the verse" title="Speak the verse" onClick={() => setSpeak(true)} className={`${SEGMENT_CLASS} ${tone(speak)}`}>
        <Mic size={15} />
      </button>
    </div>
  );
}

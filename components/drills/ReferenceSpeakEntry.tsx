"use client";

import { useState } from "react";
import { Mic } from "lucide-react";
import { isSecureContextOrLocal, isSpeechRecognitionSupported, requestMicPermission } from "@/lib/speechRecognition";
import { useContinuousListening } from "@/lib/useContinuousListening";
import { spokenReferenceMatches, type ReferenceAnswer } from "@/lib/referenceAnswer";
import type { ReferenceEntry } from "@/lib/useReferenceEntry";
import { ReferenceKeyEntry } from "@/components/drills/ReferenceKeyEntry";

interface ReferenceSpeakEntryProps {
  entry: ReferenceEntry;
  correct: ReferenceAnswer;
}

// The reference said aloud, like the speaking stages — "Romans eight two": the book counts by its
// first letter, then the chapter and verse numbers. Each part fills in as it's heard; stopping
// with a part unheard shows it, to say again. Without a usable mic, typed instead.
export function ReferenceSpeakEntry({ entry, correct }: ReferenceSpeakEntryProps) {
  const [blocked, setBlocked] = useState(() => !isSpeechRecognitionSupported() || !isSecureContextOrLocal());
  const [heard, setHeard] = useState("");

  function take(transcript: string) {
    const match = spokenReferenceMatches(transcript, correct);
    if (correct.number && match.number) entry.answer("number", correct.number);
    if (match.book) entry.answer("book", correct.book);
    if (match.chapter) entry.answer("chapter", correct.chapter);
    if (match.verse && entry.answer("verse", correct.verse)) listening.stop();
  }

  const listening = useContinuousListening({
    onTranscript: (transcript) => {
      setHeard(transcript);
      take(transcript);
    },
    onFinalTranscript: (transcript) => {
      take(transcript);
      if (entry.part) entry.answer(entry.part, "");
    },
    onError: (kind) => kind === "denied" && setBlocked(true),
  });

  if (blocked) return <ReferenceKeyEntry entry={entry} correct={correct} />;

  async function toggle() {
    if (listening.isRecording) return listening.stop();
    setHeard("");
    if ((await requestMicPermission()) === "denied") return setBlocked(true);
    listening.start();
  }

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <p className="h-5 truncate text-sm font-medium text-ink-soft dark:text-zinc-400">{heard || (listening.isRecording ? "Listening…" : "Tap the mic and say the reference")}</p>
      <button
        type="button"
        onClick={toggle}
        aria-label={listening.isRecording ? "Stop listening" : "Say the reference"}
        className={`flex h-16 w-16 items-center justify-center rounded-full text-white shadow-[0_5px_0_#8C491A] ${listening.isRecording ? "animate-pulse bg-heart-500" : "bg-brand-500"}`}
      >
        <Mic size={28} strokeWidth={2.5} />
      </button>
    </div>
  );
}

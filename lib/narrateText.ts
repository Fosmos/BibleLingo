"use client";

import { fetchNarration, playNarration } from "@/lib/cloudNarration";
import { isSpeechSynthesisSupported, speakWithWordBoundaries } from "@/lib/speechSynthesis";

// Reads `text` aloud: the natural Speechify narration when the server has it (lib/cloudNarration.ts),
// otherwise the browser's own voice — reporting where in `text` each word starts as it's heard,
// and when it's done. Returns a cancel. `player` is reused across calls (see playNarration).
export function narrateText(text: string, onWordBoundary: (charIndex: number) => void, onEnd: () => void, player?: HTMLAudioElement): () => void {
  let cancelled = false;
  let cancel = () => {};
  const speakInstead = () => {
    if (cancelled) return;
    if (isSpeechSynthesisSupported()) cancel = speakWithWordBoundaries(text, onWordBoundary, onEnd);
    else onEnd();
  };
  fetchNarration(text).then((narration) => {
    if (cancelled) return;
    if (narration) cancel = playNarration(narration, onWordBoundary, onEnd, speakInstead, player);
    else speakInstead();
  });
  return () => {
    cancelled = true;
    cancel();
  };
}

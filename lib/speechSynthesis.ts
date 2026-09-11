// Reads text aloud via the browser's built-in Web Speech API (SpeechSynthesis) — no audio
// asset files, narration recordings, or TTS API key needed, and no new dependency (this is a
// native browser API, same tier as the SpeechRecognition wrapper in lib/speechRecognition.ts).
export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export interface SpeakOptions {
  // The Web Speech API has no real SSML emphasis support (utterance text is read literally
  // by whichever OS/browser voice is active), so "spoken with emphasis" is approximated by
  // slowing down and raising pitch/volume slightly — audibly more deliberate/stressed than
  // the default delivery, without needing per-platform SSML handling.
  emphasize?: boolean;
}

// Chrome has a long-standing bug where a SpeechSynthesisUtterance with no surviving
// reference elsewhere can be garbage-collected while still queued, which silently kills the
// speech (no error, no sound) — see https://crbug.com/509488. Keeping every not-yet-finished
// utterance referenced here (rather than just the latest one) is the standard workaround —
// a piano-tiles round can have several words queued up at once.
const pendingUtterances = new Set<SpeechSynthesisUtterance>();

// Chrome (macOS in particular) defaults to a network/cloud voice (e.g. "Google US English")
// rather than one of the OS's own local voices. A network voice can silently produce no
// audio at all — no error, onend still fires — if the round-trip to Google's TTS service
// hiccups, which is indistinguishable from "speech synthesis is broken" from here. Explicitly
// picking a local voice avoids the network dependency entirely.
function getPreferredVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return voices.find((voice) => voice.localService && voice.lang.startsWith("en")) ?? voices.find((voice) => voice.localService);
}

// Deliberately does NOT cancel an in-progress utterance before queuing the next one — the
// Web Speech API queues sequential speak() calls by default, so calling one word's speech
// while a previous word is still finishing lets both play, one after another, instead of the
// new call killing the old one (which is what previously made rapid taps sound like nothing
// was playing at all: every utterance got cancelled mid-speech by the very next tap).
export function speak(text: string, onEnd?: () => void, options?: SpeakOptions): () => void {
  if (!isSpeechSynthesisSupported()) {
    console.warn("[speechSynthesis] speak() called but the Web Speech API isn't available in this browser.");
    return () => {};
  }
  // Guards against the engine getting stuck in a paused state (observed after a tab is
  // backgrounded then foregrounded) where speak() otherwise silently queues but never plays.
  window.speechSynthesis.resume();

  const utterance = new SpeechSynthesisUtterance(text);
  const preferredVoice = getPreferredVoice();
  if (preferredVoice) utterance.voice = preferredVoice;
  if (options?.emphasize) {
    utterance.rate = 0.75;
    utterance.pitch = 1.15;
    utterance.volume = 1;
  } else {
    utterance.rate = 0.9;
  }
  utterance.onend = () => {
    pendingUtterances.delete(utterance);
    onEnd?.();
  };
  utterance.onerror = (event) => {
    pendingUtterances.delete(utterance);
    if (event.error !== "canceled" && event.error !== "interrupted") {
      console.warn(`[speechSynthesis] utterance for "${text}" failed: ${event.error}`);
    }
  };

  pendingUtterances.add(utterance);
  window.speechSynthesis.speak(utterance);

  // Cancelling clears the ENTIRE queue (the API has no way to cancel a single queued
  // utterance), so this is only for a caller that wants to stop everything outright.
  return () => {
    window.speechSynthesis.cancel();
    pendingUtterances.clear();
  };
}

// KineticTextRep's own narration — one utterance for a whole passage, reporting each word's
// own `charIndex` as it's spoken (via the engine's native `onboundary` event) rather than
// synthesizing word-by-word the way speak() above does — a single utterance is what lets the
// OS/browser voice read at its own natural cadence and inflection across a full passage,
// which back-to-back single-word utterances can't reproduce. `onWordBoundary` fires with
// where in `text` the current word starts; the caller (lib/useKineticTextSync.ts) maps that
// back to a word index via lib/verseWordOffsets.ts's own tokenization of the SAME string.
// Boundary-event support/accuracy is real but browser-dependent (Chrome fires them reliably
// per word; other engines vary) — degrading to "audio plays, highlight doesn't move" on a
// browser that never fires one is an accepted tradeoff, not a bug to work around here.
export function speakWithWordBoundaries(text: string, onWordBoundary: (charIndex: number) => void, onEnd: () => void): () => void {
  if (!isSpeechSynthesisSupported()) {
    onEnd();
    return () => {};
  }
  window.speechSynthesis.resume();

  const utterance = new SpeechSynthesisUtterance(text);
  const preferredVoice = getPreferredVoice();
  if (preferredVoice) utterance.voice = preferredVoice;
  utterance.rate = 0.85;
  utterance.onboundary = (event) => {
    if (event.name === "word" || event.name === undefined) onWordBoundary(event.charIndex);
  };
  utterance.onend = () => {
    pendingUtterances.delete(utterance);
    onEnd();
  };
  utterance.onerror = (event) => {
    pendingUtterances.delete(utterance);
    if (event.error !== "canceled" && event.error !== "interrupted") {
      console.warn(`[speechSynthesis] utterance for "${text}" failed: ${event.error}`);
    }
    onEnd();
  };

  pendingUtterances.add(utterance);
  window.speechSynthesis.speak(utterance);

  return () => {
    window.speechSynthesis.cancel();
    pendingUtterances.delete(utterance);
  };
}

// SleepTimerView's own narration — one whole verse per utterance, at a slower, sleep-friendly
// pace, with a caller-supplied `volume` (0-1) baked in at the moment THIS utterance starts.
// The Web Speech API has no way to change an utterance's own volume once it's already
// speaking, so lib/useSleepTimer.ts calls this fresh for every verse in the playlist rather
// than trying to fade one long-running utterance — the fade is a smooth curve computed once
// per verse boundary (see useSleepTimer.ts's own fadeVolume), not per animation frame, which
// reads as a gentle step-down rather than a jarring cut as long as verses stay reasonably
// short (true for the single-verse queue this is built for). `onEnd` is how
// useSleepTimer.ts's own playVerse chains to the NEXT verse, so a genuine synthesis error
// (rare, but should still skip forward rather than silently going quiet for the rest of the
// session) calls it same as a normal finish does — but "canceled"/"interrupted" must NOT, since
// that's exactly what firing this utterance's own cancel() below produces: calling `onEnd()`
// there too (an earlier version of this function did) meant pressing Stop actually canceled
// the utterance and then immediately queued the NEXT one right back up via that same
// callback, so playback never actually stopped.
export function speakSleepTimerVerse(text: string, volume: number, onEnd: () => void): () => void {
  if (!isSpeechSynthesisSupported()) {
    onEnd();
    return () => {};
  }
  window.speechSynthesis.resume();

  const utterance = new SpeechSynthesisUtterance(text);
  const preferredVoice = getPreferredVoice();
  if (preferredVoice) utterance.voice = preferredVoice;
  utterance.rate = 0.85;
  utterance.volume = Math.max(0, Math.min(1, volume));
  utterance.onend = () => {
    pendingUtterances.delete(utterance);
    onEnd();
  };
  utterance.onerror = (event) => {
    pendingUtterances.delete(utterance);
    const wasCanceled = event.error === "canceled" || event.error === "interrupted";
    if (!wasCanceled) {
      console.warn(`[speechSynthesis] sleep timer utterance failed: ${event.error}`);
      onEnd();
    }
  };

  pendingUtterances.add(utterance);
  window.speechSynthesis.speak(utterance);

  return () => {
    window.speechSynthesis.cancel();
    pendingUtterances.delete(utterance);
  };
}

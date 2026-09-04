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

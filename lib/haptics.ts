// A short, precise tap on every correct word during active recall (typing or speaking) — see
// useFirstLetterTyping.ts / useFirstLetterSpeaking.ts. The web Vibration API is Android-only
// (Safari has never implemented it on iOS), so this silently no-ops there rather than erroring
// — half the reader base feels a kinesthetic rhythm building word by word, and the physical
// tap pattern itself becomes one more memory anchor for the verse's own cadence; the other
// half just sees the same UI with no vibration, no different from today.
export function hapticTick(): void {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(12);
  }
}

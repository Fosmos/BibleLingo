// Whether verses show in sense lines at all — off when the reader has turned "Learn line by line"
// off (UserProgress.wholeVerseLearning): then every verse reads as continuous text, and
// lib/senseLines.ts hands back each passage as a single line. Kept in sync from the progress store
// (store/useProgressStore.ts) so the pure sense-line parsing needn't import the store.
let prose = false;

export function setProseMode(value: boolean): void {
  prose = value;
}

export function isProseMode(): boolean {
  return prose;
}

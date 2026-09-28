import { Howl } from "howler";

export interface AudioController {
  play: () => void;
  pause: () => void;
  seek: (seconds: number) => void;
  unload: () => void;
}

const NOOP_CONTROLLER: AudioController = {
  play: () => {},
  pause: () => {},
  seek: () => {},
  unload: () => {},
};

export function loadAudio(url: string, onEnd?: () => void): AudioController {
  if (!url || typeof window === "undefined") {
    return NOOP_CONTROLLER;
  }

  let loadFailed = false;
  const howl = new Howl({
    src: [url],
    onloaderror: () => {
      loadFailed = true;
    },
    onend: onEnd,
  });

  return {
    play: () => {
      if (!loadFailed) howl.play();
    },
    pause: () => howl.pause(),
    seek: (seconds) => howl.seek(seconds),
    unload: () => howl.unload(),
  };
}

// SFX cues below use raw Web Audio API (synthesized tones, no asset files) on their own
// AudioContext — a channel fully independent of the Howl narration instances above.
let sfxContext: AudioContext | null = null;

function getSfxContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (sfxContext) return sfxContext;
  const AudioContextCtor =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return null;
  sfxContext = new AudioContextCtor();
  return sfxContext;
}

function playTone(frequency: number, durationMs: number, type: OscillatorType): void {
  const ctx = getSfxContext();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + durationMs / 1000);
}

export function playCorrectSfx(): void {
  playTone(880, 150, "sine");
}

export function playIncorrectSfx(): void {
  playTone(220, 250, "sawtooth");
}

// Ascending chime — fires when a streak increments (distinct from the per-drill correct/incorrect cues).
export function playStreakSfx(): void {
  playTone(660, 120, "sine");
  setTimeout(() => playTone(880, 180, "sine"), 100);
}

// Descending, more somber tone — fires when a boss battle's lives fully deplete and it
// restarts (not on every wrong answer, since that would double up with playIncorrectSfx).
export function playLifeLossSfx(): void {
  playTone(300, 180, "triangle");
  setTimeout(() => playTone(180, 260, "triangle"), 140);
}

// Bright three-note ascending arpeggio — fires whenever SectionCompleteOverlay mounts, for
// any "section" completion (a Learn sub-stage, a review, a whole lesson). Distinct from the
// two-note playStreakSfx chime so a streak tick and a section pop-up never sound identical.
export function playSectionCompleteSfx(): void {
  playTone(523, 110, "sine");
  setTimeout(() => playTone(659, 110, "sine"), 90);
  setTimeout(() => playTone(784, 220, "sine"), 180);
}

// A grander four-note arpeggio (one note higher/longer than playSectionCompleteSfx) — fires for
// a whole-BOOK Mind Map completion, so it reads as a bigger moment than a single chapter's own
// three-note cue without inventing an unrelated sound.
export function playBookCompleteSfx(): void {
  playTone(523, 100, "sine");
  setTimeout(() => playTone(659, 100, "sine"), 85);
  setTimeout(() => playTone(784, 100, "sine"), 170);
  setTimeout(() => playTone(1047, 260, "sine"), 255);
}

// A single soft, short tick — fires on a plain Mind Map node tap (expand/collapse a branch,
// open a pericope's own reading view). Quiet and low-key on purpose: this plays on nearly every
// tap across the canvas, so anything louder/longer than playCorrectSfx would quickly grate.
export function playMindMapTapSfx(): void {
  playTone(740, 60, "sine");
}

// The per-letter typing sound: a soft, bright pluck that climbs a pentatonic scale with every
// correct letter in a row — like a combo — so a smooth run of recall literally sounds like it's
// building; any pentatonic step sounds good after any other, so it never jars. It starts back at
// the bottom after a pause or a wrong letter (which itself makes no sound at all — see
// resetLetterCombo), so the climb is something the reader earns by keeping going.
const LETTER_SCALE_HZ = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760];
const LETTER_COMBO_TIMEOUT_MS = 1800;
let letterCombo = 0;
let lastLetterAt = 0;

function playPluck(frequency: number): void {
  const ctx = getSfxContext();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();
  const now = ctx.currentTime;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.16, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
  gain.connect(ctx.destination);
  // A pure tone plus a quiet octave above it — the octave gives it a glassy, "ding" sparkle.
  for (const [multiple, level] of [[1, 1], [2, 0.25]] as const) {
    const oscillator = ctx.createOscillator();
    const partial = ctx.createGain();
    oscillator.type = multiple === 1 ? "sine" : "triangle";
    oscillator.frequency.value = frequency * multiple;
    partial.gain.value = level;
    oscillator.connect(partial);
    partial.connect(gain);
    oscillator.start(now);
    oscillator.stop(now + 0.2);
  }
}

export function playLetterSfx(): void {
  const nowMs = typeof performance === "undefined" ? Date.now() : performance.now();
  if (nowMs - lastLetterAt > LETTER_COMBO_TIMEOUT_MS) letterCombo = 0;
  lastLetterAt = nowMs;
  playPluck(LETTER_SCALE_HZ[Math.min(letterCombo, LETTER_SCALE_HZ.length - 1)]);
  letterCombo += 1;
}

// A wrong letter: silent, but the climb starts over.
export function resetLetterCombo(): void {
  letterCombo = 0;
}

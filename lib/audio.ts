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

import { useCallback, useEffect, useRef, useState } from "react";
import { playCorrectSfx, playIncorrectSfx, playLifeLossSfx, playStreakSfx } from "@/lib/audio";
import { firstWordCharacter } from "@/lib/verseWords";
import { clampPercent, type MasteryLevelConfig } from "@/lib/masteryMode";
import { stepMasteryPhysics, impulseForKeypress, type MasteryPhysicsState } from "@/lib/masteryPhysics";

const REFERENCE_PATTERN = /^(\d+):(\d+)$/;
const RESULT_DELAY_MS = 1100;

export type MasteryChasePhase = "playing" | "cleared" | "caught";

interface UseMasteryChaseArgs {
  words: string[];
  levelConfig: MasteryLevelConfig;
  onComplete: (cleared: boolean) => void;
}

// Owns the entire Mastery Mode chase simulation — the runner's momentum-based position,
// the chariot's steady pursuit, mistake/impulse handling, and physical-keyboard capture —
// so MasteryChaseRound itself only has to render whatever this hook reports. See
// lib/masteryPhysics.ts for the underlying frame-by-frame math this drives every tick.
export function useMasteryChase({ words, levelConfig, onComplete }: UseMasteryChaseArgs) {
  const totalSteps = words.length;
  const [wordIndex, setWordIndex] = useState(0);
  const physicsRef = useRef<MasteryPhysicsState>({
    playerVelocity: 0,
    playerPosition: 0,
    chaserPosition: -levelConfig.startGap,
  });
  const [playerPos, setPlayerPos] = useState(0);
  const [chaserPos, setChaserPos] = useState(-levelConfig.startGap);
  const lastCorrectTsRef = useRef<number | null>(null);
  const [phase, setPhase] = useState<MasteryChasePhase>(() => (totalSteps === 0 ? "cleared" : "playing"));
  const [showError, setShowError] = useState(false);
  const [wrongLetterExpected, setWrongLetterExpected] = useState<string | null>(null);
  const [advanceTick, setAdvanceTick] = useState(0);
  const [surgeTick, setSurgeTick] = useState(0);

  // Runner momentum + chariot pursuit, simulated every frame. Restarts (harmlessly — one
  // frame's delta resets to 0) whenever wordIndex changes, since the physics step needs the
  // current wordIndex as the runner's glide ceiling; physicsRef itself persists across
  // restarts, so velocity/position carry over correctly between words.
  useEffect(() => {
    if (phase !== "playing") return;
    let frameId: number;
    let lastTs: number | null = null;
    function tick(ts: number) {
      if (lastTs === null) lastTs = ts;
      const dtSeconds = (ts - lastTs) / 1000;
      lastTs = ts;
      physicsRef.current = stepMasteryPhysics(physicsRef.current, dtSeconds, wordIndex, levelConfig.decayRate, levelConfig.chariotPace);
      setPlayerPos(physicsRef.current.playerPosition);
      setChaserPos(physicsRef.current.chaserPosition);
      if (physicsRef.current.chaserPosition >= physicsRef.current.playerPosition) {
        setPhase("caught");
        return;
      }
      frameId = requestAnimationFrame(tick);
    }
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [phase, levelConfig.decayRate, levelConfig.chariotPace, wordIndex]);

  useEffect(() => {
    if (phase === "cleared") {
      playStreakSfx();
      const timeout = setTimeout(() => onComplete(true), RESULT_DELAY_MS);
      return () => clearTimeout(timeout);
    }
    if (phase === "caught") {
      playLifeLossSfx();
      const timeout = setTimeout(() => onComplete(false), RESULT_DELAY_MS);
      return () => clearTimeout(timeout);
    }
  }, [phase, onComplete]);

  const currentWord = words[wordIndex];
  const referenceMatch = currentWord?.match(REFERENCE_PATTERN);

  const revealCurrentWord = useCallback(
    (surged: boolean) => {
      setShowError(false);
      setWrongLetterExpected(null);
      setAdvanceTick((tick) => tick + 1);
      if (surged) setSurgeTick((tick) => tick + 1);
      const next = wordIndex + 1;
      if (next >= words.length) {
        setPhase("cleared");
      } else {
        setWordIndex(next);
      }
    },
    [wordIndex, words.length],
  );

  // A mistake never moves the runner backward — it jumps the chariots forward instead, and
  // the same word is re-prompted (no skip). See MasteryLevelConfig.chaserJumpOnMistake.
  const punishMistake = useCallback(() => {
    physicsRef.current = { ...physicsRef.current, chaserPosition: physicsRef.current.chaserPosition + levelConfig.chaserJumpOnMistake };
    setChaserPos(physicsRef.current.chaserPosition);
    if (physicsRef.current.chaserPosition >= physicsRef.current.playerPosition) setPhase("caught");
  }, [levelConfig.chaserJumpOnMistake]);

  const handleLetterPress = useCallback(
    (letter: string) => {
      if (!currentWord || phase !== "playing") return;
      const expected = firstWordCharacter(currentWord)?.toLowerCase();
      const typed = letter.toLowerCase();
      if (typed && typed === expected) {
        playCorrectSfx();
        const now = performance.now();
        const msSinceLastCorrect = lastCorrectTsRef.current === null ? null : now - lastCorrectTsRef.current;
        const { impulse, surged } = impulseForKeypress(msSinceLastCorrect);
        lastCorrectTsRef.current = now;
        physicsRef.current = { ...physicsRef.current, playerVelocity: physicsRef.current.playerVelocity + impulse };
        revealCurrentWord(surged);
      } else if (typed) {
        playIncorrectSfx();
        setShowError(true);
        setWrongLetterExpected(firstWordCharacter(currentWord) ?? "");
        punishMistake();
      }
    },
    [currentWord, phase, revealCurrentWord, punishMistake],
  );

  // A real keyboard works alongside the on-screen one MasteryChaseRound renders — this app
  // is typically used at a desk, so physical typing stays the primary path even with the
  // touch overlay present.
  useEffect(() => {
    if (phase !== "playing" || referenceMatch) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.length === 1 && /[a-z]/i.test(event.key)) handleLetterPress(event.key);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, referenceMatch, handleLetterPress]);

  const trackLength = totalSteps + levelConfig.startGap;
  const playerPercent = clampPercent(((playerPos + levelConfig.startGap) / trackLength) * 100);
  const chaserPercent = clampPercent(((chaserPos + levelConfig.startGap) / trackLength) * 100);
  const gapWords = Math.max(0, Math.round(playerPos - chaserPos));

  return {
    phase,
    wordIndex,
    currentWord,
    referenceMatch,
    playerPercent,
    chaserPercent,
    gapWords,
    advanceTick,
    surgeTick,
    showError,
    wrongLetterExpected,
    handleLetterPress,
    revealCurrentWord,
    punishMistake,
    forceClear: () => setPhase("cleared"),
  };
}

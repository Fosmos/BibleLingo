import { useEffect, useRef } from "react";
import { recognizeCharacter } from "@/lib/handwritingRecognition";

interface AutoRecognizeDrawOptions {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  // Only "word" tokens in DrawFirstLetterRep are OCR-eligible — punctuation/verse-number
  // tokens auto-advance on their own with no drawing expected (see that component).
  enabled: boolean;
  onRecognized: () => void;
}

interface AutoRecognizeDrawHandlers {
  // Call from the canvas's own onPointerUp, alongside the drawing handler — schedules a
  // debounced recognition attempt.
  notifyStrokeEnd: () => void;
  // Call whenever a pending attempt should be invalidated: a manual Next tap, clearing the
  // canvas, or advancing to a new token — prevents a late recognition from firing after the
  // user has already moved on.
  cancel: () => void;
}

const DEBOUNCE_MS = 600;

// Debounces ~600ms after the last pointer-up with no new pointer-down before running OCR on
// the canvas — long enough that a multi-stroke letter (e.g. "t", "i") isn't recognized
// mid-letter, short enough to still feel responsive once the user actually pauses.
export function useAutoRecognizeDraw({ canvasRef, enabled, onRecognized }: AutoRecognizeDrawOptions): AutoRecognizeDrawHandlers {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Doubles as a debounce-restart token and a stale-response guard: bumped by cancel(), so a
  // recognizeCharacter() call already in flight when canceled just no-ops on resolution
  // instead of firing a late/incorrect advance.
  const requestIdRef = useRef(0);

  function cancel(): void {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    requestIdRef.current += 1;
  }

  function notifyStrokeEnd(): void {
    if (!enabled) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const thisRequestId = ++requestIdRef.current;
    timeoutRef.current = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      recognizeCharacter(canvas).then((letter) => {
        if (requestIdRef.current !== thisRequestId) return;
        if (letter) onRecognized();
      });
    }, DEBOUNCE_MS);
  }

  useEffect(() => cancel, []);

  return { notifyStrokeEnd, cancel };
}

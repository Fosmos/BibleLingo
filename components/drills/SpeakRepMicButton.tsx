"use client";

import { MicButton } from "@/components/ui/MicButton";

interface SpeakRepMicButtonProps {
  isListening: boolean;
  onStart: () => void;
  onStop: () => void;
}

// SpeakRep.tsx's own start/stop mic control, split out purely to keep that file under this
// codebase's 200-line cap.
export function SpeakRepMicButton({ isListening, onStart, onStop }: SpeakRepMicButtonProps) {
  return isListening ? (
    <MicButton listening onClick={onStop} label="Done speaking" caption="Tap when finished reciting" />
  ) : (
    <MicButton listening={false} onClick={onStart} label="Start speaking" caption="Tap to allow mic & recite" />
  );
}

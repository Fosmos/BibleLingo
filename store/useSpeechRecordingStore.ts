import { create } from "zustand";

interface SpeechRecordingState {
  isRecording: boolean;
}

interface SpeechRecordingActions {
  setRecording: (recording: boolean) => void;
}

type SpeechRecordingStore = SpeechRecordingState & SpeechRecordingActions;

// Deliberately NOT persisted (unlike store/useProgressStore.ts) — the mic is never live across
// a reload, so there's nothing worth remembering past this one session. A single shared flag
// (rather than each Speak-family hook keeping its own local isListening boolean) is what lets
// lib/useContinuousListening.ts's own onend failsafe check "should I actually restart the
// microphone, or did the caller ask me to stop" without that caller having to hand it a ref of
// its own — any part of the app can read whether the mic is live right now, and only
// useContinuousListening.ts itself ever calls setRecording.
export const useSpeechRecordingStore = create<SpeechRecordingStore>((set) => ({
  isRecording: false,
  setRecording: (recording) => set({ isRecording: recording }),
}));

"use client";

import { motion } from "framer-motion";
import { MicOff, ArrowRight, RotateCw } from "lucide-react";
import { TAP_SCALE } from "@/lib/motionTokens";

interface SpeakRepFallbackProps {
  isSecure: boolean;
  permissionDenied: boolean;
  supported: boolean;
  onSkip: () => void;
  onRetry: () => void;
}

// SpeakRep.tsx's own no-mic-available state, split out purely to keep that file under this
// codebase's 200-line cap — the one message + two actions shown whenever speech recognition
// itself isn't usable (unsupported browser, HTTPS required on mobile, or permission denied),
// rather than the recording UI it normally shows.
export function SpeakRepFallback({ isSecure, permissionDenied, supported, onSkip, onRetry }: SpeakRepFallbackProps) {
  return (
    <div className="flex w-full flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
      <div className="flex items-center gap-2 font-medium">
        <MicOff size={18} className="text-amber-600 dark:text-amber-400" />
        <span>{!isSecure ? "HTTPS required on mobile" : permissionDenied ? "Microphone access declined" : "Speech recognition unsupported"}</span>
      </div>
      <p className="text-sm text-ink-muted dark:text-zinc-400">
        {!isSecure
          ? "Mobile browsers (iOS Safari & Android Chrome) only allow microphone access over HTTPS. When testing locally on a phone, launch the server with npm run dev:https."
          : permissionDenied
            ? "Microphone access was declined in your browser. Speaking exercises can't record your voice without microphone permission."
            : "Speech recognition isn't supported in this browser (try Chrome, Edge, or Safari on iOS/Android)."}
      </p>
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <motion.button
          type="button"
          whileTap={TAP_SCALE}
          onClick={onSkip}
          className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <span>Go to next exercise</span>
          <ArrowRight size={16} />
        </motion.button>
        {supported && isSecure && permissionDenied && (
          <motion.button
            type="button"
            whileTap={TAP_SCALE}
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink-muted/30 px-4 py-2 text-sm font-medium text-ink-soft hover:bg-ink-muted/10 dark:text-zinc-300"
          >
            <RotateCw size={15} />
            <span>Try microphone again</span>
          </motion.button>
        )}
      </div>
    </div>
  );
}

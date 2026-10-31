"use client";

import { motion } from "framer-motion";
import { Mic, Square } from "lucide-react";
import { TAP_SCALE } from "@/lib/motionTokens";

interface MicButtonProps {
  listening: boolean;
  onClick: () => void;
  // What tapping does, for screen readers ("Start speaking" / "Done speaking").
  label: string;
  // The line under the button.
  caption: string;
}

// The Organic restyle's mic: a 76px terracotta button inside two soft halo rings — terracotta
// while waiting, sage while it's listening — with a caption below. In a lesson tray, just the button, no halos or caption.
export function MicButton({ listening, onClick, label, caption }: MicButtonProps) {
  return (
    <div className="flex flex-col items-center gap-2.5">
      <div className="relative flex h-[120px] w-[120px] items-center justify-center [.lesson-page-tray_&]:h-[84px] [.lesson-page-tray_&]:w-[84px]">
        <span aria-hidden="true" className={`absolute inset-0 rounded-full [.lesson-page-tray_&]:hidden ${listening ? "bg-sage-200" : "bg-brand-200"}`} />
        <span aria-hidden="true" className={`absolute inset-[18px] rounded-full [.lesson-page-tray_&]:hidden ${listening ? "bg-sage-300" : "bg-brand-300"}`} />
        <motion.button
          type="button"
          whileTap={TAP_SCALE}
          onClick={onClick}
          aria-label={label}
          className={`relative flex h-[76px] w-[76px] items-center justify-center rounded-full bg-brand-500 text-paper shadow-organic-md hover:bg-brand-600 ${listening ? "animate-pulse" : ""}`}
        >
          {listening ? <Square size={26} strokeWidth={2.75} /> : <Mic size={30} strokeWidth={2.75} />}
        </motion.button>
      </div>
      <span className="text-[15px] font-semibold text-sand-800 dark:text-zinc-300 [.lesson-page-tray_&]:hidden">{caption}</span>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { Coins } from "lucide-react";
import { useProgressStore } from "@/store/useProgressStore";
import { MOTION_DURATION } from "@/lib/motionTokens";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";

interface ShekelCounterProps {
  className?: string;
  showInfo?: boolean;
  // See StreakCounter's `pill` prop — same soft-chip treatment for standalone HUD contexts.
  pill?: boolean;
}

export function ShekelCounter({ className, showInfo, pill }: ShekelCounterProps) {
  const shekels = useProgressStore((state) => state.shekels);

  return (
    // Keying on the value remounts the row on every gain, so the pulse plays exactly once per change.
    <motion.div
      key={shekels}
      initial={{ scale: 1.35 }}
      animate={{ scale: 1 }}
      transition={{ duration: MOTION_DURATION.base, ease: "easeOut" }}
      className={`flex items-center gap-1 ${pill ? "rounded-full bg-gold-50 px-3 py-1.5 dark:bg-zinc-800" : ""} ${className ?? ""}`}
      aria-label="Shekels earned"
    >
      <Coins size={pill ? 16 : 20} className="text-gold-500" />
      <span className="text-sm font-semibold text-ink-soft dark:text-zinc-300">{shekels}</span>
      {showInfo && <InfoTip text={INFO_TIPS.shekelCounter} />}
    </motion.div>
  );
}

"use client";

import { motion } from "framer-motion";
import { MOTION_DURATION } from "@/lib/motionTokens";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}

export function ToggleSwitch({ checked, onChange, label, description }: ToggleSwitchProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-ink-soft dark:text-zinc-300">{label}</span>
        {description && <span className="text-xs text-ink-muted">{description}</span>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          checked ? "bg-brand-500" : "bg-mist dark:bg-zinc-700"
        }`}
      >
        <motion.span
          layout
          transition={{ duration: MOTION_DURATION.base, ease: "easeOut" }}
          className="absolute top-1 h-5 w-5 rounded-full bg-white shadow"
          style={{ left: checked ? "1.625rem" : "0.25rem" }}
        />
      </button>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { BookMarked, BookOpen, Bookmark, Heart, type LucideIcon } from "lucide-react";
import type { PathKind } from "@/types";
import { TAP_SCALE } from "@/lib/motionTokens";

interface PathKindPickerProps {
  onSelectKind: (kind: PathKind) => void;
}

interface KindOption {
  kind: PathKind;
  label: string;
  description: string;
  icon: LucideIcon;
}

const OPTIONS: KindOption[] = [
  { kind: "book", label: "A Book", description: "Memorize an entire book.", icon: BookMarked },
  { kind: "chapter", label: "A Chapter", description: "Focus on one chapter.", icon: BookOpen },
  { kind: "verse", label: "A Verse", description: "Memorize a single verse.", icon: Bookmark },
  { kind: "topic", label: "A Topic", description: "Verses curated by theme.", icon: Heart },
];

export function PathKindPicker({ onSelectKind }: PathKindPickerProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {OPTIONS.map(({ kind, label, description, icon: Icon }) => (
        <motion.button
          key={kind}
          type="button"
          whileTap={TAP_SCALE}
          onClick={() => onSelectKind(kind)}
          className="flex flex-col items-start gap-2 rounded-xl border border-line bg-white p-4 text-left dark:border-zinc-800 dark:bg-zinc-900"
        >
          <Icon size={22} className="text-brand-500" />
          <span className="text-sm font-semibold text-ink dark:text-zinc-200">{label}</span>
          <span className="text-xs text-ink-muted">{description}</span>
        </motion.button>
      ))}
    </div>
  );
}

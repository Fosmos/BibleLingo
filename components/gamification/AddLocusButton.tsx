"use client";

import { MapPin } from "lucide-react";

interface AddLocusButtonProps {
  onTap: () => void;
  className?: string;
}

// Opens the screen for assigning verses to a memory palace locus (ReaderLocusSheet.tsx).
export function AddLocusButton({ onTap, className = "" }: AddLocusButtonProps) {
  return (
    <button type="button" onClick={onTap} className={`flex min-h-11 shrink-0 items-center gap-1 text-[13px] font-extrabold text-brand-700 dark:text-brand-300 ${className}`}>
      <MapPin size={14} strokeWidth={2.75} />
      Add locus
    </button>
  );
}

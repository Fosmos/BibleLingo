"use client";

import { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";

interface InfoTipProps {
  text: string;
}

// A small "i" icon that toggles a short explanatory popover on click — for testers, not
// end-user onboarding, so it stays terse and out of the way until asked for. Click-to-toggle
// (not hover-only) so it works on touch devices; closes on any outside click.
export function InfoTip({ text }: InfoTipProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleOutsideClick(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  return (
    <span ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="More info"
        aria-expanded={open}
        className="flex h-4 w-4 items-center justify-center rounded-full text-ink-muted hover:text-brand-500"
      >
        <Info size={14} />
      </button>
      {open && (
        <span className="absolute left-1/2 top-5 z-50 w-56 -translate-x-1/2 rounded-lg border border-line bg-white p-2 text-left text-xs font-normal normal-case text-ink-soft dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          {text}
        </span>
      )}
    </span>
  );
}

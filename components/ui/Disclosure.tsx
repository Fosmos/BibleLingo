"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";

interface DisclosureProps {
  label: string;
  description?: string;
  defaultOpen?: boolean;
  icon?: LucideIcon;
  children: ReactNode;
}

// Generic collapsed-by-default section — tap the header to reveal `children`. Used to tuck
// less-common settings/features out of a screen's default view without removing them (see
// app/profile/page.tsx's Advanced section). Same rounded-2xl/shadow-sm card shape as every
// other content card in the app (see TodayVersesCard.tsx) — `icon` is optional since a
// Disclosure can stand for anything, but every current caller passes one so its header reads
// exactly like a SrsOverview/ProblemVersesBin caption.
export function Disclosure({ label, description, defaultOpen = false, icon: Icon, children }: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl bg-brand-50 shadow-sm dark:border dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 p-5 text-left"
      >
        <span className="flex items-center gap-2">
          {Icon && (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
              <Icon size={15} />
            </span>
          )}
          <span>
            <span className="block text-caption font-semibold uppercase tracking-wide text-brand-500">{label}</span>
            {description && <span className="mt-1 block text-sm text-ink-muted">{description}</span>}
          </span>
        </span>
        <ChevronDown size={18} className={`shrink-0 text-ink-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="flex flex-col gap-4 px-5 pb-5">{children}</div>}
    </div>
  );
}

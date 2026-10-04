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
// app/profile/page.tsx's Advanced section). The Organic restyle's soft sand card, with an
// optional sage icon circle beside the label.
export function Disclosure({ label, description, defaultOpen = false, icon: Icon, children }: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-organic bg-sand-100 dark:bg-zinc-900">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-[18px] py-4 text-left"
      >
        <span className="flex items-center gap-3">
          {Icon && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage-200 text-sage-800 dark:bg-sage-900 dark:text-sage-200">
              <Icon size={17} strokeWidth={2.75} />
            </span>
          )}
          <span>
            <span className="block text-[15px] font-bold text-ink dark:text-zinc-100">{label}</span>
            {description && <span className="mt-0.5 block text-[13px] leading-snug text-ink-muted">{description}</span>}
          </span>
        </span>
        <ChevronDown size={18} strokeWidth={2.75} className={`shrink-0 text-ink-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="flex flex-col gap-4 px-[18px] pb-4">{children}</div>}
    </div>
  );
}

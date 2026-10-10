"use client";

import { Fragment, useEffect, useRef } from "react";

interface BibleBreadcrumbsProps {
  crumbs: string[];
  level: number;
  onSelect: (level: number) => void;
}

// The Path tab's breadcrumb pills — The Bible › Letters › Titus › Titus 1 — tapping one zooms
// back out to that level.
// One row that scrolls sideways when deep, kept scrolled to the current crumb.
export function BibleBreadcrumbs({ crumbs, level, onSelect }: BibleBreadcrumbsProps) {
  const rowRef = useRef<HTMLElement>(null);
  useEffect(() => {
    rowRef.current?.scrollTo({ left: rowRef.current.scrollWidth, behavior: "smooth" });
  }, [level]);

  return (
    <nav
      ref={rowRef}
      aria-label="Where you are"
      className="flex shrink-0 items-center gap-1.5 overflow-x-auto whitespace-nowrap px-4 pb-2.5 pt-[calc(0.5rem+env(safe-area-inset-top))] [scrollbar-width:none]"
    >
      {crumbs.slice(0, level + 1).map((crumb, index) => (
        <Fragment key={index}>
          {index > 0 && <span className="text-sand-600">›</span>}
          <button
            type="button"
            onClick={() => onSelect(index)}
            aria-current={index === level ? "page" : undefined}
            className={`shrink-0 rounded-full px-3 py-[7px] text-[13px] font-bold ${
              index === level ? "bg-ink text-paper dark:bg-zinc-100 dark:text-zinc-900" : "bg-sand-100 text-ink hover:bg-sand-200 dark:bg-zinc-800 dark:text-zinc-100"
            }`}
          >
            {crumb}
          </button>
        </Fragment>
      ))}
    </nav>
  );
}

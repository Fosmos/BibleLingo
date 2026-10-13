import { Fragment } from "react";

export interface ProgressCrumb {
  label: string;
  // Omitted on the current level (not tappable).
  onTap?: () => void;
}

interface ProgressHeaderProps {
  crumbs: ProgressCrumb[];
  eyebrow: string;
  title: string;
}

// The Bible progress screens' shared header (design_handoff_bible_progress): breadcrumb pills,
// an eyebrow and a big title, over two decorative circles.
export function ProgressHeader({ crumbs, eyebrow, title }: ProgressHeaderProps) {
  return (
    <header className="relative flex flex-col gap-3 pt-[calc(0.5rem+env(safe-area-inset-top))]">
      <span aria-hidden="true" className="pointer-events-none absolute -right-[110px] -top-[90px] -z-10 h-[300px] w-[300px] rounded-full bg-sage-200/70 dark:bg-sage-900/40" />
      <span aria-hidden="true" className="pointer-events-none absolute -right-10 top-[70px] -z-10 h-[120px] w-[120px] rounded-full bg-brand-200/80 dark:bg-brand-900/40" />
      <nav aria-label="Where you are" className="flex flex-wrap items-center gap-1.5">
        {crumbs.map((crumb, index) => (
          <Fragment key={crumb.label}>
            {index > 0 && <span className="text-xs font-extrabold text-sand-600">›</span>}
            {crumb.onTap ? (
              <button type="button" onClick={crumb.onTap} className="rounded-full bg-[#FEFDFB] px-[13px] py-[7px] text-xs font-extrabold text-sand-800 shadow-organic-sm hover:bg-sand-100 dark:bg-zinc-900 dark:text-zinc-200">
                {crumb.label}
              </button>
            ) : (
              <span aria-current="page" className="rounded-full bg-ink px-[13px] py-[7px] text-xs font-extrabold text-paper dark:bg-zinc-100 dark:text-zinc-900">
                {crumb.label}
              </span>
            )}
          </Fragment>
        ))}
      </nav>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-extrabold uppercase tracking-[.08em] text-sage-800 dark:text-sage-300">{eyebrow}</span>
        <h1 className="font-heading text-[40px] leading-none text-ink [text-wrap:balance] dark:text-zinc-100">{title}</h1>
      </div>
    </header>
  );
}

import type { ReactNode } from "react";

interface PageHeadingProps {
  // A small label above the headline (e.g. "Your progress", or Home's date) — optional, since not
  // every headline needs the extra framing (see app/profile/page.tsx's plain "Profile").
  kicker?: string;
  children: ReactNode;
  className?: string;
}

// The app's shared big-serif page-header treatment — a small brand-colored kicker label (if
// given) over a large serif headline. Used at the top of every primary screen (Home, the
// path view, Memorized, Profile, ...) so they all read with the same confident, editorial
// voice instead of each page inventing its own header size.
export function PageHeading({ kicker, children, className }: PageHeadingProps) {
  return (
    <div className={className}>
      {kicker && <p className="mb-1 text-[13px] font-semibold text-ink-muted dark:text-zinc-400">{kicker}</p>}
      <h1 className="font-serif text-[34px] leading-[1.05] text-ink dark:text-zinc-100">{children}</h1>
    </div>
  );
}

import type { ReactNode } from "react";

interface PageHeadingProps {
  // A small tracked-out label above the headline (e.g. "YOUR PATH") — optional, since not
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
      {kicker && <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-brand-500">{kicker}</p>}
      <h1 className="font-serif text-3xl font-semibold leading-tight text-ink dark:text-zinc-100">{children}</h1>
    </div>
  );
}

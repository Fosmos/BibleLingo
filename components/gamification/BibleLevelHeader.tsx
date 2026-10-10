interface BibleLevelHeaderProps {
  title: string;
  sub?: string;
}

// The heading at the top of each Bible browser level — a title in the heading font and a
// quiet sub-line.
export function BibleLevelHeader({ title, sub }: BibleLevelHeaderProps) {
  return (
    <div className="flex flex-col gap-1 px-1 pb-3 pt-1">
      <h1 className="text-[26px] leading-[1.05] text-ink dark:text-zinc-100">{title}</h1>
      {sub && <p className="text-[13px] text-ink-muted">{sub}</p>}
    </div>
  );
}

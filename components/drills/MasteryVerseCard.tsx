interface MasteryVerseCardProps {
  words: string[];
  wordIndex: number;
}

// Zone 2 of Mastery Mode's chase screen — a floating white card showing every word's slot
// up front, not just the ones already typed. Words already revealed render as bold, solid
// text; every word at or after the current one renders as an invisible copy of itself
// (same font, transparent, underlined) so its blank is exactly as wide as the real word —
// no first letter, no length hint beyond what the underline itself implies.
export function MasteryVerseCard({ words, wordIndex }: MasteryVerseCardProps) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="flex flex-wrap gap-x-2 gap-y-1.5 text-lg leading-relaxed tracking-wide">
        {words.map((word, index) => {
          const revealed = index < wordIndex;
          return (
            <span
              key={index}
              className={
                revealed
                  ? "font-semibold text-ink dark:text-zinc-100"
                  : "select-none text-transparent underline decoration-line decoration-2 underline-offset-4 dark:decoration-zinc-700"
              }
              aria-hidden={revealed ? undefined : true}
            >
              {word}
            </span>
          );
        })}
      </p>
    </div>
  );
}

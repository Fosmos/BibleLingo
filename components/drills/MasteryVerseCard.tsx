interface MasteryVerseCardProps {
  reference: string;
  words: string[];
  wordIndex: number;
}

// Zone 2 of Mastery Mode's chase screen — a floating white card showing only the verse
// currently in play (not the whole passage at once, which for a chapter/book run could be
// dozens of verses long) — MasteryChaseRound swaps `words`/`wordIndex`/`reference` to the
// next verse the moment the player crosses into it, so the card updates on its own as they
// go. Words already revealed render as bold, solid text; every word at or after the current
// one renders as an invisible copy of itself (same font, transparent, underlined) so its
// blank is exactly as wide as the real word — no first letter, no length hint beyond what
// the underline itself implies.
// Fixed height regardless of verse length — a one-word verse and a twenty-word verse both
// occupy exactly the same portion of the screen, so the keyboard/button below never jump as
// the current verse changes. Content is vertically centered when it's short and scrolls
// internally on the rare verse too long to fit, rather than growing the card itself.
const CARD_HEIGHT = "h-36";

export function MasteryVerseCard({ reference, words, wordIndex }: MasteryVerseCardProps) {
  return (
    <div
      className={`flex ${CARD_HEIGHT} flex-col rounded-2xl border border-line bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900`}
    >
      <p className="mb-1.5 shrink-0 text-caption font-semibold uppercase tracking-wide text-brand-500">{reference}</p>
      <div className="flex flex-1 items-center overflow-y-auto">
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
    </div>
  );
}

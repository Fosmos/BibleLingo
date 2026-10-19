import { splitWordPunctuation } from "@/lib/verseWords";

interface HeldVerseWordsProps {
  text: string;
}

// A verse already learned, while a lesson runs on the chapter reader: just each word's first
// letter, with its punctuation — the rest of the word still taking its room, invisible, so every
// letter stays exactly where it sits in the reader (ReaderVerseRow.tsx / ReaderProseRun.tsx).
export function HeldVerseWords({ text }: HeldVerseWordsProps) {
  return (
    <>
      {text.split(" ").map((word, index) => {
        const { lead, core, trail } = splitWordPunctuation(word);
        return (
          <span key={index}>
            {index > 0 && " "}
            {lead}
            {core.slice(0, 1)}
            <span className="invisible" aria-hidden="true">
              {core.slice(1)}
            </span>
            {trail}
          </span>
        );
      })}
    </>
  );
}

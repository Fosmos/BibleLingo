import { Fragment } from "react";
import { buildDrawTokens } from "@/lib/verseDrawTokens";
import { wordLetterPlaceholder, wordOrBlank } from "@/lib/verseWords";

interface SpeakRepRevealLineProps {
  text: string;
  // How many of this verse's own WORD tokens (punctuation/reference tokens don't count) have
  // been recognized so far in the live transcript — see SpeakRep.tsx's own use of
  // lib/textMatch.ts's spokenPrefixMatchCount. Monotonic for the length of one attempt: a word
  // once revealed never goes back to hidden, even if a later interim transcript update briefly
  // stops matching it.
  revealedCount: number;
  // A not-yet-spoken word shows its first letter (the Speak flow's hint mode) or nothing at all
  // (blind recitation) — either way padded to the word's own real length (see
  // lib/verseWords.ts), never a dash/underscore.
  mode: "hint" | "blind";
}

// SpeakRep.tsx's own active-verse display: every word fills in, in place, the instant it's
// recognized in the live transcript — never waiting for the whole recitation to end, and never
// un-revealing a word once it's been said (see SpeakRep.tsx's revealedCount tracking). Reuses
// buildDrawTokens' own word/punctuation/reference split so a not-yet-spoken word's placeholder
// lines up with the SAME tokenization lib/textMatch.ts's spokenPrefixMatchCount counts against.
export function SpeakRepRevealLine({ text, revealedCount, mode }: SpeakRepRevealLineProps) {
  const tokens = buildDrawTokens(text, {});
  let wordIndex = 0;
  return (
    <>
      {tokens.map((token, index) => {
        const isWord = token.kind === "word" && !token.isReference;
        let display = token.text;
        if (isWord) {
          const isRevealed = wordIndex < revealedCount;
          // wordLetterPlaceholder's own `revealed` flag means something different from this
          // component's own `isRevealed` — it controls whether the FIRST LETTER itself shows,
          // which is exactly what "hint" mode wants for a not-yet-spoken word (the whole point
          // of a hint); passing `false` here left every not-yet-spoken word fully blank instead,
          // reading as an empty line with nothing to go on.
          display = isRevealed ? token.text : mode === "blind" ? wordOrBlank(token.text, false) : wordLetterPlaceholder(token.text, true);
          wordIndex++;
        }
        return (
          <Fragment key={index}>
            {display}
            {token.spaceAfter && " "}
          </Fragment>
        );
      })}
    </>
  );
}

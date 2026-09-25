import { Fragment } from "react";
import { buildDrawTokens } from "@/lib/verseDrawTokens";
import { firstWordCharacter, hiddenWordBlank } from "@/lib/verseWords";
import { FIRST_LETTER_GAP_CLASS } from "@/lib/firstLetterGap";

interface SpeakRepRevealLineProps {
  text: string;
  // How many of this verse's own WORD tokens (punctuation/reference tokens don't count) have
  // been recognized so far in the live transcript — see SpeakRep.tsx's own use of
  // lib/textMatch.ts's spokenPrefixMatchCount. Monotonic for the length of one attempt: a word
  // once revealed never goes back to hidden, even if a later interim transcript update briefly
  // stops matching it.
  revealedCount: number;
  // A not-yet-spoken word shows its bare first letter (the Speak flow's hint mode — a compact
  // prompt, not a same-width stand-in) or nothing at all (blind recitation, still padded to the
  // word's own real length, its punctuation hidden too — see lib/verseWords.ts's hiddenWordBlank).
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
        // Whether this token ends a first-letter unit (a hint letter, plus its punctuation) —
        // where the extra first-letter gap goes (see lib/firstLetterGap.ts). Never after a word
        // already spoken in full, which reads as ordinary text.
        let endsLetterUnit = false;
        if (isWord) {
          const isRevealed = wordIndex < revealedCount;
          display = isRevealed ? token.text : mode === "blind" ? hiddenWordBlank(token.text) : (firstWordCharacter(token.text) ?? token.text);
          endsLetterUnit = mode === "hint" && !isRevealed;
          wordIndex++;
        } else if (token.kind === "punctuation") {
          // Punctuation only appears once the word it belongs to has been said — never as part
          // of the hint, never ahead of the reader. A mark belongs to the word it touches:
          // leading punctuation (no space after it) to the NEXT word, trailing punctuation to the
          // one just before it. Hidden, it takes no room in hint mode (letters stay one space
          // apart) and blank room in blind mode (matching the blank words around it).
          const ownerIndex = token.spaceAfter ? wordIndex - 1 : wordIndex;
          if (ownerIndex >= revealedCount) display = mode === "blind" ? hiddenWordBlank(token.text) : "";
          endsLetterUnit = mode === "hint" && ownerIndex >= revealedCount;
        }
        return (
          <Fragment key={index}>
            {endsLetterUnit && token.spaceAfter ? <span className={FIRST_LETTER_GAP_CLASS}>{display}</span> : display}
            {token.spaceAfter && " "}
          </Fragment>
        );
      })}
    </>
  );
}

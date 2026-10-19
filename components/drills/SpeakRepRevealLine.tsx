import { Fragment, type ReactNode } from "react";
import { buildDrawTokens } from "@/lib/verseDrawTokens";
import { HiddenWord } from "@/components/drills/HiddenWord";

interface SpeakRepRevealLineProps {
  text: string;
  // How many of this verse's own WORD tokens (punctuation/reference tokens don't count) have
  // been recognized so far in the live transcript — see SpeakRep.tsx's own use of
  // lib/textMatch.ts's spokenPrefixMatchCount. Monotonic for the length of one attempt: a word
  // once revealed never goes back to hidden, even if a later interim transcript update briefly
  // stops matching it.
  revealedCount: number;
  // A not-yet-spoken word shows its first letter (the Speak flow's hint mode) or none of its
  // letters (blind recitation) — either way as a grey pill its length (HiddenWord.tsx).
  mode: "hint" | "blind";
}

// SpeakRep.tsx's own active-verse display: every word fills in, in place, the instant it's
// recognized in the live transcript — never waiting for the whole recitation to end, and never
// un-revealing a word once it's been said (see SpeakRep.tsx's revealedCount tracking). Reuses
// buildDrawTokens' own word/punctuation/reference split so a not-yet-spoken word's placeholder
// lines up with the SAME tokenization lib/textMatch.ts's spokenPrefixMatchCount counts against.
// Punctuation always shows, so the verse's shape is there from the start.
export function SpeakRepRevealLine({ text, revealedCount, mode }: SpeakRepRevealLineProps) {
  const tokens = buildDrawTokens(text, {});
  let wordIndex = 0;
  return (
    <>
      {tokens.map((token, index) => {
        let shown: ReactNode = token.text;
        if (token.kind === "word" && !token.isReference) {
          if (wordIndex >= revealedCount) shown = <HiddenWord word={token.text} firstLetter={mode === "hint"} />;
          wordIndex++;
        }
        return (
          <Fragment key={index}>
            {shown}
            {token.spaceAfter && " "}
          </Fragment>
        );
      })}
    </>
  );
}

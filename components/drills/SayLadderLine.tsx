import { Fragment, type ReactNode } from "react";
import { buildDrawTokens } from "@/lib/verseDrawTokens";
import type { LineMode } from "@/lib/sayLadder";
import { HiddenWord } from "@/components/drills/HiddenWord";

interface SayLadderLineProps {
  // One sense line (or clause) of the verse, and the index of its first word in the whole verse.
  text: string;
  startIndex: number;
  // How many of the verse's words have been said so far — those always show.
  revealedCount: number;
  // Every word of the verse's mode on this step (lib/sayLadder.ts's ladderWordModes).
  wordModes: LineMode[];
}

// SpeakRep.tsx's view of a line on a say-it ladder step (lib/sayLadder.ts): a word still to say
// shows whole, as its first letter, or — on a blank line — inside one empty bar the length of the
// words it hides. Each word fills in as it's said.
export function SayLadderLine({ text, startIndex, revealedCount, wordModes }: SayLadderLineProps) {
  const tokens = buildDrawTokens(text, {});
  const parts: ReactNode[] = [];
  let bar: string[] = [];
  const closeBar = () => {
    if (!bar.length) return;
    parts.push(
      <span key={`bar-${parts.length}`} aria-hidden="true" className="select-none rounded-md bg-sand-300 text-transparent [box-decoration-break:clone] dark:bg-zinc-700">
        {bar.join("")}
      </span>,
    );
    bar = [];
  };
  let wordIndex = startIndex;
  tokens.forEach((token, index) => {
    const space = token.spaceAfter ? " " : "";
    if (token.kind !== "word" || token.isReference) {
      if (bar.length) bar.push(token.text + space);
      else parts.push(<Fragment key={index}>{token.text + space}</Fragment>);
      return;
    }
    const mode = wordIndex < revealedCount ? "full" : (wordModes[wordIndex] ?? "full");
    wordIndex++;
    if (mode === "blank") return void bar.push(token.text + space);
    closeBar();
    parts.push(
      <Fragment key={index}>
        {mode === "letters" ? <HiddenWord word={token.text} firstLetter /> : token.text}
        {space}
      </Fragment>,
    );
  });
  closeBar();
  return <>{parts}</>;
}

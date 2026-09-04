import type { WordDiffToken } from "@/types";

interface MistakeDiffProps {
  label: string;
  tokens: WordDiffToken[];
  // Shown as its own line ABOVE the main one when given — "what we heard," so the reader can
  // compare their actual attempt against the correct verse right below it instead of only
  // ever seeing the target's own side of the story. Its own wrong/extra words are called out
  // the same way the main line calls out missed ones — see lib/textMatch.ts's diffAttempt.
  spokenLabel?: string;
  spokenTokens?: WordDiffToken[];
}

function DiffLine({ tokens }: { tokens: WordDiffToken[] }) {
  return (
    <p className="text-sm leading-relaxed">
      {tokens.map((token, index) => (
        <span key={index} className={token.correct ? "text-ink-soft dark:text-zinc-300" : "font-semibold text-heart-600 underline"}>
          {token.word}
          {index < tokens.length - 1 ? " " : ""}
        </span>
      ))}
    </p>
  );
}

export function MistakeDiff({ label, tokens, spokenLabel, spokenTokens }: MistakeDiffProps) {
  return (
    <div className="flex flex-col gap-3">
      {spokenTokens && spokenTokens.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-heart-600">{spokenLabel ?? "What we heard:"}</p>
          <DiffLine tokens={spokenTokens} />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-heart-600">{label}</p>
        <DiffLine tokens={tokens} />
      </div>
    </div>
  );
}

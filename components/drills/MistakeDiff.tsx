import type { WordDiffToken } from "@/types";

interface MistakeDiffProps {
  label: string;
  tokens: WordDiffToken[];
}

export function MistakeDiff({ label, tokens }: MistakeDiffProps) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm font-medium text-heart-600">{label}</p>
      <p className="text-sm leading-relaxed">
        {tokens.map((token, index) => (
          <span
            key={index}
            className={token.correct ? "text-ink-soft dark:text-zinc-300" : "font-semibold text-heart-600 underline"}
          >
            {token.word}
            {index < tokens.length - 1 ? " " : ""}
          </span>
        ))}
      </p>
    </div>
  );
}

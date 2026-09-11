import type { FirstLetterTyping } from "@/lib/useFirstLetterTyping";
import { ReferenceNumberEntry } from "@/components/drills/ReferenceNumberEntry";
import { MistakeLetterHint } from "@/components/drills/MistakeLetterHint";
import { AutoCompleteButton } from "@/components/ui/AutoCompleteButton";

interface FirstLetterTypingControlsProps {
  typing: FirstLetterTyping;
  // Shown above the input only when this review is on a real reading-view page (see
  // FirstLetterTypeRep.tsx's own `layout` doc) — every other caller already shows this same
  // label in its own header above the parchment instead.
  showLabel?: string;
  allowPeekHint?: boolean;
  autoRevealLetterOnMistake: boolean;
}

// The letter-input keyboard + reference-digit entry + mistake hint + auto-complete row shared
// by every FirstLetterTypeRep.tsx render path — split out purely to keep that file under this
// codebase's 200-line cap.
export function FirstLetterTypingControls({ typing, showLabel, allowPeekHint, autoRevealLetterOnMistake }: FirstLetterTypingControlsProps) {
  return (
    <>
      {showLabel && <p className="self-center text-caption font-semibold uppercase tracking-wide text-brand-500">{showLabel}</p>}
      {typing.referenceMatch ? (
        <ReferenceNumberEntry
          key={typing.currentWord}
          chapter={typing.referenceMatch[1]}
          verse={typing.referenceMatch[2]}
          onDone={typing.revealCurrentWord}
          onMistake={typing.recordMistake}
        />
      ) : (
        <div className="flex flex-col items-center gap-2">
          <input
            value={typing.letterInput}
            onChange={(event) => typing.handleLetterChange(event.target.value)}
            maxLength={1}
            autoFocus
            aria-label="Type the first letter of the next word"
            className={`w-16 rounded-xl border p-3 text-center text-xl focus:outline-none focus-visible:ring-2 dark:bg-zinc-900 ${
              typing.showError ? "border-heart-500 focus-visible:ring-heart-500" : "border-line focus-visible:ring-brand-500 dark:border-zinc-700"
            }`}
          />
          {allowPeekHint && !typing.showError && (
            <button type="button" onClick={typing.peekHint} className="text-xs font-medium text-ink-muted hover:text-brand-600 hover:underline">
              Peek hint
            </button>
          )}
        </div>
      )}
      {!typing.referenceMatch && typing.showError && typing.wrongLetterExpected && (
        <MistakeLetterHint
          key={typing.currentWord}
          expectedLetter={typing.wrongLetterExpected}
          autoReveal={autoRevealLetterOnMistake}
          onReveal={typing.markHintUsed}
        />
      )}
      <AutoCompleteButton onClick={typing.reportComplete} />
    </>
  );
}

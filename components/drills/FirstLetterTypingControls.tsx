import type { FirstLetterTyping } from "@/lib/useFirstLetterTyping";
import { ReferenceNumberEntry } from "@/components/drills/ReferenceNumberEntry";
import { AutoCompleteButton } from "@/components/ui/AutoCompleteButton";
import { OnScreenKeyboard } from "@/components/ui/OnScreenKeyboard";

interface FirstLetterTypingControlsProps {
  typing: FirstLetterTyping;
  // Shown above the input only when this review is on a real reading-view page (see
  // FirstLetterTypeRep.tsx's own `layout` doc) — every other caller already shows this same
  // label in its own header above the parchment instead.
  showLabel?: string;
  allowPeekHint?: boolean;
  // SRS review only (see FirstLetterTypeRep.tsx's own `moveAutoCompleteToVerseView`) — the
  // Auto-complete button moves up beside the View First Letters/View Verse pair instead of
  // rendering here.
  hideAutoComplete?: boolean;
}

// The letter-input keyboard + reference-digit entry + mistake hint + auto-complete row shared
// by every FirstLetterTypeRep.tsx render path — split out purely to keep that file under this
// codebase's 200-line cap.
export function FirstLetterTypingControls({ typing, showLabel, allowPeekHint, hideAutoComplete }: FirstLetterTypingControlsProps) {
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
        <div className="flex w-full flex-col items-center gap-2">
          {/* Visually hidden, not removed — the on-screen keyboard below is the one visible way
              to type now (no more redundant box to tap into first), but a real physical
              keyboard and screen readers still need a focusable text input to type into. */}
          <input
            value={typing.letterInput}
            onChange={(event) => typing.handleLetterChange(event.target.value)}
            maxLength={1}
            autoFocus
            aria-label="Type the first letter of the next word"
            className="sr-only"
          />
          {allowPeekHint && !typing.showError && (
            <button type="button" onClick={typing.peekHint} className="text-xs font-medium text-ink-muted hover:text-brand-600 hover:underline">
              Peek hint
            </button>
          )}
          <OnScreenKeyboard onKey={typing.handleLetterChange} />
        </div>
      )}
      {/* A genuine mistake never reveals the letter — just the generic notice, so it costs a
          real retry rather than handing over the answer. "Peek Hint" is the one deliberate
          exception (see typing.wrongLetterExpected's own doc comment): tapping it still shows
          the letter, since the reader asked for it outright rather than getting it wrong. */}
      {!typing.referenceMatch && typing.showError && (
        <p className="text-sm font-medium text-heart-600">
          {typing.wrongLetterExpected ? `Not quite — the next word starts with "${typing.wrongLetterExpected}".` : "Not quite — try again."}
        </p>
      )}
      {!hideAutoComplete && <AutoCompleteButton onClick={typing.reportComplete} />}
    </>
  );
}

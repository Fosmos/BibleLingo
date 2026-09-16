"use client";

interface OnScreenKeyboardProps {
  // Fires once per letter tapped — the caller treats it exactly like a keystroke from a real
  // keyboard (see FirstLetterTypingControls.tsx/ReviewChain.tsx/WordTypeEntry.tsx, all of which
  // already have a handleLetterChange-shaped function to hand this to).
  onKey: (letter: string) => void;
  // Full-word entry only (WordTypeEntry.tsx's own "fullWord" mode) — undefined hides both keys
  // below the letter rows, since a single-letter drill has nothing to backspace or submit.
  onBackspace?: () => void;
  onSubmit?: () => void;
  disabled?: boolean;
}

// Same physical row-by-row shape as a real QWERTY keyboard (just letters — every drill this
// serves only ever needs a-z), stretched to the FULL width of the screen with large touch
// targets — this is now the one and only way a reader types a letter (see
// FirstLetterTypingControls.tsx/ReviewChain.tsx/WordTypeEntry.tsx, which all still keep a
// visually-hidden `sr-only` `<input>` alongside this purely for a real physical keyboard or a
// screen reader — never a visible box the reader has to tap into first). Sits in every
// keyboard-driven drill's own LessonControlBar; tapping a key here calls the exact same handler
// a real keystroke would.
const KEYBOARD_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

const KEY_CLASS =
  "flex h-14 flex-1 items-center justify-center rounded-lg bg-mist text-xl font-semibold uppercase text-ink shadow-sm transition active:scale-95 active:bg-brand-100 disabled:opacity-40 dark:bg-zinc-800 dark:text-zinc-100 dark:active:bg-zinc-700";

export function OnScreenKeyboard({ onKey, onBackspace, onSubmit, disabled }: OnScreenKeyboardProps) {
  return (
    <div className="flex w-full flex-col items-center gap-2">
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        // gap-1 (not the row-group's own gap-2) — a narrower gap between keys hands that
        // saved space straight to each key's own flex-1 width instead, more tappable room
        // being the actual point of a key this size.
        <div key={rowIndex} className="flex w-full justify-center gap-1">
          {row.split("").map((letter) => (
            <button key={letter} type="button" disabled={disabled} onClick={() => onKey(letter)} aria-label={letter} className={KEY_CLASS}>
              {letter}
            </button>
          ))}
        </div>
      ))}
      {(onBackspace || onSubmit) && (
        <div className="flex w-full justify-center gap-1">
          {onBackspace && (
            <button type="button" disabled={disabled} onClick={onBackspace} aria-label="Backspace" className={`${KEY_CLASS} flex-[1.5]`}>
              ⌫
            </button>
          )}
          {onSubmit && (
            <button
              type="button"
              disabled={disabled}
              onClick={onSubmit}
              aria-label="Submit word"
              className="flex h-14 flex-[3] items-center justify-center rounded-lg bg-brand-500 text-base font-semibold text-white shadow-sm transition active:scale-95 active:bg-brand-600 disabled:opacity-40"
            >
              Space / Enter
            </button>
          )}
        </div>
      )}
    </div>
  );
}

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

// Same physical row-by-row shape as a real QWERTY keyboard, stretched to the FULL width of the screen with large touch
// targets — this is now the one and only way a reader types a letter (see
// FirstLetterTypingControls.tsx/ReviewChain.tsx/WordTypeEntry.tsx, which all still keep a
// visually-hidden `sr-only` `<input>` alongside this purely for a real physical keyboard or a
// screen reader — never a visible box the reader has to tap into first). Sits in every
// keyboard-driven drill's own LessonControlBar; tapping a key here calls the exact same handler
// a real keystroke would.
// A number row sits permanently on top (a verse reference's numbers, a numbered book, a digit in
// the text) — its keys reach `onKey` the same way a letter does.
const KEYBOARD_ROWS = ["1234567890", "qwertyuiop", "asdfghjkl", "zxcvbnm"];

// Inside the Mind Map lesson sheet's drill zone (LessonBottomSheet.tsx tags it
// `lesson-sheet-controls`) the keys are one fixed, larger size (48px tall, 22px letters) —
// the keyboard never stretches or squashes with the zone, it just docks at its bottom.
// The Organic restyle's keys: soft sand fills, 12px corners, bold 18px letters, no shadow. On the
// lesson page (PathLessonPage.tsx, `lesson-page-tray`) they're 46px tall with 20px letters, rows
// 7px apart and keys 4px apart, big enough to hit without looking twice.
const KEY_CLASS =
  "flex h-[42px] flex-1 items-center justify-center rounded-xl bg-sand-200 text-lg font-bold uppercase text-ink transition active:scale-95 active:bg-brand-200 disabled:opacity-40 dark:bg-zinc-800 dark:text-zinc-100 dark:active:bg-zinc-700 [.lesson-sheet-controls_&]:h-12 [.lesson-sheet-controls_&]:text-[22px] [.lesson-page-tray_&]:!h-[46px] [.lesson-page-tray_&]:!text-xl";

export function OnScreenKeyboard({ onKey, onBackspace, onSubmit, disabled }: OnScreenKeyboardProps) {
  return (
    <div className="flex w-full flex-col items-center gap-[5px] [.lesson-sheet-controls_&]:gap-2 [.lesson-page-tray_&]:!gap-[7px]">
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        // gap-1 (not the row-group's own gap-2) — a narrower gap between keys hands that
        // saved space straight to each key's own flex-1 width instead, more tappable room
        // being the actual point of a key this size.
        <div key={rowIndex} className="flex w-full justify-center gap-[5px] [.lesson-page-tray_&]:gap-1">
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
              className="flex h-[42px] flex-[3] items-center justify-center rounded-xl bg-brand-500 text-base font-semibold text-paper transition active:scale-95 active:bg-brand-600 disabled:opacity-40 [.lesson-sheet-controls_&]:h-12"
            >
              Space / Enter
            </button>
          )}
        </div>
      )}
    </div>
  );
}

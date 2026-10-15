"use client";

interface NumberKeyRowProps {
  onKey: (digit: string) => void;
  disabled?: boolean;
}

const DIGITS = "1234567890".split("");

// A row of number keys that sits on top of OnScreenKeyboard.tsx when a drill needs numbers (a
// verse reference's chapter and verse) — the same key look, in brand tones so it reads as the
// keys to use right now.
export function NumberKeyRow({ onKey, disabled }: NumberKeyRowProps) {
  return (
    <div className="flex w-full justify-center gap-[5px]">
      {DIGITS.map((digit) => (
        <button
          key={digit}
          type="button"
          aria-label={digit}
          disabled={disabled}
          onClick={() => onKey(digit)}
          className="flex h-[42px] flex-1 items-center justify-center rounded-xl bg-brand-100 text-lg font-bold text-brand-900 transition active:scale-95 active:bg-brand-200 disabled:opacity-40 dark:bg-brand-900/40 dark:text-brand-200 [.lesson-sheet-controls_&]:h-12 [.lesson-sheet-controls_&]:text-[22px]"
        >
          {digit}
        </button>
      ))}
    </div>
  );
}

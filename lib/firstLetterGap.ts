// Extra room between first letters wherever a verse shows as first letters only ("J, t s o J
// C,"). A bare letter is far narrower than the word it stands for, so a single ordinary space
// left them crowded together. The gap sits AFTER a letter's own punctuation (so "J," stays
// together) and only on first-letter units — never on the reserved blank space for a word not
// yet reached, which is built from non-breaking spaces a `word-spacing` rule would stretch too.
export const FIRST_LETTER_GAP_CLASS = "mr-[0.35em]";

// The same extra room for a plain run of first-letter TEXT with nothing but letters,
// punctuation and ordinary spaces in it (VerseViewButtons.tsx's first-letters popup), where
// widening each space is the simpler way to get it.
export const FIRST_LETTER_TEXT_SPACING_CLASS = "[word-spacing:0.35em]";

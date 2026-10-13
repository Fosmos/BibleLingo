// The ESV prints a translators' note in square brackets where a passage is disputed — "[Some of
// the earliest manuscripts do not include 16:9–20.]" after Mark 16:8, and the like before John
// 7:53. It isn't Scripture, so it never belongs in a verse's text. Matched narrowly (a bracket
// mentioning manuscripts) so verse markers like "[9]" are left alone. The double brackets the ESV
// sets around the disputed passage itself ("[[" … "]]") go too.
const MANUSCRIPT_NOTE = /\s*\[[^[\]]*manuscripts[^[\]]*\]\s*/gi;

export const hasEditorialNote = (text: string): boolean => /\[[^[\]]*manuscripts[^[\]]*\]|\[\[|\]\]/i.test(text);

export const stripEditorialNotes = (text: string): string => text.replace(MANUSCRIPT_NOTE, " ").replace(/\[\[|\]\]/g, "").replace(/\s+/g, " ").trim();

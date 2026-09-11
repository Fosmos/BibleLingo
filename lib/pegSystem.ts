// The classic Major/peg mnemonic system: each digit maps to a consonant sound. A single
// digit gets a well-known "peg word" built from just that sound (see PEG_DIGITS). A 2-digit
// number's peg word is built the standard way: it starts with the first digit's consonant
// sound and ends with the second digit's, with only vowels (and silent letters) between —
// e.g. 24 = N...R with vowels between = "Noir". See TWO_DIGIT_PEG_WORDS below.
export interface PegDigit {
  consonants: string;
  word: string;
  emoji: string;
}

export const PEG_DIGITS: Record<string, PegDigit> = {
  "0": { consonants: "S/Z", word: "Sauce", emoji: "🍅" },
  "1": { consonants: "T/D", word: "Toes", emoji: "🦶" },
  "2": { consonants: "N", word: "Nun", emoji: "🍤" },
  "3": { consonants: "M", word: "Mom", emoji: "👩" },
  "4": { consonants: "R", word: "Oar", emoji: "🚣" },
  "5": { consonants: "L", word: "Law", emoji: "⚖️" },
  "6": { consonants: "J/SH/CH", word: "Shoe", emoji: "👟" },
  "7": { consonants: "K", word: "Key", emoji: "🔑" },
  "8": { consonants: "F/V", word: "Ivy", emoji: "🌿" },
  "9": { consonants: "P/B", word: "Bee", emoji: "🐝" },
};

export interface PegWord {
  word: string;
  emoji: string;
}

// Every 2-digit combination's peg word starts with the tens digit's consonant sound and
// ends with the ones digit's, vowels only between — the standard Major System construction.
export const TWO_DIGIT_PEG_WORDS: Record<string, PegWord> = {
  "00": { word: "Sauce", emoji: "🍅" },
  "01": { word: "Seed", emoji: "🌱" },
  "02": { word: "Sun", emoji: "🌞" },
  "03": { word: "Seam", emoji: "🧵" },
  "04": { word: "Sore", emoji: "🤕" },
  "05": { word: "Seal", emoji: "🦭" },
  "06": { word: "Sash", emoji: "🎗️" },
  "07": { word: "Sack", emoji: "🎒" },
  "08": { word: "Safe", emoji: "🔒" },
  "09": { word: "Soap", emoji: "🧼" },
  "10": { word: "Toes", emoji: "🦶" },
  "11": { word: "Tot", emoji: "👶" },
  "12": { word: "Tin", emoji: "🥫" },
  "13": { word: "Tomb", emoji: "⚰️" },
  "14": { word: "Tire", emoji: "🛞" },
  "15": { word: "Tail", emoji: "🐾" },
  "16": { word: "Dish", emoji: "🍽️" },
  "17": { word: "Tack", emoji: "📌" },
  "18": { word: "Dove", emoji: "🕊️" },
  "19": { word: "Tub", emoji: "🛁" },
  "20": { word: "Nose", emoji: "👃" },
  "21": { word: "Net", emoji: "🥅" },
  "22": { word: "Noon", emoji: "🕛" },
  "23": { word: "Gnome", emoji: "🧙" },
  "24": { word: "Noir", emoji: "🕵️" },
  "25": { word: "Nail", emoji: "💅" },
  "26": { word: "Nudge", emoji: "👉" },
  "27": { word: "Neck", emoji: "🦒" },
  "28": { word: "Knife", emoji: "🔪" },
  "29": { word: "Nap", emoji: "😴" },
  "30": { word: "Mouse", emoji: "🐭" },
  "31": { word: "Mad", emoji: "😡" },
  "32": { word: "Moon", emoji: "🌙" },
  "33": { word: "Mime", emoji: "🎭" },
  "34": { word: "Mare", emoji: "🐎" },
  "35": { word: "Mail", emoji: "📧" },
  "36": { word: "Match", emoji: "🔥" },
  "37": { word: "Mic", emoji: "🎤" },
  "38": { word: "Muff", emoji: "🧤" },
  "39": { word: "Map", emoji: "🗺️" },
  "40": { word: "Rose", emoji: "🌹" },
  "41": { word: "Rod", emoji: "🎣" },
  "42": { word: "Rain", emoji: "🌧️" },
  "43": { word: "Ram", emoji: "🐏" },
  "44": { word: "Roar", emoji: "🦁" },
  "45": { word: "Roll", emoji: "🥐" },
  "46": { word: "Rich", emoji: "💰" },
  "47": { word: "Rock", emoji: "🪨" },
  "48": { word: "Roof", emoji: "🏠" },
  "49": { word: "Rope", emoji: "🪢" },
  "50": { word: "Lace", emoji: "🎀" },
  "51": { word: "Light", emoji: "💡" },
  "52": { word: "Lion", emoji: "🦁" },
  "53": { word: "Lime", emoji: "🍋" },
  "54": { word: "Lure", emoji: "🎣" },
  "55": { word: "Lily", emoji: "🌸" },
  "56": { word: "Leech", emoji: "🪱" },
  "57": { word: "Log", emoji: "🪵" },
  "58": { word: "Leaf", emoji: "🍃" },
  "59": { word: "Lip", emoji: "👄" },
  "60": { word: "Cheese", emoji: "🧀" },
  "61": { word: "Chat", emoji: "💬" },
  "62": { word: "Shine", emoji: "✨" },
  "63": { word: "Jam", emoji: "🍓" },
  "64": { word: "Shore", emoji: "🏖️" },
  "65": { word: "Jail", emoji: "⛓️" },
  "66": { word: "Judge", emoji: "👨‍⚖️" },
  "67": { word: "Shake", emoji: "🥤" },
  "68": { word: "Chef", emoji: "👨‍🍳" },
  "69": { word: "Ship", emoji: "🚢" },
  "70": { word: "Keys", emoji: "🔑" },
  "71": { word: "Kite", emoji: "🪁" },
  "72": { word: "Coin", emoji: "🪙" },
  "73": { word: "Comb", emoji: "🪮" },
  "74": { word: "Car", emoji: "🚗" },
  "75": { word: "Coil", emoji: "🌀" },
  "76": { word: "Cage", emoji: "🐦‍⬛" },
  "77": { word: "Cake", emoji: "🎂" },
  "78": { word: "Cave", emoji: "🕳️" },
  "79": { word: "Cup", emoji: "☕" },
  "80": { word: "Face", emoji: "😀" },
  "81": { word: "Foot", emoji: "🦶" },
  "82": { word: "Fan", emoji: "🌀" },
  "83": { word: "Foam", emoji: "🫧" },
  "84": { word: "Fur", emoji: "🐻" },
  "85": { word: "File", emoji: "📁" },
  "86": { word: "Fish", emoji: "🐟" },
  "87": { word: "Fog", emoji: "🌫️" },
  "88": { word: "Fife", emoji: "🎼" },
  "89": { word: "Fob", emoji: "🔑" },
  "90": { word: "Peas", emoji: "🫛" },
  "91": { word: "Pot", emoji: "🍯" },
  "92": { word: "Pen", emoji: "🖊️" },
  "93": { word: "Palm", emoji: "🌴" },
  "94": { word: "Pear", emoji: "🍐" },
  "95": { word: "Pail", emoji: "🪣" },
  "96": { word: "Peach", emoji: "🍑" },
  "97": { word: "Pack", emoji: "🎒" },
  "98": { word: "Puff", emoji: "💨" },
  "99": { word: "Pipe", emoji: "🪈" },
};

// The zero-padded 2-digit key TWO_DIGIT_PEG_WORDS (and UserProgress.pegMasterList — see
// resolvePegWord below) are keyed by — verse 1 -> "01", verse 24 -> "24", verse 100+ wraps to
// its own last two digits (a number that high is rare, and encoding every digit into one real
// word stops being practical).
export function pegMasterListKey(n: number): string {
  return String(Math.abs(Math.trunc(n)) % 100).padStart(2, "0");
}

// The full peg word (not just the emoji) for a verse number. A single digit still displays as
// itself (e.g. verse 1 stays "1"), but is registered in the 2-digit table zero-padded (verse 1
// -> "01" -> "Seed"), not the bare single-consonant table (which would give "Toes") — the
// 2-digit word is the more distinctive, less-collision-prone mnemonic even for small numbers.
export function pegWordFor(n: number): PegWord {
  const lastTwo = pegMasterListKey(n);
  const digit = PEG_DIGITS[String(Math.abs(Math.trunc(n)) % 10)];
  return TWO_DIGIT_PEG_WORDS[lastTwo] ?? { word: digit.word, emoji: digit.emoji };
}

export function suggestPegEmoji(n: number): string {
  return pegWordFor(n).emoji;
}

// Resolves a number's peg word using the reader's own Master Peg List override (see
// UserProgress.pegMasterList, app/profile/peg-list/page.tsx, and PegTagField.tsx — both write
// to this same map, so editing a peg tag anywhere in a path view changes the master entry for
// that number too) when one exists, falling back to this file's own recommendation otherwise.
// The emoji is always the recommendation's own — decorative only, never overridden.
export function resolvePegWord(n: number, masterList: Record<string, string>): PegWord {
  const recommended = pegWordFor(n);
  const override = masterList[pegMasterListKey(n)];
  return override ? { word: override, emoji: recommended.emoji } : recommended;
}

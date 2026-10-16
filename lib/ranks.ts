// Ranks earned by verses memorized — roles in a plain order of standing, each above the last and no
// two the same: hearing and learning (Seeker → Scribe), teaching (Teacher, Master), shepherding and
// leading (Shepherd → Judge), wisdom and prophecy (Sage, Prophet), sending and founding (Evangelist
// → Patriarch), and the highest honours (Friend of God → the whole counsel of God). A rank sits at every one of the Memorized tab's milestones (lib/
// memorizedLibrary.ts's MILESTONES — the "major" ones) and one more between each pair. Each comes
// with a line of Scripture (KJV) that names it.

export interface Rank {
  // Verses memorized to reach it.
  min: number;
  title: string;
  // A short KJV line, and where it's from.
  verse: string;
  reference: string;
  // At one of the Memorized tab's milestones.
  major: boolean;
}

export const RANKS: Rank[] = [
  { min: 0, title: "Seeker", verse: "Seek, and ye shall find.", reference: "Matthew 7:7", major: false },
  { min: 1, title: "Hearer", verse: "Faith cometh by hearing, and hearing by the word of God.", reference: "Romans 10:17", major: false },
  { min: 5, title: "Learner", verse: "Take my yoke upon you, and learn of me.", reference: "Matthew 11:29", major: false },
  { min: 10, title: "Disciple", verse: "If ye continue in my word, then are ye my disciples indeed.", reference: "John 8:31", major: true },
  { min: 17, title: "Student", verse: "Study to shew thyself approved unto God.", reference: "2 Timothy 2:15", major: false },
  { min: 25, title: "Scholar", verse: "God gave them knowledge and skill in all learning and wisdom.", reference: "Daniel 1:17", major: true },
  { min: 35, title: "Scribe", verse: "He was a ready scribe in the law of Moses.", reference: "Ezra 7:6", major: false },
  { min: 50, title: "Teacher", verse: "Ezra had prepared his heart to seek the law of the LORD… and to teach.", reference: "Ezra 7:10", major: true },
  { min: 75, title: "Master", verse: "The words of the wise are as goads, and as nails fastened by the masters of assemblies.", reference: "Ecclesiastes 12:11", major: false },
  { min: 100, title: "Shepherd", verse: "Pastors according to mine heart, which shall feed you with knowledge and understanding.", reference: "Jeremiah 3:15", major: true },
  { min: 175, title: "Watchman", verse: "I have made thee a watchman… hear the word at my mouth.", reference: "Ezekiel 3:17", major: false },
  { min: 250, title: "Elder", verse: "The elders that rule well… who labour in the word and doctrine.", reference: "1 Timothy 5:17", major: true },
  { min: 375, title: "Priest", verse: "The priest's lips should keep knowledge, and they should seek the law at his mouth.", reference: "Malachi 2:7", major: false },
  { min: 500, title: "Judge", verse: "Ye judge not for man, but for the LORD.", reference: "2 Chronicles 19:6", major: true },
  { min: 750, title: "Sage", verse: "Because the preacher was wise, he still taught the people knowledge.", reference: "Ecclesiastes 12:9", major: false },
  { min: 1000, title: "Prophet", verse: "Behold, I have put my words in thy mouth.", reference: "Jeremiah 1:9", major: true },
  { min: 1750, title: "Evangelist", verse: "Do the work of an evangelist, make full proof of thy ministry.", reference: "2 Timothy 4:5", major: false },
  { min: 2500, title: "Apostle", verse: "We will give ourselves continually to prayer, and to the ministry of the word.", reference: "Acts 6:4", major: true },
  { min: 3750, title: "Pillar", verse: "James, Cephas, and John, who seemed to be pillars.", reference: "Galatians 2:9", major: false },
  { min: 5000, title: "Patriarch", verse: "Consider how great this man was, unto whom even the patriarch Abraham gave the tenth.", reference: "Hebrews 7:4", major: true },
  { min: 7500, title: "Friend of God", verse: "He was called the Friend of God.", reference: "James 2:23", major: false },
  { min: 10000, title: "Greatly Beloved", verse: "O Daniel, a man greatly beloved, understand the words that I speak unto thee.", reference: "Daniel 10:11", major: true },
  { min: 20000, title: "Living Epistle", verse: "Ye are our epistle written in our hearts.", reference: "2 Corinthians 3:2", major: false },
  { min: 31102, title: "The Whole Counsel", verse: "I have not shunned to declare unto you all the counsel of God.", reference: "Acts 20:27", major: true },
];

// The ladder in six tiers of four, each a step up in colour (RankBadge.tsx) — so a higher rank
// always looks it.
export const RANK_TIER_SIZE = 4;
export const rankTier = (index: number): number => Math.floor(index / RANK_TIER_SIZE);

export interface RankStanding {
  index: number;
  rank: Rank;
  // The next rank up, verses still to go, and how far along toward it (0–100) — none at the top.
  next?: Rank;
  toNext: number;
  pct: number;
}

// Where `verses` memorized stands on the ladder.
export function rankStanding(verses: number): RankStanding {
  let index = 0;
  while (index + 1 < RANKS.length && verses >= RANKS[index + 1].min) index++;
  const rank = RANKS[index];
  const next = RANKS[index + 1];
  if (!next) return { index, rank, toNext: 0, pct: 100 };
  return { index, rank, next, toNext: next.min - verses, pct: Math.round(((verses - rank.min) / (next.min - rank.min)) * 100) };
}

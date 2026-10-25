import { pictureById } from "@/lib/verseImages";

interface VersePictureTileProps {
  // The verse's picture (lib/verseImages.ts) and number.
  pictureId: string;
  verseNumber: number;
  // Learned — in sage; not yet — faded sand.
  learned: boolean;
  // Being edited (ReaderPassagePictures.tsx) — ringed.
  selected?: boolean;
}

// A verse's picture as a small tile — its icon over its verse number, set quietly in the tile's own
// colour — the same everywhere a verse's picture shows (BookStructureScreen.tsx, the reader's
// passage headings, the lesson's top bar), so the picture and its number are learned together.
export function VersePictureTile({ pictureId, verseNumber, learned, selected = false }: VersePictureTileProps) {
  const Icon = pictureById(pictureId)?.Icon;
  return (
    <span
      className={`flex h-[38px] w-[34px] flex-col items-center justify-center gap-px rounded-[9px] ${
        learned ? "bg-sage-500 text-white shadow-[0_2px_0_#56633F]" : "bg-sand-200 text-sand-500 shadow-[0_2px_0_#DCD3C4] dark:bg-zinc-800 dark:text-zinc-500 dark:shadow-none"
      } ${selected ? "ring-2 ring-brand-500 ring-offset-2 ring-offset-paper dark:ring-offset-zinc-950" : ""}`}
    >
      {Icon && <Icon size={16} strokeWidth={2.4} />}
      <span className="text-[9px] font-extrabold leading-none opacity-70">{verseNumber}</span>
    </span>
  );
}

"use client";

import { useEffect, useRef } from "react";
import type { VerseSegment } from "@/types";
import { useVersePicture } from "@/lib/useVersePicture";
import { pictureById } from "@/lib/verseImages";

interface VerseIconProps {
  verse: VerseSegment;
}

function VerseIcon({ verse }: VerseIconProps) {
  const Icon = pictureById(useVersePicture(verse.book, verse.chapter, verse.verseNumber) ?? "")?.Icon;
  return Icon ? (
    <span data-verse-id={verse.id}>
      <Icon size={140} color="#ffe8b8" strokeWidth={1.75} />
    </span>
  ) : null;
}

interface Palace3DVerseIconsProps {
  verses: VerseSegment[];
  // Each verse's picture, as an image the 3D scene can draw.
  onPicture: (verseId: string, url: string) => void;
}

// Draws the verses' pictures out of sight and passes them to the scene as images, so a verse shows the
// same picture in 3D as everywhere else.
export function Palace3DVerseIcons({ verses, onPicture }: Palace3DVerseIconsProps) {
  const holder = useRef<HTMLDivElement>(null);
  useEffect(() => {
    holder.current?.querySelectorAll<HTMLElement>("[data-verse-id]").forEach((node) => {
      const svg = node.querySelector("svg");
      if (svg && node.dataset.verseId) onPicture(node.dataset.verseId, `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`);
    });
  });
  return (
    <div ref={holder} aria-hidden="true" className="hidden">
      {verses.map((verse) => (
        <VerseIcon key={verse.id} verse={verse} />
      ))}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { motion, Reorder } from "framer-motion";
import type { CustomClauseRole, VerseSegment } from "@/types";
import { tokenizeVerseWords } from "@/lib/verseWords";
import { TAP_SCALE } from "@/lib/motionTokens";
import type { WordAnnotationMap } from "@/lib/verseHighlights";
import { useProgressStore } from "@/store/useProgressStore";
import { ClauseCard, type ClauseBlock } from "@/components/drills/ClauseCard";
import { ClauseRolePalette } from "@/components/drills/ClauseRolePalette";
import { AnnotatedVerseWordRange } from "@/components/drills/AnnotatedVerseWordRange";
import { AutoCompleteButton } from "@/components/ui/AutoCompleteButton";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";
import type { ChapterReadingLayout } from "@/lib/useChapterReadingLayout";
import { LessonWholeDayPageCard } from "@/components/gamification/LessonWholeDayPageCard";
import { LessonControlBar } from "@/components/gamification/LessonControlBar";

interface VerseOrientationRepProps {
  // The whole day's own joined synthetic segment (see LearnSection.tsx's `wholeDay`) — clause
  // splitting/reordering math (breakAfter, blocks, annotations) all stays keyed to this
  // COMBINED word-index space, since a clause can cross a real verse boundary. `verses`/
  // `verseOffsets` below are only for RENDERING each real verse on its own real page position.
  verse: VerseSegment;
  verseMarkers: Record<number, number>;
  annotations: WordAnnotationMap;
  onAnnotationsChange: (updater: (prev: WordAnnotationMap) => WordAnnotationMap) => void;
  onComplete: () => void;
  // Today's own real verses (see LearnSection.tsx's `realVerses`) plus each one's own word
  // offset into `annotations`' whole-day indexing (see LearnSection.tsx's `verseOffsets`).
  verses: VerseSegment[];
  verseOffsets: number[];
  layout: ChapterReadingLayout;
}

// A stable reference for the "no roles defined yet" case — returning a fresh `[] as const`
// from the store selector below would give useSyncExternalStore a new array every render,
// which Zustand reports as an infinite loop (getSnapshot never settling).
const NO_ROLES: CustomClauseRole[] = [];

function buildClauseBlocks(words: string[], breakAfter: Set<number>): ClauseBlock[] {
  const blocks: ClauseBlock[] = [];
  let start = 0;
  words.forEach((_, index) => {
    if (breakAfter.has(index) || index === words.length - 1) {
      blocks.push({ id: `clause-${start}`, startIndex: start, endIndex: index });
      start = index + 1;
    }
  });
  return blocks;
}

// Stage 1: the passage starts as one unified block — the reader divides it into clauses
// themselves (tap a word, inside the block, to split or merge the division right there),
// drags the resulting cards into whatever vertical order helps them think through the
// passage's structure, then assigns each one a role via the shared palette above the list:
// tap a card to select it, tap a color to apply it. There's no preset role catalog — every
// role is named and colored by the reader (see ClauseRolePalette/CustomRoleEditor), scoped
// to this verse's own book and persisted (see useProgressStore's customClauseRoles) so a
// role defined once keeps showing up in every later lesson for the same book. Not graded —
// reordering doesn't change anything downstream (the real page below always shows every real
// verse in its own normal reading order, unaffected by drag reorder), it's just a way to
// actively handle the passage's structure before drilling into it; a role, once assigned,
// DOES show live on the real page (see renderActiveVerse below) via the same word-tint every
// later stage in this lesson reuses.
export function VerseOrientationRep({ verse, verseMarkers, annotations, onAnnotationsChange, onComplete, verses, verseOffsets, layout }: VerseOrientationRepProps) {
  const words = useMemo(() => tokenizeVerseWords(verse.text), [verse.text]);
  const [breakAfter, setBreakAfter] = useState<Set<number>>(() => new Set());
  const [order, setOrder] = useState<string[] | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const bookRoles = useProgressStore((state) => state.customClauseRoles[verse.book] ?? NO_ROLES);
  const upsertCustomClauseRole = useProgressStore((state) => state.upsertCustomClauseRole);

  const blocks = useMemo(() => buildClauseBlocks(words, breakAfter), [words, breakAfter]);
  const blockById = useMemo(() => new Map(blocks.map((block) => [block.id, block])), [blocks]);
  // `order` only tracks the user's own drag-reordering — a merge/split changes the block
  // count, invalidating any prior order, so it resets to the blocks' natural order then too.
  const orderedIds = order && order.length === blocks.length ? order : blocks.map((block) => block.id);
  const orderedBlocks = orderedIds
    .map((id) => blockById.get(id))
    .filter((block): block is ClauseBlock => block !== undefined);
  const selectedBlock = selectedBlockId ? blockById.get(selectedBlockId) : undefined;

  function toggleBreak(index: number) {
    if (index === words.length - 1) return;
    setBreakAfter((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
    setOrder(null);
  }

  function assignRole(role: CustomClauseRole) {
    if (!selectedBlock) return;
    const isSame = annotations[selectedBlock.startIndex]?.role?.id === role.id;
    onAnnotationsChange((prev) => {
      const next = { ...prev };
      for (let i = selectedBlock.startIndex; i <= selectedBlock.endIndex; i++) {
        next[i] = isSame ? {} : { role };
      }
      return next;
    });
  }

  // Persists the role to this book's list (so it's available in every later lesson here —
  // see store/customClauseRoleActions.ts) and re-stamps every clause already using it, so
  // redefining its name/color (via ClauseRolePalette's "Edit") doesn't leave a stale copy
  // behind on words annotated before the edit — each annotation holds its own snapshot of
  // the role, not just a lookup key.
  function saveRole(role: CustomClauseRole) {
    upsertCustomClauseRole(verse.book, role);
    onAnnotationsChange((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        const index = Number(key);
        if (next[index]?.role?.id === role.id) next[index] = { role };
      }
      return next;
    });
  }

  const canContinue = blocks.every((block) => annotations[block.startIndex]?.role !== undefined);

  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-brand-500">
        Understand <InfoTip text={INFO_TIPS.verseOrientationRep} />
      </p>
      <LessonWholeDayPageCard
        layout={layout}
        verses={verses}
        renderActiveVerse={(realVerse, verseIndex, range) => (
          <AnnotatedVerseWordRange verse={realVerse} range={range} wordAnnotations={annotations} verseOffset={verseOffsets[verseIndex] ?? 0} />
        )}
      />

      <LessonControlBar dockRef={layout.dockRef} verseText={verses.map((v) => v.text).join(" ")}>
        <p className="text-center text-xs text-ink-muted">Tap a word to split or merge clauses. Drag a card to reorder it, then give it a role.</p>
        <Reorder.Group axis="y" values={orderedIds} onReorder={setOrder} className="flex w-full flex-col gap-2">
          {orderedBlocks.map((block) => (
            <ClauseCard
              key={block.id}
              block={block}
              words={words}
              verseMarkers={verseMarkers}
              verseLabel={block.startIndex === 0 ? { chapter: verse.chapter, verseNumber: verse.verseNumber } : undefined}
              annotation={annotations[block.startIndex]}
              isSelected={block.id === selectedBlockId}
              onToggleBreak={toggleBreak}
              onSelect={() => setSelectedBlockId(block.id)}
              onMergeUp={block.startIndex > 0 ? () => toggleBreak(block.startIndex - 1) : undefined}
            />
          ))}
        </Reorder.Group>
        <ClauseRolePalette
          roles={bookRoles}
          activeRoleId={selectedBlock ? annotations[selectedBlock.startIndex]?.role?.id : undefined}
          disabled={!selectedBlock}
          onSelectRole={assignRole}
          onSaveRole={saveRole}
        />
        <motion.button
          type="button"
          whileTap={TAP_SCALE}
          disabled={!canContinue}
          onClick={onComplete}
          className="rounded-full bg-brand-500 px-6 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Continue
        </motion.button>
        <AutoCompleteButton onClick={onComplete} />
      </LessonControlBar>
    </div>
  );
}

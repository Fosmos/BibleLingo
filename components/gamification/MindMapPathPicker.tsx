"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useProgressStore } from "@/store/useProgressStore";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";
import { useOpenPath } from "@/lib/useOpenPath";
import type { PathTarget } from "@/lib/mindMapPathTarget";
import { useMindMapData } from "@/lib/useMindMapData";
import { MindMapScreen } from "@/components/gamification/MindMapScreen";
import { MindMapPathTab } from "@/components/gamification/MindMapPathTab";
import { MindMapPathSetup } from "@/components/gamification/MindMapPathSetup";
import { LessonBottomSheet } from "@/components/gamification/LessonBottomSheet";
import { MindMapSheetBreadcrumb } from "@/components/gamification/MindMapSheetBreadcrumb";
import { MindMapVerseTargetPreview } from "@/components/gamification/MindMapVerseTargetPreview";
import { BIBLE_VERSIONS } from "@/lib/bibleVersions";

interface MindMapPathPickerProps {
  // Topics are verses from all over Scripture, so they have no single place on the map — this
  // opens their own list instead (see BeginFlow.tsx).
  onChooseTopic: () => void;
}

// "Choose your path" by navigating the Mind Map: the whole canon to explore, where tapping a
// book, chapter or verse pops up the small path tab (MindMapPathTab.tsx), and its Memorize
// button opens the setup sheet (MindMapPathSetup.tsx) with the map still in view above it.
// Anything inside the current path just opens that path.
export function MindMapPathPicker({ onChooseTopic }: MindMapPathPickerProps) {
  const [target, setTarget] = useState<PathTarget | null>(null);
  const [setupTarget, setSetupTarget] = useState<PathTarget | null>(null);
  // A tapped verse, shown in the sheet with its "Memorize" button before any setup.
  const [versePick, setVersePick] = useState<Extract<PathTarget, { kind: "verse" }> | null>(null);
  const focusVerse = useLessonSessionStore((state) => state.focusVerse);
  const setFocusVerse = useLessonSessionStore((state) => state.setFocusVerse);
  const clearFocusVerse = useLessonSessionStore((state) => state.clearFocusVerse);
  const activePathKey = useProgressStore((state) => state.activePathKey);
  const mapData = useMindMapData(activePathKey);
  const activeVersion = useProgressStore((state) => (state.activePathKey ? state.paths[state.activePathKey]?.version : undefined));
  const openPath = useOpenPath();
  const beginSession = useLessonSessionStore((state) => state.begin);
  const endSession = useLessonSessionStore((state) => state.end);

  // The setup sheet covers the bottom of the screen — hide the tab bar while it's up (see
  // AuthGate.tsx), or it sits over the sheet's own last button.
  const setupOpen = setupTarget !== null || versePick !== null;
  useEffect(() => {
    if (!setupOpen) return;
    beginSession();
    return endSession;
  }, [setupOpen, beginSession, endSession]);

  function choosePath(chosen: PathTarget) {
    if (chosen.kind !== "verse") {
      setTarget(chosen);
      return;
    }
    setTarget(null);
    setVersePick(chosen);
    setFocusVerse({ book: chosen.book, chapter: chosen.chapter, verseNumber: chosen.verse });
  }

  function closeSheet() {
    setVersePick(null);
    setSetupTarget(null);
    clearFocusVerse();
  }

  function openActivePath() {
    if (activePathKey && activeVersion) openPath(activePathKey, activeVersion);
  }

  return (
    <div className="relative">
      {versePick && !setupTarget && (
        <MindMapSheetBreadcrumb book={versePick.book} chapter={versePick.chapter} verseNumber={versePick.verse} onExit={closeSheet} />
      )}
      <MindMapScreen
        data={mapData}
        onSelectChapter={openActivePath}
        onChoosePath={choosePath}
        focusVerse={focusVerse ?? undefined}
        heightClassName={setupOpen ? "h-[100dvh]" : undefined}
      />
      {!setupOpen && (
        <button
          type="button"
          onClick={onChooseTopic}
          className="absolute left-3 top-3 z-20 flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-sm dark:bg-zinc-900 dark:text-zinc-100"
        >
          <Heart size={14} className="text-brand-500" /> Topics
        </button>
      )}
      <MindMapPathTab
        target={setupOpen ? null : target}
        onMemorize={(chosen) => {
          setTarget(null);
          setSetupTarget(chosen);
        }}
        onClose={() => setTarget(null)}
      />
      <LessonBottomSheet open={setupOpen} plain={setupTarget !== null}>
        {setupTarget ? (
          <MindMapPathSetup target={setupTarget} onClose={closeSheet} />
        ) : (
          versePick && (
            <MindMapVerseTargetPreview target={versePick} version={activeVersion ?? BIBLE_VERSIONS[0].code} onMemorize={() => setSetupTarget(versePick)} />
          )
        )}
      </LessonBottomSheet>
    </div>
  );
}

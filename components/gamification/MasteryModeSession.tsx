"use client";

import { useState } from "react";
import { applyReferencePreference } from "@/lib/chapterContent";
import { MASTERY_LEVELS, getMasteryLevel, masteryPassageKey, masteryStickerKey } from "@/lib/masteryMode";
import { resolvePathLabel } from "@/lib/memorizationContent";
import { useProgressStore } from "@/store/useProgressStore";
import { MasteryPassagePicker, type MasteryPassage } from "@/components/gamification/MasteryPassagePicker";
import { MasteryLevelPicker } from "@/components/gamification/MasteryLevelPicker";
import { MasteryChaseRound } from "@/components/drills/MasteryChaseRound";
import { MasteryResultScreen } from "@/components/gamification/MasteryResultScreen";
import { EsvAttribution } from "@/components/ui/EsvAttribution";

type Phase = "passage" | "level" | "playing" | "result";

// Top-level state machine for Mastery Mode: pick a passage, pick a difficulty level, run
// the chase, show the result — then loop back into level/passage picking. Owns all the
// app-level wiring (store persistence, phase sequencing) that MasteryChaseRound itself
// deliberately knows nothing about.
export function MasteryModeSession() {
  const includeVerseReferences = useProgressStore((state) => state.includeVerseReferences);
  const masteryLevels = useProgressStore((state) => state.masteryLevels);
  const recordMasteryLevel = useProgressStore((state) => state.recordMasteryLevel);
  const awardSticker = useProgressStore((state) => state.awardSticker);

  const [phase, setPhase] = useState<Phase>("passage");
  const [passage, setPassage] = useState<MasteryPassage | null>(null);
  const [level, setLevel] = useState(1);
  const [lastCleared, setLastCleared] = useState(false);
  const [lastStickerTitle, setLastStickerTitle] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  function handlePassageSelected(selected: MasteryPassage) {
    setPassage(selected);
    setPhase("level");
  }

  function handleLevelSelected(selectedLevel: number) {
    setLevel(selectedLevel);
    setAttempt((prev) => prev + 1);
    setPhase("playing");
  }

  function handleRoundComplete(cleared: boolean) {
    if (cleared && passage) {
      recordMasteryLevel(masteryPassageKey(passage.key, passage.version), level);
      // Each level earns its own sticker — awardSticker no-ops if this exact level was
      // already cleared before, so replaying a cleared level doesn't duplicate it.
      const stickerKey = masteryStickerKey(passage.key, passage.version, level);
      awardSticker(stickerKey);
      setLastStickerTitle(resolvePathLabel(stickerKey) ?? null);
    }
    setLastCleared(cleared);
    setPhase("result");
  }

  function backToPassagePicker() {
    setPassage(null);
    setPhase("passage");
  }

  if (phase === "passage" || !passage) {
    return <MasteryPassagePicker onSelect={handlePassageSelected} />;
  }

  const key = masteryPassageKey(passage.key, passage.version);
  const bestLevel = masteryLevels[key] ?? 0;

  if (phase === "level") {
    return (
      <MasteryLevelPicker
        passageLabel={passage.label}
        bestLevel={bestLevel}
        onSelectLevel={handleLevelSelected}
        onBack={backToPassagePicker}
      />
    );
  }

  if (phase === "playing") {
    const displayVerses = applyReferencePreference(passage.verses, includeVerseReferences);
    return (
      <div className="flex flex-col gap-4">
        <MasteryChaseRound
          key={attempt}
          label={passage.label}
          verses={displayVerses}
          levelConfig={getMasteryLevel(level)}
          onComplete={handleRoundComplete}
        />
        <EsvAttribution visible={passage.version === "ESV"} />
      </div>
    );
  }

  return (
    <MasteryResultScreen
      cleared={lastCleared}
      level={level}
      passageLabel={passage.label}
      isFinalLevel={level === MASTERY_LEVELS.length}
      stickerTitle={lastCleared ? lastStickerTitle : null}
      onRetry={() => handleLevelSelected(level)}
      onNextLevel={() => handleLevelSelected(level + 1)}
      onChooseLevel={() => setPhase("level")}
      onChoosePassage={backToPassagePicker}
    />
  );
}

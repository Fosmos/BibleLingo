"use client";

import { motion } from "framer-motion";
import type { LocationTagLevel } from "@/types";
import { LOCATION_TAG_LEVEL_LABELS } from "@/lib/locationTags";
import { useProgressStore } from "@/store/useProgressStore";
import { TAP_SCALE } from "@/lib/motionTokens";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";

const LEVELS: LocationTagLevel[] = ["book", "chapter", "pericope", "verse"];
const LEVEL_DESCRIPTIONS: Record<LocationTagLevel, string> = {
  book: "One tag for the whole book — shown on its Mind Map node.",
  chapter: "One tag per chapter — shown on its Mind Map node.",
  pericope: "One tag per section — shown on its Mind Map node.",
  verse: "One tag per verse — shown in the Building path view.",
};

// The four Memory Palace tag-level checkboxes — split out of ProfileAdvancedSettings.tsx purely
// to keep that file under this codebase's 200-line cap, mirroring LearnStageToggles.tsx's own
// role there. A GLOBAL on/off per scope (see UserProgress.locationTagLevels), replacing what
// used to be a one-time picker asked once at path-creation time: turning a scope on immediately
// shows its "add location tag" option everywhere that scope shows up — a small tag badge right
// on the Mind Map for book/chapter/pericope (see MindMapNodeCard.tsx), and, when Building path
// view is also on, a field in the path's own Building view for every scope, verse included (see
// BuildingRoomView.tsx). Any combination, or none.
export function MemoryPalaceTagLevelToggles() {
  const locationTagLevels = useProgressStore((state) => state.locationTagLevels);
  const toggleLocationTagLevel = useProgressStore((state) => state.toggleLocationTagLevel);
  const selected = new Set(locationTagLevels ?? []);

  return (
    <div className="flex items-start gap-1.5">
      <div className="flex-1">
        <p className="text-sm font-medium text-ink dark:text-zinc-200">Memory Palace Tags</p>
        <p className="mb-2 text-xs text-ink-muted">Which scopes get an &quot;add location tag&quot; option</p>
        <div className="flex flex-col gap-2">
          {LEVELS.map((level) => {
            const checked = selected.has(level);
            return (
              <motion.button
                key={level}
                type="button"
                whileTap={TAP_SCALE}
                onClick={() => toggleLocationTagLevel(level)}
                className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-2.5 text-left ${
                  checked ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10" : "border-line bg-white dark:border-zinc-700 dark:bg-zinc-900"
                }`}
              >
                <span className="flex flex-col">
                  <span className="text-sm font-semibold text-ink dark:text-zinc-100">{LOCATION_TAG_LEVEL_LABELS[level]}</span>
                  <span className="text-xs text-ink-muted">{LEVEL_DESCRIPTIONS[level]}</span>
                </span>
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    checked ? "border-brand-500 bg-brand-500" : "border-line dark:border-zinc-600"
                  }`}
                >
                  {checked && <span className="h-2 w-2 rounded-full bg-white" />}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
      <InfoTip text={INFO_TIPS.memoryPalaceTagLevels} />
    </div>
  );
}

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { LocationTagLevel } from "@/types";
import { LOCATION_TAG_LEVEL_LABELS } from "@/lib/locationTags";
import { TAP_SCALE } from "@/lib/motionTokens";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";

interface LocationTagLevelPickerProps {
  onSelect: (levels: LocationTagLevel[], pegSystemEnabled: boolean, sectionEndPegEnabled: boolean) => void;
  onBack: () => void;
  // Seed for the Pegs checkbox — whatever lib/pegSystem.ts's global toggle is set to right now
  // (see Profile) — not reset just because this step is being revisited.
  initialPegSystemEnabled: boolean;
}

const LEVELS: LocationTagLevel[] = ["book", "chapter", "pericope", "verse"];
const LEVEL_DESCRIPTIONS: Record<LocationTagLevel, string> = {
  book: "One tag for the whole book.",
  chapter: "One tag per chapter.",
  pericope: "One tag per section.",
  verse: "One tag per verse — shown as that lesson's own item.",
};

// Book/chapter mode + Building view only — asked once, at path creation. Any combination of
// levels (including none) can be picked; each picked level gets its own "add location tag"
// option wherever that scope shows up in the path view (see BuildingRoomView.tsx and
// LocationTagField.tsx) — plain free text, no suggestions of any kind.
export function LocationTagLevelPicker({ onSelect, onBack, initialPegSystemEnabled }: LocationTagLevelPickerProps) {
  const [selected, setSelected] = useState<Set<LocationTagLevel>>(new Set());
  const [pegSystemEnabled, setPegSystemEnabled] = useState(initialPegSystemEnabled);
  // Create-time-only, per-path — never seeded from anywhere global, unlike pegSystemEnabled
  // above, since it only makes sense alongside this same path's own pericope-level choice.
  const [sectionEndPegEnabled, setSectionEndPegEnabled] = useState(false);

  function toggle(level: LocationTagLevel) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={onBack} className="self-start text-sm font-medium text-brand-600 hover:underline">
        ← Back
      </button>
      <h3 className="flex items-center gap-1.5 text-title">
        Add location tags? <InfoTip text={INFO_TIPS.locationTagLevelPicker} />
      </h3>
      <p className="text-sm text-ink-muted">Pick any combination — or none, if you&apos;d rather skip this.</p>
      <div className="flex flex-col gap-2">
        {LEVELS.map((level) => {
          const checked = selected.has(level);
          return (
            <motion.button
              key={level}
              type="button"
              whileTap={TAP_SCALE}
              onClick={() => toggle(level)}
              className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left ${
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
      <div className="flex items-start gap-1.5">
        <ToggleSwitch
          checked={pegSystemEnabled}
          onChange={setPegSystemEnabled}
          label="Pegs"
          description="Show a Major-System peg word alongside each location tag above — a section's own peg pegs to its first verse"
        />
        <InfoTip text={INFO_TIPS.pegSystemToggle} />
      </div>
      {selected.has("pericope") && pegSystemEnabled && (
        <div className="flex items-start gap-1.5 pl-4">
          <ToggleSwitch
            checked={sectionEndPegEnabled}
            onChange={setSectionEndPegEnabled}
            label="Section end peg"
            description="Also show a second peg word on each section, pegged to the verse it ends with"
          />
          <InfoTip text={INFO_TIPS.sectionEndPegToggle} />
        </div>
      )}
      <motion.button
        type="button"
        whileTap={TAP_SCALE}
        onClick={() => onSelect(Array.from(selected), pegSystemEnabled, sectionEndPegEnabled)}
        className="self-start rounded-full bg-brand-500 px-6 py-2 text-sm font-semibold text-white"
      >
        Continue
      </motion.button>
    </div>
  );
}

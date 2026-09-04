"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { CustomClauseRole } from "@/types";
import { CUSTOM_ROLE_COLOR_OPTIONS } from "@/lib/verseHighlights";
import { TAP_SCALE } from "@/lib/motionTokens";

interface CustomRoleEditorProps {
  initial: CustomClauseRole | null;
  onSave: (role: CustomClauseRole) => void;
  onCancel: () => void;
}

// The inline form behind ClauseRolePalette's "+ Add role" button — lets a reader name their
// own clause role and pick a color from CUSTOM_ROLE_COLOR_OPTIONS (a free hex picker isn't
// possible; Tailwind needs every class name it ships known at build time). `initial` prefills
// this when re-opened to edit a role already defined for this book, and its id (if any) is
// reused so Save replaces that same entry rather than adding a duplicate.
export function CustomRoleEditor({ initial, onSave, onCancel }: CustomRoleEditorProps) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [colorName, setColorName] = useState(
    CUSTOM_ROLE_COLOR_OPTIONS.find((option) => option.swatchClassName === initial?.swatchClassName)?.name ??
      CUSTOM_ROLE_COLOR_OPTIONS[0].name,
  );

  const selectedColor = CUSTOM_ROLE_COLOR_OPTIONS.find((option) => option.name === colorName) ?? CUSTOM_ROLE_COLOR_OPTIONS[0];
  const canSave = label.trim().length > 0;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line bg-mist p-2.5 dark:border-zinc-700 dark:bg-zinc-800/60">
      <input
        type="text"
        value={label}
        onChange={(event) => setLabel(event.target.value)}
        placeholder="Role name, e.g. Warning"
        maxLength={20}
        className="rounded-md border border-line bg-white px-2.5 py-1.5 text-sm text-ink dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      />
      <div className="flex flex-wrap gap-2">
        {CUSTOM_ROLE_COLOR_OPTIONS.map((option) => (
          <button
            key={option.name}
            type="button"
            onClick={() => setColorName(option.name)}
            aria-label={option.name}
            className={`h-6 w-6 shrink-0 rounded-full ${option.swatchClassName} ${
              colorName === option.name ? "ring-2 ring-ink ring-offset-1 dark:ring-offset-zinc-900" : ""
            }`}
          />
        ))}
      </div>
      <div className="flex items-center gap-3">
        <motion.button
          type="button"
          whileTap={canSave ? TAP_SCALE : undefined}
          disabled={!canSave}
          onClick={() =>
            onSave({
              id: initial?.id ?? crypto.randomUUID(),
              label: label.trim(),
              swatchClassName: selectedColor.swatchClassName,
              washClassName: selectedColor.washClassName,
              blockClassName: selectedColor.blockClassName,
            })
          }
          className="rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Save
        </motion.button>
        <button type="button" onClick={onCancel} className="text-xs font-medium text-ink-muted">
          Cancel
        </button>
      </div>
    </div>
  );
}

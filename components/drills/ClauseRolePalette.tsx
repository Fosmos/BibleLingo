"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import type { CustomClauseRole } from "@/types";
import { CustomRoleEditor } from "@/components/drills/CustomRoleEditor";

interface ClauseRolePaletteProps {
  // This book's own roles (see useProgressStore's customClauseRoles) — there is no preset
  // catalog, so this starts empty for a book the reader hasn't tagged clauses in before.
  roles: CustomClauseRole[];
  activeRoleId?: string;
  disabled: boolean;
  onSelectRole: (role: CustomClauseRole) => void;
  onSaveRole: (role: CustomClauseRole) => void;
}

// The shared row of role swatches for the Orientation stage — colors live here once, instead
// of being repeated on every clause card. Tap a clause card to select it (see
// VerseOrientationRep/ClauseCard), then tap a swatch here to apply that role to it; tapping
// the same swatch again undoes it. Disabled (nothing to apply a role to yet) until a card is
// selected. There's no fixed role catalog — "+ Add role" opens CustomRoleEditor to name and
// color a new one (or, via "Edit" under an existing swatch, rename/recolor it); saved roles
// come from and are written back to this book's own list, so they carry over to every later
// lesson in the same book.
export function ClauseRolePalette({ roles, activeRoleId, disabled, onSelectRole, onSaveRole }: ClauseRolePaletteProps) {
  const [editingRole, setEditingRole] = useState<CustomClauseRole | "new" | null>(null);

  function handleSave(role: CustomClauseRole) {
    onSaveRole(role);
    setEditingRole(null);
  }

  return (
    <div
      className={`sticky top-0 z-10 flex flex-col gap-2 rounded-xl border border-line bg-white/95 p-2 backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95 ${
        disabled ? "opacity-40" : ""
      }`}
    >
      <span className="text-xs font-medium text-ink-muted">
        {roles.length === 0 ? "Add a role to start tagging clauses" : disabled ? "Tap a clause, then a color" : "Tap a color to assign"}
      </span>
      <div className="flex flex-wrap gap-x-3 gap-y-1.5">
        {roles.map((role) => (
          <div key={role.id} className="flex flex-col items-center gap-0.5">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelectRole(role)}
              aria-label={role.label}
              className="flex flex-col items-center gap-1 disabled:cursor-not-allowed"
            >
              <span
                className={`h-6 w-6 shrink-0 rounded-full ${role.swatchClassName} ${
                  activeRoleId === role.id ? "ring-2 ring-ink ring-offset-1 dark:ring-offset-zinc-900" : ""
                }`}
              />
              <span className="max-w-[4.5rem] truncate text-[10px] font-medium text-ink-muted">{role.label}</span>
            </button>
            <button
              type="button"
              onClick={() => setEditingRole(role)}
              aria-label={`Edit ${role.label}`}
              className="flex items-center gap-0.5 text-[9px] font-medium text-ink-muted underline"
            >
              <Pencil size={9} /> Edit
            </button>
          </div>
        ))}
        <button type="button" onClick={() => setEditingRole("new")} className="flex flex-col items-center gap-1">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-ink-muted text-ink-muted">
            <Plus size={14} />
          </span>
          <span className="text-[10px] font-medium text-ink-muted">Add role</span>
        </button>
      </div>
      {editingRole !== null && (
        <CustomRoleEditor
          initial={editingRole === "new" ? null : editingRole}
          onSave={handleSave}
          onCancel={() => setEditingRole(null)}
        />
      )}
    </div>
  );
}

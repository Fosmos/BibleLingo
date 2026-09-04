"use client";

interface VersePOAInputProps {
  // Line 1: this verse's own location tag, if one's been added (see lib/locationTags.ts) —
  // display only, undefined when no tag has been set for this verse.
  furnitureLabel?: string;
  // Line 2: the peg system's word suggestion for this verse number (see lib/pegSystem.ts) —
  // editable; undefined when the peg system is off. pegEmoji is decorative only, always the
  // recommendation's own emoji regardless of what the reader types.
  pegWord?: string;
  pegEmoji?: string;
  onPegWordChange?: (value: string) => void;
  who: string;
  action: string;
  additionalInfo: string;
  onWhoChange: (value: string) => void;
  onActionChange: (value: string) => void;
  onAdditionalInfoChange: (value: string) => void;
}

const FIELD_CLASS =
  "w-full rounded-xl border border-line bg-white px-3 py-2 text-base text-ink focus:border-brand-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

// The 5 lines that feed the Visualize stage's generated scene (see SceneGenerator.tsx): the
// verse's own Loci (fixed, read-only context), then Peg — pre-filled with lib/pegSystem.ts's
// recommendation but editable, since the reader may prefer a different word for that number —
// then the reader's own Who, Action, and an optional extra detail (a text prop to hand the
// character, or any other note).
export function VersePOAInput({
  furnitureLabel,
  pegWord,
  pegEmoji,
  onPegWordChange,
  who,
  action,
  additionalInfo,
  onWhoChange,
  onActionChange,
  onAdditionalInfoChange,
}: VersePOAInputProps) {
  return (
    <div className="flex flex-col gap-3">
      {furnitureLabel && (
        <p className="text-sm text-ink-muted">
          <span className="font-semibold uppercase tracking-wide text-ink-soft dark:text-zinc-300">Loci:</span> {furnitureLabel}
        </p>
      )}
      {pegWord !== undefined && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Peg {pegEmoji && <span aria-hidden="true">{pegEmoji}</span>}
          </label>
          <input
            type="text"
            value={pegWord}
            onChange={(event) => onPegWordChange?.(event.target.value)}
            placeholder="e.g. Noir"
            className={FIELD_CLASS}
          />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Who</label>
        <input type="text" value={who} onChange={(event) => onWhoChange(event.target.value)} placeholder="e.g. Peter" className={FIELD_CLASS} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Action</label>
        <input
          type="text"
          value={action}
          onChange={(event) => onActionChange(event.target.value)}
          placeholder="e.g. hurls a net"
          className={FIELD_CLASS}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Additional info (optional)</label>
        <input
          type="text"
          value={additionalInfo}
          onChange={(event) => onAdditionalInfoChange(event.target.value)}
          placeholder="e.g. a golden net"
          className={FIELD_CLASS}
        />
      </div>
    </div>
  );
}

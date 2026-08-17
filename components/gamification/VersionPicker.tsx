"use client";

import { motion } from "framer-motion";
import { BIBLE_VERSIONS } from "@/lib/bibleVersions";
import { TAP_SCALE } from "@/lib/motionTokens";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";

interface VersionPickerProps {
  title: string;
  onSelectVersion: (versionCode: string) => void;
  onBack: () => void;
}

export function VersionPicker({ title, onSelectVersion, onBack }: VersionPickerProps) {
  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className="self-start text-sm font-medium text-brand-600 hover:underline"
      >
        ← Back
      </button>
      <h3 className="text-title">{title}</h3>
      <p className="flex items-center gap-1.5 text-sm text-ink-muted">
        Choose a translation. <InfoTip text={INFO_TIPS.versionPicker} />
      </p>
      <div className="flex flex-col gap-2">
        {BIBLE_VERSIONS.map((version) => (
          <motion.button
            key={version.code}
            type="button"
            whileTap={TAP_SCALE}
            onClick={() => onSelectVersion(version.code)}
            aria-label={version.name}
            className="flex items-center justify-between rounded-lg bg-brand-500 px-4 py-3 text-left text-sm font-medium text-white"
          >
            <span>{version.name}</span>
            <span className="text-xs uppercase tracking-wide">{version.code}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

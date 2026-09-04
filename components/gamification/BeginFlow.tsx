"use client";

import { useState } from "react";
import type { PathKind } from "@/types";
import { PathKindPicker } from "@/components/gamification/PathKindPicker";
import { GuidedPathFlow } from "@/components/gamification/GuidedPathFlow";
import { TopicPicker } from "@/components/gamification/TopicPicker";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";

export function BeginFlow() {
  const [kind, setKind] = useState<PathKind | null>(null);

  return (
    <div className="mx-auto w-full max-w-3xl rounded-2xl border border-line p-6 text-left dark:border-zinc-800">
      <h2 className="mb-1 flex items-center gap-1.5 text-title">
        Choose your path {kind === null && <InfoTip text={INFO_TIPS.pathKindPicker} />}
      </h2>
      <p className="mb-6 text-sm text-ink-muted">How would you like to memorize Scripture?</p>
      {kind === null && <PathKindPicker onSelectKind={setKind} />}
      {(kind === "book" || kind === "chapter" || kind === "verse") && (
        <GuidedPathFlow mode={kind} onBack={() => setKind(null)} />
      )}
      {kind === "topic" && <TopicPicker onBack={() => setKind(null)} />}
    </div>
  );
}

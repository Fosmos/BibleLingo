"use client";

import { useState } from "react";
import { useHideTabBarWhile } from "@/lib/useHideTabBarWhile";
import type { PathChoice } from "@/lib/pathChoice";
import { PathPicker } from "@/components/gamification/PathPicker";
import { PathSetupWizard } from "@/components/gamification/PathSetupWizard";

// Starting a new path (design_handoff_path_picker): the picker, then — for a path not started
// yet — the setup wizard, which ends on the new path's trail. The tab bar steps aside for the
// pinned button.
export function NewPathFlow() {
  useHideTabBarWhile(true);
  const [choice, setChoice] = useState<PathChoice | null>(null);
  if (choice) return <PathSetupWizard key={choice.key} choice={choice} onBack={() => setChoice(null)} />;
  return <PathPicker onStart={setChoice} />;
}

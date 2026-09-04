"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { generateScene, SceneFetchError, type SceneGenerationInputs } from "@/lib/sceneApiClient";
import { TAP_SCALE } from "@/lib/motionTokens";

interface SceneGeneratorProps {
  inputs: SceneGenerationInputs;
  scene: string;
  onSceneChange: (value: string) => void;
}

// The 5th line of Visualize: Gemini turns the reader's Loci/Peg/Who/Action/text-prop into
// one vivid scene sentence (see lib/geminiScene.ts) — shown here as an editable textarea, so
// the reader can tweak the result or just type their own scene by hand if they'd rather not
// call out to Gemini (or if the request fails).
export function SceneGenerator({ inputs, scene, onSceneChange }: SceneGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canGenerate = inputs.character.trim().length > 0 && inputs.action.trim().length > 0;

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const sentence = await generateScene(inputs);
      onSceneChange(sentence);
    } catch (err) {
      setError(err instanceof SceneFetchError ? err.message : "Couldn't generate a scene.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-ink-muted">The scene</label>
        <motion.button
          type="button"
          whileTap={TAP_SCALE}
          disabled={!canGenerate || loading}
          onClick={handleGenerate}
          className="flex items-center gap-1.5 rounded-full border border-brand-500 px-3 py-1 text-xs font-semibold text-brand-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-brand-400"
        >
          {loading ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" /> : <Sparkles size={13} />}
          {scene ? "Regenerate" : "Generate scene"}
        </motion.button>
      </div>
      <textarea
        value={scene}
        onChange={(event) => onSceneChange(event.target.value)}
        placeholder="Generate a scene above, or type your own."
        rows={3}
        className="w-full resize-none rounded-xl border border-line bg-white px-3 py-2 text-base text-ink focus:border-brand-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      />
      {error && <p className="text-xs font-medium text-heart-600">{error}</p>}
    </div>
  );
}

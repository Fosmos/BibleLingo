export class SceneFetchError extends Error {}

export interface SceneGenerationInputs {
  locus: string;
  pegLine: string;
  character: string;
  action: string;
  textProp: string;
}

// Calls our own /api/scene proxy (which holds GEMINI_API_KEY server-side) to turn a verse's
// Loci/Peg/Who/Action/Text-prop into one generated visualization sentence — see
// components/drills/SceneGenerator.tsx.
export async function generateScene(inputs: SceneGenerationInputs): Promise<string> {
  const response = await fetch("/api/scene", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(inputs),
  });
  const json = await response.json();
  if (!response.ok) {
    throw new SceneFetchError(json.error ?? "Couldn't generate a scene.");
  }
  return json.sentence as string;
}

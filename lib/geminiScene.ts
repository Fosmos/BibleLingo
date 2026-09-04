// SERVER ONLY — reads GEMINI_API_KEY. Never import this from a "use client" component;
// only app/api/scene/route.ts (a server-only Route Handler) should call it.

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const GEMINI_MODEL = "gemini-3.6-flash";

export class GeminiSceneError extends Error {}

export interface SceneInputs {
  // This verse's own location tag (see lib/locationTags.ts) — blank when no tag has been set
  // for it (verse/topic paths, Building view off, or the "verse" scope just isn't tagged).
  locus: string;
  // The verse number's peg word (see lib/pegSystem.ts) — starts as its recommendation but
  // the reader may have typed their own instead — formatted as "N - Word"; blank when the
  // peg system is off.
  pegLine: string;
  character: string;
  action: string;
  textProp: string;
}

// The fixed mnemonic-scene-designer prompt this app always sends to Gemini — only the
// Inputs section varies per verse. Kept as one literal template (not composed from smaller
// pieces) so its wording stays exactly reviewable/editable as a whole.
function buildPrompt(inputs: SceneInputs): string {
  return `You are an expert mnemonic scene designer specializing in spatial memory palaces and the Major System. Your task is to take structured input variables and output a single, highly vivid, cinematic, and slightly exaggerated sentence designed to help a user visualize a scripture memory scene.

Follow these strict design rules for the generated sentence:
1. THE LOCUS (Stage): Place the character directly onto or at the provided spatial location (furniture/room stop). Never morph or change the location itself.
2. THE PEG (Verse Number): Incorporate the provided monstrous peg object into the scene as a heavy structural receiver, background element, or environmental target (e.g., being crushed, smashed, or interacted with). Ensure its physical presence is prominent.
3. THE WHO & ACTION (Text): Clearly depict the provided character performing the core action or verb dynamically against or involving the peg object.
4. TEXT PROP (Optional): If an explicit text prop is provided, include it as the tool or object being handled in the action. If left blank, omit it completely and let the peg object take the brunt of the action.
5. TONE & STYLE: Keep it brief (1–2 sentences max), punchy, visually striking, and optimized for instant mental retention. Do not add unnecessary commentary—output only the visualization description.

Inputs provided:
- Locus: ${inputs.locus || "(none)"}
- Verse Number / Peg: ${inputs.pegLine || "(none)"}
- Who (Character): ${inputs.character}
- Action: ${inputs.action}
- Text Prop (Optional): ${inputs.textProp}

Output the visualization sentence now:`;
}

// Calls Gemini's generateContent endpoint with the prompt above — the key goes in a header,
// never a URL/query string, so it never ends up in server access logs.
export async function generateSceneSentence(inputs: SceneInputs, apiKey: string): Promise<string> {
  const response = await fetch(`${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: buildPrompt(inputs) }] }],
      // GEMINI_MODEL reasons before answering, spending a variable (often large) share of
      // maxOutputTokens on invisible "thinking" tokens — a low budget here truncates the
      // actual sentence before it's written. 2048 leaves comfortable headroom for that
      // overhead plus the (genuinely short) 1-2 sentence answer this prompt asks for.
      generationConfig: { temperature: 0.9, maxOutputTokens: 2048 },
    }),
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new GeminiSceneError("Invalid GEMINI_API_KEY.");
    }
    // Gemini's own error body (e.g. "model no longer available", "high demand") is far more
    // actionable than a bare status code — surfaced as-is when present.
    throw new GeminiSceneError(json?.error?.message ?? `Gemini scene generation failed (${response.status}).`);
  }

  const candidate = json?.candidates?.[0];
  const text: string | undefined = candidate?.content?.parts?.find((part: { text?: string }) => part.text)?.text;
  if (!text || !text.trim()) {
    const blockReason = json?.promptFeedback?.blockReason;
    const reason = blockReason ? `blocked (${blockReason})` : candidate?.finishReason ? `finish reason: ${candidate.finishReason}` : "empty response";
    throw new GeminiSceneError(`Gemini returned no usable text (${reason}).`);
  }
  return text.trim();
}

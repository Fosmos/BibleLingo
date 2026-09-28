// Server-side client for Speechify's text-to-speech API (https://docs.speechify.ai) — natural
// narration for the Listen stage, with each word's timing (its "speech marks"), so the stage can
// keep highlighting word by word. Used only by app/api/tts/route.ts; the key never reaches the
// browser.

const SPEECHIFY_URL = "https://api.speechify.ai/v1/audio/speech";
// The voice from Speechify's own quickstart; override with SPEECHIFY_VOICE_ID in .env.local.
const DEFAULT_VOICE_ID = "geffen_32";

// One spoken word: where it sits in the input text (character offsets) and when it's heard (ms).
export interface NarrationMark {
  start: number;
  end: number;
  startMs: number;
  endMs: number;
}

export interface Narration {
  // Base64 MP3.
  audio: string;
  marks: NarrationMark[];
}

export class SpeechifyError extends Error {
  constructor(
    message: string,
    // Upstream HTTP status, when there was one (402/429 once the free quota is used up).
    readonly status?: number,
  ) {
    super(message);
  }
}

interface SpeechifyChunk {
  type?: string;
  start?: number;
  end?: number;
  start_time?: number;
  end_time?: number;
}

interface SpeechifyResponse {
  audio_data?: string;
  speech_marks?: { chunks?: SpeechifyChunk[] };
}

export async function synthesizeNarration(text: string, apiKey: string, voiceId = DEFAULT_VOICE_ID): Promise<Narration> {
  const response = await fetch(SPEECHIFY_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ input: text, voice_id: voiceId, audio_format: "mp3", language: "en-US" }),
  });
  if (!response.ok) {
    throw new SpeechifyError(`Speechify returned ${response.status}.`, response.status);
  }
  const body = (await response.json()) as SpeechifyResponse;
  if (!body.audio_data) throw new SpeechifyError("Speechify returned no audio.");
  const marks = (body.speech_marks?.chunks ?? [])
    .filter((chunk) => (chunk.type ?? "word") === "word")
    .map((chunk) => ({ start: chunk.start ?? 0, end: chunk.end ?? 0, startMs: chunk.start_time ?? 0, endMs: chunk.end_time ?? 0 }));
  return { audio: body.audio_data, marks };
}

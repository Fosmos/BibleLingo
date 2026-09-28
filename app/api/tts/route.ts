import { NextRequest, NextResponse } from "next/server";
import { synthesizeNarration, SpeechifyError } from "@/lib/speechifyTts";

// The longest text narrated in one request — a verse or two, never a whole chapter, so one tap
// can't spend much of the free character quota.
const MAX_CHARACTERS = 1200;

// Natural narration for the Listen stage (see lib/cloudNarration.ts). Any failure — no key
// configured, the free quota used up, a network error — answers with an error status, and the
// client falls back to the browser's own voice.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text || text.length > MAX_CHARACTERS) {
    return NextResponse.json({ error: "Missing or overly long text." }, { status: 400 });
  }

  const apiKey = process.env.SPEECHIFY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "No SPEECHIFY_API_KEY configured — using the browser voice." }, { status: 501 });
  }

  try {
    const narration = await synthesizeNarration(text, apiKey, process.env.SPEECHIFY_VOICE_ID || undefined);
    return NextResponse.json(narration);
  } catch (error) {
    const status = error instanceof SpeechifyError ? error.status : undefined;
    const message = error instanceof Error ? error.message : "Unexpected narration error.";
    return NextResponse.json({ error: message, upstreamStatus: status }, { status: 502 });
  }
}

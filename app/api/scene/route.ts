import { NextRequest, NextResponse } from "next/server";
import { generateSceneSentence, GeminiSceneError, type SceneInputs } from "@/lib/geminiScene";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.character !== "string" || typeof body.action !== "string" || !body.character.trim() || !body.action.trim()) {
    return NextResponse.json({ error: "Missing character or action." }, { status: 400 });
  }

  const inputs: SceneInputs = {
    locus: typeof body.locus === "string" ? body.locus : "",
    pegLine: typeof body.pegLine === "string" ? body.pegLine : "",
    character: body.character,
    action: body.action,
    textProp: typeof body.textProp === "string" ? body.textProp : "",
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "This server has no GEMINI_API_KEY configured. Add one to .env.local (see .env.local.example) and restart the dev server.",
      },
      { status: 502 },
    );
  }

  try {
    const sentence = await generateSceneSentence(inputs, apiKey);
    return NextResponse.json({ sentence });
  } catch (error) {
    if (error instanceof GeminiSceneError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    return NextResponse.json({ error: "Unexpected error generating the scene." }, { status: 502 });
  }
}

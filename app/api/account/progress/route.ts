import { NextRequest, NextResponse } from "next/server";
import type { UserProgress } from "@/types";
import { readServerProgress, writeServerProgress } from "@/lib/serverStore";

// GET ?userId=<id> fetches a signed-in account's server-side progress (null if this account
// has never synced any yet); POST { userId, progress } saves it. There's no session/token
// system in this app (see useAuthStore.ts's own note on that) — userId is an unguessable
// crypto.randomUUID(), which is the same trust level the old localStorage-only design already
// had (anyone with access to the browser/device could see everything anyway).
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "Missing userId query parameter." }, { status: 400 });
  }
  const progress = await readServerProgress(userId);
  return NextResponse.json({ progress });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const userId = typeof body?.userId === "string" ? body.userId : "";
  const progress = body?.progress as UserProgress | undefined;
  if (!userId || !progress) {
    return NextResponse.json({ error: "Missing userId or progress." }, { status: 400 });
  }
  await writeServerProgress(userId, progress);
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { findBook } from "@/lib/bibleBooks";
import { fetchEsvPericopes, EsvApiError } from "@/lib/bibleProviders/esv";

// No `version` param — section headings always come from the ESV regardless of which
// translation the reader has selected (see fetchEsvPericopes's own comment).
export async function GET(request: NextRequest) {
  const bookName = request.nextUrl.searchParams.get("book");
  const chapterParam = request.nextUrl.searchParams.get("chapter");
  const chapter = chapterParam ? Number(chapterParam) : NaN;

  if (!bookName || !Number.isInteger(chapter) || chapter < 1) {
    return NextResponse.json({ error: "Missing or invalid book or chapter query parameter." }, { status: 400 });
  }

  const book = findBook(bookName);
  if (!book) {
    return NextResponse.json({ error: `Unknown book "${bookName}".` }, { status: 400 });
  }

  try {
    const apiKey = process.env.ESV_API_KEY;
    if (!apiKey) {
      throw new EsvApiError(
        "This server has no ESV_API_KEY configured. Sign up free at https://api.esv.org, create an API application, add ESV_API_KEY to .env.local (see .env.local.example), and restart the dev server.",
      );
    }
    const pericopes = await fetchEsvPericopes(book, chapter, apiKey);
    return NextResponse.json({ pericopes });
  } catch (error) {
    if (error instanceof EsvApiError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    return NextResponse.json({ error: "Unexpected error fetching section headings." }, { status: 502 });
  }
}

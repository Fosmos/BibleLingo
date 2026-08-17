import { NextRequest, NextResponse } from "next/server";
import { findBook } from "@/lib/bibleBooks";
import { fetchFromApiBible, ApiBibleError } from "@/lib/bibleProviders/apiBible";
import { fetchFromEsv, EsvApiError } from "@/lib/bibleProviders/esv";

export async function GET(request: NextRequest) {
  const bookName = request.nextUrl.searchParams.get("book");
  const chapterParam = request.nextUrl.searchParams.get("chapter");
  const version = request.nextUrl.searchParams.get("version");
  const chapter = chapterParam ? Number(chapterParam) : NaN;

  if (!bookName || !version || !Number.isInteger(chapter) || chapter < 1) {
    return NextResponse.json({ error: "Missing or invalid book, chapter, or version query parameter." }, { status: 400 });
  }

  const book = findBook(bookName);
  if (!book) {
    return NextResponse.json({ error: `Unknown book "${bookName}".` }, { status: 400 });
  }
    
  try {
    if (version === "ESV") {
     // GET(https://BibleLingo.ca/ESV_API_KEY)
      const apiKey = process.env.ESV_API_KEY;
      if (!apiKey) {
        throw new EsvApiError(
          "This server has no ESV_API_KEY configured. Sign up free at https://api.esv.org, create an API application, add ESV_API_KEY to .env.local (see .env.local.example), and restart the dev server.",
        );
      }
      const verses = await fetchFromEsv(book, chapter, apiKey);
      return NextResponse.json({ verses });
    }

    const apiKey = process.env.BIBLE_API_KEY;
    if (!apiKey) {
      throw new ApiBibleError(
        "This server has no BIBLE_API_KEY configured. Add one to .env.local (see .env.local.example) and restart the dev server.",
      );
    }
    const verses = await fetchFromApiBible(book, chapter, version, apiKey);
    return NextResponse.json({ verses });
  } catch (error) {
    if (error instanceof ApiBibleError || error instanceof EsvApiError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    return NextResponse.json({ error: "Unexpected error fetching chapter content." }, { status: 502 });
  }
}

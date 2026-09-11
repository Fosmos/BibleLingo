import { Header } from "@/components/gamification/Header";
import { RelearnSession } from "@/components/gamification/RelearnSession";
import { PageHeading } from "@/components/ui/PageHeading";

export default async function RelearnPage({ searchParams }: PageProps<"/memorized/relearn">) {
  const { book, chapter, verse, version } = await searchParams;
  const resolvedBook = Array.isArray(book) ? book[0] : book;
  const resolvedChapter = Number(Array.isArray(chapter) ? chapter[0] : chapter);
  const resolvedVerse = Number(Array.isArray(verse) ? verse[0] : verse);
  const resolvedVersion = (Array.isArray(version) ? version[0] : version) ?? "KJV";

  if (!resolvedBook || !Number.isFinite(resolvedChapter) || !Number.isFinite(resolvedVerse)) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
        <PageHeading>Verse not found</PageHeading>
        <p className="text-ink-muted">No verse was specified to relearn.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <RelearnSession book={resolvedBook} chapter={resolvedChapter} verseNumber={resolvedVerse} version={resolvedVersion} />
    </div>
  );
}

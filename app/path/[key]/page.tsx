import { PathOverviewScreen } from "@/components/gamification/PathOverviewScreen";
import { PageHeading } from "@/components/ui/PageHeading";
import { resolvePathLabel } from "@/lib/memorizationContent";

export default async function PathOverviewPage({ params, searchParams }: PageProps<"/path/[key]">) {
  const { key } = await params;
  const { version, versesPerDay, today, priorKnownVerseCount, startLesson } = await searchParams;
  const decodedKey = decodeURIComponent(key);
  const resolvedVersion = (Array.isArray(version) ? version[0] : version) ?? "KJV";
  const todayParam = Array.isArray(today) ? today[0] : today;
  const jumpToToday = todayParam === "1";
  const startLessonParam = Array.isArray(startLesson) ? startLesson[0] : startLesson;
  const versesPerDayParam = Array.isArray(versesPerDay) ? versesPerDay[0] : versesPerDay;
  const resolvedVersesPerDay = versesPerDayParam ? Number(versesPerDayParam) : undefined;
  const priorKnownVerseCountParam = Array.isArray(priorKnownVerseCount) ? priorKnownVerseCount[0] : priorKnownVerseCount;
  const resolvedPriorKnownVerseCount = priorKnownVerseCountParam ? Number(priorKnownVerseCountParam) : undefined;
  const label = resolvePathLabel(decodedKey);

  if (!label) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
        <PageHeading>Path not found</PageHeading>
        <p className="text-ink-muted">No memorization content exists yet for this selection.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <PathOverviewScreen
        pathKey={decodedKey}
        label={label}
        version={resolvedVersion}
        versesPerDay={resolvedVersesPerDay}
        jumpToToday={jumpToToday}
        startLesson={startLessonParam === "1"}
        priorKnownVerseCount={resolvedPriorKnownVerseCount}
      />
    </div>
  );
}

import { PathOverviewScreen } from "@/components/gamification/PathOverviewScreen";
import { PageHeading } from "@/components/ui/PageHeading";
import { resolvePathLabel } from "@/lib/memorizationContent";

type SearchParams = Record<string, string | string[] | undefined>;

interface PathOverviewPageProps {
  pathKey: string;
  searchParams: SearchParams;
  view: "path" | "map" | "palace3d" | "palacewalk" | "verses" | "duo" | "quest";
}

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

// Shared by the Path tab (app/path/[key]) and the Mind Map tab (app/path/[key]/map): reads the
// path's query (version, versesPerDay, priorKnownVerseCount, startLesson) and renders its screen.
// `today=1` (Home's "Go to your path") and `review=` are read on the screens themselves.
export function PathOverviewPage({ pathKey, searchParams, view }: PathOverviewPageProps) {
  const decodedKey = decodeURIComponent(pathKey);
  const versesPerDay = first(searchParams.versesPerDay);
  const priorKnownVerseCount = first(searchParams.priorKnownVerseCount);
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
        version={first(searchParams.version) ?? "KJV"}
        versesPerDay={versesPerDay ? Number(versesPerDay) : undefined}
        startLesson={first(searchParams.startLesson) === "1"}
        priorKnownVerseCount={priorKnownVerseCount ? Number(priorKnownVerseCount) : undefined}
        view={view}
      />
    </div>
  );
}

import { PathOverviewPage } from "@/components/gamification/PathOverviewPage";

// The Path tab's Duolingo-style view: a zigzag of verse nodes in units (DuoPathScreen.tsx).
export default async function DuoPathPage({ params, searchParams }: PageProps<"/path/[key]/duo">) {
  const { key } = await params;
  return <PathOverviewPage pathKey={key} searchParams={await searchParams} view="duo" />;
}

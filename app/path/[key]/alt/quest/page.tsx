import { PathOverviewPage } from "@/components/gamification/PathOverviewPage";

// The Quest map, one of the other path views: the path as a journey across a world map (QuestScreen.tsx).
export default async function QuestTabPage({ params, searchParams }: PageProps<"/path/[key]/alt/quest">) {
  const { key } = await params;
  return <PathOverviewPage pathKey={key} searchParams={await searchParams} view="quest" />;
}

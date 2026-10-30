import { PathOverviewPage } from "@/components/gamification/PathOverviewPage";

// The experimental Quest tab: the path as a journey across a world map (QuestScreen.tsx).
export default async function QuestTabPage({ params, searchParams }: PageProps<"/path/[key]/quest">) {
  const { key } = await params;
  return <PathOverviewPage pathKey={key} searchParams={await searchParams} view="quest" />;
}

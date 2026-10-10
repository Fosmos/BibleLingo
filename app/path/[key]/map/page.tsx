import { PathOverviewPage } from "@/components/gamification/PathOverviewPage";

// The Mind Map tab (experimental): the active path's pan/zoom canon view.
export default async function MindMapTabPage({ params, searchParams }: PageProps<"/path/[key]/map">) {
  const { key } = await params;
  return <PathOverviewPage pathKey={key} searchParams={await searchParams} view="map" />;
}

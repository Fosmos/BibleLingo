import { PathOverviewPage } from "@/components/gamification/PathOverviewPage";

// The Path tab: a book or chapter path's book view (BookStructureScreen.tsx), or a verse or topic path's trail.
export default async function PathTabPage({ params, searchParams }: PageProps<"/path/[key]">) {
  const { key } = await params;
  return <PathOverviewPage pathKey={key} searchParams={await searchParams} view="path" />;
}

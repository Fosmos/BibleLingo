import { PathOverviewPage } from "@/components/gamification/PathOverviewPage";

// The Path tab: a book/chapter/verse path's chapter path view, or a topic path's day list.
export default async function PathTabPage({ params, searchParams }: PageProps<"/path/[key]">) {
  const { key } = await params;
  return <PathOverviewPage pathKey={key} searchParams={await searchParams} view="path" />;
}

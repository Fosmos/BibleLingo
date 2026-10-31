import { redirect } from "next/navigation";

// The old home of the book view, now the Path tab itself (BookStructureScreen.tsx).
export default async function OldPalacePage({ params, searchParams }: PageProps<"/path/[key]/palace">) {
  const { key } = await params;
  const { version } = await searchParams;
  redirect(`/path/${encodeURIComponent(decodeURIComponent(key))}${typeof version === "string" ? `?version=${encodeURIComponent(version)}` : ""}`);
}

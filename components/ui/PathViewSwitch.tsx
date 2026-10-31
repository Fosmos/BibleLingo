"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useProgressStore } from "@/store/useProgressStore";

interface PathViewSwitchProps {
  dark?: boolean;
  className?: string;
}

const VIEWS = {
  path: [{ label: "Main", suffix: "" }, { label: "Verses", suffix: "/alt/verses" }, { label: "Path", suffix: "/alt/duo" }, { label: "Quest", suffix: "/alt/quest" }],
  palace: [{ label: "Walk", suffix: "/palacewalk" }, { label: "3D", suffix: "/palace3d" }],
};

// The Palace tab's two views, and the way between the other path views and back to the main one.
export function PathViewSwitch({ dark = false, className = "" }: PathViewSwitchProps) {
  const pathname = usePathname();
  const key = String(useParams().key ?? "");
  const version = useProgressStore((state) => state.paths[decodeURIComponent(key)]?.version);
  const views = pathname.includes("/palace") ? VIEWS.palace : VIEWS.path;
  const base = `/path/${key}`;
  return (
    <nav aria-label="View" className={`flex w-fit rounded-full p-1 ${dark ? "bg-zinc-950/60 backdrop-blur-md" : "bg-sand-200 dark:bg-zinc-800"} ${className}`}>
      {views.map(({ label, suffix }) => {
        const active = pathname === `${base}${suffix}` || decodeURI(pathname) === decodeURI(`${base}${suffix}`);
        const on = dark ? "bg-white text-zinc-950" : "bg-white text-ink shadow-sm dark:bg-zinc-700 dark:text-zinc-100";
        const off = dark ? "text-zinc-200" : "text-ink-muted";
        return (
          <Link key={label} href={`${base}${suffix}${version ? `?version=${encodeURIComponent(version)}` : ""}`} aria-current={active ? "page" : undefined} className={`rounded-full px-2.5 py-1.5 text-xs font-extrabold ${active ? on : off}`}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

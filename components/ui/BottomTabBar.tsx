"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, Award, User, type LucideIcon } from "lucide-react";
import { useProgressStore } from "@/store/useProgressStore";

interface TabItem {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
}

export function BottomTabBar() {
  const pathname = usePathname();
  const activePathKey = useProgressStore((state) => state.activePathKey);
  const activePlan = useProgressStore((state) => (activePathKey ? state.paths[activePathKey] : undefined));

  // The version query param is what the path overview page treats as the source of truth
  // (see app/path/[key]/page.tsx) — omitting it here would default to KJV and silently
  // overwrite an already-selected translation via PathOverviewScreen's sync effect.
  const pathHref = activePathKey
    ? `/path/${encodeURIComponent(activePathKey)}${activePlan ? `?version=${encodeURIComponent(activePlan.version)}` : ""}`
    : "/begin";

  const items: TabItem[] = [
    { href: "/", label: "Home", icon: Home, isActive: pathname === "/" },
    {
      href: pathHref,
      label: "Path",
      icon: Map,
      isActive: pathname.startsWith("/path") || pathname === "/begin",
    },
    {
      href: "/memorized",
      label: "Memorized",
      icon: Award,
      isActive: pathname.startsWith("/memorized") || pathname.startsWith("/stickers"),
    },
    {
      href: "/profile",
      label: "Profile",
      icon: User,
      isActive: pathname.startsWith("/profile"),
    },
  ];

  return (
    // A floating pill over the page (the Organic restyle), not a full-width bar.
    <nav className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-md rounded-full bg-sand-100 p-1.5 shadow-organic-md dark:bg-zinc-900">
      <ul className="flex items-stretch justify-around">
        {items.map(({ href, label, icon: Icon, isActive }) => (
          <li key={label} className="flex-1">
            <Link
              href={href}
              className={`flex flex-col items-center gap-0.5 rounded-full py-2 text-xs ${
                isActive
                  ? "bg-brand-200 font-bold text-brand-800 dark:bg-zinc-800 dark:text-zinc-100"
                  : "font-semibold text-sand-700 hover:text-ink dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              <Icon size={21} strokeWidth={2.75} />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

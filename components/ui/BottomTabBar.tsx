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
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] dark:border-zinc-800 dark:bg-zinc-950">
      <ul className="flex items-stretch justify-around">
        {items.map(({ href, label, icon: Icon, isActive }) => (
          <li key={label} className="flex-1">
            <Link
              href={href}
              className={`flex flex-col items-center gap-1 py-2.5 text-xs font-medium ${
                isActive ? "text-ink" : "text-ink-muted hover:text-ink-soft dark:hover:text-zinc-300"
              }`}
            >
              <Icon size={22} />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

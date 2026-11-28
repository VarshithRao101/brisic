"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  ["/admin", "Overview"],
  ["/admin/creators", "Creators"],
  ["/admin/playlists", "Playlists"],
  ["/admin/parties", "Parties"],
  ["/admin/content", "Content"],
] as const;

export function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Admin sections" className="no-scrollbar -mx-4 mb-5 mt-3 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      {TABS.map(([href, label]) => {
        const on = href === "/admin" ? path === "/admin" : path.startsWith(href);
        return <Link key={href} href={href} aria-current={on ? "page" : undefined} className={`chip shrink-0 ${on ? "chip-on" : ""}`}>{label}</Link>;
      })}
    </nav>
  );
}

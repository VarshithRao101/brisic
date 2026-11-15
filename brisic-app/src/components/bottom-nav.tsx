import Link from "next/link";

const items = [
  { href: "/", label: "Home", icon: "M3 11.5 12 4l9 7.5M5 10v10h14V10" },
  { href: "/search", label: "Search", icon: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3" },
  { href: "/library", label: "Library", icon: "M4 19V5m5 14V5m6 14 4-14M15 19l4-14" },
  { href: "/profile", label: "Profile", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 20a8 8 0 0 1 16 0" },
];

export function BottomNav({ active = "Home" }: { active?: string }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--border)] bg-[#050a07]/90 backdrop-blur">
      <div className="mx-auto flex max-w-xl items-center justify-around px-2 py-2">
        {items.map((it) => {
          const on = it.label === active;
          return (
            <Link
              key={it.label}
              href={it.href}
              className="flex flex-col items-center gap-1 px-3 py-1 text-[11px]"
              style={{ color: on ? "var(--primary)" : "var(--muted)" }}
            >
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={it.icon} />
              </svg>
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

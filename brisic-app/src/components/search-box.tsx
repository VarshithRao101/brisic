"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

const KEY = "brisic-recent-searches";

export function SearchBox({ initial }: { initial: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  const [recent, setRecent] = useState<string[]>([]);

  // Browser storage is only readable after hydration, so this has to run in an effect.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    try { setRecent(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch {}
  }, []);

  const go = (term: string) => {
    const t = term.trim();
    if (!t) return router.push("/search");
    const next = [t, ...recent.filter((r) => r.toLowerCase() !== t.toLowerCase())].slice(0, 8);
    setRecent(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
    router.push("/search?q=" + encodeURIComponent(t));
  };

  return (
    <div>
      <form role="search" onSubmit={(e) => { e.preventDefault(); go(q); }} className="relative">
        <label className="sr-only" htmlFor="search-input">Search songs, artists and podcasts</label>
        <Icon name="search" size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input id="search-input" className="field !border-primary/70 !pl-12 !pr-12 shadow-[0_0_12px_rgba(var(--primary-rgb),0.15)]" placeholder="Search artists, songs, albums…" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
        {q && (
          <button type="button" aria-label="Clear search" onClick={() => { setQ(""); router.push("/search"); }} className="absolute right-3 top-1/2 -translate-y-1/2 border-0 bg-transparent p-1.5 text-muted">
            <Icon name="x" size={18} />
          </button>
        )}
      </form>
      {!initial && recent.length > 0 && (
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="m-0 text-[15px] font-semibold text-white">Recently searched</h2>
            <button type="button" className="border-0 bg-transparent p-0 text-[13px] text-muted hover:text-ink" onClick={() => { setRecent([]); try { localStorage.removeItem(KEY); } catch {} }}>Clear</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recent.map((r) => (
              <button key={r} type="button" onClick={() => go(r)} className="btn btn-sm font-normal">{r}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

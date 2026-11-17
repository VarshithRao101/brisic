import { getUserId } from "@/lib/session";
import { catalog } from "@/lib/catalog";
import { hashStr } from "@/lib/format";
import { BackButton, StationButton } from "@/components/controls";
import { Icon } from "@/components/icons";
import { PageTitle } from "@/components/ui";

const TINT = ["#2f7a34", "#7a2a8a", "#d6841a", "#1c6be0", "#c0309a", "#1f9a9a", "#c8452f"];

export default async function StationsPage() {
  await getUserId();
  const stations = await catalog.getStations();
  return (
    <>
      <BackButton />
      <PageTitle title="Stations" subtitle="Radio made for you. Tap a station to start listening." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stations.map((s) => (
          <StationButton
            key={s.id}
            stationId={s.id}
            className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left text-white hover:bg-white/[0.08]"
          >
            <span
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
              style={{ background: `linear-gradient(135deg, ${TINT[hashStr(s.id) % TINT.length]}, #0a1410)` }}
            >
              <Icon name="radio" size={24} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">Radio</span>
              <span className="block truncate text-[17px] font-semibold">{s.name}</span>
              <span className="block truncate text-[13px] font-light text-muted">{s.subtitle}</span>
            </span>
            <Icon name="play" size={22} className="shrink-0 text-primary" />
          </StationButton>
        ))}
      </div>
    </>
  );
}

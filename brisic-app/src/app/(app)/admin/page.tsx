import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { storageMode } from "@/lib/storage";
import { youtubeUploadEnabled } from "@/lib/youtube";
import { paystackEnabled, paystackTestMode } from "@/lib/paystack";
import { emailEnabled } from "@/lib/email";
import { socialProviders } from "@/lib/social";
import { fmtCount } from "@/lib/format";

const DAY = 86_400_000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY);

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="panel px-4 py-3">
      <p className="m-0 text-[12.5px] font-light text-muted">{label}</p>
      <p className="m-0 text-[24px] font-bold leading-tight text-white">{value}</p>
      {sub && <p className="m-0 text-[12px] font-light text-ink/70">{sub}</p>}
    </div>
  );
}

export default async function AdminOverview() {
  const week = daysAgo(7);
  const [users, newUsers, artists, podcasters, songs, videos, episodes, playlists, plays7, paid, gifts, premium, rooms] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: week } } }),
    prisma.user.count({ where: { creatorRole: "artist" } }),
    prisma.user.count({ where: { creatorRole: "podcaster" } }),
    prisma.song.count(),
    prisma.video.count(),
    prisma.podcastEpisode.count(),
    prisma.editorialPlaylist.count(),
    prisma.playHistory.count({ where: { playedAt: { gte: week }, trackId: { startsWith: "s-" } } }),
    prisma.payment.aggregate({ where: { status: "success" }, _sum: { amountKobo: true }, _count: true }),
    prisma.gift.aggregate({ where: { artistId: { in: (await prisma.artistProfile.findMany({ select: { id: true } })).map((x) => x.id) } }, _sum: { coins: true }, _count: true }),
    prisma.user.count({ where: { isPremium: true } }),
    prisma.partyRoom.count({ where: { endedAt: null, featureKey: { startsWith: "fx-" } } }),
  ]);

  const storage = storageMode();
  const social = socialProviders();
  const checks: [string, boolean, string][] = [
    ["Admins", true, "You are an admin (ADMIN_EMAILS)."],
    ["Song & audio uploads", storage === "neon", storage === "neon" ? "Neon storage connected." : storage === "local" ? "Saving to this computer (development only)." : "Add the NEON_S3_* keys in Netlify."],
    ["Payments (B-Coins, Premium)", paystackEnabled(), paystackEnabled() ? (paystackTestMode() ? "Paystack connected in TEST mode." : "Paystack connected (live).") : "Add PAYSTACK_SECRET_KEY in Netlify."],
    ["Emails (password reset, verify)", emailEnabled(), emailEnabled() ? "Resend connected." : "Add RESEND_API_KEY and EMAIL_FROM in Netlify."],
    ["Google sign-in", social.google, social.google ? "On." : "Add AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET."],
    ["Facebook sign-in", social.facebook, social.facebook ? "On." : "Add AUTH_FACEBOOK_ID / AUTH_FACEBOOK_SECRET."],
    ["Apple sign-in", social.apple, social.apple ? "On." : "Add AUTH_APPLE_ID / AUTH_APPLE_SECRET."],
    ["YouTube direct upload", youtubeUploadEnabled(), youtubeUploadEnabled() ? "Uploads go to Brisic's channel (unlisted)." : "Optional. Creators paste YouTube links for now."],
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Stat label="Listeners" value={fmtCount(users)} sub={`+${newUsers} this week`} />
        <Stat label="Creators" value={String(artists + podcasters)} sub={`${artists} artists · ${podcasters} podcasters`} />
        <Stat label="Songs" value={fmtCount(songs)} sub={`${fmtCount(plays7)} plays this week`} />
        <Stat label="Videos & episodes" value={fmtCount(videos + episodes)} sub={`${videos} videos · ${episodes} episodes`} />
        <Stat label="Brisic playlists" value={String(playlists)} sub={`${rooms} featured parties`} />
        <Stat label="Coin sales" value={`₦${fmtCount((paid._sum.amountKobo ?? 0) / 100)}`} sub={`${paid._count} payments`} />
        <Stat label="Gifts to artists" value={`${fmtCount(gifts._sum.coins ?? 0)} B`} sub={`${gifts._count} gifts`} />
        <Stat label="Premium" value={String(premium)} sub="members" />
      </div>

      <h2 className="m-0 mb-2 mt-6 text-[17px] font-semibold text-white">Setup</h2>
      <ul className="panel m-0 list-none divide-y divide-white/5 p-1">
        {checks.map(([name, ok, note]) => (
          <li key={name} className="flex items-start gap-3 px-3 py-2.5">
            <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${ok ? "bg-primary text-primary-ink" : "bg-[#ffcf87]/20 text-[#ffcf87]"}`}>{ok ? "✓" : "!"}</span>
            <span className="min-w-0">
              <span className="block text-[14.5px] text-white">{name}</span>
              <span className="block text-[12.5px] font-light text-muted">{note}</span>
            </span>
          </li>
        ))}
      </ul>

      <h2 className="m-0 mb-2 mt-6 text-[17px] font-semibold text-white">Get Brisic ready</h2>
      <ol className="panel m-0 flex flex-col gap-2 p-4 pl-9 text-[14px] text-ink/90">
        <li><Link href="/admin/creators" className="text-primary">Invite your artists and podcasters</Link> (they sign up first).</li>
        <li>Artists upload songs, videos and lives in their Creator Studio; podcasters publish episodes.</li>
        <li><Link href="/admin/playlists" className="text-primary">Make Brisic playlists</Link> from their songs. Each one fills a Home shelf.</li>
        <li><Link href="/admin/parties" className="text-primary">Start featured listening parties</Link> for Home.</li>
      </ol>
    </>
  );
}

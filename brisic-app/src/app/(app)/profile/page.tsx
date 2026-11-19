import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getUserId, requireUser } from "@/lib/session";
import { fmtCoins } from "@/lib/format";
import { SignOutButton } from "@/components/controls";
import { Icon } from "@/components/icons";
import { RowLink } from "@/components/ui";

export default async function ProfilePage() {
  const userId = await getUserId();
  const [user, following, playlists, likes] = await Promise.all([
    requireUser(),
    prisma.follow.count({ where: { userId } }),
    prisma.userPlaylist.count({ where: { userId } }),
    prisma.likedTrack.count({ where: { userId } }),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-col items-center text-center">
        <span className="ring-glow flex h-[112px] w-[112px] items-center justify-center overflow-hidden rounded-full p-[3px]">
          {user.image ? (
            <Image src={user.image} alt="" width={106} height={106} unoptimized={user.image.startsWith("/api/")} className="h-full w-full rounded-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center rounded-full text-[42px] font-semibold text-white" style={{ background: "linear-gradient(#c9803a,#5a2f14)" }}>{user.displayName[0]?.toUpperCase()}</span>
          )}
        </span>
        <h1 className="m-0 mt-3 max-w-full truncate text-[24px] font-semibold text-white">{user.displayName}</h1>
        <p className="m-0 text-[14px] font-light text-muted">@{user.handle}{user.isPremium ? " · Premium" : ""}</p>
        {user.bio && <p className="m-0 mt-2 max-w-md text-[14px] font-light text-ink/90">{user.bio}</p>}
        <Link href="/profile/edit" className="btn btn-sm mt-3 !px-5">Edit Profile</Link>
      </div>

      <div className="panel mt-5 grid grid-cols-3 divide-x divide-line text-center">
        {[
          ["/following", following, "Following"],
          ["/library", playlists, "Playlists"],
          ["/library/liked", likes, "Liked"],
        ].map(([href, n, label]) => (
          <Link key={String(href)} href={String(href)} className="px-2 py-3 hover:bg-white/5">
            <span className="block text-[22px] font-semibold text-white">{n}</span>
            <span className="block text-[12.5px] font-light text-muted">{label}</span>
          </Link>
        ))}
      </div>

      <div className="panel-glow mt-4 flex items-center gap-4 p-4">
        <Image src="/assets/coin.png" alt="" width={48} height={48} className="h-12 w-12 object-contain drop-shadow-[0_0_10px_rgba(242,201,76,0.45)]" />
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[13px] font-light text-ink/80">B-Coins balance</p>
          <p className="m-0 text-[26px] font-semibold text-white">{fmtCoins(user.coins)}</p>
        </div>
        <Link href="/coins" className="btn btn-primary btn-sm">Get Coins</Link>
      </div>

      <h2 className="m-0 mb-2 mt-6 text-[18px] font-semibold text-white">Settings</h2>
      <div className="flex flex-col gap-2">
        {!user.isPremium && (
          <Link href="/premium" className="panel-glow flex items-center gap-3.5 px-3 py-3">
            <Image src="/assets/crown.png" alt="" width={40} height={40} className="h-10 w-10 object-contain" />
            <span className="min-w-0 flex-1">
              <span className="block text-[15.5px] font-medium text-white">Go Premium</span>
              <span className="block text-[13px] font-light text-ink/75">No ads, offline, better sound</span>
            </span>
            <Icon name="chevron" size={18} className="text-primary" />
          </Link>
        )}
        <RowLink href="/settings" icon="settings" title="Player color & Settings" subtitle="Change the player color, home style and playback" />
        <RowLink href="/info/account" icon="user" title="Account" subtitle="Email, password, username" />
        <RowLink href="/notifications" icon="bell" title="Notifications" subtitle="Gifts, releases and updates" />
        <RowLink href="/coins" icon="coin" title="Payments & B-Coins" subtitle="Balance, top-ups and coin history" />
        <RowLink href="/info/privacy" icon="lock" title="Privacy & Security" subtitle="Your data, your control" />
        <RowLink href="/info/help" icon="info" title="Help & Support" subtitle="FAQ and contact us" />
        <RowLink href="/info/about" icon="sparkle" title="About Brisic" subtitle="What Brisic is for" />
        <RowLink href="/download" icon="phone" title="Get the app" subtitle="Install Brisic on your phone" />
      </div>

      <div className="mt-6 flex justify-center"><SignOutButton /></div>
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { fmtCoins } from "@/lib/format";
import { SignOutButton } from "@/components/controls";
import { Icon } from "@/components/icons";
import { RowLink } from "@/components/ui";

export default async function ProfilePage() {
  const user = await requireUser();
  const [following, playlists, likes] = await Promise.all([
    prisma.follow.count({ where: { userId: user.id } }),
    prisma.userPlaylist.count({ where: { userId: user.id } }),
    prisma.likedTrack.count({ where: { userId: user.id } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        {user.image ? (
          <Image src={user.image} alt="" width={104} height={104} className="h-[104px] w-[104px] rounded-full border-2 border-line object-cover" />
        ) : (
          <span className="flex h-[104px] w-[104px] items-center justify-center rounded-full bg-primary text-[42px] font-semibold text-primary-ink">{user.displayName[0]?.toUpperCase()}</span>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="m-0 truncate text-[28px] font-semibold text-white">{user.displayName}</h1>
          <p className="m-0 text-[15px] font-light text-muted">@{user.handle}{user.isPremium ? " · Premium" : ""}</p>
          {user.bio && <p className="m-0 mt-2 text-[14.5px] font-light text-ink/90">{user.bio}</p>}
        </div>
        <Link href="/profile/edit" className="btn btn-sm"><Icon name="pencil" size={16} /> Edit Profile</Link>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        {[
          ["/following", following, "Following"],
          ["/library", playlists, "Playlists"],
          ["/library/liked", likes, "Liked songs"],
        ].map(([href, n, label]) => (
          <Link key={String(href)} href={String(href)} className="panel px-2 py-3 hover:bg-white/5">
            <span className="block text-[22px] font-semibold text-white">{n}</span>
            <span className="block text-[12.5px] font-light text-muted">{label}</span>
          </Link>
        ))}
      </div>

      <div className="panel mt-4 flex items-center gap-4 p-4">
        <Image src="/assets/coin.png" alt="" width={48} height={48} className="h-12 w-12 object-contain" />
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[13px] font-light text-muted">B-Coins balance</p>
          <p className="m-0 text-[24px] font-semibold text-[#f2c94c]">{fmtCoins(user.coins)}</p>
        </div>
        <Link href="/coins" className="btn btn-sm">Get Coins</Link>
      </div>

      {!user.isPremium && (
        <Link href="/premium" className="mt-4 flex items-center gap-4 rounded-[20px] border border-[#6a5a1e] bg-[linear-gradient(135deg,#2a2409,#0b1a11)] p-4">
          <Image src="/assets/crown.png" alt="" width={48} height={48} className="h-12 w-12 object-contain" />
          <span className="min-w-0 flex-1">
            <span className="block text-[17px] font-semibold text-white">Go Premium</span>
            <span className="block text-[13.5px] font-light text-muted">No ads, offline, better sound</span>
          </span>
          <Icon name="chevron" size={18} className="text-muted" />
        </Link>
      )}

      <div className="panel mt-4 p-2">
        <RowLink href="/settings" icon="settings" title="Player color & Settings" subtitle="Change the player color, playback and quality" />
        <RowLink href="/info/account" icon="user" title="Account" subtitle="Email, password, username" />
        <RowLink href="/notifications" icon="bell" title="Notifications" subtitle="Gifts, releases and updates" />
        <RowLink href="/coins" icon="coin" title="Payments & B-Coins" subtitle="Balance and coin history" />
        <RowLink href="/info/privacy" icon="lock" title="Privacy & Security" subtitle="Your data, your control" />
        <RowLink href="/info/help" icon="info" title="Help & Support" subtitle="FAQ and contact us" />
        <RowLink href="/info/about" icon="sparkle" title="About Brisic" subtitle="What Brisic is for" />
        <RowLink href="/download" icon="phone" title="Get the app" subtitle="Install Brisic on your phone" />
      </div>

      <div className="mt-5 flex justify-center"><SignOutButton /></div>
    </div>
  );
}

import { redirect } from "next/navigation";
import Image from "next/image";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/sign-out-button";
import { BottomNav } from "@/components/bottom-nav";

const rows: { title: string; items: string[] }[] = [
  {
    title: "Listen Now",
    items: ["Daily Mix 1", "Afro Heat", "Chill Vibes", "New Releases"],
  },
  {
    title: "Made for you",
    items: ["Focus Flow", "Throwback", "Discover Weekly", "Night Drive"],
  },
  {
    title: "Trending",
    items: ["Top 50 Global", "Viral Hits", "Rising Artists", "Hot Right Now"],
  },
];

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const name = session.user.name?.split(" ")[0] ?? "there";

  return (
    <div className="mx-auto min-h-dvh w-full max-w-xl px-5 pb-24 pt-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/assets/logo-b-plain.png"
            alt="Brisic"
            width={40}
            height={40}
            className="h-9 w-auto"
          />
          <div>
            <p className="text-sm font-light text-[var(--muted)]">Welcome back,</p>
            <h1 className="text-xl font-semibold text-white">{name} 👋</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {session.user.image && (
            <Image
              src={session.user.image}
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 rounded-full border border-[var(--border)]"
            />
          )}
          <SignOutButton />
        </div>
      </header>

      {rows.map((row) => (
        <section key={row.title} className="mt-7">
          <h2 className="mb-3 text-[17px] font-semibold text-white">
            {row.title}
          </h2>
          <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
            {row.items.map((item) => (
              <div
                key={item}
                className="w-[150px] shrink-0"
              >
                <div className="aspect-square w-full rounded-2xl border border-[var(--border)] bg-[linear-gradient(145deg,#12201a,#0b0e0d)]" />
                <p className="mt-2 text-sm font-medium text-[var(--text)]">
                  {item}
                </p>
                <p className="text-xs font-light text-[var(--muted)]">Playlist</p>
              </div>
            ))}
          </div>
        </section>
      ))}

      <p className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--card)]/60 px-4 py-3 text-center text-xs font-light text-[var(--muted)]">
        You&apos;re signed in with Google. Music catalog, search and playback
        connect in the next build step.
      </p>

      <BottomNav active="Home" />
    </div>
  );
}

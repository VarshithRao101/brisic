import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { InstallButton } from "@/components/install-button";

export const metadata = { title: "Get the app — Brisic" };

// Set NEXT_PUBLIC_APK_URL to the hosted .apk file to switch the Android button on.
const APK_URL = process.env.NEXT_PUBLIC_APK_URL;

const PERKS = [
  ["Offline downloads", "Save songs and listen without data."],
  ["Background play", "Keep the music going with the screen off."],
  ["Faster and full screen", "Opens from your home screen like any app."],
] as const;

export default function DownloadPage() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-3xl px-4 py-8 sm:px-6">
      <Link href="/" className="inline-flex items-center gap-1 text-[14px] text-muted hover:text-ink"><Icon name="back" size={18} /> Back to Brisic</Link>

      <div className="mt-6 flex flex-col items-center text-center">
        <Image src="/assets/logo-b-glow.png" alt="" width={456} height={656} priority className="h-28 w-auto" />
        <h1 className="m-0 mt-3 text-[32px] font-semibold leading-tight text-white sm:text-[40px]">Get the Brisic app</h1>
        <p className="m-0 mt-2 max-w-md text-[15.5px] font-light text-muted">Your music, your people, in your pocket.</p>
      </div>

      <ul className="m-0 mt-7 grid list-none gap-3 p-0 sm:grid-cols-3">
        {PERKS.map(([title, body]) => (
          <li key={title} className="panel p-4">
            <p className="m-0 text-[15.5px] font-semibold text-white">{title}</p>
            <p className="m-0 mt-1 text-[13.5px] font-light text-muted">{body}</p>
          </li>
        ))}
      </ul>

      <section className="panel mt-5 p-5">
        <h2 className="m-0 flex items-center gap-2 text-[18px] font-semibold text-white"><Icon name="phone" size={20} className="text-primary" /> Install now</h2>
        <p className="m-0 mb-4 mt-1 text-[14px] font-light text-muted">Add Brisic to your home screen. It works on Android, iPhone and computers, with nothing to download from a store.</p>
        <InstallButton />
      </section>

      <section className="panel mt-4 p-5">
        <h2 className="m-0 flex items-center gap-2 text-[18px] font-semibold text-white"><Icon name="download" size={20} className="text-primary" /> Android app (APK)</h2>
        {APK_URL ? (
          <>
            <p className="m-0 mb-4 mt-1 text-[14px] font-light text-muted">Download the Android app file and open it to install.</p>
            <a href={APK_URL} className="btn btn-primary" download><Icon name="download" size={18} /> Download for Android</a>
          </>
        ) : (
          <p className="m-0 mt-1 text-[14px] font-light text-muted">The Android app is on its way. Until it lands, install Brisic from the button above.</p>
        )}
      </section>
    </main>
  );
}

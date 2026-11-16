import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="m-0 text-[30px] font-semibold text-white">We could not find that page</h1>
      <p className="m-0 max-w-sm text-[15px] font-light text-muted">The song, artist or page may have moved.</p>
      <Link href="/" className="btn btn-primary mt-2">Back to Home</Link>
    </main>
  );
}

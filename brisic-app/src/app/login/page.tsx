"use client";

import { useState } from "react";
import Image from "next/image";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [loading, setLoading] = useState(false);
  const isLogin = mode === "login";

  async function handleGoogle() {
    setLoading(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh w-full items-center justify-center px-4 py-8">
      <div className="w-full max-w-[430px] rounded-[28px] border border-[var(--border)] bg-[radial-gradient(100%_50%_at_50%_0%,#0f2c18_0%,#050a07_60%,#030504_100%)] px-6 py-9 shadow-[0_30px_70px_rgba(0,0,0,0.6)] sm:px-8">
        <div className="flex flex-col items-center text-center">
          <Image
            src="/assets/logo-b-glow.png"
            alt="Brisic"
            width={104}
            height={104}
            priority
            className="h-24 w-auto"
          />
          <h1 className="mt-2 text-[27px] font-semibold text-white">
            {isLogin ? "Welcome back" : "Join Brisic"}
          </h1>
          <p className="mt-1 text-[14.5px] font-light text-[var(--accent)]">
            Music that understands you.
          </p>
        </div>

        <div className="mt-4 flex flex-col gap-2.5">
          {!isLogin && (
            <input
              type="text"
              placeholder="Full name"
              className="h-[50px] w-full rounded-full border-[1.5px] border-[var(--border)] bg-[var(--card-2)] px-[18px] text-base text-[#f1f7f3] outline-none placeholder:text-[#8fa398] focus:border-[var(--primary)]"
            />
          )}
          <input
            type="text"
            placeholder="Email or phone"
            className="h-[50px] w-full rounded-full border-[1.5px] border-[var(--border)] bg-[var(--card-2)] px-[18px] text-base text-[#f1f7f3] outline-none placeholder:text-[#8fa398] focus:border-[var(--primary)]"
          />
          <input
            type="password"
            placeholder="Password"
            className="h-[50px] w-full rounded-full border-[1.5px] border-[var(--border)] bg-[var(--card-2)] px-[18px] text-base text-[#f1f7f3] outline-none placeholder:text-[#8fa398] focus:border-[var(--primary)]"
          />
        </div>

        {isLogin && (
          <div className="mt-2 text-right text-[13.5px] text-[var(--primary)]">
            Forgot password?
          </div>
        )}

        <button
          type="button"
          disabled
          title="Email sign-in is coming soon — use Google for now"
          className="mt-3.5 flex h-[52px] w-full cursor-not-allowed items-center justify-center rounded-full bg-[var(--primary)] text-[17px] font-semibold text-[var(--primary-ink)] opacity-60"
        >
          {isLogin ? "Log in" : "Create account"}
        </button>

        <p className="mt-3.5 text-center text-[14.5px] font-light text-[var(--muted)]">
          {isLogin ? "New to Brisic?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => setMode(isLogin ? "signup" : "login")}
            className="font-semibold text-[var(--primary)]"
          >
            {isLogin ? "Sign up" : "Log in"}
          </button>
        </p>

        <div className="my-3.5 flex items-center gap-3 text-[13.5px] text-[#7f9d8b]">
          <div className="h-px flex-1 bg-[#26332b]" />
          or continue with
          <div className="h-px flex-1 bg-[#26332b]" />
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="flex h-[52px] w-full items-center justify-center gap-3 rounded-full border-[1.5px] border-[var(--border)] bg-white/5 text-[16.5px] font-medium text-[#f1f7f3] transition hover:bg-white/10 disabled:opacity-60"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.6a4.8 4.8 0 0 1-2.1 3.1v2.6h3.4c2-1.8 3.1-4.5 3.1-7.6z"
              />
              <path
                fill="#34A853"
                d="M12 22c2.8 0 5.2-.9 6.9-2.5l-3.4-2.6c-.9.6-2.1 1-3.5 1-2.7 0-5-1.8-5.8-4.3H2.7v2.7A10 10 0 0 0 12 22z"
              />
              <path
                fill="#FBBC05"
                d="M6.2 13.6a6 6 0 0 1 0-3.8V7.1H2.7a10 10 0 0 0 0 9z"
              />
              <path
                fill="#EA4335"
                d="M12 6c1.5 0 2.9.5 4 1.6l3-3A10 10 0 0 0 2.7 7.1l3.5 2.7C7 7.8 9.3 6 12 6z"
              />
            </svg>
            {loading ? "Opening Google…" : "Continue with Google"}
          </button>

          <button
            type="button"
            disabled
            title="Coming soon"
            className="flex h-[52px] w-full cursor-not-allowed items-center justify-center gap-3 rounded-full border-[1.5px] border-[var(--border)] bg-white/5 text-[16.5px] font-medium text-[#f1f7f3] opacity-50"
          >
            Apple · coming soon
          </button>
        </div>

        <p className="mt-3.5 text-center text-xs font-light leading-relaxed text-[#6f8c7b]">
          By continuing you agree to Brisic&apos;s Terms and Privacy Policy.
        </p>
      </div>
    </main>
  );
}

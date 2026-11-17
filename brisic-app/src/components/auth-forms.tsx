"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { registerUser } from "@/app/actions";
import { requestPasswordReset, resetPassword } from "@/app/account-actions";
import { Icon } from "@/components/icons";

/** Live checklist of the password rules. */
export function PasswordRules({ password }: { password: string }) {
  const rules: [string, boolean][] = [
    ["At least 8 characters", password.length >= 8],
    ["Uppercase and lowercase letters", /[a-z]/.test(password) && /[A-Z]/.test(password)],
    ["A number", /\d/.test(password)],
    ["A symbol", /[^A-Za-z0-9]/.test(password)],
  ];
  return (
    <ul className="m-0 flex list-none flex-col gap-1 p-0 text-[13px]">
      {rules.map(([text, ok]) => (
        <li key={text} className={`flex items-center gap-2 ${ok ? "text-primary" : "text-muted"}`}>
          <Icon name={ok ? "check" : "x"} size={14} /> {text}
        </li>
      ))}
    </ul>
  );
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState("");
  const [error, setError] = useState("");

  if (done) {
    return (
      <div className="mt-5 text-center">
        <p role="status" className="m-0 text-[15px] text-ink">{done}</p>
        <p className="m-0 mt-2 text-[13.5px] font-light text-muted">Check your spam folder if it does not arrive in a few minutes.</p>
        <Link href="/login" className="btn btn-primary mt-5 w-full">Back to log in</Link>
      </div>
    );
  }
  return (
    <form
      className="mt-5 flex flex-col gap-2.5"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const r = await requestPasswordReset(email).catch(() => null);
        setBusy(false);
        if (!r) return setError("Something went wrong. Try again.");
        if (r.ok) setDone(r.message ?? "Check your email.");
        else setError(r.error);
      }}
    >
      <p className="m-0 text-center text-[14px] font-light text-muted">Enter your account email and we will send you a link to choose a new password.</p>
      <input type="email" name="email" autoComplete="email" required aria-label="Email" placeholder="Email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
      {error && <p role="alert" className="m-0 text-[14px] text-[#ff9b9b]">{error}</p>}
      <button className="btn btn-primary mt-1 w-full !h-[52px] !text-[17px]" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</button>
      <Link href="/login" className="mt-1 text-center text-[14px] text-muted hover:text-ink">Back to log in</Link>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  return (
    <form
      className="mt-5 flex flex-col gap-2.5"
      onSubmit={async (e) => {
        e.preventDefault();
        if (password !== confirm) return setError("Passwords do not match.");
        setBusy(true);
        setError("");
        const r = await resetPassword(token, password).catch(() => null);
        setBusy(false);
        if (!r) return setError("Something went wrong. Try again.");
        if (!r.ok) return setError(r.error);
        router.push("/login?reset=1");
      }}
    >
      <input type="password" name="new-password" autoComplete="new-password" required aria-label="New password" placeholder="New password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} maxLength={100} />
      <input type="password" name="confirm-password" autoComplete="new-password" required aria-label="Confirm new password" placeholder="Confirm new password" className="field" value={confirm} onChange={(e) => setConfirm(e.target.value)} maxLength={100} />
      <PasswordRules password={password} />
      {error && <p role="alert" className="m-0 text-[14px] text-[#ff9b9b]">{error}</p>}
      <button className="btn btn-primary mt-1 w-full !h-[52px] !text-[17px]" disabled={busy}>{busy ? "Saving…" : "Set new password"}</button>
    </form>
  );
}

export function AuthFrame({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <main className="flex min-h-dvh w-full flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-[430px] rounded-[28px] border border-line bg-[radial-gradient(100%_50%_at_50%_0%,#0f2c18_0%,#050a07_60%,#030504_100%)] px-6 py-9 shadow-[0_30px_70px_rgba(0,0,0,0.6)] sm:px-8">
        <div className="flex flex-col items-center text-center">
          <Image src="/assets/logo-b-glow.png" alt="Brisic" width={456} height={656} priority className="h-24 w-auto" />
          <h1 className="m-0 mt-2 text-[27px] font-semibold text-white">{heading}</h1>
          <p className="m-0 mt-1 text-[14.5px] font-light text-accent">Music that understands you.</p>
        </div>
        {children}
        <p className="m-0 mt-5 text-center text-xs font-light leading-relaxed text-[#6f8c7b]">By continuing you agree to Brisic&apos;s Terms and Privacy Policy.</p>
      </div>
      <Link href="/download" className="mt-5 inline-flex items-center gap-2 text-[14px] text-muted hover:text-ink">
        <Icon name="download" size={17} /> Get the Brisic app
      </Link>
    </main>
  );
}

function GoogleButton() {
  const [loading, setLoading] = useState(false);
  return (
    <>
      <div className="my-4 flex items-center gap-3 text-[13.5px] text-[#7f9d8b]">
        <div className="h-px flex-1 bg-[#26332b]" />
        or continue with
        <div className="h-px flex-1 bg-[#26332b]" />
      </div>
      <button
        type="button" disabled={loading} className="btn w-full !h-[52px] !text-[16.5px]"
        onClick={() => { setLoading(true); signIn("google", { callbackUrl: "/" }).catch(() => setLoading(false)); }}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path fill="#4285F4" d="M22 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.6a4.8 4.8 0 0 1-2.1 3.1v2.6h3.4c2-1.8 3.1-4.5 3.1-7.6z" />
          <path fill="#34A853" d="M12 22c2.8 0 5.2-.9 6.9-2.5l-3.4-2.6c-.9.6-2.1 1-3.5 1-2.7 0-5-1.8-5.8-4.3H2.7v2.7A10 10 0 0 0 12 22z" />
          <path fill="#FBBC05" d="M6.2 13.6a6 6 0 0 1 0-3.8V7.1H2.7a10 10 0 0 0 0 9z" />
          <path fill="#EA4335" d="M12 6c1.5 0 2.9.5 4 1.6l3-3A10 10 0 0 0 2.7 7.1l3.5 2.7C7 7.8 9.3 6 12 6z" />
        </svg>
        {loading ? "Opening Google…" : "Continue with Google"}
      </button>
    </>
  );
}

const OAUTH_ERRORS: Record<string, string> = {
  OAuthAccountNotLinked: "This email already has a Brisic password. Log in with your email and password instead.",
  AccessDenied: "Sign-in was cancelled or not allowed for this account.",
};

export function LoginForm({ error, notice, resetEnabled }: { error?: string; notice?: string; resetEnabled: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(error && error !== "CredentialsSignin" ? OAUTH_ERRORS[error] ?? "Could not sign you in. Try again." : "");

  return (
    <>
      <form
        className="mt-5 flex flex-col gap-2.5"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setMessage("");
          const r = await signIn("credentials", { email, password, redirect: false }).catch(() => null);
          if (!r || r.error) {
            setBusy(false);
            return setMessage(r?.code === "rate_limited" ? "Too many attempts. Wait 15 minutes and try again." : "Email or password is incorrect.");
          }
          router.push("/");
          router.refresh();
        }}
      >
        <input type="email" name="email" autoComplete="email" required aria-label="Email" placeholder="Email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" name="password" autoComplete="current-password" required aria-label="Password" placeholder="Password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} />
        {resetEnabled && (
          <Link href="/forgot-password" className="self-end text-[13.5px] text-primary hover:underline">Forgot password?</Link>
        )}
        {notice && !message && <p role="status" className="m-0 text-[14px] text-primary">{notice}</p>}
        {message && <p role="alert" className="m-0 text-[14px] text-[#ff9b9b]">{message}</p>}
        <button className="btn btn-primary mt-1 w-full !h-[52px] !text-[17px]" disabled={busy}>{busy ? "Logging in…" : "Log in"}</button>
      </form>
      <p className="m-0 mt-3.5 text-center text-[14.5px] font-light text-muted">
        New to Brisic? <Link href="/signup" className="font-semibold text-primary">Sign up</Link>
      </p>
      <GoogleButton />
    </>
  );
}

export function SignupForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const rules: [string, boolean][] = [
    ["At least 8 characters", password.length >= 8],
    ["Uppercase and lowercase letters", /[a-z]/.test(password) && /[A-Z]/.test(password)],
    ["A number", /\d/.test(password)],
    ["A symbol", /[^A-Za-z0-9]/.test(password)],
  ];
  const strong = rules.every(([, ok]) => ok);
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

  return (
    <>
      <p className="m-0 mt-4 text-center text-[12px] font-semibold uppercase tracking-[0.14em] text-accent">Step {step} of 2</p>
      {step === 1 ? (
        <form className="mt-3 flex flex-col gap-2.5" onSubmit={(e) => { e.preventDefault(); if (name.trim() && emailOk) { setMessage(""); setStep(2); } else setMessage("Enter your name and a valid email like name@gmail.com."); }}>
          <input name="name" autoComplete="name" required aria-label="Full name" placeholder="Full name" className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
          <input type="email" name="email" autoComplete="email" required aria-label="Email" placeholder="Email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
          {message && <p role="alert" className="m-0 text-[14px] text-[#ff9b9b]">{message}</p>}
          <button className="btn btn-primary mt-1 w-full !h-[52px] !text-[17px]">Continue</button>
        </form>
      ) : (
        <form
          className="mt-3 flex flex-col gap-2.5"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!strong) return setMessage("Your password does not meet all the rules yet.");
            if (password !== confirm) return setMessage("Passwords do not match.");
            setBusy(true);
            setMessage("");
            const r = await registerUser({ name, email, password }).catch(() => null);
            if (!r || !r.ok) {
              setBusy(false);
              return setMessage(r && !r.ok ? r.error : "Could not create your account. Try again.");
            }
            const s = await signIn("credentials", { email, password, redirect: false }).catch(() => null);
            if (!s || s.error) return router.push("/login");
            router.push("/");
            router.refresh();
          }}
        >
          <p className="m-0 text-center text-[14px] font-light text-muted">Create a password for {email}</p>
          <div className="relative">
            <input type={show ? "text" : "password"} name="new-password" autoComplete="new-password" required aria-label="Password" placeholder="Password" className="field !pr-20" value={password} onChange={(e) => setPassword(e.target.value)} maxLength={100} />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 border-0 bg-transparent p-1 text-[13.5px] text-primary">{show ? "Hide" : "Show"}</button>
          </div>
          <input type={show ? "text" : "password"} name="confirm-password" autoComplete="new-password" required aria-label="Confirm password" placeholder="Confirm password" className="field" value={confirm} onChange={(e) => setConfirm(e.target.value)} maxLength={100} />
          <ul className="m-0 flex list-none flex-col gap-1 p-0 text-[13px]">
            {rules.map(([text, ok]) => (
              <li key={text} className={`flex items-center gap-2 ${ok ? "text-primary" : "text-muted"}`}>
                <Icon name={ok ? "check" : "x"} size={14} /> {text}
              </li>
            ))}
          </ul>
          {message && <p role="alert" className="m-0 text-[14px] text-[#ff9b9b]">{message}</p>}
          <button className="btn btn-primary mt-1 w-full !h-[52px] !text-[17px]" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
          <button type="button" className="btn w-full" disabled={busy} onClick={() => { setMessage(""); setStep(1); }}>Back</button>
        </form>
      )}
      <p className="m-0 mt-3.5 text-center text-[14.5px] font-light text-muted">
        Already have an account? <Link href="/login" className="font-semibold text-primary">Log in</Link>
      </p>
      {step === 1 && <GoogleButton />}
    </>
  );
}

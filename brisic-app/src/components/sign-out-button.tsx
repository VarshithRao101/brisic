"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="rounded-full border border-[var(--border)] bg-white/5 px-4 py-1.5 text-sm font-medium text-[var(--text)] transition hover:bg-white/10"
    >
      Sign out
    </button>
  );
}

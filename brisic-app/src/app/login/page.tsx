import { redirect } from "next/navigation";
import { hasLiveSession } from "@/lib/session";
import { socialProviders } from "@/lib/social";
import { emailEnabled } from "@/lib/email";
import { AuthFrame, LoginForm } from "@/components/auth-forms";

export const metadata = { title: "Log in — Brisic" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; reset?: string; deleted?: string }> }) {
  if (await hasLiveSession()) redirect("/");
  const { error, reset, deleted } = await searchParams;
  const notice = reset ? "Password changed. Log in with your new password." : deleted ? "Your account was deleted." : undefined;
  return (
    <AuthFrame heading="Welcome back">
      <LoginForm error={error} notice={notice} resetEnabled={emailEnabled()} social={socialProviders()} />
    </AuthFrame>
  );
}

import { redirect } from "next/navigation";
import { hasLiveSession } from "@/lib/session";
import { socialProviders } from "@/lib/social";
import { AuthFrame, SignupForm } from "@/components/auth-forms";

export const metadata = { title: "Sign up — Brisic" };

export default async function SignupPage() {
  if (await hasLiveSession()) redirect("/");
  return (
    <AuthFrame heading="Join Brisic">
      <SignupForm social={socialProviders()} />
    </AuthFrame>
  );
}

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthFrame, SignupForm } from "@/components/auth-forms";

export const metadata = { title: "Sign up — Brisic" };

export default async function SignupPage() {
  const session = await auth();
  if (session?.user?.id) redirect("/");
  return (
    <AuthFrame heading="Join Brisic">
      <SignupForm />
    </AuthFrame>
  );
}

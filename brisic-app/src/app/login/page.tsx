import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthFrame, LoginForm } from "@/components/auth-forms";

export const metadata = { title: "Log in — Brisic" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await auth();
  if (session?.user?.id) redirect("/");
  const { error } = await searchParams;
  return (
    <AuthFrame heading="Welcome back">
      <LoginForm error={error} />
    </AuthFrame>
  );
}

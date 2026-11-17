import Link from "next/link";
import { AuthFrame, ResetPasswordForm } from "@/components/auth-forms";

export const metadata = { title: "Choose a new password — Brisic" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = (await searchParams).token ?? "";
  return (
    <AuthFrame heading="New password">
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div className="mt-5 text-center">
          <p className="m-0 text-[15px] text-ink">This reset link is incomplete.</p>
          <Link href="/forgot-password" className="btn btn-primary mt-4 w-full">Ask for a new link</Link>
        </div>
      )}
    </AuthFrame>
  );
}

import { notFound } from "next/navigation";
import { emailEnabled } from "@/lib/email";
import { AuthFrame, ForgotPasswordForm } from "@/components/auth-forms";

export const metadata = { title: "Reset password — Brisic" };

export default function ForgotPasswordPage() {
  if (!emailEnabled()) notFound();
  return (
    <AuthFrame heading="Forgot password">
      <ForgotPasswordForm />
    </AuthFrame>
  );
}

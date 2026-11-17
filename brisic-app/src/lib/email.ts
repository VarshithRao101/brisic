// Transactional email through Resend (https://resend.com), called with plain fetch.
//
// Turn it on with two env vars:
//   RESEND_API_KEY  — from the Resend dashboard
//   EMAIL_FROM      — e.g. "Brisic <noreply@your-domain.com>" (domain verified in Resend)
// Without them, emails are printed to the server console in development and
// email-based features (password reset) are hidden in production.

export function emailEnabled(): boolean {
  return !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM) || process.env.NODE_ENV === "development";
}

export async function sendEmail(msg: { to: string; subject: string; text: string; html: string }): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) {
    if (process.env.NODE_ENV === "development") {
      console.log(`\n[email to ${msg.to}] ${msg.subject}\n${msg.text}\n`);
      return true;
    }
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [msg.to], subject: msg.subject, text: msg.text, html: msg.html }),
    });
    if (!res.ok) console.error("Resend error", res.status, await res.text().catch(() => ""));
    return res.ok;
  } catch (err) {
    console.error("Resend request failed", err);
    return false;
  }
}

/** Public base URL for links in emails. */
export function siteUrl(requestHeaders?: Headers): string {
  if (process.env.AUTH_URL) return process.env.AUTH_URL.replace(/\/$/, "");
  if (process.env.URL) return process.env.URL.replace(/\/$/, "");
  const host = requestHeaders?.get("x-forwarded-host") || requestHeaders?.get("host") || "localhost:3000";
  const proto = requestHeaders?.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

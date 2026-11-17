// Netlify Scheduled Function: keeps the Neon database awake.
//
// Neon's free plan puts the database to sleep after 5 idle minutes; the next
// visitor then waits for it to wake. This pings /api/health (one `SELECT 1`)
// every 4 minutes so it never reaches 5 idle minutes.
//
// IMPORTANT — Neon free-plan compute budget: staying awake uses compute hours.
// Awake 24/7 would use up the free monthly allowance in roughly two weeks and
// the database would then stop until the next month. So this only runs during
// peak hours. Times are UTC:
//   08:00–17:59 UTC = 09:00–18:59 in Nigeria (WAT), 13:30–23:29 in India (IST).
// On a paid Neon plan, change "8-17" to "*" to stay awake all day.
export const config = {
  schedule: "*/4 8-17 * * *",
};

export default async () => {
  const base = process.env.URL || "https://brisic.netlify.app";
  try {
    const res = await fetch(`${base}/api/health`, { headers: { "user-agent": "brisic-keep-warm" } });
    console.log(`keep-warm: ${res.status} ${await res.text()}`);
  } catch (err) {
    console.log(`keep-warm failed: ${err instanceof Error ? err.message : err}`);
  }
};

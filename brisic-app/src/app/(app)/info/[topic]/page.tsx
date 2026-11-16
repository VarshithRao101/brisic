import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { BackButton } from "@/components/controls";
import { PageTitle } from "@/components/ui";

const TOPICS: Record<string, { title: string; subtitle: string; items: [string, string][] }> = {
  account: {
    title: "Account",
    subtitle: "Email, password, username",
    items: [
      ["Email and sign-in", "You sign in with Google or with your email and password. Your email address identifies your account."],
      ["Username and display name", "Change them any time from Profile, then Edit Profile. Usernames are 3 to 20 letters, numbers or underscores."],
      ["Password", "Passwords need at least 8 characters with an uppercase and a lowercase letter, a number and a symbol. Accounts created with Google do not have a Brisic password."],
      ["Delete my account", "Deleting your account removes your profile, playlists, likes and follows. Contact support to request it."],
    ],
  },
  privacy: {
    title: "Privacy & Security",
    subtitle: "Your data, your control",
    items: [
      ["What we collect", "Your account details, what you listen to and the playlists you make. We use them to run Brisic and recommend music."],
      ["Private session", "Turn on Private session in Settings and the songs you play are not added to your listening history."],
      ["Listening history", "You can clear your history at any time from Library, then Listening History."],
      ["Download or delete my data", "Contact support to ask for a copy of your data or to have it deleted."],
    ],
  },
  help: {
    title: "Help & Support",
    subtitle: "Answers and support",
    items: [
      ["How do I follow an artist?", "Open the artist profile and tap Follow. Artists you follow appear in your Library under Artists Followed."],
      ["How do I make a playlist?", "Open Library and tap New playlist. To add songs, open the menu on any song and choose Add to playlist."],
      ["What are B-Coins?", "B-Coins are the in-app coins you use to send gifts to artists and to unlock exclusive content."],
      ["How do I send a gift?", "Open an artist, tap Support, choose Send a gift, pick a gift, add an optional message and send it."],
      ["How do I get Premium?", "Open Profile and tap Go Premium to see the plans. Checkout opens when payments go live."],
      ["How do I get the app?", "Open Profile and tap Get the app. You can install Brisic to your home screen today; the Android app follows."],
    ],
  },
  about: {
    title: "About Brisic",
    subtitle: "Learn about Brisic",
    items: [
      ["What is Brisic?", "Brisic is a music home for artists, fans and podcasters, built especially for emerging African artists. Listen, follow, gift and join parties."],
      ["Who is it for?", "Listeners who want to find new sounds first, and artists who want a direct line to the fans who support them."],
      ["How do artists earn?", "Fans support artists directly with B-Coin gifts, exclusive content and merch."],
    ],
  },
};

export default async function InfoPage({ params }: { params: Promise<{ topic: string }> }) {
  await requireUser();
  const topic = TOPICS[(await params).topic];
  if (!topic) notFound();
  return (
    <div className="mx-auto max-w-3xl">
      <BackButton />
      <PageTitle title={topic.title} subtitle={topic.subtitle} />
      <div className="flex flex-col gap-2">
        {topic.items.map(([q, a]) => (
          <details key={q} className="panel group px-4 py-3.5">
            <summary className="cursor-pointer list-none text-[15.5px] font-medium text-white marker:hidden">
              <span className="flex items-center justify-between gap-3">
                {q}
                <span aria-hidden="true" className="text-muted transition group-open:rotate-45">+</span>
              </span>
            </summary>
            <p className="m-0 mt-2.5 text-[14.5px] font-light leading-relaxed text-ink/85">{a}</p>
          </details>
        ))}
      </div>
      <div className="panel mt-5 p-4 text-center">
        <p className="m-0 text-[15.5px] font-semibold text-white">Still need help?</p>
        <p className="m-0 mt-1 text-[13.5px] font-light text-muted">A support contact will be listed here before launch.</p>
      </div>
    </div>
  );
}

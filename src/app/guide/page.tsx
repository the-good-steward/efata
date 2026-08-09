import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/app-nav";

export const metadata = { title: "How this works · Efata" };

/**
 * The guide, always available, never in the way.
 *
 * A tour that runs on first sign-in interrupts someone at the moment
 * they are keenest to try the thing, and is gone by the time they
 * actually want it. This sits in the menu instead: three cards, each
 * with what it is, how long it takes, and a way to start it.
 */
const WAYS = [
  {
    title: "Practice session",
    time: "About 20 minutes",
    href: "/practice",
    what: "Paste the job post you are applying for. Efata builds four questions you are likely to face, and you answer them out loud.",
    when: "Before an interview, or when you want a proper run at a role.",
  },
  {
    title: "Daily drill",
    time: "About 3 minutes",
    href: "/drill",
    what: "One question and one habit. Saying the number and stopping. Cutting the apology at the start.",
    when: "Every day, if you can. This is the one that builds something.",
  },
  {
    title: "Something you have to say",
    time: "About 5 minutes",
    href: "/situation",
    what: "Describe a conversation coming up with a real client. Efata puts you in the moment and you answer it.",
    when: "When you are dreading a message you have to send.",
  },
];

export default async function GuidePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-dvh flex-col">
      <AppNav email={user.email} />

      <main className="mx-auto w-full max-w-md flex-1 px-5 pb-28">
        <h1 className="ef-display text-ink mt-4">How this works</h1>
        <p className="ef-body text-ink-2 mt-3">
          Three ways in. All of them end with you speaking out loud, because
          that is the part that fails on a real call.
        </p>

        <div className="mt-8 flex flex-col gap-4">
          {WAYS.map((way) => (
            <section key={way.title} className="bg-card rounded-[16px] p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-serif text-ink text-[21px]">{way.title}</h2>
                <span className="ef-caption text-ink-3 shrink-0">
                  {way.time}
                </span>
              </div>
              <p className="ef-body text-ink-2 mt-2">{way.what}</p>
              <p className="ef-caption text-ink-3 mt-2">{way.when}</p>
              <Link
                href={way.href}
                className="text-sea mt-4 inline-block text-[16px] font-medium underline underline-offset-4"
              >
                Try it
              </Link>
            </section>
          ))}
        </div>

        <section className="border-hairline mt-10 border-t pt-6">
          <h2 className="ef-label text-ink-3">Two things worth knowing</h2>

          <p className="ef-body text-ink-2 mt-4">
            <span className="text-ink font-semibold">You answer twice.</span>{" "}
            The first time tells you how you came across. The second is where
            it changes. Only after both do you see your own answer written
            back stronger.
          </p>

          <p className="ef-body text-ink-2 mt-4">
            <span className="text-ink font-semibold">Nothing is scored.</span>{" "}
            No marks, no grades, no streak to break. Nobody else hears your
            recordings.
          </p>
        </section>

        <section className="border-hairline mt-8 border-t pt-6">
          <h2 className="ef-label text-ink-3">Your CV</h2>
          <p className="ef-body text-ink-2 mt-3">
            If you add one, half your questions come from work you have
            actually done, and Efata can point back at experience you leave
            out of an answer.
          </p>
          <Link
            href="/profile"
            className="text-sea mt-4 inline-block text-[16px] font-medium underline underline-offset-4"
          >
            Add or change it
          </Link>
        </section>
      </main>
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/app-nav";

export const metadata = { title: "How this works · Efata" };

/**
 * Short enough to actually read.
 *
 * The first version explained each way in twice over, plus two asides
 * and a note about the CV. A guide nobody finishes is worse than none,
 * because it is the page someone opens when they are already unsure.
 *
 * One line each, then the three rules that surprise people.
 */
const WAYS = [
  {
    title: "Practice session",
    time: "20 min",
    href: "/practice",
    line: "Paste a job post. Four questions, answered out loud.",
  },
  {
    title: "Daily drill",
    time: "3 min",
    href: "/drill",
    line: "One question, one habit. The one to do every day.",
  },
  {
    title: "Something you have to say",
    time: "5 min",
    href: "/situation",
    line: "A real conversation coming up with a client.",
  },
];

const RULES = [
  "You answer everything out loud.",
  "You answer twice. The second one is where it changes.",
  "Nothing is scored, and nobody else hears it.",
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

        <div className="mt-7 flex flex-col gap-3">
          {WAYS.map((way) => (
            <Link
              key={way.title}
              href={way.href}
              className="bg-card block rounded-[16px] p-4"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-serif text-ink text-[19px]">
                  {way.title}
                </span>
                <span className="ef-caption text-ink-3 shrink-0">
                  {way.time}
                </span>
              </div>
              <p className="ef-caption text-ink-2 mt-1">{way.line}</p>
            </Link>
          ))}
        </div>

        <ul className="mt-8 flex flex-col gap-3">
          {RULES.map((rule) => (
            <li key={rule} className="ef-body text-ink-2 flex gap-3">
              <span aria-hidden="true" className="text-sea">
                ·
              </span>
              {rule}
            </li>
          ))}
        </ul>

        <Link
          href="/profile"
          className="text-sea mt-8 inline-block text-[16px] underline underline-offset-4"
        >
          Add your CV for questions about your own work
        </Link>
      </main>
    </div>
  );
}

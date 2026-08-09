"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Mark } from "@/components/logo";

/**
 * The mark, a menu, and a quick way to start something.
 *
 * Deliberately absent from the session screens: nothing should be
 * visible while someone is about to speak. This is for the pages
 * between sessions.
 */
const LINKS = [
  { href: "/practice", label: "Practice" },
  { href: "/drill", label: "Daily drill" },
  { href: "/situation", label: "Something you have to say" },
  { href: "/progress", label: "Progress" },
  { href: "/recall", label: "Log an interview" },
  { href: "/profile", label: "My profile" },
];

export function AppNav({ email }: { email?: string | null }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [startOpen, setStartOpen] = useState(false);
  const pathname = usePathname();

  /*
   * Hidden where its own actions already fill the screen.
   *
   * On the practice page the primary button starts a session, and the
   * drill card sits below it. A floating button offering both is
   * clutter there, and it was landing directly on top of the primary
   * action in the same dark fill.
   */
  /*
   * Hidden where it would get in the way.
   *
   * On the drill it offers the page someone is already on. On practice
   * it lands directly on top of the primary button, and the drill card
   * is already on that page anyway, so it adds nothing but a collision.
   * Inside a session nothing floats at all.
   */
  // Hidden inside a session and on the pages it would offer someone
  // the page they are already on. Kept on practice, where it is the
  // only way to reach the short practices without opening the menu.
  const startHidden =
    pathname.startsWith("/practice/") ||
    pathname === "/drill" ||
    pathname === "/cv" ||
    pathname === "/onboarding" ||
    pathname === "/situation";

  // On practice the primary button sits at the bottom, so the floating
  // one lifts clear of it rather than landing on top.
  const lifted = pathname === "/practice";

  return (
    <>
      <header className="flex items-center justify-between px-5 py-5">
        <Link href="/practice" aria-label="Efata" className="inline">
          <Mark size={30} />
        </Link>

        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="text-ink flex size-11 items-center justify-center"
        >
          <span className="flex flex-col gap-[5px]">
            <span className="bg-ink block h-[2px] w-6 rounded-full" />
            <span className="bg-ink block h-[2px] w-6 rounded-full" />
            <span className="bg-ink block h-[2px] w-6 rounded-full" />
          </span>
        </button>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-30 flex flex-col">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="bg-ink/40 absolute inset-0"
          />

          <nav className="bg-paper relative ml-auto flex h-full w-[86%] max-w-sm flex-col px-6 py-5">
            <div className="flex items-center justify-between">
              <Mark size={28} />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="text-ink-3 flex size-11 items-center justify-center text-[20px]"
              >
                ✕
              </button>
            </div>

            <ul className="mt-8 flex flex-col">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`border-hairline block border-b py-4 text-[19px] ${
                      pathname === link.href
                        ? "text-ink font-semibold"
                        : "text-ink-2"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-auto">
              {email && (
                <p className="text-ink-3 truncate text-[13px]">{email}</p>
              )}
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="text-ink-3 mt-2 py-3 text-[15px] underline underline-offset-4"
                >
                  Sign out
                </button>
              </form>
            </div>
          </nav>
        </div>
      )}

      {/*
        Start something, from anywhere.
        The two things a person actually comes here to do, one tap away
        wherever they are, rather than requiring a trip back to a home
        page first.
      */}
      {/*
        The two short things, one tap away.
        A drill is the daily habit; a real conversation is the thing
        someone arrives with a need for. Both are quick, and neither
        should require a trip back to a home page first.
      */}
      {!startHidden && (
        <div
          className={`fixed right-5 z-20 flex flex-col items-end gap-3 ${
            lifted ? "bottom-28" : "bottom-6"
          }`}
        >
          {startOpen && (
            <>
              <Link
                href="/situation"
                prefetch
                onClick={() => setStartOpen(false)}
                className="animate-rise bg-paper border-edge flex flex-col items-end rounded-2xl border px-5 py-3 shadow-md"
              >
                <span className="text-ink text-[16px] font-semibold">
                  Something you have to say
                </span>
                <span className="text-ink-3 text-[13px]">
                  A real conversation, coming up
                </span>
              </Link>

              <Link
                href="/drill"
                prefetch
                onClick={() => setStartOpen(false)}
                className="animate-rise bg-paper border-edge flex flex-col items-end rounded-2xl border px-5 py-3 shadow-md"
              >
                <span className="text-ink text-[16px] font-semibold">
                  Today&rsquo;s drill
                </span>
                <span className="text-ink-3 text-[13px]">
                  One question, three minutes
                </span>
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={() => setStartOpen((o) => !o)}
            aria-expanded={startOpen}
            aria-label={startOpen ? "Close" : "Practise something"}
            className="bg-sea relative flex size-16 items-center justify-center rounded-full shadow-lg"
          >
            {!startOpen && (
              <>
                <span className="bg-sea/30 animate-halo absolute inset-0 rounded-full" />
                <span className="border-sea/50 animate-halo absolute inset-0 rounded-full border-2 [animation-delay:1.2s]" />
              </>
            )}
            {startOpen ? (
              <span className="text-paper text-[24px] leading-none">✕</span>
            ) : (
              <Mark size={34} onLight={false} />
            )}
          </button>
        </div>
      )}

    </>
  );
}

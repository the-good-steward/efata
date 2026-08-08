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
  { href: "/progress", label: "Progress" },
  { href: "/recall", label: "Log an interview" },
  { href: "/profile", label: "My profile" },
];

export function AppNav({ email }: { email?: string | null }) {
  const [menuOpen, setMenuOpen] = useState(false);
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
  const startHidden =
    pathname === "/drill" ||
    pathname === "/practice" ||
    pathname.startsWith("/practice/") ||
    pathname === "/cv";

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
        One thing, always the same thing.
        An expanding menu made the daily drill a second choice behind a
        tap, and the drill is the habit worth building. So the button is
        the drill, and nothing else: the mark, glowing gently, one tap
        from anywhere.
      */}
      {!startHidden && (
        <Link
          href="/drill"
          prefetch
          aria-label="Today's drill"
          className="bg-sea fixed right-5 bottom-6 z-20 flex size-16 items-center justify-center rounded-full shadow-lg"
        >
          <span className="bg-sea/30 animate-halo absolute inset-0 rounded-full" />
          <span className="border-sea/50 animate-halo absolute inset-0 rounded-full border-2 [animation-delay:1.2s]" />
          <Mark size={34} onLight={false} />
        </Link>
      )}

    </>
  );
}

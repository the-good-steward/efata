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
  const [startOpen, setStartOpen] = useState(false);
  const pathname = usePathname();

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
      <div className="fixed right-5 bottom-6 z-20 flex flex-col items-end gap-3">
        {startOpen && (
          <>
            <Link
              href="/practice"
              onClick={() => setStartOpen(false)}
              className="bg-paper border-edge text-ink rounded-full border px-5 py-3.5 text-[16px] font-medium shadow-sm"
            >
              Practice session
            </Link>
            <Link
              href="/drill"
              onClick={() => setStartOpen(false)}
              className="bg-paper border-edge text-ink rounded-full border px-5 py-3.5 text-[16px] font-medium shadow-sm"
            >
              Daily drill
            </Link>
          </>
        )}

        <button
          type="button"
          onClick={() => setStartOpen((o) => !o)}
          aria-expanded={startOpen}
          aria-label={startOpen ? "Close" : "Start something"}
          className="bg-ink text-paper flex size-14 items-center justify-center rounded-full text-[26px] leading-none shadow-md"
        >
          {startOpen ? "✕" : "+"}
        </button>
      </div>
    </>
  );
}

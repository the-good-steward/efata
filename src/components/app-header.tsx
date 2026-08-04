import Link from "next/link";
import { Wordmark } from "@/components/logo";
import { logout } from "@/app/auth/actions";

/**
 * Shared header.
 *
 * The nav is a single non-wrapping row that scrolls sideways when it
 * runs out of room, rather than reflowing into broken phrases like "Log
 * a real / question". On a narrow phone a wrapped link reads as two
 * separate links, which is worse than a scroll.
 *
 * Calibration is deliberately absent: it is an internal quality tool,
 * not a feature, and asking a user to grade themselves before seeing
 * feedback would confuse them. It stays reachable at /calibrate.
 */
export function AppHeader({ email }: { email?: string | null }) {
  return (
    <header className="mb-12">
      <div className="flex items-center justify-between gap-4">
        <Link href="/practice" className="inline">
          <Wordmark size={34} />
        </Link>

        <form action={logout}>
          <button
            type="submit"
            className="text-faint hover:text-paper ef-caption inline whitespace-nowrap transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>

      <nav className="border-hairline mt-6 flex gap-6 overflow-x-auto border-t pt-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[
          { href: "/practice", label: "Practice" },
          { href: "/drill", label: "Daily drill" },
          { href: "/progress", label: "Progress" },
          { href: "/recall", label: "Log an interview" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            className="ef-ui text-muted hover:text-paper inline whitespace-nowrap transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {email && (
        <p className="ef-caption text-disabled mt-4 truncate">{email}</p>
      )}
    </header>
  );
}

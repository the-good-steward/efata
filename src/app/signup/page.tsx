import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { signup } from "@/app/auth/actions";
import { Mark } from "@/components/logo";

export const metadata = { title: "Create your account · Efata" };

/**
 * Signups are paused with EFATA_SIGNUPS_CLOSED=true.
 *
 * An environment variable rather than a code change: reopening is one
 * setting, and the reason someone cannot sign up is visible where you
 * would look for it rather than buried in a deploy.
 *
 * Existing accounts are unaffected — the sign-in page stays open, so
 * anyone already testing can keep going.
 */
export default function SignupPage() {
  const closed = process.env.EFATA_SIGNUPS_CLOSED === "true";

  if (closed) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <Mark size={40} />

          <h1 className="ef-display text-paper mt-8">
            Paused for a day or two
          </h1>

          <p className="ef-body text-paper-soft mt-5">
            A tester found that recordings were not saving properly. That is
            fixed, and I would rather sort out the rest before letting more
            people in than have anyone lose a session they spent twenty
            minutes on.
          </p>

          <p className="ef-body text-muted mt-4">
            If I sent you the link, I will message you when it is open. Thank
            you for being early.
          </p>

          <div className="border-hairline mt-10 border-t pt-6">
            <Link
              href="/login"
              className="ef-ui text-seaglass hover:text-paper inline transition-colors"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-20">
      <AuthForm mode="signup" action={signup} />
    </main>
  );
}

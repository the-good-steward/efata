import Link from "next/link";

export const metadata = { title: "Link didn't work · Efata" };

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <h1 className="text-parchment font-display text-4xl">
        That link didn&rsquo;t work
      </h1>
      <p className="ef-body text-paper-soft mt-4 max-w-sm">
        This usually happens when the link opens in a different browser from
        the one you signed up in — for example, signing up inside Messenger
        and then opening the email in Safari or Chrome.
      </p>
      <p className="ef-body text-muted mt-4 max-w-sm">
        Your account is fine. Try signing in with the email and password you
        just used.
      </p>

      {reason && (
        <p className="border-rule text-ash font-body mt-6 max-w-sm rounded-sm border px-3 py-2 text-xs">
          {reason}
        </p>
      )}

      <Link
        href="/login"
        className="bg-parchment text-ink font-body hover:bg-parchment/85 mt-8 rounded-sm px-4 py-2.5 text-sm font-medium transition-colors"
      >
        Sign in
      </Link>
    </main>
  );
}

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
      <p className="text-ash font-body mt-4 max-w-sm text-sm leading-relaxed">
        Confirmation links expire after a short time and can only be used
        once. Request a new one by signing up again with the same email.
      </p>

      {reason && (
        <p className="border-rule text-ash font-body mt-6 max-w-sm rounded-sm border px-3 py-2 text-xs">
          {reason}
        </p>
      )}

      <Link
        href="/signup"
        className="bg-parchment text-ink font-body hover:bg-parchment/85 mt-8 rounded-sm px-4 py-2.5 text-sm font-medium transition-colors"
      >
        Back to sign up
      </Link>
    </main>
  );
}

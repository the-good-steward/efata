import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ResetForm } from "@/components/reset-forms";
import { Mark } from "@/components/logo";

export const metadata = { title: "Set a new password · Efata" };

export default async function ResetPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The recovery link signs them in. Arriving without a session means
  // the link expired, was already used, or was opened in a different
  // browser from the one that asked for it.
  if (!user) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <Mark size={36} />
          <h1 className="ef-display text-paper mt-8">That link has expired</h1>
          <p className="ef-body text-ink-2 mt-4">
            Reset links last an hour and work once. Opening one in a different
            browser from the one you requested it in will also do this.
          </p>
          <Link
            href="/forgot"
            className="bg-ink text-ground w-full rounded-full px-6 py-4 text-[17px] font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send a new link
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <ResetForm />
    </main>
  );
}

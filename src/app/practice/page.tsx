import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";

export const metadata = { title: "Practice · Efata" };

export default async function PracticePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Belt and braces: the proxy redirects too, but a protected page
  // should never render without verifying for itself.
  if (!user) redirect("/login");

  return (
    <main className="flex flex-1 flex-col px-6 py-16">
      <div className="mx-auto w-full max-w-xl">
        <header className="flex items-baseline justify-between gap-4">
          <div>
            <p className="text-ash font-body text-xs tracking-[0.3em] uppercase">
              Signed in
            </p>
            <p className="text-parchment font-body mt-1 text-sm">
              {user.email}
            </p>
          </div>

          <form action={logout}>
            <button
              type="submit"
              className="text-ash font-body hover:text-parchment text-sm underline underline-offset-4 transition-colors"
            >
              Sign out
            </button>
          </form>
        </header>

        <div className="border-rule mt-12 border-t pt-12">
          <h1 className="text-parchment font-display text-4xl">
            Nothing to practice yet
          </h1>
          <p className="text-ash font-body mt-4 max-w-md text-sm leading-relaxed">
            Question generation and recorded answers land here next. Your
            account is set up and ready.
          </p>
        </div>
      </div>
    </main>
  );
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/app-nav";
import { SituationForm } from "@/components/situation-form";

export const metadata = { title: "A real conversation · Efata" };
export const maxDuration = 60;

export default async function SituationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-dvh flex-col">
      <AppNav email={user.email} />

      <main className="mx-auto w-full max-w-md flex-1 px-5 pb-28">
        <h1 className="ef-display text-ink mt-4">
          Something you have to say
        </h1>
        <p className="ef-body text-ink-2 mt-3">
          Practise it once before you have it for real.
        </p>

        <div className="mt-8">
          <SituationForm />
        </div>
      </main>
    </div>
  );
}

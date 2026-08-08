import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CvRunner } from "@/components/cv-runner";
import { cvSummary, type CvSummary } from "@/lib/cv/extract";

export const metadata = { title: "Your CV · Efata" };
export const maxDuration = 60;

export default async function CvPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: row } = await supabase
    .from("cv_profiles")
    .select("summary, confirmed_at")
    .eq("user_id", user.id)
    .maybeSingle();

  // Only an unconfirmed summary is shown for review. A confirmed one
  // means this step is done, and the page has nothing left to ask.
  let existing: CvSummary | null = null;
  if (row?.summary && !row.confirmed_at) {
    const parsed = cvSummary.safeParse(row.summary);
    if (parsed.success) existing = parsed.data;
  }

  return (
    <div className="h-dvh">
      <CvRunner existing={existing} />
    </div>
  );
}

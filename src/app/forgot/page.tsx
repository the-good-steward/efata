import { ForgotForm } from "@/components/reset-forms";

export const metadata = { title: "Forgotten password · Efata" };

export default function ForgotPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <ForgotForm />
    </main>
  );
}

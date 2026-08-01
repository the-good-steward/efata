import { AuthForm } from "@/components/auth-form";
import { signup } from "@/app/auth/actions";

export const metadata = { title: "Create your account · Efata" };

export default function SignupPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-20">
      <AuthForm mode="signup" action={signup} />
    </main>
  );
}

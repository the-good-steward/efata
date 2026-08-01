import { AuthForm } from "@/components/auth-form";
import { login } from "@/app/auth/actions";

export const metadata = { title: "Sign in · Efata" };

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-20">
      <AuthForm mode="login" action={login} />
    </main>
  );
}

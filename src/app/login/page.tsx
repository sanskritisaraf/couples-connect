import { Suspense } from "react";
import { Logo } from "@/components/Logo";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-6">
      <Logo />
      <div className="flex flex-1 items-center">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}

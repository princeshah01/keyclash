import { Suspense } from "react";
import { AuthCallback } from "@/components/player/auth-callback";

export const metadata = { title: "Signing in" };

export default function AuthCallbackPage() {
  return (
    <main className="flex flex-1 items-center justify-center pb-24">
      <Suspense>
        <AuthCallback />
      </Suspense>
    </main>
  );
}

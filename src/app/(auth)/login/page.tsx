import { Suspense } from "react";
import LoginPage from "./page.client";

export default function LoginRoute() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bone flex items-center justify-center">
          <p className="font-mono text-[13px] text-stone">Loading…</p>
        </div>
      }
    >
      <LoginPage />
    </Suspense>
  );
}

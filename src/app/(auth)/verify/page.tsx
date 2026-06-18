import { Suspense } from "react";
import VerifyPage from "./page.client";

export default function VerifyRoute() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bone flex items-center justify-center">
          <p className="font-mono text-[13px] text-stone">Loading…</p>
        </div>
      }
    >
      <VerifyPage />
    </Suspense>
  );
}

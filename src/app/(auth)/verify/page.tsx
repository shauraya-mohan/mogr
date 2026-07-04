import { Suspense } from "react";
import VerifyPage from "./page.client";
import Loader from "@/components/Loader";

export default function VerifyRoute() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bone flex flex-col items-center justify-center gap-5">
          <span className="font-display text-[28px] font-bold tracking-[-0.03em] text-ink">
            mogr<span className="text-bronze">.</span>
          </span>
          <Loader />
        </div>
      }
    >
      <VerifyPage />
    </Suspense>
  );
}

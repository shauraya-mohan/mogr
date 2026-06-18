"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "@/components/ThemeToggle";
import { createClient } from "@/lib/supabase/client";
import { VERIFY } from "@/lib/scan/content";

/**
 * Email verification waiting page.
 *
 * After signup we land here. Detection of "email confirmed" is done WITHOUT
 * storing any credentials:
 *   1. onAuthStateChange — fires SIGNED_IN if confirmation happens in this
 *      browser (the /auth/confirm route sets the session cookie).
 *   2. A periodic getSession() poll + a re-check whenever the tab regains
 *      focus — catches the session the moment the confirm cookie lands, even
 *      if the link was opened in another tab of the same browser.
 *
 * If the user confirms on a different device, this tab won't auto-advance
 * (there's no session here to detect) — they just sign in via the link/login,
 * which the "back to login" fallback covers.
 */
export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  const [verified, setVerified] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const doneRef = useRef(false);

  const markVerified = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    sessionStorage.removeItem("mogr-verify-email");
    setVerified(true);
  }, []);

  // Detect confirmation: auth events + session poll + focus re-check.
  useEffect(() => {
    if (errorParam) return;
    const supabase = createClient();

    const check = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) markVerified();
    };

    check(); // immediate
    const poll = setInterval(check, 3000);
    const onVisible = () => {
      if (!document.hidden) check();
    };
    document.addEventListener("visibilitychange", onVisible);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || session) markVerified();
    });

    return () => {
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
      subscription.unsubscribe();
    };
  }, [errorParam, markVerified]);

  // Once verified, count down and redirect to /scan.
  useEffect(() => {
    if (!verified) return;
    if (countdown <= 0) {
      router.push("/scan");
      router.refresh();
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [verified, countdown, router]);

  return (
    <div className="min-h-screen bg-bone text-ink flex flex-col">
      <header className="container-page flex items-center justify-between h-[var(--header-h)]">
        <Link href="/" className="relative block h-8 w-[120px]" aria-label="mogr home">
          <Image
            className="logo-light object-contain object-left"
            src="/assets/mogr-logo-horizontal.webp"
            alt="mogr."
            fill
            sizes="120px"
            priority
          />
          <Image
            className="logo-dark object-contain object-left"
            src="/assets/mogr-logo-horizontal-dark.png"
            alt="mogr."
            fill
            sizes="120px"
            priority
          />
        </Link>
        <ThemeToggle />
      </header>

      <main className="container-page flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-[480px] text-center">
          {/* ── Error state ── */}
          {errorParam && (
            <>
              <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--ink-08)]">
                <span className="text-[28px]">✕</span>
              </div>
              <p className="eyebrow mb-4 justify-center">{VERIFY.errorEyebrow}</p>
              <h1 className="font-display font-bold text-[clamp(28px,5vw,40px)] tracking-[-0.04em] leading-[0.95] mb-4">
                {VERIFY.errorTitle}
              </h1>
              <p className="text-graphite text-[clamp(15px,2vw,17px)] leading-relaxed max-w-[38ch] mx-auto mb-8">
                {errorParam}
              </p>
              <Link
                href="/login"
                className="font-mono text-[13px] text-bronze transition-colors duration-[400ms] hover:text-ink"
              >
                {VERIFY.backToLogin}
              </Link>
            </>
          )}

          {/* ── Verified state ── */}
          {!errorParam && verified && (
            <>
              <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-bronze/15">
                <span className="text-[28px]">✓</span>
              </div>
              <p className="eyebrow mb-4 justify-center">{VERIFY.successEyebrow}</p>
              <h1 className="font-display font-bold text-[clamp(28px,5vw,40px)] tracking-[-0.04em] leading-[0.95] mb-4">
                {VERIFY.successTitle}
              </h1>
              <p className="text-graphite text-[clamp(15px,2vw,17px)] leading-relaxed max-w-[38ch] mx-auto">
                {VERIFY.successBody(countdown)}
              </p>
            </>
          )}

          {/* ── Waiting state ── */}
          {!errorParam && !verified && (
            <>
              <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-bronze/10 animate-pulse">
                <span className="text-[28px]">✉</span>
              </div>
              <p className="eyebrow mb-4 justify-center">{VERIFY.waitingEyebrow}</p>
              <h1 className="font-display font-bold text-[clamp(28px,5vw,40px)] tracking-[-0.04em] leading-[0.95] mb-4">
                {VERIFY.waitingTitle}
              </h1>
              <p className="text-graphite text-[clamp(15px,2vw,17px)] leading-relaxed max-w-[38ch] mx-auto mb-8">
                {VERIFY.waitingBody}
              </p>

              <div className="flex items-center justify-center gap-2 mb-8">
                <span className="w-2 h-2 rounded-full bg-bronze/40 animate-pulse" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-bronze/40 animate-pulse" style={{ animationDelay: "300ms" }} />
                <span className="w-2 h-2 rounded-full bg-bronze/40 animate-pulse" style={{ animationDelay: "600ms" }} />
              </div>

              <p className="font-mono text-[12px] text-stone mb-8">
                {VERIFY.waitingHint}
              </p>

              <Link
                href="/login"
                className="font-mono text-[13px] text-bronze transition-colors duration-[400ms] hover:text-ink"
              >
                {VERIFY.backToLogin}
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

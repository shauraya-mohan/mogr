"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "@/components/ThemeToggle";
import Button from "@/components/Button";
import Loader from "@/components/Loader";
import { createClient } from "@/lib/supabase/client";
import { VERIFY } from "@/lib/scan/content";

/**
 * Email verification waiting page.
 *
 * Two ways to get verified, no credentials stored:
 *   1. 6-digit code entry (works cross-device) — read the code from the email
 *      on any device, type it here; verifyOtp creates the session on THIS
 *      device, so we advance directly. This is the reliable path in local dev,
 *      where the magic link points at localhost and can't be opened elsewhere.
 *   2. Magic link on the same browser — the /auth/confirm route sets the
 *      session cookie; we pick it up via a getSession() poll + onAuthStateChange
 *      + a focus re-check.
 */
export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  const [verified, setVerified] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [email, setEmail] = useState("");
  const [hadStoredEmail, setHadStoredEmail] = useState(false);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const doneRef = useRef(false);

  const markVerified = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    sessionStorage.removeItem("mogr-verify-email");
    setVerified(true);
  }, []);

  // Prefill the email captured at signup (non-sensitive).
  useEffect(() => {
    const stored = sessionStorage.getItem("mogr-verify-email");
    if (stored) {
      setEmail(stored);
      setHadStoredEmail(true);
    }
  }, []);

  // Passive detection for same-browser magic-link confirmation.
  useEffect(() => {
    if (errorParam) return;
    const supabase = createClient();

    const check = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) markVerified();
    };

    check();
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

  // Verify the 6-digit code — creates the session on this device.
  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setCodeError(null);
    if (!email) {
      setCodeError(VERIFY.needEmail);
      return;
    }
    const token = code.replace(/\D/g, "");
    if (token.length !== 6) {
      setCodeError(VERIFY.codeInvalid);
      return;
    }
    setSubmitting(true);
    const supabase = createClient();
    // The OTP type for a signup confirmation varies across Supabase versions
    // ('signup' vs 'email'); try both so a valid code always verifies.
    let { error } = await supabase.auth.verifyOtp({ email, token, type: "signup" });
    if (error) {
      ({ error } = await supabase.auth.verifyOtp({ email, token, type: "email" }));
    }
    if (error) {
      setCodeError(error.message);
      setSubmitting(false);
      return;
    }
    markVerified(); // session is now set on this device
  }

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

  const inputClass =
    "w-full bg-bone border border-[var(--ink-08)] rounded-[10px] px-4 py-3 text-graphite font-body text-[15px] outline-none focus:border-bronze transition-colors duration-[400ms]";

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
              <div className="mb-6 flex mx-auto items-center justify-center w-16 h-16 rounded-full bg-[var(--ink-08)]">
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
              <div className="mb-6 flex mx-auto items-center justify-center w-16 h-16 rounded-full bg-bronze/15">
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

          {/* ── Waiting state (code entry) ── */}
          {!errorParam && !verified && (
            <>
              <div className="mb-6 flex mx-auto items-center justify-center w-16 h-16 rounded-full bg-bronze/10 animate-pulse">
                <span className="text-[28px]">✉</span>
              </div>
              <p className="eyebrow mb-4 justify-center">{VERIFY.waitingEyebrow}</p>
              <h1 className="font-display font-bold text-[clamp(28px,5vw,40px)] tracking-[-0.04em] leading-[0.95] mb-4">
                {VERIFY.waitingTitle}
              </h1>
              <p className="text-graphite text-[clamp(15px,2vw,17px)] leading-relaxed max-w-[38ch] mx-auto mb-8">
                {VERIFY.waitingBody}
              </p>

              <form
                onSubmit={handleVerifyCode}
                className="bg-cloud border border-[var(--ink-08)] rounded-[18px] p-[clamp(20px,4vw,32px)] grid gap-4 text-left"
              >
                {!hadStoredEmail && (
                  <label className="grid gap-2">
                    <span className="font-mono text-[12px] tracking-[0.14em] uppercase text-stone">
                      {VERIFY.emailLabel}
                    </span>
                    <input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClass}
                    />
                  </label>
                )}
                <label className="grid gap-2">
                  <span className="font-mono text-[12px] tracking-[0.14em] uppercase text-stone">
                    {VERIFY.codeLabel}
                  </span>
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder={VERIFY.codePlaceholder}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    className={`${inputClass} font-mono tracking-[0.4em] text-[20px] text-center`}
                  />
                </label>

                {codeError && (
                  <p className="text-[14px] text-bronze" role="alert">
                    {codeError}
                  </p>
                )}

                <Button type="submit" size="lg" dot={!submitting} disabled={submitting} className="w-full justify-center">
                  {submitting ? <Loader /> : VERIFY.verifyButton}
                </Button>
              </form>

              <p className="font-mono text-[12px] text-stone mt-6 mb-6">
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

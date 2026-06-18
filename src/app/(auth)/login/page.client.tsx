"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Button from "@/components/Button";
import ThemeToggle from "@/components/ThemeToggle";
import { createClient } from "@/lib/supabase/client";
import { AUTH } from "@/lib/scan/content";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/scan";

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    if (mode === "signup") {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }
    }

    router.push(next.startsWith("/") ? next : "/scan");
    router.refresh();
  }

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
        <div className="w-full max-w-[420px]">
          <p className="eyebrow mb-4">
            {mode === "signin" ? AUTH.signInEyebrow : AUTH.signUpEyebrow}
          </p>
          <h1 className="font-display font-bold text-[clamp(32px,6vw,48px)] tracking-[-0.04em] leading-[0.95] mb-8">
            {mode === "signin" ? AUTH.signInTitle : AUTH.signUpTitle}
          </h1>

          <form
            onSubmit={handleSubmit}
            className="bg-cloud border border-[var(--ink-08)] rounded-[18px] p-[clamp(24px,4vw,36px)] grid gap-5"
          >
            <label className="grid gap-2">
              <span className="font-mono text-[12px] tracking-[0.14em] uppercase text-stone">
                {AUTH.emailLabel}
              </span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-bone border border-[var(--ink-08)] rounded-[10px] px-4 py-3 text-graphite font-body text-[15px] outline-none focus:border-bronze transition-colors duration-[400ms]"
              />
            </label>

            <label className="grid gap-2">
              <span className="font-mono text-[12px] tracking-[0.14em] uppercase text-stone">
                {AUTH.passwordLabel}
              </span>
              <input
                type="password"
                required
                minLength={6}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-bone border border-[var(--ink-08)] rounded-[10px] px-4 py-3 text-graphite font-body text-[15px] outline-none focus:border-bronze transition-colors duration-[400ms]"
              />
            </label>

            {error && (
              <p className="text-[14px] text-bronze" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full justify-center">
              {loading ? "…" : mode === "signin" ? AUTH.signIn : AUTH.signUp}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
            }}
            className="mt-6 font-mono text-[13px] text-graphite transition-colors duration-[400ms] hover:text-bronze"
          >
            {mode === "signin" ? AUTH.toggleSignUp : AUTH.toggleSignIn}
          </button>
        </div>
      </main>
    </div>
  );
}

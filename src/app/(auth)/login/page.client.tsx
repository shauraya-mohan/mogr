"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Button from "@/components/Button";
import Loader from "@/components/Loader";
import ThemeToggle from "@/components/ThemeToggle";
import { createClient } from "@/lib/supabase/client";
import { AUTH } from "@/lib/scan/content";

type Mode = "signin" | "signup";

// Borderless underline input — editorial, not a boxed field.
const INPUT_CLS =
  "mt-2.5 w-full rounded-none border-0 border-b border-[var(--ink-12)] bg-transparent px-0 py-2.5 font-body text-[16px] text-ink outline-none transition-colors duration-300 focus:border-bronze";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const explicitNext = searchParams.get("next");

  // Where to land after auth: an explicit target if the user was redirected
  // here, otherwise scan-aware — brand-new users (no scans) go to /scan to
  // onboard, returning users go straight to /dashboard.
  async function resolveDest(
    supabase: ReturnType<typeof createClient>,
  ): Promise<string> {
    if (explicitNext && explicitNext.startsWith("/")) return explicitNext;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return "/scan";
    const { count } = await supabase
      .from("scans")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    return (count ?? 0) > 0 ? "/dashboard" : "/scan";
  }

  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
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
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(explicitNext || "/dashboard")}`,
          // Read by the handle_new_user() trigger to populate `profiles`.
          data: { full_name: name.trim(), age },
        },
      });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }
      // If email confirmation is disabled (e.g. local-dev auto-confirm),
      // signUp returns a live session — go straight in. When confirmation is
      // required (prod), session is null and we wait on the verify page.
      if (data.session) {
        router.push(await resolveDest(supabase));
        router.refresh();
        return;
      }
      // Remember the email for display on the verify page (non-sensitive).
      sessionStorage.setItem("mogr-verify-email", email);
      router.push("/verify");
      return;
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

    router.push(await resolveDest(supabase));
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

      <main className="container-page flex-1 grid items-center gap-[clamp(40px,7vw,96px)] py-[clamp(32px,6vh,72px)] lg:grid-cols-[1.05fr_0.95fr]">
        {/* Left — brand thesis (fills the void; type carries it) */}
        <div className="hidden lg:block">
          <p className="eyebrow mb-7">{mode === "signin" ? AUTH.signInEyebrow : AUTH.signUpEyebrow}</p>
          <h2 className="font-display font-bold text-[clamp(52px,6vw,88px)] leading-[0.9] tracking-[-0.04em] text-ink text-balance">
            Look like<br />you mean it<span className="text-bronze">.</span>
          </h2>
          <p className="mt-7 max-w-[36ch] text-graphite text-[clamp(15px,1.3vw,18px)] leading-relaxed">
            One scan builds your grooming profile across skin, hair, beard and
            wardrobe, then coaches the upgrade.
          </p>
          <div className="mt-9 flex items-end gap-[3px]" aria-hidden>
            {[10, 16, 22, 16, 10, 20, 13].map((h, i) => (
              <span key={i} className="w-[3px] rounded-[1px] bg-bronze/70" style={{ height: h }} />
            ))}
          </div>
        </div>

        {/* Right — the form, borderless, underline inputs */}
        <div className="mx-auto w-full max-w-[400px] lg:mx-0 lg:justify-self-end">
          <h1 className="font-display font-bold text-[clamp(30px,4.4vw,42px)] tracking-[-0.04em] leading-[0.95]">
            {mode === "signin" ? AUTH.signInTitle : AUTH.signUpTitle}
          </h1>
          <p className="mt-2 mb-9 text-graphite text-[15px]">
            {mode === "signin"
              ? "Pick up where you left off."
              : "A minute to set up, then scan."}
          </p>

          <form onSubmit={handleSubmit} className="grid gap-7">
            {mode === "signup" && (
              <div className="grid grid-cols-[1.7fr_1fr] gap-6">
                <label className="block">
                  <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-stone">
                    {AUTH.nameLabel}
                  </span>
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={INPUT_CLS}
                  />
                </label>
                <label className="block">
                  <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-stone">
                    {AUTH.ageLabel}
                  </span>
                  <input
                    type="number"
                    required
                    min={13}
                    max={120}
                    inputMode="numeric"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className={INPUT_CLS}
                  />
                </label>
              </div>
            )}

            <label className="block">
              <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-stone">
                {AUTH.emailLabel}
              </span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={INPUT_CLS}
              />
            </label>

            <label className="block">
              <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-stone">
                {AUTH.passwordLabel}
              </span>
              <input
                type="password"
                required
                minLength={6}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={INPUT_CLS}
              />
            </label>

            {error && (
              <p className="text-[14px] text-bronze" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" dot={!loading} disabled={loading} className="mt-1 w-full justify-center">
              {loading ? <Loader /> : mode === "signin" ? AUTH.signIn : AUTH.signUp}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
            }}
            className="mt-8 font-mono text-[13px] text-graphite transition-colors duration-[400ms] hover:text-ink"
          >
            {mode === "signin" ? AUTH.toggleSignUp : AUTH.toggleSignIn}
          </button>
        </div>
      </main>
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { createClient } from "@/lib/supabase/client";
import { AUTH } from "@/lib/scan/content";

export default function AppHeader() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 bg-bone/70 backdrop-blur-md border-b border-[var(--ink-08)]">
      <div className="container-page flex items-center justify-between gap-6 h-[var(--header-h)]">
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
        <div className="flex items-center gap-[clamp(14px,2vw,24px)]">
          <ThemeToggle />
          <button
            type="button"
            onClick={handleSignOut}
            className="font-mono text-[13px] text-graphite transition-colors duration-[400ms] hover:text-ink"
          >
            {AUTH.signOut}
          </button>
        </div>
      </div>
    </header>
  );
}

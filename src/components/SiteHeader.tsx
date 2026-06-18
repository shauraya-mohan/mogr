"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Button from "./Button";
import ThemeToggle from "./ThemeToggle";
import { createClient } from "@/lib/supabase/client";

/**
 * Sticky header: transparent → bone + hairline once scrolled past the hero.
 * The scrolled state (.is-scrolled) is driven by the motion layer via
 * window.__mogrHeaderUpdate (Lenis scroll, with a native-scroll fallback
 * under reduced motion). This component is just structure + theme toggle.
 *
 * Auth-aware navigation:
 * - Logged out → "log in" link + "start scan" (→ /scan, middleware redirects to /login)
 * - Logged in  → "dashboard" link + "start scan" (no "log in")
 */
export default function SiteHeader() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Check initial auth state
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });

    // Listen for auth changes (login / logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="site-header" id="siteHeader" data-screen-label="header">
      <div className="container-page flex items-center justify-between gap-6">
        <Link className="brand" href="/" aria-label="mogr home">
          {/* Logo: cropped horizontal lockup (mark + wordmark). Do not redraw. */}
          <Image
            className="logo-light"
            src="/assets/mogr-logo-horizontal.webp"
            alt="mogr."
            width={280}
            height={120}
            priority
          />
          <Image
            className="logo-dark"
            src="/assets/mogr-logo-horizontal-dark.png"
            alt="mogr."
            width={280}
            height={120}
            priority
          />
        </Link>
        <nav
          className="flex items-center gap-[clamp(16px,3vw,36px)] max-[620px]:gap-[14px]"
          aria-label="Primary"
        >
          {/* Show "log in" only when logged out; "dashboard" only when logged in */}
          {isLoggedIn === false && (
            <Link className="nav-link max-[620px]:hidden" href="/login">
              log in
            </Link>
          )}
          {isLoggedIn === true && (
            <Link className="nav-link max-[620px]:hidden" href="/dashboard">
              dashboard
            </Link>
          )}
          <ThemeToggle />
          <Button href="/scan" size="sm">
            start scan
          </Button>
        </nav>
      </div>
    </header>
  );
}

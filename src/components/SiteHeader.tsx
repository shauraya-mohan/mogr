"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Button from "./Button";
import { createClient } from "@/lib/supabase/client";

/**
 * Sticky header: transparent full-width bar → a floating rounded pill once
 * scrolled past the hero. The scrolled state (.is-scrolled) is driven by the
 * motion layer via window.__mogrHeaderUpdate (Lenis scroll, with a
 * native-scroll fallback under reduced motion) — see globals.css for the
 * shape/shadow transition. The landing page always reads as the dark theme
 * (see .hero / .site-header overrides in globals.css), so there's no theme
 * toggle here — it previously let a light-mode flip bleed into sections that
 * are meant to stay fixed-dark.
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
          {/* Logged out → "log in"; logged in → "dashboard".
             Text link on desktop; a compact circular icon (matching the theme
             toggle) on mobile so the destination is always reachable. */}
          {isLoggedIn === false && (
            <>
              <Link className="nav-link max-[620px]:hidden" href="/login">
                log in
              </Link>
              <Link className="theme-toggle narrow:hidden" href="/login" aria-label="Log in">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="8.5" r="3.6" />
                  <path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" />
                </svg>
              </Link>
            </>
          )}
          {isLoggedIn === true && (
            <>
              <Link className="nav-link max-[620px]:hidden" href="/dashboard">
                dashboard
              </Link>
              <Link className="theme-toggle narrow:hidden" href="/dashboard" aria-label="Dashboard">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="7" height="7" rx="1.6" />
                  <rect x="14" y="3" width="7" height="7" rx="1.6" />
                  <rect x="14" y="14" width="7" height="7" rx="1.6" />
                  <rect x="3" y="14" width="7" height="7" rx="1.6" />
                </svg>
              </Link>
            </>
          )}
          <Button href="/scan" size="sm">
            start scan
          </Button>
        </nav>
      </div>
    </header>
  );
}

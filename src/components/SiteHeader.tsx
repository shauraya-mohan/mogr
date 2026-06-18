"use client";

import Image from "next/image";
import Link from "next/link";
import Button from "./Button";
import ThemeToggle from "./ThemeToggle";
import { NAV_LINKS } from "@/lib/content";

/**
 * Sticky header: transparent → bone + hairline once scrolled past the hero.
 * The scrolled state (.is-scrolled) is driven by the motion layer via
 * window.__mogrHeaderUpdate (Lenis scroll, with a native-scroll fallback
 * under reduced motion). This component is just structure + theme toggle.
 */
export default function SiteHeader() {
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
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              className={`nav-link${link.hideOnMobile ? " max-[620px]:hidden" : ""}`}
              href={link.href}
            >
              {link.label}
            </Link>
          ))}
          <ThemeToggle />
          <Button href="/scan" size="sm">
            start scan
          </Button>
        </nav>
      </div>
    </header>
  );
}

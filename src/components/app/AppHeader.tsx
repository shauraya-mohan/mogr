import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export default function AppHeader() {
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
        <ThemeToggle />
      </div>
    </header>
  );
}

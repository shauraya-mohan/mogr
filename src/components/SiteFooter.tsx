import Image from "next/image";
import { FOOTER_COLUMNS } from "@/lib/content";

/**
 * Footer — built entirely with Tailwind utilities + brand tokens. This is the
 * reference pattern for feature UI: no bespoke CSS, colors/fonts come straight
 * from the @theme tokens (so it tracks dark mode automatically).
 */
export default function SiteFooter() {
  return (
    <footer
      className="bg-bone border-t border-[var(--ink-12)] py-[clamp(56px,9vh,110px)]"
      id="footer"
      data-screen-label="footer"
    >
      <div className="container-page">
        <div className="grid grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,0.6fr))] gap-[clamp(28px,5vw,64px)] items-start max-[900px]:grid-cols-2 max-[620px]:grid-cols-1">
          <div className="max-[900px]:col-span-full">
            {/* Footer logo: full lockup, larger. Do not redraw. */}
            <Image
              className="logo-light footer-brand-logo"
              src="/assets/mogr-logo.webp"
              alt="mogr."
              width={360}
              height={360}
            />
            <Image
              className="logo-dark footer-brand-logo"
              src="/assets/mogr-logo-dark.png"
              alt="mogr."
              width={360}
              height={360}
            />
            <p className="mt-[18px] max-w-[34ch] text-graphite text-[15px]">
              Men&apos;s grooming, systemized. Scan your face, hair, beard and
              wardrobe. Get coaching and a preview of the upgraded you.
            </p>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.heading}>
              <h5 className="flex items-center gap-2 mb-4 font-mono text-[12px] tracking-[0.14em] uppercase text-stone">
                <span className="w-[5px] h-[5px] rounded-full bg-bronze" />
                {col.heading}
              </h5>
              <ul className="list-none m-0 p-0 grid gap-[11px]">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <a
                      className="font-mono text-[13px] text-graphite transition-colors duration-[400ms] hover:text-bronze"
                      href={link.href}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-[clamp(40px,7vh,72px)] pt-[22px] border-t border-[var(--ink-12)] flex justify-between items-center gap-4 flex-wrap font-mono text-[12px] tracking-[0.04em] text-stone">
          <span>
            © 2026 mogr<span className="dot">.</span> studio
          </span>
          <div className="flex gap-[22px] flex-wrap">
            <span>groommax™</span>
            <span>built for the upgrade</span>
            <span>v1.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

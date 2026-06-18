import Button from "./Button";
import Typewriter from "./Typewriter";
import { TYPEWRITER_WORDS } from "@/lib/content";

export default function Hero() {
  return (
    <section className="hero container-page" id="hero" data-screen-label="hero">
      <p className="eyebrow reveal-up">groommax · men&apos;s grooming, systemized</p>

      <Typewriter words={TYPEWRITER_WORDS} />

      <div className="mt-[clamp(30px,5vh,52px)] flex items-end justify-between gap-[clamp(24px,5vw,72px)] flex-wrap max-[620px]:gap-[22px]">
        <p className="hero-sub reveal-up">
          Scan once. A grooming routine built around your skin, hair, beard and
          wardrobe — and a preview of the upgraded you.
        </p>
        <div className="reveal-up flex items-center gap-[clamp(16px,2vw,28px)] flex-wrap">
          <Button href="/scan" size="lg">
            Start your scan
          </Button>
          <a className="hero-textlink" href="#how">
            See how it works →
          </a>
        </div>
      </div>
    </section>
  );
}

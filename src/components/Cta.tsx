import Button from "./Button";

/**
 * Big closing CTA. The headline reveals line-by-line (each `.line > span`
 * slides up from behind a clip edge) via the motion layer.
 */
export default function Cta() {
  return (
    <section
      className="section-pad container-page text-center"
      id="start"
      data-screen-label="cta"
    >
      <p className="eyebrow justify-center mb-[26px]">your move</p>
      <h2 className="cta-headline" id="ctaHeadline" aria-label="Time to lock in.">
        <span className="line">
          <span>Time to</span>
        </span>
        <span className="line">
          <span>
            lock in<span className="dot">.</span>
          </span>
        </span>
      </h2>
      <div className="mt-[clamp(36px,6vh,60px)] flex justify-center gap-4 flex-wrap">
        <Button href="/scan" size="lg">
          Start your scan
        </Button>
      </div>
      <p className="mt-[22px] font-mono text-[12px] tracking-[0.06em] text-stone">
        Takes about two minutes · no equipment
      </p>
    </section>
  );
}

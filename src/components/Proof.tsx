import { PROOF_FRAMES, type ProofFrame } from "@/lib/content";

function Frame({ frame }: { frame: ProofFrame }) {
  return (
    <article className={`proof-frame reveal-up${frame.isAfter ? " is-after" : ""}`}>
      {/* Replace .proof-frame__img background with a real photo when ready. */}
      <div className="proof-frame__img">
        <span className="proof-frame__tag">{frame.tag}</span>
        <span className="proof-frame__ph">{frame.placeholder}</span>
      </div>
      <div className="proof-frame__cap">
        <h4>{frame.heading}</h4>
        <p>{frame.body}</p>
      </div>
    </article>
  );
}

export default function Proof() {
  const [today, after] = PROOF_FRAMES;
  return (
    <section
      className="proof section-pad container-page"
      id="proof"
      data-screen-label="proof"
    >
      <div className="text-center mb-[clamp(34px,6vh,64px)]">
        <p className="eyebrow justify-center">the preview</p>
        <h2
          className="section-title reveal-up mx-auto text-center max-w-[22ch]"
        >
          See where you&apos;re headed<span className="dot">.</span>
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-[clamp(16px,2.4vw,32px)] items-stretch relative max-[620px]:grid-cols-1 max-[620px]:gap-[14px]">
        <Frame frame={today} />
        <div className="proof-arrow" aria-hidden="true">
          →
        </div>
        <Frame frame={after} />
      </div>
      <p className="text-center mt-[clamp(26px,4vh,40px)] font-mono text-[13px] tracking-[0.04em] text-stone">
        Encouraging coaching — not a number.
      </p>
    </section>
  );
}

import { HOW_STEPS } from "@/lib/content";

/**
 * Pinned section: steps swap as you scroll. The pin + active-step switching
 * is driven by the motion layer (useLandingMotion), which toggles `.is-active`
 * on `.how-step[data-step]` and `.is-on` on the progress ticks. Markup here
 * just provides the structure + the initial active state.
 */
export default function HowItWorks() {
  return (
    <section className="how" id="how" data-screen-label="how-it-works">
      <div className="how-pin container-page">
        <div className="how-head">
          <p className="eyebrow">how it works</p>
        </div>
        <div className="how-stage" id="howStage">
          {HOW_STEPS.map((step, i) => (
            <div
              key={step.num}
              className={`how-step${i === 0 ? " is-active" : ""}`}
              data-step={i}
            >
              <div className="how-step__num">
                {step.num}
                <span className="sep"> / </span>
              </div>
              <div className="how-step__body">
                <p className="how-tag">{step.tag}</p>
                <h3>
                  {step.title}
                  <span className="dot">.</span>
                </h3>
                <p>{step.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="how-progress" id="howProgress">
          {HOW_STEPS.map((step, i) => (
            <span key={step.num} className={`tick${i === 0 ? " is-on" : ""}`}>
              <span />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

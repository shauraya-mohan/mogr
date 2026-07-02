/**
 * "Why mogr" — the masked heading slides its two lines up from behind a clip
 * edge. The prototype built this structure at runtime from a data-masked
 * attribute; here it's authored directly. The motion layer finds `.word`
 * nodes under `[data-masked]` and tweens them. data-masked is kept so the
 * selector still matches and aria-label stays in sync.
 */
const MASKED_LINES = ["One profile.", "Every angle."] as const;

function MaskedHeading() {
  return (
    <h2
      className="masked-heading"
      data-masked={MASKED_LINES.join("|")}
      aria-label={MASKED_LINES.join(" ")}
    >
      {MASKED_LINES.map((line) => {
        const endsWithDot = line.endsWith(".");
        const text = endsWithDot ? line.slice(0, -1) : line;
        return (
          <span key={line} className="mask" style={{ display: "block" }}>
            <span className="word">
              {text}
              {endsWithDot && <span className="dot">.</span>}
            </span>
          </span>
        );
      })}
    </h2>
  );
}

export default function WhyMogr() {
  return (
    <section className="why section-pad container-page" id="why" data-screen-label="why">
      <div className="grid grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] gap-[clamp(32px,6vw,96px)] items-start max-[900px]:grid-cols-1 max-[900px]:gap-10">
        <div>
          <p className="eyebrow">why mogr</p>
          <MaskedHeading />
        </div>
        <div className="why-body">
          <p className="reveal-up">
            One scan feeds skin, hair, beard and style at the same time, so the
            advice fits together instead of pulling four ways.
          </p>
          <p className="reveal-up">
            It remembers. Every check-in sharpens the read, so the coaching gets
            more like you the longer you stay with it.
          </p>
          <ul className="why-list">
            <li className="reveal-up">One capture, four reads</li>
            <li className="reveal-up">Coaching, not a scorecard</li>
            <li className="reveal-up">Smarter with every check-in</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

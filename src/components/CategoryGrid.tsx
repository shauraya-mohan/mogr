import { CATEGORIES, type Category } from "@/lib/content";

function CategoryCard({ cat }: { cat: Category }) {
  return (
    <article className="cat-card reveal-up" tabIndex={0}>
      {/* Replace .cat-card__media background with a real image when ready. */}
      <div className="cat-card__media">
        <span className="cat-card__placeholder">{cat.placeholder}</span>
      </div>
      <span className="cat-card__index">{cat.indexLabel}</span>
      <span className="cat-card__label">{cat.label}</span>
      <div className="cat-card__overlay">
        <span className="ov-cat">{cat.overlayCat}</span>
        <div className="ov-rule" />
        <span className="ov-label">{cat.label}</span>
        <p className="ov-desc">{cat.description}</p>
      </div>
    </article>
  );
}

export default function CategoryGrid() {
  return (
    <section
      className="section-pad container-page"
      id="categories"
      data-screen-label="categories"
    >
      <div className="flex items-end justify-between gap-6 mb-[clamp(28px,5vh,56px)] flex-wrap">
        <div>
          <p className="eyebrow">what we read</p>
          <h2 className="section-title reveal-up">
            Four reads. One self<span className="dot">.</span>
          </h2>
        </div>
        <p
          className="reveal-up max-w-[34ch] text-graphite"
        >
          Hover any read to see what mogr builds for it. Imagery is placeholder —
          swap in your own.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-[clamp(14px,1.8vw,22px)] max-[620px]:grid-cols-1">
        {CATEGORIES.map((cat) => (
          <CategoryCard key={cat.index} cat={cat} />
        ))}
      </div>
    </section>
  );
}

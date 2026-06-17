/* ============================================================
   mogr. — Tweaks panel app (design tool only)
   Bridges the React Tweaks UI to the vanilla page:
   - accent  -> sets the --bronze CSS variable directly
   - motion / words / hero theme -> dispatched as a 'mogrtweak'
     CustomEvent that main.js listens for.
   Delete this file + its <script> tags to ship a clean page.
   ============================================================ */
const { useEffect } = React;

const MOGR_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#B07A3C",
  "motionSpeed": 1,
  "heroWords": "Ascend., Lock in., Level up., Glow up., Mog."
}/*EDITMODE-END*/;

function MogrTweaksApp() {
  const [t, setTweak] = useTweaks(MOGR_TWEAK_DEFAULTS);

  // Accent → CSS variable (sparingly-used single accent across the page)
  useEffect(() => {
    document.documentElement.style.setProperty("--bronze", t.accent);
  }, [t.accent]);

  // Motion / words → notify the vanilla animation layer
  useEffect(() => {
    const words = String(t.heroWords)
      .split(",")
      .map((w) => w.trim())
      .filter(Boolean);
    window.dispatchEvent(new CustomEvent("mogrtweak", {
      detail: {
        motionSpeed: Number(t.motionSpeed) || 1,
        words: words
      }
    }));
  }, [t.motionSpeed, t.heroWords]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Brand accent" />
      <TweakColor
        label="Accent"
        value={t.accent}
        options={["#B07A3C", "#8F5E2A", "#C98A45", "#7A6A4A"]}
        onChange={(v) => setTweak("accent", v)}
      />

      <TweakSection label="Motion" />
      <TweakSlider
        label="Motion speed"
        value={t.motionSpeed}
        min={0.6} max={1.6} step={0.1} unit="×"
        onChange={(v) => setTweak("motionSpeed", v)}
      />

      <TweakSection label="Hero" />
      <TweakText
        label="Typewriter words"
        value={t.heroWords}
        onChange={(v) => setTweak("heroWords", v)}
      />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById("tweaks-root")).render(<MogrTweaksApp />);

/* ============================================================
   mogr. — animation layer
   GSAP + ScrollTrigger + Lenis (smooth scroll).
   Motion is slow + deliberate (no bounce). Everything degrades
   gracefully when prefers-reduced-motion is set.
   ============================================================ */
(function () {
  "use strict";

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGSAP = typeof window.gsap !== "undefined";

  /* Tweakable runtime state (driven by the Tweaks panel) */
  var state = {
    motionSpeed: 1,                 // 1 = base; >1 faster, <1 slower
    words: ["Ascend.", "Lock in.", "Level up.", "Glow up.", "Mog."]
  };

  /* Base easing + duration for entrance tweens */
  var EASE = "power3.out";
  var BASE_DUR = 0.95;
  function dur(d) { return (d || BASE_DUR) / state.motionSpeed; }

  document.documentElement.classList.add("js-ready");

  /* --------------------------------------------------------
     TYPEWRITER  (type-in → hold → delete → next, looping)
     -------------------------------------------------------- */
  var TW = (function () {
    var el = document.getElementById("typewriter");
    if (!el) return { setWords: function () {} };
    var wordIndex = 0, charIndex = 0, deleting = false, timer = null;

    function render(text) {
      // split trailing period(s) so they can be bronze
      var m = text.match(/^(.*?)(\.+)$/);
      if (m) {
        el.innerHTML = escapeHtml(m[1]) + '<span class="tw-period">' + m[2] + "</span>";
      } else {
        el.textContent = text;
      }
    }
    function escapeHtml(s) {
      return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    function tick() {
      var word = state.words[wordIndex % state.words.length] || "";
      if (!deleting) {
        charIndex++;
        render(word.slice(0, charIndex));
        if (charIndex >= word.length) {
          deleting = true;
          schedule(1100 / state.motionSpeed);  // hold full word
          return;
        }
        schedule((70 + Math.random() * 60) / state.motionSpeed);
      } else {
        charIndex--;
        render(word.slice(0, Math.max(0, charIndex)));
        if (charIndex <= 0) {
          deleting = false;
          wordIndex++;
          schedule(380 / state.motionSpeed);   // pause before next word
          return;
        }
        schedule(40 / state.motionSpeed);
      }
    }
    function schedule(ms) { clearTimeout(timer); timer = setTimeout(tick, ms); }

    function start() {
      if (REDUCED) { render(state.words[0] || ""); return; }
      schedule(700);
    }
    function setWords(list) {
      if (Array.isArray(list) && list.length) {
        state.words = list;
        wordIndex = 0; charIndex = 0; deleting = false;
        if (REDUCED) render(state.words[0]);
      }
    }
    start();
    return { setWords: setWords };
  })();

  /* --------------------------------------------------------
     HEADER scroll state (works with or without GSAP)
     -------------------------------------------------------- */
  (function () {
    var header = document.getElementById("siteHeader");
    var hero = document.getElementById("hero");
    if (!header) return;
    function update(y) {
      var threshold = hero ? hero.offsetHeight * 0.55 : 400;
      header.classList.toggle("is-scrolled", y > threshold);
    }
    window.__mogrHeaderUpdate = update;
    update(window.scrollY || 0);
    if (REDUCED || !hasGSAP) {
      window.addEventListener("scroll", function () { update(window.scrollY); }, { passive: true });
    }
  })();

  /* --------------------------------------------------------
     Build masked-heading markup from data-masked="A|B"
     -------------------------------------------------------- */
  function buildMaskedHeadings() {
    var nodes = document.querySelectorAll("[data-masked]");
    nodes.forEach(function (h) {
      var lines = h.getAttribute("data-masked").split("|");
      h.setAttribute("aria-label", lines.join(" "));
      h.innerHTML = "";
      lines.forEach(function (line, i) {
        var mask = document.createElement("span");
        mask.className = "mask";
        mask.style.display = "block";
        var word = document.createElement("span");
        word.className = "word";
        // keep the bronze period device if line ends with '.'
        if (/\.$/.test(line)) {
          word.innerHTML = escapeHtmlSimple(line.slice(0, -1)) + '<span class="dot">.</span>';
        } else {
          word.textContent = line;
        }
        mask.appendChild(word);
        h.appendChild(mask);
      });
    });
  }
  function escapeHtmlSimple(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  buildMaskedHeadings();

  /* --------------------------------------------------------
     THEME TOGGLE — light / dark, persisted. Runs regardless of
     GSAP / reduced-motion. No-flash initial theme is set by the
     inline <head> script.
     -------------------------------------------------------- */
  (function () {
    var btn = document.getElementById("themeToggle");
    var root = document.documentElement;
    function current() {
      return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
    }
    function apply(theme) {
      root.setAttribute("data-theme", theme);
      if (btn) btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
      try { localStorage.setItem("mogr-theme", theme); } catch (e) {}
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    }
    apply(current());
    if (btn) {
      btn.addEventListener("click", function () {
        apply(current() === "dark" ? "light" : "dark");
      });
    }
  })();

  /* --------------------------------------------------------
     If reduced motion or GSAP missing: stop here.
     CSS already shows final states for reveals; just make sure
     masked words are visible.
     -------------------------------------------------------- */
  if (REDUCED || !hasGSAP) {
    document.querySelectorAll(".mask > .word").forEach(function (w) { w.style.transform = "none"; });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* --------------------------------------------------------
     LENIS smooth scroll, wired into GSAP's ticker
     -------------------------------------------------------- */
  var lenis = null;
  if (typeof window.Lenis !== "undefined") {
    lenis = new Lenis({
      duration: 1.15,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true
    });
    lenis.on("scroll", function (e) {
      ScrollTrigger.update();
      if (window.__mogrHeaderUpdate) window.__mogrHeaderUpdate(e.scroll || window.scrollY);
    });
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
    // anchor links → smooth scroll via lenis
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        if (id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -72 });
      });
    });
  }
  window.__mogrLenis = lenis;

  /* --------------------------------------------------------
     Generic reveals — .reveal-up / .reveal-fade
     Per-element triggers (robust to fast / programmatic scroll).
     Elements that share a near-identical top get a small stagger.
     -------------------------------------------------------- */
  gsap.utils.toArray(".reveal-up").forEach(function (el) {
    gsap.to(el, {
      y: 0, opacity: 1, duration: dur(1.0), ease: EASE,
      scrollTrigger: { trigger: el, start: "top 90%", toggleActions: "play none none none" }
    });
  });

  /* --------------------------------------------------------
     MASKED HEADING reveals (words slide up from behind edge)
     -------------------------------------------------------- */
  document.querySelectorAll("[data-masked]").forEach(function (h) {
    var words = h.querySelectorAll(".word");
    gsap.set(words, { yPercent: 115 });
    ScrollTrigger.create({
      trigger: h,
      start: "top 82%",
      once: true,
      onEnter: function () {
        gsap.to(words, {
          yPercent: 0, duration: dur(1.1), ease: EASE,
          stagger: 0.12 / state.motionSpeed
        });
      }
    });
  });

  /* --------------------------------------------------------
     HERO VIDEO STAGE — the film autoplays MUTED (visuals only) and the
     section stays pinned to the viewport for a while as you scroll.
     Audio is controlled ONLY by the sound button — there is no
     auto-unmute, so the voice never plays in the background on its own.
     The HUD timecode / frame counter / progress bar track playback.
     -------------------------------------------------------- */
  (function () {
    var stage = document.getElementById("heroStage");
    var video = document.getElementById("heroVideo");
    var fill = document.getElementById("heroVideoFill");
    var recTime = document.getElementById("recTime");
    var recFrame = document.getElementById("recFrame");
    var media = document.getElementById("heroVideoMedia");
    var soundBtn = document.getElementById("heroVideoSound");
    var soundLabel = soundBtn && soundBtn.querySelector(".hero-video__sound-label");
    if (!stage || !video) return;

    var FPS = 24;

    function two(n) { return (n < 10 ? "0" : "") + n; }
    function pad3(n) { n = "" + n; while (n.length < 3) n = "0" + n; return n; }

    function reflectSound() {
      var on = media && !media.muted;
      if (soundBtn) {
        soundBtn.setAttribute("aria-pressed", on ? "true" : "false");
        soundBtn.setAttribute("aria-label", on ? "Mute video" : "Unmute video");
      }
      if (soundLabel) soundLabel.textContent = on ? "sound on" : "sound off";
    }

    function startPlayback() {
      if (!media) return;
      var p = media.play();
      if (p && p.catch) p.catch(function () {});
    }

    // HUD reflects real playback time
    function updateHud() {
      var dur = (media && media.duration) || 0;
      var t = (media && media.currentTime) || 0;
      var p = dur ? t / dur : 0;
      if (fill) gsap.set(fill, { scaleX: p });
      var totalFrames = Math.max(1, Math.round(dur * FPS));
      if (recTime) recTime.textContent = "REC · " + two(Math.floor(t / 60)) + ":" + two(Math.floor(t % 60));
      if (recFrame) recFrame.textContent = "FRAME " + pad3(Math.round(t * FPS)) + " / " + pad3(totalFrames);
    }

    // Sound is OFF until the user presses the button (the only control).
    function toggleSound() {
      if (!media) return;
      media.muted = !media.muted;
      if (!media.muted) startPlayback();   // ensure it's running when audible
      reflectSound();
    }

    if (media) {
      media.muted = true;                  // guarantee a silent start
      media.addEventListener("loadedmetadata", updateHud);
      media.addEventListener("timeupdate", updateHud);
      media.load();
      startPlayback();                     // muted autoplay for the visuals
    }
    if (soundBtn) {
      soundBtn.addEventListener("click", function (e) { e.stopPropagation(); toggleSound(); });
    }
    reflectSound();

    // Pin the section to the viewport for a while; the film keeps playing.
    ScrollTrigger.create({
      trigger: stage,
      start: "top top",
      end: "+=120%",
      pin: true,
      pinSpacing: true,
      onEnter: startPlayback,
      onEnterBack: startPlayback
    });
  })();

  /* --------------------------------------------------------
     PINNED HOW-IT-WORKS: steps swap as you scroll
     -------------------------------------------------------- */
  (function () {
    var section = document.getElementById("how");
    var stage = document.getElementById("howStage");
    var prog = document.getElementById("howProgress");
    if (!section || !stage) return;
    var steps = Array.prototype.slice.call(stage.querySelectorAll(".how-step"));
    var ticks = prog ? Array.prototype.slice.call(prog.querySelectorAll(".tick")) : [];
    var count = steps.length;
    var current = -1;

    function setActive(idx) {
      if (idx === current) return;
      current = idx;
      steps.forEach(function (s, i) {
        var on = i === idx;
        s.classList.toggle("is-active", on);
        if (on) {
          gsap.fromTo(s.querySelector(".how-step__body"),
            { y: 26, opacity: 0 },
            { y: 0, opacity: 1, duration: dur(0.85), ease: EASE, overwrite: true });
        }
      });
      ticks.forEach(function (t, i) { t.classList.toggle("is-on", i <= idx); });
    }
    setActive(0);

    ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "+=" + (count * 70) + "%",   // ~0.7 viewport per step (30% shorter)
      pin: ".how-pin",
      pinSpacing: true,
      scrub: false,
      onUpdate: function (self) {
        var idx = Math.min(count - 1, Math.floor(self.progress * count - 0.0001));
        if (idx < 0) idx = 0;
        setActive(idx);
      }
    });
  })();

  /* --------------------------------------------------------
     CTA multi-line slide-up reveal (Monolog-style)
     -------------------------------------------------------- */
  (function () {
    var cta = document.getElementById("ctaHeadline");
    if (!cta) return;
    var lines = cta.querySelectorAll(".line > span");
    gsap.set(lines, { yPercent: 115 });
    ScrollTrigger.create({
      trigger: cta,
      start: "top 80%",
      once: true,
      onEnter: function () {
        gsap.to(lines, {
          yPercent: 0, duration: dur(1.15), ease: EASE,
          stagger: 0.14 / state.motionSpeed
        });
      }
    });
  })();

  /* --------------------------------------------------------
     TWEAK BRIDGE — listen for changes from the React panel
     detail: { motionSpeed, words, lightHero }
     (accent colour is applied directly as a CSS var by the panel)
     -------------------------------------------------------- */
  window.addEventListener("mogrtweak", function (e) {
    var t = e.detail || {};
    if (typeof t.motionSpeed === "number" && t.motionSpeed > 0) {
      state.motionSpeed = t.motionSpeed;
      // speed up / slow down CSS transitions globally + live tweens
      document.documentElement.style.setProperty("--dur", (0.9 / t.motionSpeed) + "s");
      gsap.globalTimeline.timeScale(t.motionSpeed);
      if (lenis) lenis.options.duration = 1.15 / t.motionSpeed;
    }
    if (Array.isArray(t.words)) TW.setWords(t.words);
  });

  // settle layout after fonts load
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
  window.addEventListener("load", function () { ScrollTrigger.refresh(); });

  /* --------------------------------------------------------
     FAILSAFE — never leave content stuck in its hidden
     pre-animation state. If the render loop is paused (e.g. the
     page loads in a background/hidden tab so requestAnimationFrame
     — and therefore GSAP's ticker — never advances), snap every
     reveal to its final visible state. When the tab is visible and
     ticking, this is a no-op and the animations play normally.
     -------------------------------------------------------- */
  function snapToFinal() {
    gsap.set(".reveal-up", { opacity: 1, y: 0 });
    gsap.set("[data-masked] .word", { yPercent: 0 });
    gsap.set("#ctaHeadline .line > span", { yPercent: 0 });
  }
  setTimeout(function () {
    if (gsap.ticker.frame < 2) snapToFinal();   // rAF never advanced
  }, 2400);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) ScrollTrigger.refresh();
  });
})();

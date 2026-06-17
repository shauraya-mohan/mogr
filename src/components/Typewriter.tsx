"use client";

import { useEffect, useRef, useState } from "react";

interface TypewriterProps {
  words: readonly string[];
  /** 1 = base speed; >1 faster, <1 slower (kept as a future tweak seam). */
  speed?: number;
}

/**
 * Type-in → hold → delete → next, looping. A trailing period is split out so
 * it can render in bronze (the brand "." device). Height is reserved by the
 * parent (.typewriter-wrap) so the page never reflows as words change.
 */
export default function Typewriter({ words, speed = 1 }: TypewriterProps) {
  const [text, setText] = useState("");
  const stateRef = useRef({ wordIndex: 0, charIndex: 0, deleting: false });

  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduced) {
      setText(words[0] ?? "");
      return;
    }

    let timer: ReturnType<typeof setTimeout>;
    const s = stateRef.current;
    s.wordIndex = 0;
    s.charIndex = 0;
    s.deleting = false;

    const schedule = (ms: number) => {
      clearTimeout(timer);
      timer = setTimeout(tick, ms);
    };

    function tick() {
      const word = words[s.wordIndex % words.length] ?? "";
      if (!s.deleting) {
        s.charIndex++;
        setText(word.slice(0, s.charIndex));
        if (s.charIndex >= word.length) {
          s.deleting = true;
          schedule(1100 / speed); // hold full word
          return;
        }
        schedule((70 + Math.random() * 60) / speed);
      } else {
        s.charIndex--;
        setText(word.slice(0, Math.max(0, s.charIndex)));
        if (s.charIndex <= 0) {
          s.deleting = false;
          s.wordIndex++;
          schedule(380 / speed); // pause before next word
          return;
        }
        schedule(40 / speed);
      }
    }

    schedule(700);
    return () => clearTimeout(timer);
  }, [words, speed]);

  // Split trailing period(s) so they can be bronze.
  const match = text.match(/^(.*?)(\.+)$/);
  const aria = words.join(" ");

  return (
    <h1
      className="hero-headline"
      id="heroHeadline"
      aria-label={aria}
    >
      <span className="typewriter-wrap">
        <span className="typewriter" aria-hidden="true">
          {match ? (
            <>
              {match[1]}
              <span className="tw-period">{match[2]}</span>
            </>
          ) : (
            text
          )}
        </span>
        <span className="caret" aria-hidden="true" />
      </span>
    </h1>
  );
}

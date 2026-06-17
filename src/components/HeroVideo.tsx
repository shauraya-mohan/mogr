"use client";

import { useEffect, useRef, useState } from "react";

const FPS = 24;
const two = (n: number) => (n < 10 ? "0" : "") + n;
const pad3 = (n: number) => String(n).padStart(3, "0");

/**
 * Near-full-bleed hero film. Autoplays MUTED for the visuals; audio is
 * controlled ONLY by the sound button (no auto-unmute), so the voice never
 * plays in the background on its own. The section is pinned to the viewport
 * by the motion layer (see useLandingMotion); the HUD timecode / frame
 * counter / progress bar track real playback here.
 */
export default function HeroVideo() {
  const mediaRef = useRef<HTMLVideoElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [recTime, setRecTime] = useState("REC · 00:00");
  const [recFrame, setRecFrame] = useState("FRAME 000 / 000");

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    media.muted = true; // guarantee a silent start

    const updateHud = () => {
      const duration = media.duration || 0;
      const t = media.currentTime || 0;
      const p = duration ? t / duration : 0;
      if (fillRef.current) {
        fillRef.current.style.transform = `scaleX(${p})`;
      }
      const totalFrames = Math.max(1, Math.round(duration * FPS));
      setRecTime(
        `REC · ${two(Math.floor(t / 60))}:${two(Math.floor(t % 60))}`,
      );
      setRecFrame(`FRAME ${pad3(Math.round(t * FPS))} / ${pad3(totalFrames)}`);
    };

    const play = () => {
      const p = media.play();
      if (p && p.catch) p.catch(() => {});
    };

    media.addEventListener("loadedmetadata", updateHud);
    media.addEventListener("timeupdate", updateHud);
    media.load();
    play(); // muted autoplay for the visuals

    return () => {
      media.removeEventListener("loadedmetadata", updateHud);
      media.removeEventListener("timeupdate", updateHud);
    };
  }, []);

  function toggleSound() {
    const media = mediaRef.current;
    if (!media) return;
    const next = !soundOn;
    media.muted = !next;
    if (next) {
      const p = media.play();
      if (p && p.catch) p.catch(() => {});
    }
    setSoundOn(next);
  }

  return (
    <section className="hero-stage" id="heroStage" data-screen-label="hero-video">
      <div
        className="hero-video"
        id="heroVideo"
        aria-label="Product film — plays on scroll"
      >
        <div className="hero-video__inner">
          <video
            className="hero-video__media"
            id="heroVideoMedia"
            ref={mediaRef}
            muted
            loop
            autoPlay
            playsInline
            preload="auto"
            disablePictureInPicture
          >
            <source src="/assets/hero.mp4" type="video/mp4" />
          </video>
          <div className="hero-video__grain" />
        </div>
        <div className="hero-video__edge" />
        <div className="hero-video__hud">
          <span className="hero-video__corner tl">
            <span className="rec" />
            <span className="mono">{recTime}</span>
          </span>
          <span className="hero-video__corner tr mono">mogr — groommax</span>
          <span className="hero-video__corner br mono">{recFrame}</span>
        </div>
        <button
          className="hero-video__sound"
          id="heroVideoSound"
          type="button"
          aria-label={soundOn ? "Mute video" : "Unmute video"}
          aria-pressed={soundOn}
          onClick={toggleSound}
        >
          <svg
            className="snd snd--off"
            viewBox="0 0 24 24"
            width="17"
            height="17"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 9v6h4l5 4V5L8 9H4z" />
            <path d="M17 9l4 6M21 9l-4 6" />
          </svg>
          <svg
            className="snd snd--on"
            viewBox="0 0 24 24"
            width="17"
            height="17"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 9v6h4l5 4V5L8 9H4z" />
            <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8 8 0 0 1 0 12" />
          </svg>
          <span className="hero-video__sound-label mono">
            {soundOn ? "sound on" : "sound off"}
          </span>
        </button>
        <div className="hero-video__bar">
          <span ref={fillRef} />
        </div>
      </div>
    </section>
  );
}

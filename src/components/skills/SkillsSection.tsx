"use client";

import React, { useEffect, useRef, useState } from "react";
import SkillsGame from "./SkillsGame";
import SkillsCarousel from "./SkillsCarousel";

/** Responsive scale based on viewport width (0.95 → 1.3). */
function useUiScale() {
  const [s, setS] = useState(1);
  useEffect(() => {
    const calc = () => {
      const w = typeof window !== "undefined" ? window.innerWidth : 1200;
      const minW = 360, maxW = 1536;
      const t = Math.min(1, Math.max(0, (w - minW) / (maxW - minW)));
      setS(0.95 + t * (1.3 - 0.95));
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);
  return s;
}

/** Track viewport height so we can cap the game's height to a % of the screen. */
function useViewportHeight() {
  const [vh, setVh] = useState<number>(
    typeof window !== "undefined" ? window.innerHeight : 900
  );
  useEffect(() => {
    const onR = () => setVh(window.innerHeight);
    onR();
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);
  return vh;
}

export default function SkillsSection() {
  const [playing, setPlaying] = useState(false);
  const uiScale = useUiScale();
  const viewportH = useViewportHeight();

  // ---- VISUAL SCALES (unchanged) ----
  const pad = Math.round(24 * uiScale);
  const gap = Math.round(16 * uiScale);
  const titleSize = Math.round(18 * uiScale);
  const bodySize = Math.round(14 * uiScale);

  // ---- Estimate carousel height (unchanged, just for game height calc) ----
  const pillScale = uiScale * 1.1;
  const rowGap = Math.round(12 * uiScale);
  const padY = Math.round(12 * uiScale);
  const rowH = Math.round(32 * pillScale);
  const approxCarouselHeight = padY * 2 + rowH * 3 + rowGap * 2;

  // ---- Game height (unchanged logic) + capped by viewport so page doesn't scroll ----
  const desiredGameHeight = Math.round(
    Math.max(600, approxCarouselHeight + Math.round(240 * uiScale))
  );
  const MAX_VH_RATIO = 0.55; // cap to ~55% of viewport height
  const clampedGameHeight = Math.min(desiredGameHeight, Math.floor(viewportH * MAX_VH_RATIO));

  // ---- Smooth height transition wrapper ----
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [wrapH, setWrapH] = useState<number | null>(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    // Measure and animate whenever content height changes
    const ro = new ResizeObserver(() => {
      setWrapH(el.offsetHeight);
    });
    ro.observe(el);

    // Initial measure
    setWrapH(el.offsetHeight);

    return () => ro.disconnect();
  }, [playing, uiScale, clampedGameHeight]);

  return (
    <section
      className="rounded-xl border border-white/10 bg-[#111111] relative"
      style={{ padding: pad }}
    >
      <header className="flex items-start mb-4" style={{ gap }}>
        <div>
          <h3 className="font-semibold" style={{ fontSize: titleSize }}>Skills</h3>
          <p className="text-gray-400" style={{ fontSize: bodySize }}>
            Here's my main tech stack and skills, wanna play a game? Click the button down there!
          </p>
        </div>
      </header>

      {/* Animated height wrapper (only around the changing area) */}
      <div
        style={{
          height: wrapH ?? "auto",
          transition: "height 320ms ease",
          overflow: "hidden",
        }}
      >
        <div ref={contentRef}>
          {!playing ? (
            <>
              {/* Compact carousel — unchanged */}
              <SkillsCarousel uiScale={uiScale} />

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setPlaying(true)}
                  className="rounded-lg bg-blue-600 hover:bg-blue-700"
                  style={{
                    padding: `${Math.round(8 * uiScale)}px ${Math.round(14 * uiScale)}px`,
                    fontSize: Math.round(14 * uiScale),
                  }}
                >
                  Start Game
                </button>
              </div>
            </>
          ) : (
            <div className="mt-2">
              <SkillsGame
                uiScale={uiScale}
                heightPx={clampedGameHeight}
                onExit={() => setPlaying(false)}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

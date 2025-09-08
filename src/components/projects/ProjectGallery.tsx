"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  animate,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import clsx from "clsx";
import ProjectCard from "./ProjectCard";
import type { Project } from "./projects";
import LedBorder from "../ui/LedBorder";

type XY = { x: number; y: number };

export interface ProjectGalleryProps {
  items: Project[];
  activeIndex: number;
  onChangeIndex: (i: number) => void;

  // Viewport controls
  viewportMaxWidth?: number; // px
  peekPx?: number; // visible sliver of prev/next inside the frame
  extraHeight?: number; // extra vertical padding above/below the card area
  stageXNudge?: number; // shift whole wheel left/right (px, negative = left)

  // UI nudges
  dotsOffset?: XY;
  tipOffset?: XY;
}

export default function ProjectGallery({
  items,
  activeIndex,
  onChangeIndex,

  viewportMaxWidth = 760,
  peekPx = 35,
  extraHeight = 200,
  stageXNudge = -350,

  dotsOffset = { x: 0, y: 0 },
  tipOffset = { x: 0, y: 0 },
}: ProjectGalleryProps) {
  // Basic helpers and reduced-motion check
  const n = items.length;
  const wrap = (i: number) => (i + n) % n;
  const reduced = useReducedMotion();

  // ---------------- TUNING KNOBS (spring-only) ----------------
  // Threshold of wheel delta before we commit to stepping the carousel
  const THRESHOLD_PX = 140;
  // Optional buffer time after each step (0 leaves it snappy)
  const COOLDOWN_MS = 0;

  // Presentation of the 3D stack
  const TILT_DEG = reduced ? 0 : 22;
  const CENTER_SCALE = 0.95;
  const PREVIEW_SCALE = 0.9;

  // Slight horizontal offset for the previews so the stack has a subtle “comb”
  const PREVIEW_X_SHIFT = 15; // px
  const PREVIEW_X_EASE = 1; // easing exponent for the comb effect

  // Spring parameters for returning the stack to rest
  const START_STEP = 1.0; // begin slightly behind the target so it rolls through
  const SPRING_STIFFNESS = 600;
  const SPRING_DAMPING = 60;
  const SPRING_MASS = 2.5;
  const SPRING_REST_DELTA = 0.001;
  const SPRING_REST_SPEED = 0.001;

  // Keep far spokes barely visible to avoid layer thrash on the GPU
  const FAR_OPACITY = 0.001;

  // Edge fades to smooth the top/bottom mask
  const FADE_HEIGHT = 26; // px
  const PAGE_BG = "#121212"; // matches the page background
  // ------------------------------------------------------------

  // We keep a stable “visual base index” during transitions to avoid key churn.
  const [visualBaseIndex, setVisualBaseIndex] = useState(activeIndex);
  useEffect(() => {
    setVisualBaseIndex((prev) => (prev === activeIndex ? prev : activeIndex));
  }, [activeIndex]);

  // Measure the active card so spacing and mask height feel consistent
  const activeArticleRef = useRef<HTMLElement | null>(null);
  const MIN_CARD_H = 320;
  const MAX_DELTA_PCT = 0.4; // ignore sudden huge resizes
  const RESIZE_DEBOUNCE_MS = 60;

  const [cardH, setCardH] = useState<number>(Math.max(MIN_CARD_H, 360));
  const cardHTargetRef = useRef(cardH);
  const resizeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const el = activeArticleRef.current;
    if (!el) return;

    const applyHeight = (raw: number) => {
      if (!raw || raw < MIN_CARD_H) return;
      const current = cardHTargetRef.current;
      const jumpTooBig =
        Math.abs(raw - current) / Math.max(current, 1) > MAX_DELTA_PCT;
      if (jumpTooBig) return;
      if (Math.abs(raw - current) > 1) {
        cardHTargetRef.current = raw;
        setCardH(raw);
      }
    };

    const ro = new ResizeObserver((entries) => {
      const h = Math.round(entries[0]?.contentRect?.height || 0);
      if (resizeTimerRef.current) window.clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = window.setTimeout(
        () => applyHeight(h),
        RESIZE_DEBOUNCE_MS
      );
    });

    ro.observe(el);
    return () => {
      ro.disconnect();
      if (resizeTimerRef.current) window.clearTimeout(resizeTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visualBaseIndex]);

  // Mask height and spoke spacing are derived from the active card’s height
  const WRAPPER_H = Math.max(cardH, MIN_CARD_H) + peekPx * 2 + extraHeight;
  const OFFSET_Y = Math.max(cardH, MIN_CARD_H) - peekPx;

  // Phase is the single source of truth for the stack transforms (y/tilt/scale/etc)
  const phase = useMotionValue(0);
  const steppingRef = useRef(false);

  // We accumulate wheel deltas before committing a step
  const containerRef = useRef<HTMLDivElement>(null);
  const accRef = useRef(0);

  // Preload a couple of images around the visual base so stepping looks instant
  useEffect(() => {
    if (typeof window === "undefined") return;
    const OFFSETS = [-2, -1, 0, 1, 2];
    const seen = new Set<string>();
    for (const k of OFFSETS) {
      const proj = items[(visualBaseIndex + k + n) % n];
      const imgs = proj?.images ?? [];
      for (let i = 0; i < Math.min(2, imgs.length); i++) {
        const src = imgs[i]?.src;
        if (!src || seen.has(src)) continue;
        seen.add(src);
        const im = new Image();
        im.decoding = "async";
        im.src = src;
      }
    }
  }, [visualBaseIndex, items, n]);

  // Advance one project forward/backward (or jump to a specific index).
  // We nudge phase first so the motion starts immediately, notify the parent,
  // then spring phase back to 0. When the spring settles, we update the base.
  const step = (dir: 1 | -1, toIndex?: number) => {
    if (steppingRef.current) return;
    steppingRef.current = true;

    const next =
      typeof toIndex === "number" ? wrap(toIndex) : wrap(activeIndex + dir);

    // Begin just behind the target so we visibly “roll” through it
    phase.set(-START_STEP * dir);

    // Let the outside world know about the new active index
    onChangeIndex(next);

    // Bring phase home with a spring; finalize the base index when settled
    const controls = animate(phase, 0, {
      type: "spring",
      stiffness: SPRING_STIFFNESS,
      damping: SPRING_DAMPING,
      mass: SPRING_MASS,
      restDelta: SPRING_REST_DELTA,
      restSpeed: SPRING_REST_SPEED,
      velocity: 0,
    });

    controls.then(() => {
      setVisualBaseIndex(next); // swap base after motion ends → no unmount flash
      accRef.current = 0;
      if (COOLDOWN_MS > 0) {
        setTimeout(() => {
          steppingRef.current = false;
        }, COOLDOWN_MS);
      } else {
        steppingRef.current = false;
      }
    });
  };

  const goPrev = () => step(-1);
  const goNext = () => step(+1);

  // Wheel handler: accumulate small deltas and step once we cross the threshold
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (steppingRef.current) return;

      accRef.current += e.deltaY;
      if (Math.abs(accRef.current) < THRESHOLD_PX) return;

      const dir = accRef.current > 0 ? +1 : -1;
      accRef.current = 0;
      step(dir);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel as any);
  }, [activeIndex, n]);

  // We render only a small window of neighbors around the visual base (-2..+2)
  const OFFSETS = useMemo(() => [-2, -1, 0, 1, 2] as const, []);
  const projectAt = (base: number, k: number) => items[(base + k + n) % n];

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-0 flex flex-col items-center justify-center"
    >
      {/* OUTER WRAPPER (no overflow) — buttons live here so they don't get clipped */}
      <div
        className="relative w-full mx-auto"
        style={{ height: WRAPPER_H, maxWidth: viewportMaxWidth }}
      >
        {/* INNER MASK clips the spinning stack only; fades sit at the edges */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Top fade to soften the crop line */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0"
            style={{
              height: FADE_HEIGHT,
              background: `linear-gradient(to bottom, ${PAGE_BG}, transparent)`,
              zIndex: 50,
            }}
          />
          {/* Bottom fade to soften the crop line */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0"
            style={{
              height: FADE_HEIGHT,
              background: `linear-gradient(to top, ${PAGE_BG}, transparent)`,
              zIndex: 50,
            }}
          />

          {/* 3D stage: all per-spoke transforms are driven by the shared phase */}
          <div
            className="absolute inset-0"
            style={{
              perspective: reduced ? undefined : "1100px",
              transformStyle: "preserve-3d",
              translate: `${stageXNudge}px 0`,
            }}
            aria-live="polite"
          >
            {OFFSETS.map((k) => {
              // Position each spoke relative to phase. 0 = center.
              const y = useTransform(phase, (p) => (k - p) * OFFSET_Y);
              const rotateX = useTransform(phase, (p) => -(k - p) * TILT_DEG);
              const scale = useTransform(phase, (p) =>
                Math.abs(k - p) < 0.5 ? CENTER_SCALE : PREVIEW_SCALE
              );
              const zIndex = useTransform(phase, (p) => 10 - Math.abs(k - p));
              // Fade out distant spokes (never all the way to 0 to keep layers alive)
              const opacity = useTransform(phase, (p) => {
                const dist = Math.abs(k - p);
                if (dist <= 1.25) return 1;
                if (dist >= 1.7) return FAR_OPACITY;
                const t = (dist - 1.25) / (1.7 - 1.25);
                return FAR_OPACITY + (1 - FAR_OPACITY) * (1 - t);
              });
              // Only the centered card should accept pointer events
              const pointer = useTransform(phase, (p) =>
                Math.abs(k - p) < 0.5 ? "auto" : "none"
              );

              // Small horizontal comb effect for the previews
              const x = useTransform(phase, (p) => {
                const rel = k - p; // 0 at center, ±1 at previews
                const dir = rel === 0 ? 0 : -1; // both previews to the left; use +1 for right
                const tRaw = (Math.abs(rel) - 0.5) / 0.5; // [-∞..1]
                const t = Math.max(0, Math.min(1, tRaw));
                const eased = Math.pow(t, PREVIEW_X_EASE);
                return dir * PREVIEW_X_SHIFT * eased;
              });

              const proj = projectAt(visualBaseIndex, k);
              const prewarm = Math.abs(k) <= 1; // center & immediate previews

              return (
                <motion.article
                  key={`${visualBaseIndex}-${proj.id}-${k}`}
                  className="absolute left-1/2 -translate-x-1/2 w-full will-change-transform"
                  style={{
                    top: "50%",
                    translate: "0 -50% 0",
                    transformStyle: "preserve-3d",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    willChange: "transform, opacity",
                    x,
                    y,
                    rotateX,
                    scale,
                    opacity,
                    zIndex,
                    pointerEvents: pointer as unknown as "auto" | "none",
                  }}
                  ref={
                    k === 0
                      ? (el: HTMLElement | null) => {
                          activeArticleRef.current = el;
                        }
                      : undefined
                  }
                >
                  {/* Card content sits inside a subtle LED frame */}
                  <LedBorder
                    color="#004ac2ff"
                    thickness={0}
                    radius={27}
                    glow={10}
                    pulse
                    flow
                    speedSec={1}
                  >
                    <ProjectCard
                      project={proj}
                      isActive={k === 0}
                      prewarm={prewarm}
                      visibilityHint
                    />
                  </LedBorder>
                </motion.article>
              );
            })}
          </div>
        </div>

        {/* Vertical step buttons — live on the outer wrapper so they aren't clipped */}
        <div className="hidden md:flex flex-col gap-3 items-center absolute right-[-56px] top-1/2 -translate-y-1/2 z-30">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous project"
            className={clsx(
              "w-12 h-12 rounded-full grid place-items-center",
              "bg-white/10 hover:bg-white/20 active:bg-white/25",
              "border border-white/30 shadow-lg backdrop-blur",
              "text-white focus:outline-none focus:ring focus:ring-white/40"
            )}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M6 15l6-6 6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => step(+1)}
            aria-label="Next project"
            className={clsx(
              "w-12 h-12 rounded-full grid place-items-center",
              "bg-white/10 hover:bg-white/20 active:bg-white/25",
              "border border-white/30 shadow-lg backdrop-blur",
              "text-white focus:outline-none focus:ring focus:ring-white/40"
            )}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M18 9l-6 6-6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Dots below the gallery let you jump directly to any project */}
      <div
        className="mt-8 flex items-center gap-3"
        style={{ transform: `translate(${dotsOffset.x}px, ${dotsOffset.y}px)` }}
      >
        {items.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to project ${i + 1}`}
            onClick={() => {
              if (i === activeIndex || (phase as any).isAnimating) return;
              const dir = i > activeIndex ? +1 : -1;
              step(dir, i);
            }}
            className={clsx(
              "h-2 w-2 rounded-full transition-colors",
              i === activeIndex ? "bg-white" : "bg-white/35 hover:bg-white/60"
            )}
          />
        ))}
      </div>

      {/* Small usage hint; offsets let the parent nudge it if needed */}
      <p
        className="mt-4 text-xs text-zinc-400 text-center"
        style={{ transform: `translate(${tipOffset.x}px, ${tipOffset.y}px)` }}
      >
        Tip: Hover to use mouse wheel (↑/↓, PageUp/PageDown, Home/End).
      </p>
    </div>
  );
}

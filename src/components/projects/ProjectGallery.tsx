// components/ProjectGallery.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  animate,
  useTransform,
  useReducedMotion,
  useMotionValueEvent,
} from "framer-motion";
import clsx from "clsx";
import ProjectCard from "./ProjectCard";
import type { Project } from "./projects";
import GlowLedBorder from "../ui/GlowLedBorder"; // ← LED border

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
  extraHeight = 150,
  stageXNudge = -350,

  dotsOffset = { x: 0, y: 0 },
  tipOffset = { x: 0, y: 0 },
}: ProjectGalleryProps) {
  // Basic helpers and reduced-motion check
  const n = items.length;
  const wrap = (i: number) => (i + n) % n;
  const reduced = useReducedMotion();

  // ---------------- TUNING KNOBS (spring-only) ----------------
  const THRESHOLD_PX = 140;
  const COOLDOWN_MS = 0;

  const TILT_DEG = reduced ? 0 : 22;
  const CENTER_SCALE = 0.95;
  const PREVIEW_SCALE = 0.9;

  const PREVIEW_X_SHIFT = 15; // px
  const PREVIEW_X_EASE = 1;

  const START_STEP = 1.0;
  const SPRING_STIFFNESS = 600;
  const SPRING_DAMPING = 60;
  const SPRING_MASS = 2.5;
  const SPRING_REST_DELTA = 0.001;
  const SPRING_REST_SPEED = 0.001;

  const FAR_OPACITY = 0.001;

  const FADE_HEIGHT = 26; // px
  const PAGE_BG = "#121212"; // matches the page background
  // ------------------------------------------------------------

  const [visualBaseIndex, setVisualBaseIndex] = useState(activeIndex);
  useEffect(() => {
    setVisualBaseIndex((prev) => (prev === activeIndex ? prev : activeIndex));
  }, [activeIndex]);

  // Measure the active card for consistent spacing/mask
  const activeArticleRef = useRef<HTMLElement | null>(null);
  const MIN_CARD_H = 320;
  const MAX_DELTA_PCT = 0.4;
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

  const WRAPPER_H = Math.max(cardH, MIN_CARD_H) + peekPx * 2 + extraHeight;
  const OFFSET_Y = Math.max(cardH, MIN_CARD_H) - peekPx;

  // Phase drives everything (y/tilt/scale, and now glow)
  const phase = useMotionValue(0);
  const steppingRef = useRef(false);

  // Wheel accumulator
  const containerRef = useRef<HTMLDivElement>(null);
  const accRef = useRef(0);

  // Preload a couple of images around the base
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

  // Step logic
  const step = (dir: 1 | -1, toIndex?: number) => {
    if (steppingRef.current) return;
    steppingRef.current = true;

    const next =
      typeof toIndex === "number" ? wrap(toIndex) : wrap(activeIndex + dir);

    phase.set(-START_STEP * dir);
    onChangeIndex(next);

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
      setVisualBaseIndex(next);
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

  // Wheel navigation
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Disabled per requirement: user should only use the buttons to change projects.
    const onWheel = (_e: WheelEvent) => {
      // Intentionally do nothing; allow the page to scroll naturally.
      // (We also register this as passive so we don’t interfere with scrolling.)
      return;
    };

    el.addEventListener("wheel", onWheel, { passive: true });
    return () => el.removeEventListener("wheel", onWheel as any);
  }, [activeIndex, n]);

  // --- Keyboard navigation (Up/Down, PageUp/PageDown, Home/End)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // ignore if typing in an input/textarea/contenteditable
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || (t as any).isContentEditable)) {
        return;
      }
      if (steppingRef.current) return;

      switch (e.key) {
        case "ArrowDown":
        case "PageDown":
          e.preventDefault();
          step(+1);
          break;
        case "ArrowUp":
        case "PageUp":
          e.preventDefault();
          step(-1);
          break;
        case "Home":
          e.preventDefault();
          step(-1, 0);
          break;
        case "End":
          e.preventDefault();
          step(+1, n - 1);
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [n, activeIndex]); // safe to rebind when index changes

  // Render small window of neighbors around the visual base (-2..+2)
  const OFFSETS = useMemo(() => [-2, -1, 0, 1, 2] as const, []);
  const projectAt = (base: number, k: number) => items[(base + k + n) % n];

  // --- Responsive horizontal nudge (keep old look ≥ 680px)
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [localStageXNudge, setLocalStageXNudge] = useState<number>(stageXNudge);
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const calcResponsiveNudge = (w: number) => {
      const BASE = stageXNudge;
      if (w >= 680) return BASE; // original look
      const MIN = -200; // least left shift on very small widths
      const clamped = Math.max(420, Math.min(680, w));
      const t = (clamped - 420) / (680 - 420);
      return MIN + (BASE - MIN) * t;
    };
    const apply = () => setLocalStageXNudge(calcResponsiveNudge(el.clientWidth || 0));
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, [stageXNudge]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-0 flex flex-col items-center justify-center"
    >
      {/* OUTER WRAPPER (no overflow) — buttons live here so they don't get clipped */}
      <div
        ref={wrapperRef}
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

          {/* 3D stage */}
          <div
            className="absolute inset-0"
            style={{
              perspective: reduced ? undefined : "1100px",
              transformStyle: "preserve-3d",
              translate: `${localStageXNudge}px 0`,
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
              const opacity = useTransform(phase, (p) => {
                const dist = Math.abs(k - p);
                if (dist <= 1.25) return 1;
                if (dist >= 1.7) return FAR_OPACITY;
                const t = (dist - 1.25) / (1.7 - 1.25);
                return FAR_OPACITY + (1 - FAR_OPACITY) * (1 - t);
              });
              const pointer = useTransform(phase, (p) =>
                Math.abs(k - p) < 0.5 ? "auto" : "none"
              );

              // Small horizontal comb effect for the previews
              const x = useTransform(phase, (p) => {
                const rel = k - p; // 0 at center, ±1 at previews
                const dir = rel === 0 ? 0 : -1;
                const tRaw = (Math.abs(rel) - 0.5) / 0.5; // [-∞..1]
                const t = Math.max(0, Math.min(1, tRaw));
                const eased = Math.pow(t, PREVIEW_X_EASE);
                return dir * PREVIEW_X_SHIFT * eased;
              });

              const proj = projectAt(visualBaseIndex, k);
              const prewarm = Math.abs(k) <= 1;

              // --- glow & pulse driven by MotionValues (no re-render per frame)
              const proximity = useTransform(phase, (p) =>
                Math.max(0, 1 - Math.abs(k - p))
              );
              const glowMV = useTransform(proximity, (t) => {
                if (t >= 0.85) return 1;
                if (t > 0) return 0.45 + 0.55 * t;
                return 0.18;
              });

              // Pulse when crossing into active
              const wasActive = useRef(false);
              const [pulseKey, setPulseKey] = useState(0);
              useMotionValueEvent(proximity, "change", (t) => {
                const isActive = t >= 0.85;
                if (isActive && !wasActive.current) setPulseKey((s) => s + 1);
                wasActive.current = isActive;
              });

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
                  {/* Card inside the LED frame */}
                  <GlowLedBorder glow={glowMV} pulseKey={pulseKey} radius={16} thickness={2}>
                    <ProjectCard
                      project={proj}
                      isActive={k === 0}
                      prewarm={prewarm}
                      visibilityHint
                    />
                  </GlowLedBorder>
                </motion.article>
              );
            })}
          </div>
        </div>

        {/* Vertical step buttons — still available on ultra-wide layouts */}
        <div className="hidden 2xl:flex flex-col gap-3 items-center absolute right-[-56px] top-1/2 -translate-y-1/2 z-30">
          <button
            type="button"
            onClick={() => goPrev()}
            aria-label="Previous project"
            className={clsx(
              "w-12 h-12 rounded-full grid place-items-center",
              "bg-white/10 hover:bg-white/20 active:bg-white/25",
              "border border-white/30 shadow-lg backdrop-blur",
              "text-white focus:outline-none focus:ring focus:ring-white/40"
            )}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M6 15l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => goNext()}
            aria-label="Next project"
            className={clsx(
              "w-12 h-12 rounded-full grid place-items-center",
              "bg-white/10 hover:bg-white/20 active:bg-white/25",
              "border border-white/30 shadow-lg backdrop-blur",
              "text-white focus:outline-none focus:ring focus:ring-white/40"
            )}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M18 9l-6 6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

      {/* NEW: Prominent Prev/Next buttons below (primary controls) */}
      <div className="mt-6 w-full flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => goPrev()}
          className={clsx(
            "inline-flex items-center gap-2 px-4 py-2 rounded-full",
            "bg-white/10 hover:bg-white/20 active:bg-white/25",
            "border border-white/30 shadow-lg backdrop-blur",
            "text-white text-sm font-medium focus:outline-none focus:ring focus:ring-white/40"
          )}
          aria-label="Previous project"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Prev project
        </button>

        <button
          type="button"
          onClick={() => goNext()}
          className={clsx(
            "inline-flex items-center gap-2 px-4 py-2 rounded-full",
            "bg-white/10 hover:bg-white/20 active:bg-white/25",
            "border border-white/30 shadow-lg backdrop-blur",
            "text-white text-sm font-medium focus:outline-none focus:ring focus:ring-white/40"
          )}
          aria-label="Next project"
        >
          Next project
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Small usage hint; offsets let the parent nudge it if needed */}
      <p
        className="mt-4 text-sm text-zinc-300 text-center"
        style={{ transform: `translate(${tipOffset.x}px, ${tipOffset.y}px)` }}
      >
        Tip: Use the buttons <span className="font-medium">below</span> to view other projects, and swipe left/right to view other images.
      </p>
    </div>
  );
}

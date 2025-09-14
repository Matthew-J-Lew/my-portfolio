"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RevealOnScroll } from "./experience/RevealOnScroll";
import { experiences } from "./experience/data";
import TimelineRow from "./experience/TimelineRow";

type Props = {
  anchor?: number | string;       // Node anchor line in the viewport (e.g. 0.25, "25vh", or px)
  spineLeft?: number;             // X position (px) for the vertical spine center
  glowColorStart?: string;        // Spine glow gradient start
  glowColorEnd?: string;          // Spine glow gradient end
  // node fine-tune knobs
  nodeOffsetX?: number;           // Manual nudge for node centering (px)
  nodeOffsetY?: number;           // Manual nudge for node centering (px)
  nodeRotateDeg?: number;         // Rotate node gradient for taste
  nodeGradientAngle?: number;     // Angle for node gradient
  nodeGradient?: string;          // Override node gradient CSS
  // mask knobs (blocks glow under cards)
  maskLeft?: number;              // Left edge of the right column; mask hides spine glow under cards
  maskBg?: string;                // Page background color for the mask
  maskShowOnMobile?: boolean;     // Usually false; show the mask on small screens if needed
};

const NODE_PX = 16;               // Visual node diameter (px)

function parseAnchor(anchor: number | string): number {
  if (typeof anchor === "number") return anchor > 0 && anchor <= 1 ? window.innerHeight * anchor : anchor;
  const s = String(anchor).trim();
  if (s.endsWith("vh")) return (window.innerHeight * parseFloat(s)) / 100;
  if (s.endsWith("px")) return parseFloat(s);
  const n = Number(s);
  return Number.isNaN(n) ? window.innerHeight * 0.5 : (n > 0 && n <= 1 ? window.innerHeight * n : n);
}

// Smooth easing when handing off between rows
const easeSmooth = (t: number) => {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
};

type RowMetrics = { top: number; bottom: number; height: number };

export default function ExperienceSection({
  anchor = 1 / 4,
  spineLeft = 22,
  glowColorStart = "#3b82f6",
  glowColorEnd = "#6366f1",
  nodeOffsetX = 0,
  nodeOffsetY = 0,
  nodeRotateDeg = 0,
  nodeGradientAngle = 160,
  nodeGradient,
  maskLeft = 280,          // md:grid-cols-[280px_minmax(0,1fr)]
  maskBg = "#121212",      // same as your <main> bg
  maskShowOnMobile = false,
}: Props) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const rowsCount = experiences.length;

  const metricsRef = useRef<RowMetrics[]>(Array(rowsCount).fill({ top: 0, bottom: 0, height: 0 }));
  const [metricsVersion, setMetricsVersion] = useState(0);

  const [glowHeight, setGlowHeight] = useState(0);
  const [disc, setDisc] = useState<number[]>(() => Array(rowsCount).fill(0));
  const [ring, setRing] = useState<number[]>(() => Array(rowsCount).fill(0));

  // Rows report their metrics here
  const registerRow = useCallback((index: number, topWithinTrack: number, height: number) => {
    metricsRef.current[index] = { top: topWithinTrack, bottom: topWithinTrack + height, height };
    setMetricsVersion(v => v + 1);
  }, []);

  // Core scroll/resize → compute active row + glow height
  useEffect(() => {
    const onScrollOrResize = () => {
      const trackEl = trackRef.current;
      if (!trackEl) return;

      const trackTopAbs = window.scrollY + trackEl.getBoundingClientRect().top;
      const anchorPx = parseAnchor(anchor);
      const anchorAbs = window.scrollY + anchorPx;
      const anchorInTrack = anchorAbs - trackTopAbs;

      const rows = metricsRef.current;
      if (!rows.length) return;

      const d = Array(rows.length).fill(0);
      const r = Array(rows.length).fill(0);

      // Which row contains the anchor?
      let inside = -1;
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (anchorInTrack >= row.top && anchorInTrack < row.bottom) { inside = i; break; }
      }

      if (inside >= 0) {
        const row = rows[inside];
        const yInRow = Math.max(0, Math.min(anchorInTrack - row.top, row.height - NODE_PX));
        const nodeCenter = row.top + yInRow + NODE_PX / 2;
        setGlowHeight(nodeCenter);

        d[inside] = 1; r[inside] = 0;
        for (let j = inside + 1; j < rows.length; j++) r[j] = 1;
      } else {
        // Between rows → blend previous/next
        let prev = -1, next = -1;
        for (let i = 0; i < rows.length - 1; i++) {
          if (anchorInTrack >= rows[i].bottom && anchorInTrack < rows[i + 1].top) { prev = i; next = i + 1; break; }
        }
        if (prev >= 0 && next >= 0) {
          const rp = rows[prev], rn = rows[next];
          const start = rp.bottom - NODE_PX / 2;
          const end = rn.top + NODE_PX / 2;
          const t = easeSmooth((anchorInTrack - rp.bottom) / Math.max(1, rn.top - rp.bottom));
          setGlowHeight(start + t * (end - start));

          d[prev] = 1 - t; r[prev] = (1 - Math.abs(2 * t - 1)) * 0.9;
          d[next] = t;     r[next] = 1 - t;
          for (let j = next + 1; j < rows.length; j++) r[j] = 1;
        } else {
          // Above first / below last
          if (anchorInTrack < rows[0].top) {
            setGlowHeight(rows[0].top + NODE_PX / 2);
            r[0] = 1; for (let j = 1; j < rows.length; j++) r[j] = 1;
          } else {
            const last = rows.length - 1;
            setGlowHeight(rows[last].bottom - NODE_PX / 2);
            d[last] = 1;
          }
        }
      }

      setDisc(d);
      setRing(r);
    };

    onScrollOrResize();
    const onScroll = () => requestAnimationFrame(onScrollOrResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [anchor, metricsVersion]);

  const prettyAnchor = useMemo(
    () => (typeof anchor === "number" ? (anchor > 0 && anchor <= 1 ? `${(anchor * 100).toFixed(1)}vh` : `${anchor}px`) : anchor),
    [anchor]
  );

  // Ceil to avoid fractional clipping of the glow cap
  const glowHeightPx = Math.max(0, Math.ceil(glowHeight || 0));

  return (
    <section id="experience" aria-label="Experience timeline"
      className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-zinc-100">
      <RevealOnScroll dir="up" once>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
          Experience: <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-indigo-400">My Journey So Far</span>
        </h2>
        <p className="mt-2 text-zinc-400">My most recent experiences and positions!</p>
      </RevealOnScroll>

      {/* TRACK: expose --page-bg so nodes can “erase” the spine behind them */}
      <div
        ref={trackRef}
        className="relative isolate mt-10 space-y-12 md:space-y-16"
        style={
          {
            ["--glow-start" as any]: glowColorStart,
            ["--glow-end" as any]: glowColorEnd,
            ["--page-bg" as any]: maskBg, // ← added
          } as React.CSSProperties
        }
      >
        {/* Base spine */}
        <div className="pointer-events-none absolute top-0 bottom-0 w-px bg-zinc-800/80 z-10"
             style={{ left: spineLeft, transform: "translateX(-0.5px)" }} aria-hidden />

        {/* Glow (clipped) */}
        <div className="pointer-events-none absolute top-0 -translate-x-1/2 overflow-hidden z-20"
             style={{ left: spineLeft, height: glowHeightPx, width: 18 }} aria-hidden>
          <div className="glow-line" />
          <div className="glow-cap" />
        </div>

        {/* Mask to block glow under cards */}
        <div
          className={`pointer-events-none absolute inset-y-0 right-0 ${maskShowOnMobile ? "block" : "hidden md:block"} z-[25]`}
          style={{ left: maskLeft, background: maskBg }}
          aria-hidden
        />

        {experiences.map((item, idx) => (
          <TimelineRow
            key={item.id}
            index={idx}
            item={item}
            anchor={anchor}
            spineLeft={spineLeft}
            trackRef={trackRef}
            registerRow={registerRow}
            disc={disc[idx]}
            ring={ring[idx]}
            nodeOffsetX={nodeOffsetX}
            nodeOffsetY={nodeOffsetY}
            nodeRotateDeg={nodeRotateDeg}
            nodeGradientAngle={nodeGradientAngle}
            nodeGradient={nodeGradient}
          />
        ))}
      </div>

      <style jsx>{`
        .glow-line {
          position: absolute; left: 50%; transform: translateX(-50%);
          width: 2px; height: 100%; border-radius: 9999px;
          background: linear-gradient(to bottom, var(--glow-start), var(--glow-end));
          box-shadow:
            0 0 6px var(--glow-start),
            0 0 12px rgba(59,130,246,0.35),
            0 0 18px rgba(99,102,241,0.25);
          animation: glowPulse 3.2s ease-in-out infinite;
          opacity: 0.88;
        }
        .glow-cap {
          position: absolute; left: 50%; bottom: -7px; transform: translateX(-50%);
          width: 20px; height: 20px; pointer-events: none;
          background:
            radial-gradient(closest-side, rgba(99,102,241,0.45), rgba(99,102,241,0.22) 55%, transparent 70%),
            radial-gradient(closest-side, rgba(59,130,246,0.22), transparent 70%);
          filter: blur(0.35px);
          opacity: 0.5;
          animation: capPulse 3.2s ease-in-out infinite;
        }
        @keyframes glowPulse {
          0% { filter: brightness(1);    opacity: 0.82; }
          50%{ filter: brightness(1.12); opacity: 0.94; }
          100%{filter: brightness(1);    opacity: 0.82; }
        }
        @keyframes capPulse {
          0% { transform: translateX(-50%) scale(0.96); opacity: 0.44; }
          50%{ transform: translateX(-50%) scale(1.03); opacity: 0.58; }
          100%{transform: translateX(-50%) scale(0.96); opacity: 0.44; }
        }
      `}</style>
    </section>
  );
}

// components/ui/LedBorder.tsx
"use client";

import clsx from "clsx";
import React from "react";

/**
 * Circular animated LED ring with a vibrant, breathing glow.
 * - `gap=0` keeps the ring flush against the panel.
 * - `glowIntensity` scales both halo opacities together.
 */
export default function LedBorder({
  children,
  className,
  size = "clamp(420px, 64vmin, 820px)",
  thickness = 10,
  gap = 0,
  spinSec = 10,
  glowSec = 3.6,
  glowIntensity = 0.5, // tasteful default to match the site
}: {
  children: React.ReactNode;
  className?: string;
  size?: string | number;
  thickness?: number;
  gap?: number;
  spinSec?: number;
  glowSec?: number;
  glowIntensity?: number;
}) {
  const style: React.CSSProperties = {
    width: typeof size === "number" ? `${size}px` : size,
    ["--t" as any]: `${thickness}px`,
    ["--gap" as any]: `${gap}px`,
    ["--pad" as any]: `calc(var(--t) + var(--gap))`,
    ["--spin" as any]: `${spinSec}s`,
    ["--glow" as any]: `${glowSec}s`,
    ["--intensity" as any]: glowIntensity,
  };

  // More diverse palette: cyan → blue → indigo → violet → magenta → back to cyan
/*
  const conic =
    "conic-gradient(from 0deg," +
    "hsl(188 96% 64%) 0%," +      // bright cyan
    "hsl(203 95% 66%) 10%," +     // azure
    "hsl(220 92% 70%) 22%," +     // blue
    "hsl(235 90% 72%) 34%," +     // indigo
    "hsl(252 88% 74%) 46%," +     // violet
    "hsl(268 86% 76%) 58%," +     // purple
    "hsl(285 85% 74%) 70%," +     // violet/magenta bridge
    "hsl(312 86% 72%) 82%," +     // magenta
    "hsl(335 88% 72%) 92%," +     // pink hint
    "hsl(188 96% 64%) 100%)";     // loop back to cyan
*/
// New colour palette:
const conic =
  "conic-gradient(from 0deg," +
  "hsl(208 92% 66%) 0%," +    // azure (≈ blue-400)
  "hsl(223 90% 64%) 16%," +   // indigo-ish
  "hsl(240 86% 62%) 32%," +   // deep blue
  "hsl(255 82% 58%) 48%," +   // violet (≈ purple-600)
  "hsl(270 78% 54%) 64%," +   // royal purple
  "hsl(292 70% 46%) 80%," +   // **darker magenta** (replaces bright pink)
  "hsl(208 92% 66%) 100%)";   // loop back to azure


  return (
    <div
      className={clsx(
        "relative isolate overflow-visible rounded-full aspect-square grid place-items-center",
        className
      )}
      style={style}
    >
      {/* OUTER COLOR HALO (broad + soft) */}
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-14 rounded-full will-change-transform mix-blend-screen"
        style={{
          background: conic,
          filter: "blur(84px) saturate(1.45)",
          transformOrigin: "50% 50%",
          animation:
            "led-breath-outer var(--glow) ease-in-out infinite, led-spin var(--spin) linear infinite",
        }}
      />

      {/* INNER COLOR HALO (tight to the ring) */}
      <span
        aria-hidden
        className="pointer-events-none absolute rounded-full will-change-transform mix-blend-screen"
        style={{
          inset: "calc(var(--t) + 2px)",
          background:
            "radial-gradient(closest-side, rgba(255,255,255,0.22), transparent 75%), " + conic,
          filter: "blur(34px) saturate(1.2)",
          transformOrigin: "50% 50%",
          animation:
            "led-breath-inner var(--glow) ease-in-out infinite -0.6s, led-spin var(--spin) linear infinite",
        }}
      />

      {/* ROTATING RING */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full will-change-transform"
        style={{
          background: conic,
          WebkitMask:
            "radial-gradient(farthest-side, transparent calc(100% - var(--t)), #000 calc(100% - var(--t)))",
          mask:
            "radial-gradient(farthest-side, transparent calc(100% - var(--t)), #000 calc(100% - var(--t)))",
          transformOrigin: "50% 50%",
          animation: "led-spin var(--spin) linear infinite",
          opacity: 0.98,
          // subtle dual-color bloom that complements cyan & violet/pink
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.06) inset," +
            "0 0 60px rgba(56,189,248,0.18)," +   // cyan glow
            "0 0 36px rgba(168,85,247,0.12)",     // violet glow
        }}
      />

      {/* Hairline to hide any sub-pixel seams */}
      <span
        aria-hidden
        className="pointer-events-none absolute rounded-full"
        style={{
          inset: "calc(var(--t) - 0.5px)",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.08) inset",
          borderRadius: "9999px",
        }}
      />

      {/* INNER PANEL */}
      <div
        className="absolute rounded-full grid place-items-center bg-zinc-900/70 backdrop-blur-md border border-white/5"
        style={{ inset: "var(--pad)" }}
      >
        <div className="px-8">{children}</div>
      </div>

      <style jsx>{`
        @keyframes led-spin { to { transform: rotate(360deg); } }

        /* Breathing with a gentle hold near the peak for presence */
        @keyframes led-breath-outer {
          0%   { transform: scale(0.985); opacity: calc(0.45 * var(--intensity)); }
          40%  { transform: scale(1.12);  opacity: calc(1.00 * var(--intensity)); }
          60%  { transform: scale(1.12);  opacity: calc(1.00 * var(--intensity)); }
          100% { transform: scale(0.985); opacity: calc(0.45 * var(--intensity)); }
        }
        @keyframes led-breath-inner {
          0%   { transform: scale(1.00); opacity: calc(0.25 * var(--intensity)); }
          50%  { transform: scale(1.07); opacity: calc(0.70 * var(--intensity)); }
          100% { transform: scale(1.00); opacity: calc(0.25 * var(--intensity)); }
        }

        @media (prefers-reduced-motion: reduce) {
          span[aria-hidden] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

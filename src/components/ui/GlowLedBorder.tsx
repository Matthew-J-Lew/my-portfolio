// GlowLedBorder.tsx
"use client";

import { motion, MotionValue } from "framer-motion";
import clsx from "clsx";
import React from "react";

// Tiny wrapper that paints a neon/LED border around any children.
// Matches the look used on Experience cards (gradient ring + soft outer glow + pulse).
type GlowVal = number | MotionValue<number>;

export default function GlowLedBorder({
  children,
  glow = 0,
  pulseKey = 0,
  radius = 16,     // match inner card corner radius (rounded-2xl ≈ 16px)
  thickness = 2,  // border thickness in px
  className,
}: {
  children: React.ReactNode;
  glow?: GlowVal;            // 0..1 or MotionValue; controls brightness
  pulseKey?: number;         // bump to retrigger the one-shot pulse
  radius?: number;           // border radius in px
  thickness?: number;        // LED "tube" width in px
  className?: string;
}) {
  // Expose config via CSS vars (MotionValue binds without rerenders).
  const style = {
    ["--card-glow" as any]: glow as any,
    ["--led-radius" as any]: `${radius}px`,
    ["--led-pad" as any]: `${thickness}px`,
  };

  return (
    <motion.div className={clsx("relative isolate", className)} style={style}>
      {/* Content lives under the LED layers; radius matches so edges align */}
      <div className="led-content" style={{ borderRadius: "var(--led-radius)" }}>
        {children}
      </div>

      {/* LED layers are absolute and pointerless; they render the ring + glow + pulse */}
      <div className="pointer-events-none absolute inset-0 z-10" aria-hidden>
        <span className="card-led" />
        <span className="card-led-glow" />
        <span key={pulseKey} className="card-led-pulse" />
      </div>

      <style jsx>{`
        /* Keep the same corner radius across all layers */
        :global(.card-led),
        :global(.card-led-glow),
        :global(.card-led-pulse),
        .led-content {
          border-radius: var(--led-radius, 1rem);
        }

        /* Main gradient border, masked so only the border band is visible */
        :global(.card-led) {
          position: absolute;
          inset: 0;
          padding: var(--led-pad, 2px);
          background: linear-gradient(
            135deg,
            rgba(99, 102, 241, 0.95),
            rgba(59, 130, 246, 0.95)
          );
          -webkit-mask: linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
                  mask-composite: exclude;
          opacity: calc(var(--card-glow, 0) * 0.9);
          transition: opacity 220ms ease;
        }

        /* Soft ambient glow outside the border */
        :global(.card-led-glow) {
          position: absolute;
          inset: 0;
          box-shadow:
            0 0 calc(16px * var(--card-glow, 0)) rgba(99, 102, 241, 0.45),
            0 0 calc(26px * var(--card-glow, 0.9)) rgba(59, 130, 246, 0.28);
          opacity: calc(0.75 * var(--card-glow, 0));
          transition: opacity 220ms ease, box-shadow 220ms ease;
        }

        /* One-shot pulse when activated (remounts via pulseKey) */
        :global(.card-led-pulse) {
          position: absolute;
          inset: 0;
          pointer-events: none;
          animation: cardPulse 900ms ease-out;
          background: linear-gradient(
            135deg,
            rgba(99, 102, 241, 0.75),
            rgba(59, 130, 246, 0.75)
          );
          -webkit-mask: linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
                  mask-composite: exclude;
          padding: var(--led-pad, 2px);
          opacity: var(--card-glow, 0);
        }

        /* Brief brighten + bloom, then fade back */
        @keyframes cardPulse {
          0%   { filter: brightness(1);   box-shadow: 0 0 0 rgba(99,102,241,0); }
          30%  { filter: brightness(1.3); box-shadow: 0 0 22px rgba(99,102,241,0.5); }
          100% { filter: brightness(1);   box-shadow: 0 0 0 rgba(99,102,241,0); }
        }
      `}</style>
    </motion.div>
  );
}

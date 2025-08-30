// src/components/ui/LedBorder.tsx
"use client";

import React, { CSSProperties, PropsWithChildren } from "react";

type Props = PropsWithChildren<{
  /** Main glow color (hex/rgb). */
  color?: string;
  /** Border thickness in px. */
  thickness?: number;
  /** Border radius in px. */
  radius?: number;
  /** Glow blur size in px. */
  glow?: number;
  /** Subtle breathing pulse. */
  pulse?: boolean;
  /** Slow rotating gradient around the edge (set false for static). */
  flow?: boolean;
  /** Flow speed in seconds (lower = faster). */
  speedSec?: number;
  /** Extra classes for the inner content wrapper. */
  innerClassName?: string;
  /** Extra classes for root. */
  className?: string;
  style?: CSSProperties;
}>;

const LedBorder: React.FC<Props> = ({
  children,
  color = "#7df9ff",
  thickness = 2,
  radius = 16,
  glow = 18,
  pulse = true,
  flow = false,
  speedSec = 18,
  innerClassName = "",
  className = "",
  style,
}) => {
  const vars: CSSProperties = {
    // CSS vars so the styles below can use them
    ["--led-color" as any]: color,
    ["--led-thickness" as any]: `${thickness}px`,
    ["--led-radius" as any]: `${radius}px`,
    ["--led-glow" as any]: `${glow}px`,
    ["--led-speed" as any]: `${speedSec}s`,
  };

  return (
    <div
      className={`relative isolate ${className ?? ""}`}
      style={{ borderRadius: radius, ...vars, ...style }}
    >
      {/* Border + glow layers */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {/* LED strip (masked to just the border ring) */}
        <span className={`led-border ${flow ? "led-flow" : ""} ${pulse ? "led-pulse" : ""}`} />
        {/* Soft outer glow */}
        <span className={`led-glow ${pulse ? "led-pulse" : ""}`} />
      </div>

      {/* Content */}
      <div className={`relative`} style={{ borderRadius: radius }}>
        {children}
      </div>

      <style jsx>{`
        .led-border {
          position: absolute;
          inset: 0;
          border-radius: var(--led-radius);
          padding: var(--led-thickness);
          /* A gentle gradient that we can rotate if flow=true */
          background:
            conic-gradient(
              from 0deg,
              var(--led-color),
              rgba(255,255,255,0.35) 25%,
              var(--led-color) 50%,
              rgba(255,255,255,0.35) 75%,
              var(--led-color)
            );
          /* Mask to ring only (content box minus padding box) */
          -webkit-mask: 
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          -webkit-mask-composite: xor; /* Safari/WebKit */
          mask-composite: exclude;      /* Standard */
          opacity: 0.95;
          border-radius: var(--led-radius);
        }

        .led-flow {
          animation: led-rotate var(--led-speed) linear infinite;
        }

        .led-pulse {
          animation: led-pulse 3.2s ease-in-out infinite;
        }

        .led-glow {
          position: absolute;
          inset: 0;
          border-radius: var(--led-radius);
          /* Soft colored glow behind the border */
          box-shadow:
            0 0 calc(var(--led-glow) * 0.6) 0 var(--led-color),
            0 0 var(--led-glow) 4px rgba(125, 249, 255, 0.35);
          /* Slightly expand for a halo */
          transform: scale(1.01);
          opacity: 0.55;
          filter: blur(0.6px);
        }

        @keyframes led-rotate {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        @keyframes led-pulse {
          0%   { opacity: 0.60; filter: brightness(1); }
          50%  { opacity: 1.00; filter: brightness(1.08); }
          100% { opacity: 0.60; filter: brightness(1); }
        }
      `}</style>
    </div>
  );
};

export default LedBorder;

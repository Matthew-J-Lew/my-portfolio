"use client";

import { RefObject, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import ExperienceCard from "./ExperienceCard";
import type { ExperienceItem } from "./types";

const NODE_PX = 16;

function parseAnchor(anchor: number | string): number {
  if (typeof anchor === "number")
    return anchor > 0 && anchor <= 1 ? window.innerHeight * anchor : anchor;
  const s = String(anchor).trim();
  if (s.endsWith("vh")) return (window.innerHeight * parseFloat(s)) / 100;
  if (s.endsWith("px")) return parseFloat(s);
  const n = Number(s);
  return Number.isNaN(n)
    ? window.innerHeight * 0.5
    : n > 0 && n <= 1
    ? window.innerHeight * n
    : n;
}

export default function TimelineRow({
  index,
  item,
  anchor = 1 / 7,
  spineLeft = 22,
  trackRef,
  registerRow,
  disc = 0,
  ring = 0,
  nodeOffsetX = 0,
  nodeOffsetY = 0,
  nodeRotateDeg = 0,
  nodeGradientAngle = 160,
  nodeGradient,
}: {
  index: number;
  item: ExperienceItem;
  anchor?: number | string;
  spineLeft?: number;
  trackRef?: RefObject<HTMLDivElement | null>;
  registerRow?: (
    index: number,
    topWithinTrack: number,
    height: number
  ) => void;
  disc?: number;
  ring?: number;
  nodeOffsetX?: number;
  nodeOffsetY?: number;
  nodeRotateDeg?: number;
  nodeGradientAngle?: number;
  nodeGradient?: string;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [rowH, setRowH] = useState<number>(0);
  const [y, setY] = useState(0);

  // Measure row height AND push updated metrics upstream whenever card/row changes size.
  useLayoutEffect(() => {
    const update = () => {
      const cardEl = cardRef.current;
      const rEl = rowRef.current;
      const tEl = trackRef?.current;
      if (cardEl) setRowH(cardEl.getBoundingClientRect().height || 0);

      if (rEl && tEl && registerRow) {
        const rowRect = rEl.getBoundingClientRect();
        const trackRect = tEl.getBoundingClientRect();
        const topWithinTrack = rowRect.top - trackRect.top;
        registerRow(index, topWithinTrack, rowRect.height);
      }
    };

    update();

    const ro = new ResizeObserver(update);
    if (cardRef.current) ro.observe(cardRef.current);
    if (rowRef.current) ro.observe(rowRef.current);

    return () => ro.disconnect();
  }, [index, registerRow, trackRef]);

  // Track anchor position within this row as the user scrolls.
  useEffect(() => {
    const rowEl = rowRef.current;
    if (!rowEl) return;

    let raf = 0,
      ticking = false;
    const compute = () => {
      ticking = false;
      const rect = rowEl.getBoundingClientRect();
      const anchorPx = parseAnchor(anchor);
      const raw = anchorPx - rect.top;
      const maxY = Math.max(0, rect.height - NODE_PX);
      setY(Math.max(0, Math.min(raw, maxY)));
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        raf = requestAnimationFrame(compute);
      }
    };
    const onResize = () => compute();

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [anchor]);

  // Node visuals (gradient disc)
  const gradientCss =
    nodeGradient ??
    `linear-gradient(${nodeGradientAngle}deg, #ec4899 0%, #6366f1 45%, #22d3ee 100%)`;
  const scale = 0.9 + 0.1 * disc;
  const discTransform =
    `translate(calc(-50% + ${nodeOffsetX}px), calc(-50% + ${nodeOffsetY}px)) ` +
    `scale(${scale}) rotate(${nodeRotateDeg}deg)`;

  const titleClass = [
    "whitespace-nowrap leading-none",
    "text-[13px] md:text-[15px] font-semibold tracking-wide",
    disc > 0.6
      ? "text-zinc-100 drop-shadow-[0_0_6px_rgba(59,130,246,0.35)]"
      : "text-zinc-300",
  ].join(" ");

  // Derive card glow + pulse (same feel as before)
  const ACTIVE_THR = 0.85;
  const isActive = disc >= ACTIVE_THR;
  const isBridge = disc > 0 && !isActive;
  const isFuture = disc === 0 && ring > 0.5;
  const isPast = disc === 0 && !isFuture;

  let glow = 0;
  if (isActive) glow = 1;
  else if (isBridge) glow = 0.45 + 0.55 * disc;
  else if (isPast) glow = 0.18;
  else glow = 0;

  const wasActive = useRef(false);
  const [pulseKey, setPulseKey] = useState(0);
  useEffect(() => {
    if (isActive && !wasActive.current) setPulseKey((k) => k + 1);
    wasActive.current = isActive;
  }, [isActive]);

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)] gap-6 md:gap-10"
      ref={rowRef}
    >
      {/* Left: moving node */}
      <div className="relative" style={{ height: rowH || undefined }}>
        <motion.div
          className="absolute will-change-transform z-40"
          style={{ y, left: spineLeft }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative">
            {/* Filled disc */}
            <div
              className="absolute top-1/2 left-0 h-4 w-4 rounded-full"
              style={{
                transform: discTransform,
                background: gradientCss,
                boxShadow:
                  disc > 0
                    ? "0 0 8px rgba(99,102,241,0.45), 0 0 14px rgba(99,102,241,0.30), 0 0 20px rgba(34,211,238,0.25)"
                    : "none",
                opacity: disc,
                border:
                  disc > 0 ? "1px solid rgba(255,255,255,0.25)" : "none",
              }}
            />
            {/* Hollow ring */}
            <div
              className="absolute top-1/2 left-0 h-4 w-4 rounded-full"
              style={{
                transform: "translate(-50%, -50%)",
                border: "2px solid rgba(34,211,238,0.7)",
                opacity: Math.max(0, Math.min(1, ring)) * 0.9,
                background: "transparent",
              }}
            />
            {/* Label */}
            <div className="absolute top-1/2 -translate-y-1/2 left-6 md:left-7">
              <div className={titleClass}>{item.org}</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right: card */}
      <div ref={cardRef} className="relative z-30">
        <ExperienceCard item={item} glow={glow} pulseKey={pulseKey} />
      </div>
    </div>
  );
}

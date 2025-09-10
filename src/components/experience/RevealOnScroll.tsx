"use client";
import { motion } from "framer-motion";
import { PropsWithChildren } from "react";

type Dir = "up" | "down" | "left" | "right";

export function RevealOnScroll({
  children,
  dir = "up",
  delay = 0,
  once = true,
  className = "",
}: PropsWithChildren<{ dir?: Dir; delay?: number; once?: boolean; className?: string }>) {
  // Direction → initial offset (px). We animate this back to 0 on reveal.
  const map: Record<Dir, { x: number; y: number }> = {
    up:    { x: 0,  y: 16 },
    down:  { x: 0,  y: -16 },
    left:  { x: 16, y: 0 },
    right: { x: -16,y: 0 },
  };

  return (
    <motion.div
      className={className}
      // Start slightly shifted + transparent
      initial={{ opacity: 0, x: map[dir].x, y: map[dir].y }}
      // When scrolled into view, fade in and slide to neutral
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      // Intersection options: reveal once (or every time) and how much must be visible
      viewport={{ once, amount: 0.2 }}
      // Timing + easing; optional per-instance delay
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

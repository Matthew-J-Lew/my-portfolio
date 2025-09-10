"use client";
import { motion } from "framer-motion";
import type { MediaItem } from "./types";

/**
 * Simple horizontal image scroller with subtle entrance motion.
 * - Uses native horizontal overflow + snap for momentum scrolling.
 * - Adds soft gradient fades at the left/right edges.
 */
export default function MediaCarousel({ items }: { items: MediaItem[] }) {
  // Nothing to show
  if (!items?.length) return null;

  return (
    <div className="group relative">
      {/* Scroll strip: horizontal, snap-to-center, subtle chrome */}
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory rounded-2xl p-2 bg-zinc-900/40 ring-1 ring-zinc-800">
        {items.map((m, i) => (
          <motion.img
            key={i}
            src={m.src}
            alt={m.alt}
            // Fixed-height thumbnails; no wrapping; slight hover scale for polish
            className="h-48 w-auto max-w-none snap-center rounded-xl ring-1 ring-zinc-800 transition-transform duration-300 group-hover:scale-[1.01]"
            loading="lazy"
            // Fade+rise as images enter viewport
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}
      </div>

      {/* Edge fades to soften the crop at the scroll boundaries */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-zinc-950 to-transparent rounded-l-2xl" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-zinc-950 to-transparent rounded-r-2xl" />
    </div>
  );
}

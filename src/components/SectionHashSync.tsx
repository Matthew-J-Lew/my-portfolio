// components/SectionHashSync.tsx
"use client";

import { useEffect, useRef } from "react";

/**
 * Keeps the URL hash in sync with the section near viewport center, but:
 * - Does NOT start until the user interacts (scroll/touch/keys).
 * - Uses replaceState (no history spam, no scroll jump).
 * - Preserves /#projects/<slug> while Projects is in view and the user
 *   has interacted with the gallery.
 *
 * Make sure the section wrappers have these ids:
 *   <section id="about">, <section id="projects">, <section id="experience">, <section id="contact">
 * Optionally give your hero wrapper id="hero" (otherwise we use scrollY<=64 to clear the hash).
 */
export default function SectionHashSync() {
  const startedRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const cancelRef = useRef<() => void>(() => {});
  const lastWrittenRef = useRef<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const ids = ["hero", "about", "projects", "experience", "contact"];
    const els = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    const write = (hash: string | "") => {
      const base = window.location.pathname + window.location.search;
      const target = hash ? `${base}#${hash}` : base;
      if (target === lastWrittenRef.current || target === window.location.href) return;
      try {
        history.replaceState(history.state, "", target);
        lastWrittenRef.current = target;
      } catch {}
    };

    const pickSection = () => {
      // near top -> no hash
      if (window.scrollY <= 64) {
        write("");
        return;
      }

      // Choose the visible section whose center is closest to viewport center
      const vy = window.innerHeight / 2;
      let bestId: string | null = null;
      let bestScore = Infinity;

      for (const el of els) {
        const rect = el.getBoundingClientRect();
        // visible window with a bit of slack, so tall sections work too
        const visible =
          rect.bottom > window.innerHeight * 0.15 &&
          rect.top < window.innerHeight * 0.85;
        if (!visible) continue;

        const center = rect.top + rect.height / 2;
        const score = Math.abs(center - vy);
        if (score < bestScore) {
          bestScore = score;
          bestId = el.id;
        }
      }

      if (!bestId) return;

      if (bestId === "projects") {
        const interacted = Boolean((window as any).__projectsInteracted);
        const current = window.location.hash || "";
        // If user interacted and we already have #projects/<slug>, preserve it
        if (interacted && /^#projects\/[^/]+$/.test(current)) return;
        write("projects");
        return;
      }

      write(bestId === "hero" ? "" : bestId);
    };

    const onEntries: IntersectionObserverCallback = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(pickSection);
    };

    const start = () => {
      if (startedRef.current) return;
      startedRef.current = true;

      const io = new IntersectionObserver(onEntries, {
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
        rootMargin: "-10% 0px -10% 0px",
      });

      els.forEach((el) => io.observe(el));

      // Also react to scroll so we don’t miss center crossings between IO batches
      const onScroll = () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(pickSection);
      };
      window.addEventListener("scroll", onScroll, { passive: true });

      cancelRef.current = () => {
        io.disconnect();
        window.removeEventListener("scroll", onScroll);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };

      // First pick after interaction
      pickSection();
    };

    // Start only after user interaction (keeps initial URL clean)
    const kick = () => start();
    const keyKick = (e: KeyboardEvent) => {
      if (
        e.key === "ArrowDown" ||
        e.key === "ArrowUp" ||
        e.key === "PageDown" ||
        e.key === "PageUp" ||
        e.key === "Home" ||
        e.key === "End" ||
        e.key === " "
      ) {
        start();
      }
    };

    window.addEventListener("wheel", kick, { passive: true });
    window.addEventListener("touchstart", kick, { passive: true });
    window.addEventListener("keydown", keyKick, { passive: true });

    return () => {
      window.removeEventListener("wheel", kick);
      window.removeEventListener("touchstart", kick);
      window.removeEventListener("keydown", keyKick);
      cancelRef.current();
    };
  }, []);

  return null;
}

// components/projectsSection.tsx
"use client";

/**
 * Projects section
 * - Keeps URL clean on initial load (no hash write).
 * - Supports deep-linking: #slug (legacy) or #projects/<slug>.
 * - After *user interaction* only, writes /#projects/<slug> to the URL.
 */

import { useEffect, useRef } from "react";
import { useProjectsStore } from "@/components/projects/projectsStore";
import { projects } from "@/components/projects/projects";
import ProjectDetails from "@/components/projects/ProjectDetails";
import ProjectGallery from "@/components/projects/ProjectGallery";
import { RevealOnScroll } from "./revealOnScroll";

const TINT_CLASS = "bg-[#121212]/85";

export default function ProjectsSection() {
  const { activeIndex, setActiveBySlug, setActiveIndex } = useProjectsStore();

  // Gate URL updates until the user interacts with the projects UI
  const hasInteractedRef = useRef(false);

  // On first render, respect a hash if present, but DO NOT write back to URL.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.location.hash?.replace(/^#/, "") || "";

    // Accept either "#projects/<slug>" or just "#<slug>"
    let slug = raw;
    if (raw.startsWith("projects/")) {
      slug = raw.slice("projects/".length);
    }

    if (slug && slug !== "projects") {
      setActiveBySlug(slug);
      // Do not mark as interacted — initial deep-link shouldn't cause auto-writes
    }
  }, [setActiveBySlug]);

  // Only write the hash after the user has interacted.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!hasInteractedRef.current) return;

    const slug = projects[activeIndex]?.slug;
    if (!slug) return;

    const target = `#projects/${slug}`;
    if (window.location.hash !== target) {
      // Mark as interacted for any external hash-sync logic
      (window as any).__projectsInteracted = true;
      // pushState so back/forward history works like before
      history.pushState(null, "", target);
    }
  }, [activeIndex]);

  // Wrap the gallery change handler so we can mark interaction
  const handleChangeIndex = (i: number) => {
    hasInteractedRef.current = true;
    if (typeof window !== "undefined") {
      (window as any).__projectsInteracted = true;
    }
    setActiveIndex(i);
  };

  // Wrap the details "jump to" handler so we also mark interaction
  const handleJumpTo = (slug: string) => {
    hasInteractedRef.current = true;
    if (typeof window !== "undefined") {
      (window as any).__projectsInteracted = true;
    }
    setActiveBySlug(slug);
  };

  return (
    <section
      id="projects"
      className="relative min-h-screen flex items-center py-12 md:py-16 text-white"
    >
      {/* full-bleed grey tint so particles show through */}
      <div aria-hidden className={`absolute inset-0 ${TINT_CLASS}`} />

      <div className="relative z-10 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left column: textual details + tech (mobile carousel buttons live here too) */}
          <div className="lg:col-span-5">
            <RevealOnScroll>
              <ProjectDetails
                project={projects[activeIndex]}
                onJumpTo={handleJumpTo}
              />
            </RevealOnScroll>
          </div>

          {/* Right column: interactive gallery */}
          <RevealOnScroll className="hidden lg:flex lg:col-span-7 h-full items-center">
            <ProjectGallery
              items={projects}
              activeIndex={activeIndex}
              onChangeIndex={handleChangeIndex}
              dotsOffset={{ x: 0, y: 0 }}
              tipOffset={{ x: 0, y: 0 }}
            />
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}

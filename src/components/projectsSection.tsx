// components/projectsSection.tsx
"use client";

/**
 * Projects section
 * - Semi-transparent #121212 overlay so particles remain visible.
 * - Keeps your existing layout/logic intact.
 */

import { useEffect } from "react";
import { useProjectsStore } from "@/components/projects/projectsStore";
import { projects } from "@/components/projects/projects";
import ProjectDetails from "@/components/projects/ProjectDetails";
import ProjectGallery from "@/components/projects/ProjectGallery";
import { RevealOnScroll } from "./revealOnScroll";

const TINT_CLASS = "bg-[#121212]/85"; // adjust opacity to taste

export default function ProjectsSection() {
  const { activeIndex, setActiveBySlug, setActiveIndex } = useProjectsStore();

  // On first render, look at the URL hash and select that project if present.
  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const slug = hash?.replace(/^#/, "");
    if (slug) setActiveBySlug(slug);
  }, [setActiveBySlug]);

  // When the active project changes, push its slug into the hash.
  // (Avoids extra history entries if the hash is already correct.)
  useEffect(() => {
    const slug = projects[activeIndex]?.slug;
    if (!slug) return;
    if (typeof window !== "undefined") {
      const newHash = `#${slug}`;
      if (window.location.hash !== newHash)
        history.pushState(null, "", newHash);
    }
  }, [activeIndex]);

  return (
    // One viewport tall so the section feels like a dedicated “page”
    <section
      id="projects"
      className="relative min-h-screen flex items-center py-12 md:py-16 text-white"
    >
      {/* full-bleed grey tint so particles show through */}
      <div aria-hidden className={`absolute inset-0 ${TINT_CLASS}`} />

      <div className="relative z-10 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8">
        {/* 12-col layout on large screens; stacks on small screens */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left column: textual details + tech cube/tags (and on <lg, the mobile carousel) */}
          <div className="lg:col-span-5">
            <RevealOnScroll>
              <ProjectDetails
                project={projects[activeIndex]}
                onJumpTo={(slug) => setActiveBySlug(slug)}
              />
            </RevealOnScroll>
          </div>

          {/* Right column: interactive gallery; only render when the layout is 2 columns.
              Using `hidden lg:flex` ensures it's never shown in the 1-column layout. */}
          <RevealOnScroll className="hidden lg:flex lg:col-span-7 h-full items-center">
            <ProjectGallery
              items={projects}
              activeIndex={activeIndex}
              onChangeIndex={(i) => setActiveIndex(i)}
              dotsOffset={{ x: 0, y: 0 }}
              tipOffset={{ x: 0, y: 0 }}
            />
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}

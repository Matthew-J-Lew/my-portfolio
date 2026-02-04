"use client";
// components/projects/ProjectDetails.tsx

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import TechCube from "./TechCube";
import TechBadgesRow from "./TechBadgesRow";
import ProjectCard from "./ProjectCard"; // mobile: show the image carousel here
import type { Project } from "./projects";

/** Short helper to keep the teaser text compact in the summary. */
function truncate(text: string, limit = 220) {
  if (!text) return "";
  if (text.length <= limit) return text;
  return text.slice(0, limit).trimEnd() + "…";
}

/** Maps project kind to a label + tailwind classes for the pill badge. */
function kindBadge(kind: Project["kind"]) {
  if (kind === "professional") {
    return {
      label: "Professional Project",
      className:
        "bg-emerald-900/30 text-emerald-200 border border-emerald-700/40",
    };
  }
  if (kind === "hackathon") {
    return {
      label: "Hackathon Project",
      className:
        "bg-fuchsia-900/30 text-fuchsia-200 border border-fuchsia-700/40",
    };
  }
  return {
    label: "Personal Project",
    className: "bg-indigo-900/30 text-indigo-200 border border-indigo-700/40",
  };
}

/**
 * Left-hand project details pane:
 * - Title, kind badge, tagline/impact
 * - Collapsible description
 * - Tech visual (3D cube on desktop; flat badges for reduced motion)
 * - On <lg: mobile layout shows the image carousel here with Prev/Next buttons.
 * - Links (GitHub, Demo)
 * - Tech stack tags (filtered by showInTags)
 */
export default function ProjectDetails({
  project,
  onJumpTo, // used for mobile prev/next buttons
}: {
  project: Project;
  onJumpTo: (slug: string) => void;
}) {
  // Respect reduced-motion settings (fallback to flat badges instead of 3D).
  const reduced = useReducedMotion();
  const has3D = !reduced;

  // Style the "Professional/Personal" badge once per render.
  const badge = kindBadge(project.kind);

  // Helpers for mobile prev/next (wrap across the list using allTitles).
  const all = project.allTitles ?? [];
  const selfIdx = all.findIndex((t) => t.slug === project.slug);
  const prevSlug =
    selfIdx >= 0 && all.length > 0
      ? all[(selfIdx - 1 + all.length) % all.length].slug
      : undefined;
  const nextSlug =
    selfIdx >= 0 && all.length > 0
      ? all[(selfIdx + 1) % all.length].slug
      : undefined;

  return (
    <div className="flex flex-col gap-5">
      {/* Header block (animated in on mount/swap) */}
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        className="space-y-3"
      >
        {/* Section label + kind pill */}
        <div className="flex items-center gap-3">
          <span className="text-sm uppercase tracking-widest text-zinc-400">
            Projects
          </span>
          <span
            className={`text-xs px-2.5 py-1 rounded-full ${badge.className}`}
            title={project.role || badge.label}
          >
            {badge.label}
          </span>
        </div>

        {/* Title + optional tagline */}
        <h2 className="text-2xl md:text-3xl font-semibold">{project.title}</h2>
        {project.tagline && <p className="text-zinc-300">{project.tagline}</p>}

        {/* Optional impact line */}
        {project.impact && (
          <p className="text-sm text-zinc-400">
            <span className="font-medium text-zinc-300">Impact:</span>{" "}
            {project.impact}
          </p>
        )}

        {/* Collapsible description: short summary in <summary>, full text below */}
        {project.description && (
          <details className="group">
            <summary className="cursor-pointer list-none inline-flex gap-1 text-zinc-200 hover:text-white">
              <span>{truncate(project.description)}</span>
              {project.description.length > 220 && (
                <span className="ml-2 underline decoration-dotted">More</span>
              )}
            </summary>
            {project.description.length > 220 && (
              <p className="mt-2 text-zinc-300">{project.description}</p>
            )}
          </details>
        )}
      </motion.div>

      {/* MOBILE (<lg): screenshot carousel where the cube would be + Prev/Next underneath */}
      <div className="lg:hidden">
        <ProjectCard project={project} isActive prewarm visibilityHint />
        <div className="mt-3 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => prevSlug && onJumpTo(prevSlug)}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-sm"
          >
            Prev Project
          </button>
          <button
            type="button"
            onClick={() => nextSlug && onJumpTo(nextSlug)}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-sm"
          >
            Next Project
          </button>
        </div>
      </div>

      {/* DESKTOP/TABLET (>=lg): tech visualization (cube or flat badges).
          Hidden below lg to avoid the stacked layout/scroll trap. */}
      <div className="hidden lg:block">
        {has3D ? (
          <TechCube tech={project.tech} />
        ) : (
          <TechBadgesRow tech={project.tech} />
        )}
      </div>

      {/* External links (GitHub / Live Demo) */}
      <div className="flex flex-wrap gap-3 pt-1">
        {project.links?.github && (
          <a
            href={project.links.github}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-zinc-800 hover:bg-zinc-700 transition shadow-sm focus:outline-none focus:ring focus:ring-zinc-500 text-zinc-100"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M12 .5a12 12 0 0 0-3.79 23.4c.6.1.82-.26.82-.58 0-.28-.01-1.02-.02-2-3.34.73-4.04-1.61-4.04-1.61-.55-1.4-1.34-1.78-1.34-1.78-1.1-.76.08-.74.08-.74 1.22.09 1.86 1.26 1.86 1.26 1.08 1.85 2.83 1.31 3.52 1 .11-.8.42-1.31.76-1.61-2.67-.31-5.47-1.33-5.47-5.9 0-1.3.47-2.36 1.24-3.19-.12-.31-.54-1.57.12-3.27 0 0 1.01-.32 3.3 1.22a11.5 11.5 0 0 1 6 0c2.29-1.54 3.3-1.22 3.3-1.22.66 1.7.24 2.96.12 3.27.77.83 1.24 1.89 1.24 3.19 0 4.58-2.8 5.58-5.48 5.88.43.37.81 1.1.81 2.22 0 1.6-.02 2.89-.02 3.28 0 .32.21.69.83.57A12 12 0 0 0 12 .5z" />
            </svg>
            GitHub
          </a>
        )}
        {project.links?.demo && (
          <a
            href={project.links.demo}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-2xl bg-white text-black hover:bg-zinc-100 transition shadow-sm focus:outline-none focus:ring focus:ring-zinc-200"
          >
            Live Demo
          </a>
        )}
       {project.links?.devpost && (
          <a
            href={project.links.devpost}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-zinc-800 hover:bg-zinc-700 transition shadow-sm focus:outline-none focus:ring focus:ring-zinc-500 text-zinc-100"
          >
            <span className="relative h-4 w-4">
              <Image
                src="/icons/devpost.svg"
                alt=""
                fill
                className="object-contain"
                sizes="16px"
                aria-hidden
              />
            </span>
            Devpost
          </a>
        )}
      </div>

      {/* Tech stack tags:
         - Uses project.tech
         - Only renders entries that do not explicitly opt out via showInTags === false */}
      <div className="pt-3">
        <h3 className="sr-only">Tech stack</h3>
        <div className="flex flex-wrap gap-2" aria-label="Tech stack">
          {project.tech
            ?.filter((t) => t.showInTags !== false)
            .map((t) => (
              <span
                key={t.name}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs text-zinc-200 backdrop-blur-sm hover:bg-white/10 transition-colors"
              >
                <span className="relative h-4 w-4">
                  <Image
                    src={t.icon}
                    alt=""
                    fill
                    className="object-contain"
                    sizes="16px"
                    aria-hidden
                  />
                </span>
                {t.name}
              </span>
            ))}
        </div>
      </div>
    </div>
  );
}

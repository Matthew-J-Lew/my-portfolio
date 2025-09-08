"use client";

import { useMemo } from "react";
import type { Project } from "./projects";
import Carousel, { CarouselItem } from "./Carousel";

/**
 * Displays a single project as a card.
 * Each card shows an image carousel with screenshots for that project.
 */
export default function ProjectCard({
  project,
  isActive,
  prewarm,
  visibilityHint,
  onClick,
}: {
  project: Project;
  isActive: boolean;
  prewarm?: boolean;       // if true, prepare images eagerly for smoother transitions
  visibilityHint?: boolean; // indicates whether the card is likely visible soon
  onClick?: () => void;     // optional click handler (e.g., to select the card)
}) {
  // Build carousel items for this project.
  // If the project has images, use them; otherwise fall back to a placeholder.
  const items: CarouselItem[] = useMemo(
    () =>
      (project.images?.length
        ? project.images
        : [{ src: "/images/placeholder.png", alt: project.title }]
      ).map((img, idx) => ({
        id: `${project.id}-${idx}`,
        title: project.title,
        description: project.tagline,
        imageSrc: img.src,
        imageAlt: img.alt,
      })),
    [project.id, project.images, project.tagline, project.title]
  );

  // Only autoplay the carousel when this card is active and visible.
  const shouldAutoplay = Boolean(isActive && visibilityHint);

  return (
    <div onClick={onClick}>
      <Carousel
        items={items}
        autoWidth
        autoplay={shouldAutoplay}
        autoplayDelay={2600}
        pauseOnHover
        loop={false}              // do not wrap; bounce at the edges instead
        round={false}
        highPriority={Boolean(isActive || prewarm)}
        eagerCount={2}            // load at least the first two slides eagerly
      />
    </div>
  );
}

"use client";

import { useEffect, useState, useRef } from "react";
import type { ReactNode } from "react";
import { motion, PanInfo, useMotionValue } from "motion/react";
import NextImage from "next/image";

export interface CarouselItem {
  id: number | string;
  imageSrc?: string;
  imageAlt?: string;
  title?: string;
  description?: string;
  icon?: ReactNode;
}

export interface CarouselProps {
  items?: CarouselItem[];
  baseWidth?: number;
  autoWidth?: boolean;
  autoplay?: boolean;
  autoplayDelay?: number;
  pauseOnHover?: boolean;
  loop?: boolean; // when false we stop at the ends and “rubberband” back
  round?: boolean;
  /** Passed to the <img>; “object-contain” avoids cropping and uses letterboxing. */
  imageClassName?: string;
  /** Applied to each slide’s outer wrapper. */
  borderClassName?: string;
  highPriority?: boolean;
  eagerCount?: number;
  /** Background used for the letterbox bars. */
  letterboxColor?: string;
}

const DEFAULT_ITEMS: CarouselItem[] = [
  { id: 1, imageSrc: "/images/placeholder.png", imageAlt: "Slide 1" },
  { id: 2, imageSrc: "/images/placeholder.png", imageAlt: "Slide 2" },
  { id: 3, imageSrc: "/images/placeholder.png", imageAlt: "Slide 3" },
];

const GAP = 16;
const SPRING_OPTIONS = { type: "spring", stiffness: 300, damping: 30 } as const;
const VELOCITY_THRESHOLD = 500; // fling speed that counts as a swipe
const BLUR_DARK =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=";

export default function Carousel({
  items = DEFAULT_ITEMS,
  baseWidth = 300,
  autoWidth = false,
  autoplay = false,
  autoplayDelay = 3000,
  pauseOnHover = false,
  loop = false,
  round = false,
  imageClassName = "object-contain",
  borderClassName = "border border-white/15",
  highPriority = false,
  eagerCount = 2,
  letterboxColor = "#000",
}: CarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState<number>(baseWidth);

  // If autoWidth is on, track the container’s width so slides size themselves responsively.
  useEffect(() => {
    if (!autoWidth || !containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver(() =>
      setContainerW(el.clientWidth || baseWidth)
    );
    setContainerW(el.clientWidth || baseWidth);
    ro.observe(el);
    return () => ro.disconnect();
  }, [autoWidth, baseWidth]);

  // Basic sizing: slide width is container width minus a little padding.
  const effectiveWidth = autoWidth ? containerW : baseWidth;
  const containerPadding = 16;
  const itemWidth = Math.max(120, effectiveWidth - containerPadding * 2);
  const trackItemOffset = itemWidth + GAP;

  // We don’t clone items when loop=false; we’ll just bounce at the ends.
  const carouselItems = items;

  // Active slide and transient interaction state.
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const x = useMotionValue(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // Hover toggles a pause flag and shows a “grab” cursor.
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const onEnter = () => setIsHovered(true);
    const onLeave = () => setIsHovered(false);
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  // Optional autoplay. With loop=false we stop at the last slide; otherwise wrap around.
  useEffect(() => {
    if (!autoplay) return;
    if (pauseOnHover && isHovered) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        if (loop) return (prev + 1) % items.length;
        return Math.min(prev + 1, items.length - 1);
      });
    }, autoplayDelay);

    return () => clearInterval(timer);
  }, [autoplay, autoplayDelay, pauseOnHover, isHovered, loop, items.length]);

  // Swipe decision: advance when dragged far enough or flung fast enough.
  const distanceThreshold = itemWidth * 0.22;

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const offset = info.offset.x; // negative = dragged left (toward next)
    const velocity = info.velocity.x;

    // Next slide
    if (offset < -distanceThreshold || velocity < -VELOCITY_THRESHOLD) {
      setCurrentIndex((prev) =>
        loop ? (prev + 1) % items.length : Math.min(prev + 1, items.length - 1)
      );
      return;
    }

    // Previous slide
    if (offset > distanceThreshold || velocity > VELOCITY_THRESHOLD) {
      setCurrentIndex((prev) =>
        loop ? (prev - 1 + items.length) % items.length : Math.max(prev - 1, 0)
      );
      return;
    }

    // Otherwise keep the current index; the spring snaps back.
  };

  // When not looping, constrain the drag so users can overdrag elastically but not break out.
  const dragProps = loop
    ? {}
    : {
        dragConstraints: {
          left: -trackItemOffset * (items.length - 1),
          right: 0,
        },
      };

  // This is the slide we consider selected for things like eager loading and scale.
  const logicalActive = currentIndex;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden p-4 select-none ${
        round
          ? "rounded-full border border-white bg-zinc-900"
          : "rounded-[24px] border border-white/10 bg-zinc-900"
      }`}
      style={{
        width: autoWidth ? "100%" : `${effectiveWidth}px`,
        ...(round && { height: `${itemWidth}px` }),
        cursor: isHovered ? "grab" : "default",
      }}
    >
      {/* Track with draggable slides */}
      <motion.div
        className="flex"
        drag="x"
        dragElastic={0.25} // small rubberband at the edges
        dragMomentum={false} // no inertial glide after release
        {...dragProps}
        style={{
          width: itemWidth,
          gap: `${GAP}px`,
          perspective: 1000,
          perspectiveOrigin: `${
            currentIndex * trackItemOffset + itemWidth / 2
          }px 50%`,
          x,
        }}
        onDragEnd={handleDragEnd}
        animate={{ x: -(currentIndex * trackItemOffset) }}
        transition={SPRING_OPTIONS} // same spring handles snap + bounce-back
      >
        {carouselItems.map((item, index) => {
          // Load the current slide and neighbors eagerly for a smooth feel.
          const eager =
            index < (eagerCount ?? 2) ||
            index === logicalActive ||
            index === Math.min(logicalActive + 1, items.length - 1);

          return (
            <motion.div
              key={`${item.id}-${index}`}
              className={`relative shrink-0 ${
                round ? "border-0" : borderClassName
              } overflow-hidden`}
              style={{
                width: itemWidth,
                height: round ? itemWidth : 320,
                borderRadius: round ? "9999px" : "12px",
                // Solid fill for letterbox bars behind object-contain images.
                backgroundColor: letterboxColor,
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                cursor: "grab",
                willChange: "transform, opacity",
                transform: "translateZ(0)",
                scale: index === logicalActive ? 1 : 0.98,
              }}
              transition={SPRING_OPTIONS}
            >
              {!!item.imageSrc && (
                <NextImage
                  src={item.imageSrc}
                  alt={item.imageAlt || ""}
                  fill
                  sizes="(max-width:1024px) 90vw, 600px"
                  // Keep images contained (no crop) and let the black bars show.
                  className={`pointer-events-none select-none ${imageClassName} ${
                    round ? "rounded-full" : "rounded-[10px]"
                  }`}
                  style={{ backgroundColor: "transparent" }}
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  priority={highPriority || eager}
                  loading={highPriority || eager ? "eager" : "lazy"}
                  placeholder="blur"
                  blurDataURL={BLUR_DARK}
                />
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Pagination dots */}
      <div
        className={`flex w-full justify-center ${
          round ? "absolute z-20 bottom-12 left-1/2 -translate-x-1/2" : ""
        }`}
      >
        <div className="mt-4 mb-1 flex w-[150px] justify-between px-8">
          {items.map((_, index) => (
            <motion.div
              key={`dot-${index}`}
              className="h-2 w-2 rounded-full cursor-pointer transition-colors duration-150"
              style={{
                backgroundColor:
                  logicalActive === index ? "white" : "rgba(255,255,255,0.35)",
              }}
              animate={{ scale: logicalActive === index ? 1.2 : 1 }}
              onClick={() => setCurrentIndex(index)}
              transition={{ duration: 0.15 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

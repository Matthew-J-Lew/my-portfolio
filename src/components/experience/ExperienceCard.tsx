"use client";
import { motion } from "framer-motion";
import MediaCarousel from "./MediaCarousel";
import GlowLedBorder from "../ui/GlowLedBorder";
import type { ExperienceItem } from "./types";

// Small helper: pick badge colors by employment type
function employmentBadgeClasses(kind?: ExperienceItem["employmentType"]) {
  switch (kind) {
    case "internship": return "bg-sky-500/10 text-sky-300 ring-1 ring-sky-400/30";
    case "co-op":      return "bg-indigo-500/10 text-indigo-300 ring-1 ring-indigo-400/30";
    case "contract":   return "bg-amber-500/10 text-amber-300 ring-1 ring-amber-400/30";
    case "part-time":  return "bg-fuchsia-500/10 text-fuchsia-300 ring-1 ring-fuchsia-400/30";
    case "fulltime":   return "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-400/30";
    default:           return "bg-zinc-700/20 text-zinc-300 ring-1 ring-zinc-600/40";
  }
}

export default function ExperienceCard({
  item,
  featured = false,
  glow = 0,       // 0..1 brightness used by GlowLedBorder
  pulseKey = 0,   // bump to retrigger the entry pulse
}: {
  item: ExperienceItem;
  featured?: boolean;
  glow?: number;
  pulseKey?: number;
}) {
  // Lighten glass a bit for upcoming roles
  const isLight = item.light || item.status === "upcoming";

  // Cheap single-image detection to switch layout (image above impact text)
  const media = (item.media ?? []) as Array<any>;
  const hasSingleImage =
    media.length === 1 &&
    typeof media[0]?.src === "string" &&
    (media[0]?.type === "image" || !media[0]?.type);

  // Build one secondary badge: prefer explicit durationLabel (e.g., "16-month Co-op"),
  // otherwise fall back to employmentType ("Co-op", "Internship", etc.)
  const showSecondaryBadge = Boolean(item.durationLabel || item.employmentType);
  const secondaryBadgeText =
    item.durationLabel ??
    (item.employmentType
      ? item.employmentType === "co-op"
        ? "Co-op"
        : item.employmentType.charAt(0).toUpperCase() + item.employmentType.slice(1)
      : "");
  const secondaryBadgeClasses = employmentBadgeClasses(item.employmentType);

  return (
    // Reusable LED frame (looks identical to the original inline LED)
    <GlowLedBorder glow={glow} pulseKey={pulseKey} radius={16} thickness={2}>
      <motion.article
        // Fade/slide-in once per viewport entry
        initial={{ opacity: 0, x: 24 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={[
          "relative rounded-2xl p-5 md:p-6",
          // Glass card shell (no backdrop-blur to avoid timeline glow bleed-through)
          "bg-gradient-to-b from-zinc-900/70 via-zinc-900/60 to-zinc-900/45",
          "ring-1 ring-zinc-800/80 shadow-[0_10px_30px_rgba(0,0,0,0.35)]",
          // Subtle inner border + top sheen accent
          "before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:border before:border-white/5",
          "after:pointer-events-none after:absolute after:inset-x-4 after:top-0 after:h-px after:bg-gradient-to-r after:from-white/20 after:via-white/5 after:to-transparent",
          isLight ? "opacity-95" : "opacity-100",
          featured ? "outline outline-1 outline-cyan-500/40" : "",
        ].join(" ")}
        style={{ isolation: "isolate" }}
      >
        {/* Header row: logo + role + meta + right-side badges */}
        <div className="flex items-center gap-4">
          {item.logoSrc && (
            <img
              src={item.logoSrc}
              alt={`${item.org} logo`}
              className="h-9 md:h-10 w-auto shrink-0 transition-transform duration-300 hover:scale-105"
              loading="lazy"
            />
          )}

          <div className="min-w-0">
            <h3 className="text-lg md:text-xl font-semibold tracking-tight text-zinc-100">
              {item.role}
            </h3>
            <p className="text-zinc-400 text-sm md:text-[15px]">
              {item.start} – {item.end}
              {item.location ? (
                <span className="whitespace-nowrap"> • {item.location}</span>
              ) : null}
            </p>
          </div>

          {/* Compact badges on the right
             - MOBILE: drop to a new line and wrap so long labels (e.g., "16-month Co-op") never overflow.
             - DESKTOP: stays inline on the right as before. */}
          <div className="ml-auto md:ml-auto basis-full md:basis-auto flex flex-wrap items-center gap-2 mt-2 md:mt-0">
            {showSecondaryBadge && (
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${secondaryBadgeClasses}`}
                title={secondaryBadgeText}
              >
                {secondaryBadgeText}
              </span>
            )}
            {item.status === "current" && (
              <span className="shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300 ring-1 ring-emerald-500/30">
                Current
              </span>
            )}
            {item.status === "upcoming" && (
              <span className="shrink-0 rounded-full bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-300 ring-1 ring-cyan-500/30">
                Upcoming
              </span>
            )}
          </div>
        </div>

        {/* Single hero image (when present) sits above the description */}
        {hasSingleImage && (
          <figure
            className={[
              "mx-auto mt-4 md:mt-5",
              "max-w-2xl w-full",
              "overflow-hidden rounded-xl",
              "ring-1 ring-zinc-800 bg-zinc-950/30",
              "shadow-[0_8px_24px_rgba(0,0,0,0.35)]",
            ].join(" ")}
          >
            <img
              src={media[0].src}
              alt={media[0].alt ?? `${item.org} photo`}
              className="block w-full h-auto"
              loading="lazy"
            />
            {media[0].caption && (
              <figcaption className="px-4 py-2 text-center text-xs text-zinc-400">
                {media[0].caption}
              </figcaption>
            )}
          </figure>
        )}

        {/* Body copy: impact + bullets; measure is slightly wider on large screens */}
        <div
          className={[
            "mt-4 md:mt-5",
            "max-w-[86ch] md:max-w-[96ch] xl:max-w-[94ch]",
            "space-y-3",
            hasSingleImage ? "md:mt-5" : "",
          ].join(" ")}
        >
          {item.impact && (
            <p className="text-[15px] md:text-base leading-relaxed text-zinc-300">
              {item.impact}
            </p>
          )}

          {item.bullets?.length ? (
            <ul className="list-disc pl-5 text-zinc-300/95 marker:text-zinc-500 space-y-1.5">
              {item.bullets.map((b, i) => (
                <li key={i} className="leading-relaxed text-[15px] md:text-base">
                  {b}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {/* Fallback carousel when more than one media item exists */}
        {!hasSingleImage && media.length > 0 && (
          <div className="mt-4 md:mt-5">
            <MediaCarousel items={media} />
          </div>
        )}
      </motion.article>
    </GlowLedBorder>
  );
}

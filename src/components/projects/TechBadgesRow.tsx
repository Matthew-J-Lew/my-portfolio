// components/projects/TechBadgesRow.tsx
"use client";

/**
 * Simple non-3D tech row shown when reduced motion is on or 3D is unavailable.
 * It renders a compact pill for each tech item. The icon is represented by a
 * tiny fallback glyph derived from the icon path (keeps it lightweight).
 */
export default function TechBadgesRow({
  tech,
}: {
  tech: { name: string; icon: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {tech.map((t) => (
        <span
          key={t.name}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-2xl bg-zinc-900/60 border border-white/5 text-sm"
        >
          {/* small visual marker based on the icon path */}
          <span aria-hidden>{fallbackGlyph(t.icon)}</span>
          {t.name}
        </span>
      ))}
    </div>
  );
}

/**
 * Very lightweight icon fallback:
 * inspects the icon path and returns a small symbol that roughly matches.
 */
function fallbackGlyph(iconPath: string) {
  const p = iconPath.toLowerCase();
  if (p.includes("react")) return "⚛️";
  if (p.includes("next")) return "▲";
  if (p.includes("ts")) return "TS";
  if (p.includes("tailwind")) return "〰️";
  return "•";
}

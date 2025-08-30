"use client";
import React from "react";
import type { Skill } from "./skillsData";

type Props = {
  skill: Skill;
  size?: "sm" | "md";
  className?: string;
  /** multiplier for visual size (1 = base). Used to scale padding, font, icon. */
  scale?: number;
};

function FallbackBadge({ label, size, scale = 1 }: { label: string; size: "sm" | "md"; scale?: number }) {
  const base = size === "sm" ? { dim: 16, font: 10 } : { dim: 20, font: 11 };
  const d = Math.round(base.dim * scale);
  const f = Math.round(base.font * scale);
  return (
    <span
      aria-hidden
      className="inline-flex items-center justify-center rounded-full bg-white/20 font-semibold shrink-0 select-none"
      style={{ width: d, height: d, fontSize: f }}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
    >
      {label.slice(0, 2).toUpperCase()}
    </span>
  );
}

export default function SkillPill({ skill, size = "md", className = "", scale = 1 }: Props) {
  const base =
    size === "sm"
      ? { px: 8, py: 4, font: 12, icon: 16 }
      : { px: 12, py: 6, font: 14, icon: 20 };

  const padX = Math.round(base.px * scale);
  const padY = Math.round(base.py * scale);
  const font = Math.round(base.font * scale);
  const icon = Math.max(1, Math.round(base.icon * scale));

  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full bg-blue-600/90 text-white shadow-sm",
        "shrink-0 select-none no-drag-select",
        className,
      ].join(" ")}
      title={`${skill.name} — ${skill.category}`}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      style={{
        userSelect: "none",
        padding: `${padY}px ${padX}px`,
        fontSize: font,
        lineHeight: 1,
      }}
    >
      {skill.iconSrc ? (
        <img
          src={skill.iconSrc}
          alt=""
          aria-hidden
          className="inline-block shrink-0 pointer-events-none"
          width={icon}
          height={icon}
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
        />
      ) : (
        <FallbackBadge label={skill.name} size={size} scale={scale} />
      )}
      <span className="leading-none">{skill.name}</span>
    </span>
  );
}

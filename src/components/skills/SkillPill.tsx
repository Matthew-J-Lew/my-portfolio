"use client";
import React from "react";
import type { Skill } from "./skillsData";

type Props = { skill: Skill; size?: "sm" | "md"; className?: string };

function FallbackBadge({ label, size }: { label: string; size: "sm" | "md" }) {
  const dim = size === "sm" ? "h-4 w-4 text-[10px]" : "h-5 w-5 text-[11px]";
  return (
    <span
      aria-hidden
      className={`inline-flex items-center justify-center rounded-full bg-white/20 ${dim} font-semibold shrink-0 select-none`}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
    >
      {label.slice(0, 2).toUpperCase()}
    </span>
  );
}

export default function SkillPill({ skill, size = "md", className = "" }: Props) {
  const pad = size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm";
  const iconDim = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full bg-blue-600/90 text-white shadow-sm",
        "shrink-0 select-none no-drag-select", // << prevents highlight & native drag
        pad,
        className,
      ].join(" ")}
      title={`${skill.name} — ${skill.category}`}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      style={{ userSelect: "none" }}
    >
      {skill.iconSrc ? (
        <img
          src={skill.iconSrc}
          alt=""
          aria-hidden
          className={`${iconDim} inline-block shrink-0 pointer-events-none`}
          width={size === "sm" ? 16 : 20}
          height={size === "sm" ? 16 : 20}
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
        />
      ) : (
        <FallbackBadge label={skill.name} size={size} />
      )}
      <span className="leading-none">{skill.name}</span>
    </span>
  );
}

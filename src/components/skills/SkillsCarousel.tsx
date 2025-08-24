"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import SkillPill from "./SkillPill";
import { skills as ALL, type Skill } from "./skillsData";

/** deterministic order: core first */
function orderCoreFirst(list: Skill[]) {
  const core = list.filter((s) => s.core);
  const rest = list.filter((s) => !s.core);
  return [...core, ...rest];
}

type RowCfg = {
  base: Skill[];
  dir: "left" | "right";
  dur: string; // e.g., "28s"
};

export default function SkillsCarousel() {
  // Rows (your categories)
  const row1 = useMemo(
    () => orderCoreFirst(ALL.filter((s) => s.category === "Programming Languages")),
    []
  );
  const row2 = useMemo(
    () => orderCoreFirst(ALL.filter((s) => s.category === "Web & Cloud")),
    []
  );
  const row3 = useMemo(
    () =>
      orderCoreFirst([
        ...ALL.filter((s) => s.category === "Database"),
        ...ALL.filter((s) => s.category === "DevOps & Tools"),
      ]),
    []
  );

  const rows: RowCfg[] = useMemo(
    () => [
      { base: row1, dir: "left", dur: "28s" },
      { base: row2, dir: "right", dur: "32s" },
      { base: row3, dir: "left", dur: "36s" },
    ],
    [row1, row2, row3]
  );

  // measurement refs & repeat counts
  const wrapRefs = useRef<HTMLDivElement[]>([]);
  const measureRefs = useRef<HTMLDivElement[]>([]);
  const [repeats, setRepeats] = useState<number[]>(() => rows.map(() => 2));

  // measure: ensure track >= 2x container
  useEffect(() => {
    const calc = () => {
      const next = rows.map((_, i) => {
        const wrap = wrapRefs.current[i];
        const meas = measureRefs.current[i];
        if (!wrap || !meas) return 2;
        const containerW = wrap.clientWidth || 1;
        const baseW = meas.scrollWidth || 1;
        // repeat count so baseW * repeats >= containerW * 2
        return Math.max(2, Math.ceil((containerW * 2) / baseW));
      });
      setRepeats(next);
    };
    const ro = new ResizeObserver(calc);
    wrapRefs.current.forEach((el) => el && ro.observe(el));
    calc();
    return () => ro.disconnect();
  }, [rows.length]);

  return (
    <div className="rounded-lg border border-white/10 bg-neutral-900/30 overflow-hidden px-3 py-4 md:px-4 md:py-5 select-none">
      <div className="flex flex-col gap-3 md:gap-4">
        {rows.map((row, idx) => {
          const rep = repeats[idx] ?? 2;
          const deltaPct = -(100 / rep); // negative like -50, -33.333...
          const items = Array.from({ length: rep }, () => row.base).flat();

          // For left: from 0% → delta (negative). For right: from delta → 0%.
          const from = row.dir === "left" ? "0%" : `${deltaPct}%`;
          const to = row.dir === "left" ? `${deltaPct}%` : "0%";

          return (
            <div
              key={idx}
              className="overflow-hidden"
              ref={(el) => {
                if (el) wrapRefs.current[idx] = el;
              }}
            >
              {/* hidden measurer (1× base) */}
              <div
                ref={(el) => {
                  if (el) measureRefs.current[idx] = el;
                }}
                className="inline-flex gap-3 min-w-max opacity-0 pointer-events-none absolute -z-50"
                aria-hidden
              >
                {row.base.map((s, i) => (
                  <SkillPill key={`measure-${s.id}-${i}`} skill={s} size="md" />
                ))}
              </div>

              {/* animated track (requires .marqueeVar keyframes using --marq-from/--marq-to/--marq-dur) */}
              <div
                className="inline-flex min-w-max gap-3 marqueeVar"
                style={
                  {
                    // consumed by keyframes in your globals.css
                    "--marq-from": from,
                    "--marq-to": to,
                    "--marq-dur": row.dur,
                  } as React.CSSProperties
                }
              >
                {items.map((s, i) => (
                  <SkillPill key={`${idx}-${s.id}-${i}`} skill={s} size="md" />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

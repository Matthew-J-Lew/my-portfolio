"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import SkillPill from "./SkillPill";
import { skills as ALL } from "./skillsData";

type Props = { uiScale?: number };

/** deterministic order: core first */
function orderCoreFirst<T extends { core?: boolean }>(list: T[]) {
  const core = list.filter((s) => s.core);
  const rest = list.filter((s) => !s.core);
  return [...core, ...rest];
}

type RowCfg = {
  base: typeof ALL;
  dir: "left" | "right";
  dur: string; // e.g., "28s"
};

export default function SkillsCarousel({ uiScale = 1 }: Props) {
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

  // scale the *visuals* a bit bigger than base screen scale
  const pillScale = uiScale * 1.1;
  const padX = Math.round(12 * uiScale);
  const padY = Math.round(12 * uiScale);
  const rowGap = Math.round(12 * uiScale);

  // measurement refs & repeat counts
  const wrapRefs = useRef<HTMLDivElement[]>([]);
  const measureRefs = useRef<HTMLDivElement[]>([]);
  const [repeats, setRepeats] = useState<number[]>(() => rows.map(() => 2));

  // ensure track >= 2x container
  useEffect(() => {
    const calc = () => {
      const next = rows.map((_, i) => {
        const wrap = wrapRefs.current[i];
        const meas = measureRefs.current[i];
        if (!wrap || !meas) return 2;
        const containerW = wrap.clientWidth || 1;
        const baseW = meas.scrollWidth || 1;
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
    <div
      className="rounded-lg border border-white/10 bg-neutral-900/30 overflow-hidden select-none"
      style={{ padding: `${padY}px ${padX}px` }}
    >
      <div className="flex flex-col" style={{ gap: rowGap }}>
        {rows.map((row, idx) => {
          const rep = repeats[idx] ?? 2;
          const deltaPct = -(100 / rep); // -50, -33.333...
          const items = Array.from({ length: rep }, () => row.base).flat();

          const from = row.dir === "left" ? "0%" : `${deltaPct}%`;
          const to = row.dir === "left" ? `${deltaPct}%` : "0%";

          return (
            <div
              key={idx}
              className="relative overflow-hidden"
              ref={(el) => {
                if (el) wrapRefs.current[idx] = el;
              }}
            >
              {/* hidden measurer (1× base, same sizing as visible items) */}
              <div
                ref={(el) => {
                  if (el) measureRefs.current[idx] = el;
                }}
                className="absolute left-0 top-0 inline-flex min-w-max opacity-0 pointer-events-none -z-50"
                aria-hidden
                style={{ gap: rowGap }}
              >
                {row.base.map((s, i) => (
                  <SkillPill key={`measure-${s.id}-${i}`} skill={s} size="md" scale={pillScale} />
                ))}
              </div>

              {/* animated track */}
              <div
                className="inline-flex min-w-max marqueeVar"
                style={
                  {
                    gap: rowGap,
                    "--marq-from": from,
                    "--marq-to": to,
                    "--marq-dur": row.dur,
                  } as React.CSSProperties
                }
              >
                {items.map((s, i) => (
                  <SkillPill key={`${idx}-${s.id}-${i}`} skill={s} size="md" scale={pillScale} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

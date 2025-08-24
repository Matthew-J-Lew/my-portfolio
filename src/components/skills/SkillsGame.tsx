// src/components/skills/SkillsGame.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import { skills as SKILLS, categories, type Skill } from "./skillsData";
import SkillPill from "./SkillPill";

/** Layout */
const BUCKET_BOTTOM = 12;
const FLOOR_CLEARANCE = 10;
const CHIP_ROW_EST = 26;

const GRID_COLS = 4;
const GRID_LEFT_PCT = 12;
const GRID_COL_STEP_PCT = 22;
const GRID_TOP_PCT = 10;
const GRID_ROW_STEP_PCT = 13;

/** Edge guards (kept modest; visual clamping handles the rest) */
const GUARD_LEFT = 18;
const GUARD_RIGHT = 18;
const GUARD_TOP = 18;

/** Motion feel */
const GRAVITY_Y = 0.85;
const TIMESCALE = 0.88;
const RESTITUTION = 0.9;
const AIR_DRAG = 0.012;
const FLOOR_MIN_REBOUND = 5.5;
const SETTLE_KICK = 6.0;
const WRONG_DROP_BOUNCE = 7.0;
const START_FORCE_Y = 0.018;

/** Collision categories (bit masks) */
const CAT_SKILL = 0x0001;
const CAT_BOUNDS = 0x0002;
const SKILL_MASK_DEFAULT = CAT_SKILL | CAT_BOUNDS;
const SKILL_MASK_DRAG = CAT_SKILL; // collide with other skills, ignore bounds while dragging

type Props = { onExit?: () => void };

export default function SkillsGame({ onExit }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tagRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const bucketDomRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const engineRef = useRef<Matter.Engine | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const bodyRefs = useRef<Map<number, Matter.Body>>(new Map());
  const floorBodyRef = useRef<Matter.Body | null>(null);
  const mouseRef = useRef<Matter.Mouse | null>(null);
  const rafRef = useRef<number | null>(null);

  /** per-chip measured size for correct display clamping (half-diagonal) */
  const chipDiagRef = useRef<Map<number, number>>(new Map());

  const [bucketItems, setBucketItems] = useState<Record<string, Skill[]>>(
    () => Object.fromEntries(categories.map((c) => [c, []])) as Record<string, Skill[]>
  );
  const [sortedCount, setSortedCount] = useState(0);
  const [bucketMinHeight, setBucketMinHeight] = useState(96);
  const allSorted = sortedCount === SKILLS.length;

  /** Grow buckets together (no scrollbars) */
  useEffect(() => {
    const counts = categories.map((c) => (bucketItems[c] || []).length);
    const maxItems = Math.max(0, ...counts);
    const headerAndPadding = 50;
    setBucketMinHeight(headerAndPadding + Math.max(1, maxItems) * CHIP_ROW_EST);
  }, [bucketItems]);

  const rand = (min: number, max: number) => Math.random() * (max - min) + min;

  /** Floor y so its top stays above buckets */
  const computeFloorY = () => {
    const el = containerRef.current;
    if (!el) return 99999;
    const rect = el.getBoundingClientRect();
    const floorHalfH =
      floorBodyRef.current
        ? (floorBodyRef.current.bounds.max.y - floorBodyRef.current.bounds.min.y) / 2
        : 9;
    const floorTop = rect.height - (BUCKET_BOTTOM + bucketMinHeight + FLOOR_CLEARANCE);
    return floorTop + floorHalfH;
  };

  /** Body clamps (physics, not display). Keep modest so play area feels wide. */
  const clampX = (x: number, rect: DOMRect) =>
    Math.min(Math.max(x, GUARD_LEFT + 24), rect.width - GUARD_RIGHT - 24);
  const clampY = (y: number, rect: DOMRect) =>
    Math.min(Math.max(y, GUARD_TOP + 24), rect.height - (bucketMinHeight + BUCKET_BOTTOM + 20));

  /** Where we initially place chips (SSR-stable) */
  const gridPos = (idx: number, rect: DOMRect) => {
    const col = idx % GRID_COLS;
    const row = Math.floor(idx / GRID_COLS);
    const gx = (rect.width * (GRID_LEFT_PCT + col * GRID_COL_STEP_PCT)) / 100;
    const gy = (rect.height * (GRID_TOP_PCT + row * GRID_ROW_STEP_PCT)) / 100;
    return { x: clampX(gx, rect), y: clampY(gy, rect) };
  };

  /** Create a physics body and bind to DOM */
  const spawnChip = (skill: Skill, idx: number, rect: DOMRect) => {
    const { World, Bodies } = Matter;
    const engine = engineRef.current!;
    const el = tagRefs.current.get(skill.id);
    if (!el) return;

    el.style.display = "";

    const r = el.getBoundingClientRect();
    const w = Math.max(28, r.width);
    const h = Math.max(24, r.height);
    chipDiagRef.current.set(skill.id, Math.sqrt(w * w + h * h) / 2);

    const { x, y } = gridPos(idx, rect);

    const body = Bodies.rectangle(x, y, w, h, {
      label: `skill-${skill.id}`,
      restitution: RESTITUTION,
      frictionAir: AIR_DRAG,
      friction: 0.025,
      collisionFilter: { category: CAT_SKILL, mask: SKILL_MASK_DEFAULT },
    });

    World.add(engine.world, body);
    bodyRefs.current.set(skill.id, body);

    el.style.position = "absolute";
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.transform = "translate(-50%, -50%)";
    el.style.zIndex = "20";
    el.style.pointerEvents = "auto";
    el.style.cursor = "grab";
  };

  /** Separate so they don't stack */
  const scatterChips = (rect: DOMRect) => {
    bodyRefs.current.forEach((b) => {
      const nx = clampX(b.position.x + rand(-22, 22), rect);
      const ny = clampY(b.position.y + rand(-12, 12), rect);
      Matter.Body.setPosition(b, { x: nx, y: ny });
      Matter.Body.setVelocity(b, { x: rand(-2.2, 2.2), y: -rand(2.2, 4.0) });
      Matter.Body.setAngularVelocity(b, rand(-0.12, 0.12));
      Matter.Body.applyForce(b, b.position, { x: rand(-0.001, 0.001), y: -START_FORCE_Y });
    });
  };

  const clearChipBodies = () => {
    const engine = engineRef.current;
    if (!engine) return;
    const toRemove: Matter.Body[] = [];
    bodyRefs.current.forEach((b) => toRemove.push(b));
    toRemove.forEach((b) => { try { Matter.World.remove(engine.world, b); } catch {} });
    bodyRefs.current.clear();
  };

  const handleReset = () => {
    for (const [, el] of tagRefs.current) {
      if (!el) continue;
      el.style.display = "";
      el.style.transform = "translate(-50%, -50%)";
    }
    setBucketItems(Object.fromEntries(categories.map((c) => [c, []])) as Record<string, Skill[]>);
    setSortedCount(0);

    const container = containerRef.current;
    const engine = engineRef.current;
    if (!container || !engine) return;

    clearChipBodies();
    const rect = container.getBoundingClientRect();
    SKILLS.forEach((s, idx) => spawnChip(s, idx, rect));
    scatterChips(rect);
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    if (width === 0 || height === 0) return;

    const { Engine, World, Bodies, Mouse, MouseConstraint, Runner, Events, Body } = Matter;

    const engine = Engine.create({ gravity: { x: 0, y: GRAVITY_Y } });
    engine.timing.timeScale = TIMESCALE;
    engineRef.current = engine;

    // Bounds (category = CAT_BOUNDS)
    const floorH = 18;
    const floorW = Math.max(160, width - (GUARD_LEFT + GUARD_RIGHT));
    const floor = Bodies.rectangle(width / 2, computeFloorY(), floorW, floorH, {
      isStatic: true,
      label: "floor",
      collisionFilter: { category: CAT_BOUNDS, mask: CAT_SKILL },
    });

    const leftWall = Bodies.rectangle(
      GUARD_LEFT / 2,
      height / 2,
      GUARD_LEFT,
      height,
      { isStatic: true, label: "left-wall", collisionFilter: { category: CAT_BOUNDS, mask: CAT_SKILL } }
    );
    const rightWall = Bodies.rectangle(
      width - GUARD_RIGHT / 2,
      height / 2,
      GUARD_RIGHT,
      height,
      { isStatic: true, label: "right-wall", collisionFilter: { category: CAT_BOUNDS, mask: CAT_SKILL } }
    );
    const ceiling = Bodies.rectangle(
      (GUARD_LEFT + (width - GUARD_RIGHT)) / 2,
      GUARD_TOP / 2,
      width - (GUARD_LEFT + GUARD_RIGHT),
      GUARD_TOP,
      { isStatic: true, label: "ceiling", collisionFilter: { category: CAT_BOUNDS, mask: CAT_SKILL } }
    );

    World.add(engine.world, [floor, leftWall, rightWall, ceiling]);
    floorBodyRef.current = floor;

    // Spawn + scatter
    SKILLS.forEach((s, idx) => spawnChip(s, idx, rect));
    scatterChips(rect);

    // Mouse drag
    const mouse = Mouse.create(container);
    mouseRef.current = mouse;
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 0.22, render: { visible: false } },
    });
    World.add(engine.world, mouseConstraint);

    // while dragging: ignore bounds, still collide with other skills
    Events.on(mouseConstraint, "startdrag", (e: any) => {
      const b: Matter.Body | null = e.body || null;
      if (!b?.label?.startsWith?.("skill-")) return;
      container.classList.add("dragging");
      b.collisionFilter.mask = SKILL_MASK_DRAG; // ignore bounds only
      // leave velocity/angVel as-is so you can push other chips around
    });

    Events.on(mouseConstraint, "enddrag", (e: any) => {
      const b: Matter.Body | null = e.body || null;
      container.classList.remove("dragging");
      if (!b?.label?.startsWith?.("skill-")) return;

      const id = Number(b.label.slice("skill-".length));
      const skillObj = SKILLS.find((x) => x.id === id);
      if (!skillObj) return;

      // Use mouse position for hit test (lets you release below floor)
      const m = mouseRef.current?.position || { x: b.position.x, y: b.position.y };
      const cRect = container.getBoundingClientRect();

      let hitCat: string | null = null;
      for (const cat of categories) {
        const node = bucketDomRefs.current.get(cat);
        if (!node) continue;
        const r = node.getBoundingClientRect();
        const left = r.left - cRect.left;
        const right = r.right - cRect.left;
        const top = r.top - cRect.top;
        const bottom = r.bottom - cRect.top;
        if (m.x >= left && m.x <= right && m.y >= top && m.y <= bottom) {
          hitCat = cat;
          break;
        }
      }

      // restore normal collisions with bounds
      b.collisionFilter.mask = SKILL_MASK_DEFAULT;

      if (hitCat && skillObj.category === hitCat) {
        // absorb into bucket
        try { Matter.World.remove(engine.world, b); } catch {}
        bodyRefs.current.delete(id);

        setBucketItems((prev) => {
          if ((prev[hitCat!] || []).some((it) => it.id === id)) return prev;
          const copy = { ...prev };
          copy[hitCat!] = [...(copy[hitCat!] || []), skillObj];
          return copy;
        });
        setSortedCount((c) => c + 1);

        const el = tagRefs.current.get(id);
        if (el) el.style.display = "none";
      } else if (hitCat && skillObj.category !== hitCat) {
        // wrong bucket: pop back above the floor with a bounce
        const rectNow = container.getBoundingClientRect();
        const floorY = floorBodyRef.current?.position.y ?? rectNow.height - 60;
        const bh = b.bounds.max.y - b.bounds.min.y;
        const safeY = floorY - bh / 2 - 2;
        const safeX = clampX(b.position.x, rectNow);
        Matter.Body.setPosition(b, { x: safeX, y: safeY });
        Matter.Body.setVelocity(b, { x: (Math.random() - 0.5) * 4, y: -WRONG_DROP_BOUNCE });
        Matter.Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.18);
      } else {
        // released in open play: if you released below the floor, nudge back up a bit
        const floorY = floorBodyRef.current?.position.y ?? Infinity;
        const bh = b.bounds.max.y - b.bounds.min.y;
        if (b.position.y > floorY - bh / 2) {
          Matter.Body.setPosition(b, { x: b.position.x, y: floorY - bh / 2 - 2 });
          Matter.Body.setVelocity(b, { x: b.velocity.x, y: -SETTLE_KICK });
        }
      }
    });

    // lively floor rebounds
    Events.on(engine, "collisionStart", (ev) => {
      for (const pair of ev.pairs) {
        const a = pair.bodyA;
        const b = pair.bodyB;
        const skillBody = a.label?.startsWith("skill-") ? a : b.label?.startsWith("skill-") ? b : null;
        const isFloor = a.label === "floor" || b.label === "floor";
        if (skillBody && isFloor) {
          const vy = skillBody.velocity.y;
          if (vy > -FLOOR_MIN_REBOUND) {
            Matter.Body.setVelocity(skillBody, { x: skillBody.velocity.x * 0.96, y: -FLOOR_MIN_REBOUND });
          }
        }
      }
    });

    // tiny kick if resting; gentle rescue if far outside (resize etc.)
    Events.on(engine, "afterUpdate", () => {
      const floorY = floorBodyRef.current?.position.y ?? Infinity;
      const rectNow = containerRef.current?.getBoundingClientRect();
      if (!rectNow) return;

      bodyRefs.current.forEach((b) => {
        if (!b.label?.startsWith("skill-")) return;

        const vy = b.velocity.y;
        const bh = b.bounds.max.y - b.bounds.min.y;

        if (Math.abs(vy) < 0.08 && b.position.y > floorY - bh / 2 - 2) {
          Matter.Body.setVelocity(b, { x: b.velocity.x * 0.98, y: -SETTLE_KICK });
        }

        // soft clamp if extremely far (window rescales, etc.)
        if (b.position.x < -200 || b.position.x > rectNow.width + 200 || b.position.y > rectNow.height + 200) {
          Matter.Body.setPosition(b, { x: clampX(b.position.x, rectNow), y: clampY(b.position.y, rectNow) });
        }
      });
    });

    // run + sync DOM
    const runner = Runner.create();
    runnerRef.current = runner;
    Runner.run(runner, engine);

    const sync = () => {
      const rectNow = containerRef.current?.getBoundingClientRect();
      for (const [id, body] of bodyRefs.current) {
        const el = tagRefs.current.get(id);
        if (!el) continue;

        // ---- DISPLAY CLAMP (prevents “shrinking” on the right edge) ----
        // Clamp the DOM position based on the chip's half-diagonal so the
        // rotated pill never gets clipped by the container's overflow.
        let x = body.position.x;
        let y = body.position.y;
        if (rectNow) {
          const halfDiag = chipDiagRef.current.get(id) ?? 24;
          const minX = halfDiag;
          const maxX = rectNow.width - halfDiag;
          const minY = halfDiag;
          const maxY = rectNow.height - halfDiag;
          x = Math.min(Math.max(x, minX), maxX);
          y = Math.min(Math.max(y, minY), maxY);
        }

        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.transform = `translate(-50%, -50%) rotate(${body.angle}rad)`;
      }
      rafRef.current = requestAnimationFrame(sync);
    };
    sync();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      try { if (runnerRef.current) Runner.stop(runnerRef.current); } catch {}
      try { World.clear(engine.world, false); Engine.clear(engine); } catch {}
      engineRef.current = null;
      runnerRef.current = null;
      bodyRefs.current.clear();
      floorBodyRef.current = null;
      mouseRef.current = null;
      chipDiagRef.current.clear();
    };
  }, []);

  /** Floor tracks bucket growth a bit */
  useEffect(() => {
    const engine = engineRef.current;
    const floor = floorBodyRef.current;
    const container = containerRef.current;
    if (!engine || !floor || !container) return;

    const rect = container.getBoundingClientRect();
    const newY = computeFloorY();
    Matter.Body.setPosition(floor, { x: rect.width / 2, y: newY });

    bodyRefs.current.forEach((b) => {
      const bh = b.bounds.max.y - b.bounds.min.y;
      if (b.position.y > newY - bh / 2) {
        Matter.Body.setPosition(b, { x: b.position.x, y: newY - bh / 2 - 1 });
        Matter.Body.setVelocity(b, { x: b.velocity.x * 0.9, y: -SETTLE_KICK });
      }
    });

    scatterChips(rect);
  }, [bucketMinHeight]);

  return (
    <div className="w-full">
      {/* GAME AREA */}
      <div
        ref={containerRef}
        className="relative w-full h-[520px] rounded-xl overflow-hidden border border-white/10 bg-neutral-900/20 select-none"
      >
        {/* inline congrats banner */}
        {allSorted && (
          <div
            className="absolute inset-x-0 z-[8] flex justify-center pointer-events-none"
            style={{ bottom: BUCKET_BOTTOM + bucketMinHeight + 24 }}
          >
            <div className="px-3 py-1.5 rounded-full bg-emerald-600/80 text-white text-sm shadow">
              All skills sorted — nice! 🎉
            </div>
          </div>
        )}

        {/* Buckets */}
        <div className="absolute left-0 right-0 bottom-[12px] z-[6] pointer-events-none">
          <div className="flex justify-center gap-6 px-6">
            {categories.map((cat) => {
              const items = bucketItems[cat] || [];
              return (
                <div
                  key={cat}
                  ref={(el) => {
                    if (el) bucketDomRefs.current.set(cat, el);
                    else bucketDomRefs.current.delete(cat);
                  }}
                  className="w-56 rounded-xl bg-neutral-800/60 border border-white/10 flex flex-col items-center py-2 px-2 transition-all duration-300"
                  style={{ minHeight: bucketMinHeight, overflow: "visible" }}
                >
                  <div className="text-sm font-semibold text-white text-center">{cat}</div>
                  <div className="text-xs text-gray-300 mt-1">
                    {items.length} / {SKILLS.filter((s) => s.category === cat).length}
                  </div>
                  <div className="mt-2 w-full flex flex-col gap-1 px-1" style={{ overflow: "visible" }}>
                    {items.map((sk) => (
                      <SkillPill key={sk.id} skill={sk} size="sm" />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chips (physics-controlled) */}
        <div className="absolute inset-0 z-[10]">
          {SKILLS.map((s, idx) => (
            <div
              key={s.id}
              ref={(el) => {
                if (el) tagRefs.current.set(s.id, el);
                else tagRefs.current.delete(s.id);
              }}
              style={{
                position: "absolute",
                left: `calc(${GRID_LEFT_PCT + (idx % GRID_COLS) * GRID_COL_STEP_PCT}%)`,
                top: `calc(${GRID_TOP_PCT + Math.floor(idx / GRID_COLS) * GRID_ROW_STEP_PCT}%)`,
                transform: "translate(-50%, -50%)",
                zIndex: 20,
                cursor: "grab",
              }}
              role="button"
              aria-label={`Drag ${s.name} to ${s.category}`}
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
            >
              <SkillPill skill={s} />
            </div>
          ))}
        </div>

        <style jsx>{`
          .dragging, .dragging * { cursor: grabbing !important; }
        `}</style>
      </div>

      {/* HUD */}
      <div className="mt-3 flex items-center gap-3 justify-between">
        <div className="text-xs text-gray-300">
          Sorted: {sortedCount} / {SKILLS.length}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-3 py-2 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-sm"
          >
            Reset
          </button>
          {onExit && (
            <button
              onClick={onExit}
              className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-sm"
            >
              Exit
            </button>
          )}
        </div>
      </div>

      <p className="mt-2 text-xs text-gray-400">
        Drop each skill into the correct bucket. Wrong drops bounce back into play.
      </p>
    </div>
  );
}

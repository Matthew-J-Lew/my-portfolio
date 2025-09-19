// src/components/skills/SkillsGame.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import { skills as SKILLS, categories, type Skill } from "./skillsData";
import SkillPill from "./SkillPill";

/** Layout (base units; multiplied by session VS at runtime) */
const BUCKET_BOTTOM = 12;
const FLOOR_CLEARANCE = 10;
const CHIP_ROW_EST = 26;

const GRID_COLS = 4;
const GRID_LEFT_PCT = 12;
const GRID_COL_STEP_PCT = 22;
const GRID_TOP_PCT = 10;
const GRID_ROW_STEP_PCT = 13;

/** Edge guards (base) */
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
const SKILL_MASK_DRAG = CAT_SKILL;

/** OOB rescue thresholds (~60 FPS) */
const OOB_SOFT_FRAMES = 50; // ~0.8s
const OOB_HARD_FRAMES = 90; // ~1.5s
const RELEASE_GRACE_FRAMES = 36; // ~0.6s grace after release

/** PB storage */
const PB_KEY = "skillsGame_pb_ms_v1";

type Props = { onExit?: () => void; uiScale: number; heightPx?: number };

/** Human-friendly time string */
function formatDuration(ms: number) {
  const secs = ms / 1000;
  if (secs < 60) return `${secs.toFixed(2)} s`;
  const totalSec = Math.floor(secs);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  const mRem = m % 60;
  return `${h}h ${mRem}m ${s}s`;
}

/** One-time game scale from current window width (stable for the session) */
function useSessionGameScale() {
  const [s] = useState(() => {
    const w = typeof window !== "undefined" ? window.innerWidth : 1200;
    const minW = 768, maxW = 1280; // map [minW..maxW] -> [0.78..1.0]
    const t = Math.min(1, Math.max(0, (w - minW) / (maxW - minW)));
    const min = 0.78, max = 1.0;
    return min + t * (max - min);
  });
  return s;
}

export default function SkillsGame({ onExit, uiScale, heightPx }: Props) {
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

  /** frames spent out-of-bounds (for rescue) */
  const oobFramesRef = useRef<Map<number, number>>(new Map());

  /** which chip is being dragged, and post-release grace frames */
  const draggingIdRef = useRef<number | null>(null);
  const releaseGraceRef = useRef<Map<number, number>>(new Map());

  /** --- TIMER --- */
  const timerIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [stopped, setStopped] = useState(false);

  const startTimer = () => {
    startTimeRef.current = typeof performance !== "undefined" ? performance.now() : Date.now();
    setElapsedMs(0);
    setStopped(false);

    setLastWasPB(false);
    setFinishMsgKind(null);

    if (timerIdRef.current) {
      window.clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }
    timerIdRef.current = window.setInterval(() => {
      const now = typeof performance !== "undefined" ? performance.now() : Date.now();
      setElapsedMs(now - startTimeRef.current);
    }, 75);
  };

  const stopTimer = () => {
    if (timerIdRef.current) {
      window.clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }
    setStopped(true);
  };

  /** --- PB (Personal Best) --- */
  const [bestMs, setBestMs] = useState<number | null>(null);
  const bestMsRef = useRef<number | null>(null);
  useEffect(() => {
    bestMsRef.current = bestMs;
  }, [bestMs]);

  // load PB on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PB_KEY);
      if (raw != null) {
        const v = Number(raw);
        if (!Number.isNaN(v)) setBestMs(v);
      }
    } catch {}
  }, []);

  // was this run a PB?
  const [lastWasPB, setLastWasPB] = useState(false);

  /** buckets + sorted state */
  const [bucketItems, setBucketItems] = useState<Record<string, Skill[]>>(
    () => Object.fromEntries(categories.map((c) => [c, []])) as Record<string, Skill[]>
  );
  const [sortedCount, setSortedCount] = useState(0);
  const [bucketMinHeight, setBucketMinHeight] = useState(96);
  const allSorted = sortedCount === SKILLS.length;

  /** victory banner message kind */
  const [finishMsgKind, setFinishMsgKind] = useState<"fast" | "firstOver30" | "keepRolling" | null>(null);

  /** ---- VISUAL SCALE (fixed for the session) ---- */
  const sessionScale = useSessionGameScale();
  const VS = uiScale * sessionScale; // visual scale used for chips/buckets/HUD (constant during a play session)

  /** Grow buckets together (no scrollbars) — scaled by VS */
  useEffect(() => {
    const counts = categories.map((c) => (bucketItems[c] || []).length);
    const maxItems = Math.max(0, ...counts);
    const headerAndPadding = 50 * VS;
    setBucketMinHeight(headerAndPadding + Math.max(1, maxItems) * CHIP_ROW_EST * VS);
  }, [bucketItems, VS]);

  const rand = (min: number, max: number) => Math.random() * (max - min) + min;

  /** Floor y so its top stays above buckets */
  const computeFloorY = () => {
    const el = containerRef.current;
    if (!el) return 99999;
    const rect = el.getBoundingClientRect();
    const floorHalfH =
      floorBodyRef.current
        ? (floorBodyRef.current.bounds.max.y - floorBodyRef.current.bounds.min.y) / 2
        : 9 * VS;
    const floorTop = rect.height - (BUCKET_BOTTOM * VS + bucketMinHeight + FLOOR_CLEARANCE * VS);
    return floorTop + floorHalfH;
  };

  /** Physics clamps */
  const clampX = (x: number, rect: DOMRect) =>
    Math.min(Math.max(x, GUARD_LEFT * VS + 24), rect.width - GUARD_RIGHT * VS - 24);
  const clampY = (y: number, rect: DOMRect) =>
    Math.min(Math.max(y, GUARD_TOP * VS + 24), rect.height - (bucketMinHeight + BUCKET_BOTTOM * VS + 20));

  /** Initial positions */
  const gridPos = (idx: number, rect: DOMRect) => {
    const col = idx % GRID_COLS;
    const row = Math.floor(idx / GRID_COLS);
    const gx = (rect.width * (GRID_LEFT_PCT + col * GRID_COL_STEP_PCT)) / 100;
    const gy = (rect.height * (GRID_TOP_PCT + row * GRID_ROW_STEP_PCT)) / 100;
    return { x: clampX(gx, rect), y: clampY(gy, rect) };
  };

  /** Effective leftover play area (inside guards, above floor/buckets) */
  const getPlayBox = (rect: DOMRect) => {
    const floor = floorBodyRef.current;
    const floorHalfH = floor ? (floor.bounds.max.y - floor.bounds.min.y) / 2 : 9 * VS;
    const floorTop = (floor?.position.y ?? rect.height) - floorHalfH;

    let left = GUARD_LEFT * VS;
    let right = rect.width - GUARD_RIGHT * VS;
    let top = GUARD_TOP * VS;
    let bottom = floorTop - 4;

    if (bottom - top < 40) {
      const mid = rect.height * 0.5;
      top = Math.max(4, mid - 20);
      bottom = Math.min(rect.height - 4, mid + 20);
    }
    if (right - left < 40) {
      const midX = rect.width * 0.5;
      left = Math.max(4, midX - 20);
      right = Math.min(rect.width - 4, midX + 20);
    }

    const cx = (left + right) / 2;
    const cy = (top + bottom) / 2;
    return { left, right, top, bottom, cx, cy };
  };

  /** Create a physics body and bind to DOM */
  const spawnChip = (skill: Skill, idx: number, rect: DOMRect) => {
    const { World, Bodies } = Matter;
    const engine = engineRef.current!;
    const el = tagRefs.current.get(skill.id);
    if (!el) return;

    el.style.display = "";

    const r = el.getBoundingClientRect();
    const w = Math.max(28 * VS, r.width);
    const h = Math.max(24 * VS, r.height);
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
      const nx = clampX(b.position.x + rand(-22 * VS, 22 * VS), rect);
      const ny = clampY(b.position.y + rand(-12 * VS, 12 * VS), rect);
      Matter.Body.setPosition(b, { x: nx, y: ny });
      Matter.Body.setVelocity(b, { x: rand(-2.2, 2.2), y: -rand(2.2, 4.0) });
      Matter.Body.setAngularVelocity(b, rand(-0.12, 0.12));
      Matter.Body.applyForce(b, b.position, { x: rand(-0.001, 0.001), y: -START_FORCE_Y * VS });
    });
  };

  const clearChipBodies = () => {
    const engine = engineRef.current;
    if (!engine) return;
    const toRemove: Matter.Body[] = [];
    bodyRefs.current.forEach((b) => toRemove.push(b));
    toRemove.forEach((b) => {
      try {
        Matter.World.remove(engine.world, b);
      } catch {}
    });
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

    // restart timer on reset
    startTimer();

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

    // start timer when game mounts
    startTimer();

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    if (width === 0 || height === 0) return;

    const { Engine, World, Bodies, Mouse, MouseConstraint, Runner, Events } = Matter;

    const engine = Engine.create({ gravity: { x: 0, y: GRAVITY_Y } }); // gravity feel is stable
    engine.timing.timeScale = TIMESCALE;
    engineRef.current = engine;

    // Bounds (category = CAT_BOUNDS)
    const floorH = 18 * VS;
    const floorW = Math.max(160 * VS, width - (GUARD_LEFT + GUARD_RIGHT) * VS);
    const floor = Bodies.rectangle(width / 2, computeFloorY(), floorW, floorH, {
      isStatic: true,
      label: "floor",
      collisionFilter: { category: CAT_BOUNDS, mask: CAT_SKILL },
    });

    const leftWall = Bodies.rectangle(
      (GUARD_LEFT * VS) / 2,
      height / 2,
      GUARD_LEFT * VS,
      height,
      { isStatic: true, label: "left-wall", collisionFilter: { category: CAT_BOUNDS, mask: CAT_SKILL } }
    );
    const rightWall = Bodies.rectangle(
      width - (GUARD_RIGHT * VS) / 2,
      height / 2,
      GUARD_RIGHT * VS,
      height,
      { isStatic: true, label: "right-wall", collisionFilter: { category: CAT_BOUNDS, mask: CAT_SKILL } }
    );
    const ceiling = Bodies.rectangle(
      (GUARD_LEFT * VS + (width - GUARD_RIGHT) * VS) / 2,
      (GUARD_TOP * VS) / 2,
      width - (GUARD_LEFT + GUARD_RIGHT) * VS,
      GUARD_TOP * VS,
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
      b.collisionFilter.mask = SKILL_MASK_DRAG;

      const id = Number(b.label.slice("skill-".length));
      draggingIdRef.current = id;
      oobFramesRef.current.set(id, 0);        // reset OOB counter
      releaseGraceRef.current.delete(id);     // clear any post-release grace
    });

    Events.on(mouseConstraint, "enddrag", (e: any) => {
      const b: Matter.Body | null = e.body || null;
      container.classList.remove("dragging");
      if (!b?.label?.startsWith?.("skill-")) return;

      const id = Number(b.label.slice("skill-".length));
      draggingIdRef.current = null;                 // no longer dragging
      oobFramesRef.current.set(id, 0);              // restart OOB counting
      releaseGraceRef.current.set(id, RELEASE_GRACE_FRAMES); // short grace window

      const skillObj = SKILLS.find((x) => x.id === id);
      if (!skillObj) return;

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
        const rectNow = container.getBoundingClientRect();
        const floorY = floorBodyRef.current?.position.y ?? rectNow.height - 60 * VS;
        const bh = b.bounds.max.y - b.bounds.min.y;
        const safeY = floorY - bh / 2 - 2;
        const safeX = clampX(b.position.x, rectNow);
        Matter.Body.setPosition(b, { x: safeX, y: safeY });
        Matter.Body.setVelocity(b, { x: (Math.random() - 0.5) * 4, y: -WRONG_DROP_BOUNCE });
        Matter.Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.18);
      } else {
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
        const skillBody =
          a.label?.startsWith("skill-") ? a :
          b.label?.startsWith("skill-") ? b : null;
        const isFloor = a.label === "floor" || b.label === "floor";
        if (skillBody && isFloor) {
          const vy = skillBody.velocity.y;
          if (vy > -FLOOR_MIN_REBOUND) {
            Matter.Body.setVelocity(skillBody, {
              x: skillBody.velocity.x * 0.96,
              y: -FLOOR_MIN_REBOUND,
            });
          }
        }
      }
    });

    // tiny kick if resting; soft + hard OOB rescue (disabled during drag / grace)
    Events.on(engine, "afterUpdate", () => {
      const floorY = floorBodyRef.current?.position.y ?? Infinity;
      const rectNow = containerRef.current?.getBoundingClientRect();
      if (!rectNow) return;

      const play = getPlayBox(rectNow);
      const tol = 8;

      bodyRefs.current.forEach((b, id) => {
        if (!b.label?.startsWith("skill-")) return;

        // skip any rescue while actively dragging this id
        if (draggingIdRef.current === id) {
          oobFramesRef.current.set(id, 0);
          return;
        }

        // post-release grace: count down and skip rescue meanwhile
        const grace = releaseGraceRef.current.get(id) ?? 0;
        if (grace > 0) {
          releaseGraceRef.current.set(id, grace - 1);
          oobFramesRef.current.set(id, 0);
          return;
        }

        const vy = b.velocity.y;
        const bh = b.bounds.max.y - b.bounds.min.y;

        if (Math.abs(vy) < 0.08 && b.position.y > floorY - bh / 2 - 2) {
          Matter.Body.setVelocity(b, { x: b.velocity.x * 0.98, y: -SETTLE_KICK });
        }

        const outOfPlay =
          b.position.x < play.left - tol ||
          b.position.x > play.right + tol ||
          b.position.y < play.top - tol ||
          b.position.y > play.bottom + tol;

        if (!outOfPlay) {
          oobFramesRef.current.set(id, 0);
          return;
        }

        const n = (oobFramesRef.current.get(id) || 0) + 1;
        oobFramesRef.current.set(id, n);

        if (n > OOB_HARD_FRAMES) {
          const targetX = play.cx;
          const maxY = Math.min(play.bottom - bh / 2 - 4, floorY - bh / 2 - 4);
          const targetY = Math.max(play.top + bh / 2 + 4, Math.min((play.top + play.bottom) / 2, maxY));

          Matter.Body.setPosition(b, { x: targetX, y: targetY });
          Matter.Body.setVelocity(b, { x: (Math.random() - 0.5) * 2.5, y: -SETTLE_KICK });
          Matter.Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.15);
          oobFramesRef.current.set(id, 0);
        } else if (n > OOB_SOFT_FRAMES) {
          const targetX = Math.min(Math.max(b.position.x, play.left + 6), play.right - 6);
          const maxY = Math.min(play.bottom - bh / 2 - 4, floorY - bh / 2 - 4);
          const targetY = Math.min(Math.max(b.position.y, play.top + bh / 2 + 4), maxY);

          Matter.Body.setPosition(b, { x: targetX, y: targetY });
          Matter.Body.setVelocity(b, { x: (Math.random() - 0.5) * 3, y: -SETTLE_KICK });
          Matter.Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.12);
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

        // DISPLAY CLAMP (prevents clipping at edges)
        let x = body.position.x;
        let y = body.position.y;
        if (rectNow) {
          const halfDiag = chipDiagRef.current.get(id) ?? 24 * VS;
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
      oobFramesRef.current.clear();
      releaseGraceRef.current.clear();
      draggingIdRef.current = null;

      if (timerIdRef.current) {
        window.clearInterval(timerIdRef.current);
        timerIdRef.current = null;
      }
    };
    // NOTE: run once per session so sorted chips won't respawn on resize
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // <-- no uiScale dependency

  /** Stop the timer + compute PB + set banner kind the first time we finish */
  useEffect(() => {
    if (!allSorted) return;

    stopTimer();

    const prevBest = bestMsRef.current; // PB before this run
    const secs = elapsedMs / 1000;

    // choose finish message kind
    if (secs < 30) {
      setFinishMsgKind("fast");
    } else {
      setFinishMsgKind(prevBest == null ? "firstOver30" : "keepRolling");
    }

    // update PB
    setBestMs((prev) => {
      const isPB = prev == null || elapsedMs < prev;
      setLastWasPB(isPB);
      if (isPB) {
        try { localStorage.setItem(PB_KEY, String(elapsedMs)); } catch {}
        return elapsedMs;
      }
      return prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSorted]);

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
  }, [bucketMinHeight]);

  // Default game height; can be overridden via prop (scaled by VS once)
  const defaultGameHeight = Math.round(Math.min(480, Math.max(400, 440 * VS)));
  const gameHeight = heightPx ?? defaultGameHeight;
  const bucketWidth = Math.round(224 * VS); // ~w-56 @ VS

  // --- Dynamic goal + messages ---
  const secs = elapsedMs / 1000;
  const isUnder30 = secs < 30;

  // Goal: static "30 seconds" until >30s, then current+1s using same formatting as timer
  const goalMs = isUnder30 ? 30000 : (secs + 1) * 1000;
  const goalPretty = isUnder30 ? "30 seconds" : formatDuration(goalMs);
  const instructionMsg = `Try to get under ${goalPretty}!`;

  let bannerText: string | null = null;
  if (allSorted) {
    if (finishMsgKind === "fast") {
      bannerText = "Wow! you're fast! Nice job!";
    } else if (finishMsgKind === "firstOver30") {
      bannerText = "Oh... wow! Just in time..!!";
    } else if (finishMsgKind === "keepRolling") {
      bannerText = `Nice! Keep going — try going for a new personal best!`;
    } else {
      bannerText = "All skills sorted — nice! 🎉";
    }
  }

  return (
    <div className="w-full">
      {/* GAME AREA */}
      <div
        ref={containerRef}
        className="relative w-full rounded-xl overflow-hidden border border-white/10 bg-neutral-900/20 select-none"
        style={{ height: gameHeight }}
      >
        {/* inline congrats banner */}
        {bannerText && (
          <div
            className="absolute inset-x-0 z-[8] flex justify-center pointer-events-none"
            style={{ bottom: BUCKET_BOTTOM * VS + bucketMinHeight + 24 }}
          >
            <div className="px-3 py-1.5 rounded-full bg-emerald-600/80 text-white text-sm shadow">
              {bannerText}
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
                  className="rounded-xl bg-neutral-800/60 border border-white/10 flex flex-col items-center py-2 px-2 transition-all duration-300"
                  style={{ minHeight: bucketMinHeight, overflow: "visible", width: bucketWidth }}
                >
                  <div className="text-white text-center font-semibold" style={{ fontSize: Math.round(12 * VS) }}>
                    {cat}
                  </div>
                  <div className="mt-1 text-gray-300" style={{ fontSize: Math.round(11 * VS) }}>
                    {items.length} / {SKILLS.filter((s) => s.category === cat).length}
                  </div>
                  <div className="mt-2 w-full flex flex-col gap-1 px-1" style={{ overflow: "visible" }}>
                    {items.map((sk) => (
                      <SkillPill key={sk.id} skill={sk} size="sm" scale={VS * 0.95} />
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
              <SkillPill skill={s} scale={VS} />
            </div>
          ))}
        </div>

        <style jsx>{`
          .dragging, .dragging * { cursor: grabbing !important; }
        `}</style>
      </div>

      {/* HUD: includes live timer + PB */}
      <div className="mt-3 flex items-center gap-3 justify-between">
        <div className="flex items-center gap-4" style={{ fontSize: Math.round(12 * VS) }}>
          <span className="font-semibold">Sorted: {sortedCount} / {SKILLS.length}</span>
          <span className="font-semibold">Time: {formatDuration(elapsedMs)}</span>
          <span className="font-semibold">
            PB: {bestMs == null ? "—" : formatDuration(bestMs)}
            {lastWasPB && <span className="ml-2 text-emerald-400">New PB!</span>}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="rounded-lg bg-neutral-700 hover:bg-neutral-600"
            style={{ padding: `${Math.round(8 * VS)}px ${Math.round(12 * VS)}px`, fontSize: Math.round(14 * VS) }}
          >
            Reset
          </button>
          {onExit && (
            <button
              onClick={onExit}
              className="rounded-lg bg-red-600 hover:bg-red-700"
              style={{ padding: `${Math.round(8 * VS)}px ${Math.round(12 * VS)}px`, fontSize: Math.round(14 * VS) }}
            >
              Exit
            </button>
          )}
        </div>
      </div>

      {/* Instruction + tiny spacer to avoid clipping during height animation */}
      <p className="mt-2 text-gray-400" style={{ fontSize: Math.round(12 * VS), marginBottom: 0 }}>
        Drag and drop each skill into the right spot! {instructionMsg}
      </p>
      <div aria-hidden className="pointer-events-none" style={{ height: Math.max(6, Math.round(8 * VS)) }} />
    </div>
  );
}

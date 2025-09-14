"use client";
// components/projects/TechCube.tsx

import { useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  animate,
  type MotionValue,
  useReducedMotion,
} from "framer-motion";
import Image from "next/image";

type Tech = { name: string; icon: string }[];

/**
 * Return the 3D transform for each cube face given the depth `d`.
 * Faces 0..3 are the vertical ring; 4 is top; 5 is bottom.
 */
function faceTransform(i: number, d: number) {
  switch (i) {
    case 0:
      return `translateZ(${d}px)`;
    case 1:
      return `rotateY(90deg) translateZ(${d}px)`;
    case 2:
      return `rotateY(180deg) translateZ(${d}px)`;
    case 3:
      return `rotateY(-90deg) translateZ(${d}px)`;
    case 4:
      return `rotateX(90deg) translateZ(${d}px)`; // top
    case 5:
      return `rotateX(-90deg) translateZ(${d}px)`; // bottom
    default:
      return "";
  }
}

/**
 * For the “inner sticker” we flip the plane so it lives on the inside
 * of the cube. Sides flip around Y; top/bottom flip around X.
 */
function innerFlip(i: number) {
  if (i === 4 || i === 5) return "rotateX(180deg)";
  return "rotateY(180deg)";
}

/**
 * Mirror the artwork so it reads correctly when viewed through the cube.
 * Top/bottom mirror vertically; sides mirror horizontally.
 */
function innerMirror(i: number) {
  return i === 4 || i === 5 ? "scaleY(-1)" : "scaleX(-1)";
}

/**
 * Given a current angle and a target angle, compute the shortest path
 * (prevents full 360° spins when tweening back to rest).
 */
function shortestTarget(current: number, target: number) {
  const norm = (a: number) => ((a % 360) + 360) % 360;
  const a = norm(current);
  const b = norm(target);
  let delta = b - a;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return current + delta;
}

export default function TechCube({ tech }: { tech: Tech }) {
  // Respect reduced motion and hide the cube if requested by the user/OS.
  const reduced = useReducedMotion();
  if (reduced) return null;

  // Cycle the provided tech into 6 faces (wrap if fewer than 6).
  const faces = Array.from({ length: 6 }, (_, i) => tech[i % tech.length]);

  // ------------------- TUNING -------------------
  // Dimensions/orientation
  const SIZE = 140;
  const DEPTH = 70;
  const BASE_PITCH = -18;
  const BASE_YAW = 22;

  // Mouse hover “follow” behavior
  const HOVER_MAX_PITCH = 14;
  const HOVER_MAX_YAW = 14;
  const HOVER_TRACK_DUR = 0.12;
  const HOVER_RETURN_DUR = 0.38;
  const HOVER_EASE = [0.25, 0.9, 0.2, 1] as const;

  // Pointer drag sensitivity
  const DRAG_SENS = 0.3;

  // Inertia feel after releasing drag
  const INERTIA_OPTS = {
    type: "inertia" as const,
    power: 0.9,
    timeConstant: 1200,
    bounceStiffness: 0,
    bounceDamping: 0,
    restDelta: 0.01,
    min: -Infinity,
    max: Infinity,
  };

  // When inertia slows below this threshold for a short time, we “magnetize”
  const VELOCITY_CUTOFF_DEG_PER_S = 100;
  const CUTOFF_SETTLE_MS = 220;

  // Magnetize pitch back to a clean resting angle (only pitch, not yaw)
  const MAGNETIZE_DELAY_MS = 0;
  const MAGNETIZE_MODE: "tween" | "spring" = "tween";
  const MAGNETIZE_DUR = 2.1;
  const MAGNETIZE_EASE = [0.25, 0.9, 0.2, 1] as const;
  const SPRING_MAGNET_PITCH = {
    type: "spring" as const,
    stiffness: 20,
    damping: 12,
    mass: 1.4,
    restDelta: 0.01,
    restSpeed: 1.5,
  };

  // Idle yaw spin to keep the cube feeling alive
  const IDLE_SPIN_DEG = 360;
  const IDLE_SPIN_SEC = 18;
  // ----------------------------------------------

  // Face “glass” appearance
  const FACE_BG = "rgba(95, 95, 95, 0.3)";
  //const FACE_BG = "rgba(255, 255, 255, 0.055)";
  const FACE_BORDER = "rgba(255,255,255,0.65)";
  const FACE_SHADOW =
    "0 10px 24px rgba(255,255,255,0.05), 0 6px 18px rgba(0,0,0,0.22)";
  const FACE_INNER =
    "inset 0 0 0 1px rgba(255,255,255,0.16), inset 0 8px 24px rgba(255,255,255,0.06)";

  // --- Motion values for the base orientation and hover offsets
  const pitchBase: MotionValue<number> = useMotionValue(BASE_PITCH);
  const yawBase: MotionValue<number> = useMotionValue(BASE_YAW);
  const hoverPitch: MotionValue<number> = useMotionValue(0);
  const hoverYaw: MotionValue<number> = useMotionValue(0);

  // Idle spin on yaw
  const idleYaw: MotionValue<number> = useMotionValue(0);
  const idleCtl = useRef<ReturnType<typeof animate> | null>(null);
  const startIdle = () => {
    if (idleCtl.current) return;
    idleYaw.set(0);
    idleCtl.current = animate(idleYaw, IDLE_SPIN_DEG, {
      duration: IDLE_SPIN_SEC,
      ease: "linear",
      repeat: Infinity,
    });
  };
  const stopIdle = () => {
    idleCtl.current?.stop();
    idleCtl.current = null;
    idleYaw.set(0);
  };

  // State flags used during pointer interaction
  const showHover = useRef(true);
  const dragging = useRef(false);
  const coasting = useRef(false);

  // Inertia controllers for drag release
  const yawInertiaCtl = useRef<ReturnType<typeof animate> | null>(null);
  const pitchInertiaCtl = useRef<ReturnType<typeof animate> | null>(null);

  // Timers/RAF guards for magnetizing and velocity cutoff loop
  const magnetizeTimer = useRef<number | null>(null);
  const cutoffRAF = useRef<number | null>(null);
  const cutoffStart = useRef<number | null>(null);

  const clearMagnetizeTimer = () => {
    if (magnetizeTimer.current != null) {
      window.clearTimeout(magnetizeTimer.current);
      magnetizeTimer.current = null;
    }
  };
  const cancelCutoffRAF = () => {
    if (cutoffRAF.current != null) {
      cancelAnimationFrame(cutoffRAF.current);
      cutoffRAF.current = null;
    }
    cutoffStart.current = null;
  };

  // Compose the visible orientation = base + (idle yaw) + (hover offsets)
  const composedPitch: MotionValue<number> = useMotionValue(BASE_PITCH);
  const composedYaw: MotionValue<number> = useMotionValue(BASE_YAW);
  const recompute = () => {
    const bx = pitchBase.get();
    const by = yawBase.get();
    const iy = idleYaw.get();
    const hx = showHover.current ? hoverPitch.get() : 0;
    const hy = showHover.current ? hoverYaw.get() : 0;
    composedPitch.set(bx + hx);
    composedYaw.set(by + iy + hy);
  };
  useMotionValueEvent(pitchBase, "change", recompute);
  useMotionValueEvent(yawBase, "change", recompute);
  useMotionValueEvent(hoverPitch, "change", recompute);
  useMotionValueEvent(hoverYaw, "change", recompute);
  useMotionValueEvent(idleYaw, "change", recompute);

  // Start idle spin on mount; clear any RAF on unmount
  useEffect(() => {
    startIdle();
    return () => {
      stopIdle();
      cancelCutoffRAF();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track the mouse while hovering over the cube wrapper
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const hoverTrackTo = (yawTarget: number, pitchTarget: number) => {
    animate(hoverYaw, yawTarget, {
      duration: HOVER_TRACK_DUR,
      ease: HOVER_EASE,
    });
    animate(hoverPitch, pitchTarget, {
      duration: HOVER_TRACK_DUR,
      ease: HOVER_EASE,
    });
  };
  const hoverReturnToNeutral = () => {
    animate(hoverYaw, 0, { duration: HOVER_RETURN_DUR, ease: HOVER_EASE });
    animate(hoverPitch, 0, { duration: HOVER_RETURN_DUR, ease: HOVER_EASE });
  };

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      if (!showHover.current) return;
      const rect = el.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      hoverTrackTo(nx * HOVER_MAX_YAW, -ny * HOVER_MAX_PITCH);
    };
    const onLeave = () => hoverReturnToNeutral();

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  // Pull pitch back to base using tween or spring once inertia settles
  const beginMagnetize = () => {
    startIdle();
    showHover.current = false;

    const pitchNow = pitchBase.get();
    const toPitch = shortestTarget(pitchNow, BASE_PITCH);

    const done = () => {
      showHover.current = true;
    };

    if (MAGNETIZE_MODE === "tween") {
      Promise.resolve(
        animate(pitchBase, toPitch, {
          duration: MAGNETIZE_DUR,
          ease: MAGNETIZE_EASE,
        })
      ).finally(done);
    } else {
      Promise.resolve(animate(pitchBase, toPitch, SPRING_MAGNET_PITCH)).finally(
        done
      );
    }
  };

  // Pointer handlers: capture, drag to rotate, release into inertia
  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    // Bake idle + hover offsets into the base so the drag starts from what you see
    const idleY = idleYaw.get();
    const hovY = showHover.current ? hoverYaw.get() : 0;
    const hovP = showHover.current ? hoverPitch.get() : 0;

    yawBase.set(yawBase.get() + idleY + hovY);
    pitchBase.set(pitchBase.get() + hovP);

    hoverYaw.set(0);
    hoverPitch.set(0);
    showHover.current = false;

    stopIdle();
    idleYaw.set(0);

    dragging.current = true;
    coasting.current = false;
    clearMagnetizeTimer();
    cancelCutoffRAF();

    (e.currentTarget as HTMLElement).style.cursor = "grabbing";
    last.current = { x: e.clientX, y: e.clientY, t: performance.now() };
  };

  // Track last pointer and approximate velocity for inertia on release
  const last = useRef<{ x: number; y: number; t: number } | null>(null);
  const lastVel = useRef<{ vx: number; vy: number }>({ vx: 0, vy: 0 });

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || !last.current) return;
    const now = performance.now();
    const dt = Math.max(1, now - last.current.t);
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;

    yawBase.set(yawBase.get() + dx * DRAG_SENS);
    pitchBase.set(pitchBase.get() - dy * DRAG_SENS);

    lastVel.current.vx = dx * DRAG_SENS * (1000 / dt);
    lastVel.current.vy = -dy * DRAG_SENS * (1000 / dt);

    last.current = { x: e.clientX, y: e.clientY, t: now };
  };

  /**
   * While coasting, poll the velocities. When they’re low for a short window,
   * stop inertia and start the magnetize tween/spring.
   */
  const startMomentumCutoffLoop = () => {
    cutoffStart.current = null;
    const tick = () => {
      if (!coasting.current) {
        cancelCutoffRAF();
        return;
      }
      const vyaw = Math.abs(yawBase.getVelocity?.() ?? 0);
      const vpitch = Math.abs(pitchBase.getVelocity?.() ?? 0);
      const under =
        vyaw < VELOCITY_CUTOFF_DEG_PER_S && vpitch < VELOCITY_CUTOFF_DEG_PER_S;

      if (under) {
        if (cutoffStart.current == null)
          cutoffStart.current = performance.now();
        const elapsed = performance.now() - (cutoffStart.current ?? 0);
        if (elapsed >= CUTOFF_SETTLE_MS) {
          yawInertiaCtl.current?.stop();
          pitchInertiaCtl.current?.stop();
          coasting.current = false;
          clearMagnetizeTimer();
          magnetizeTimer.current = window.setTimeout(() => {
            if (!dragging.current && !coasting.current) beginMagnetize();
          }, MAGNETIZE_DELAY_MS);
          cancelCutoffRAF();
          return;
        }
      } else {
        cutoffStart.current = null;
      }

      cutoffRAF.current = requestAnimationFrame(tick);
    };
    cutoffRAF.current = requestAnimationFrame(tick);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    (e.currentTarget as HTMLElement).style.cursor = "grab";

    showHover.current = false;

    // Kick off inertia based on the last measured velocity
    coasting.current = true;
    yawInertiaCtl.current = animate(yawBase, 0, {
      ...INERTIA_OPTS,
      velocity: lastVel.current.vx,
    });
    pitchInertiaCtl.current = animate(pitchBase, 0, {
      ...INERTIA_OPTS,
      velocity: lastVel.current.vy,
    });

    // When both animations settle, start the magnetize phase
    Promise.all(
      [yawInertiaCtl.current, pitchInertiaCtl.current].map((c) => c)
    ).finally(() => {
      coasting.current = false;
      clearMagnetizeTimer();
      magnetizeTimer.current = window.setTimeout(() => {
        if (!dragging.current && !coasting.current) beginMagnetize();
      }, MAGNETIZE_DELAY_MS);
    });

    cancelCutoffRAF();
    startMomentumCutoffLoop();
  };

  // --- Render: a 3D stage with six faces and a front/back decal on each
  return (
    <div
      ref={wrapperRef}
      className="relative no-drag-select"
      style={{ height: SIZE, touchAction: "none" }}
      aria-hidden
    >
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: SIZE,
          height: SIZE,
          perspective: 800,
          transformStyle: "preserve-3d",
        }}
      >
        <motion.div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="absolute inset-0 cursor-grab"
          style={{
            transformStyle: "preserve-3d",
            rotateX: composedPitch,
            rotateY: composedYaw,
            willChange: "transform",
          }}
        >
          {faces.map((f, i) => (
            <div
              key={i}
              className="absolute inset-0 grid place-items-center rounded-xl"
              style={{
                transform: faceTransform(i, DEPTH),
                // show through the glass to the backside when rotated
                backfaceVisibility: "visible",
                WebkitBackfaceVisibility: "visible",
                background: FACE_BG,
                border: `1px solid ${FACE_BORDER}`,
                boxShadow: `${FACE_SHADOW}, ${FACE_INNER}`,
                backdropFilter: "saturate(110%) brightness(1.12)",
              }}
            >
              {/* Front decal (sits slightly above the outer surface) */}
              <div
                className="absolute inset-0 grid place-items-center pointer-events-none select-none"
                style={{
                  transform: "translateZ(0.6px)", // outer surface
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                }}
              >
                <div className="relative w-16 h-16 pointer-events-none select-none">
                  <Image
                    src={f.icon}
                    alt={f.name}
                    fill
                    className="object-contain pointer-events-none select-none"
                    draggable={false}
                  />
                </div>
              </div>

              {/* Inner mirrored decal (mounted on the inside surface) */}
              <div
                className="absolute inset-0 grid place-items-center pointer-events-none select-none"
                style={{
                  transform: `${innerFlip(i)} translateZ(-0.6px)`,
                  // hide the decal's backface so it doesn't double-render on the same face
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                }}
              >
                <div
                  className="relative w-16 h-16 pointer-events-none select-none"
                  style={{ transform: innerMirror(i) }}
                >
                  <Image
                    src={f.icon}
                    alt={`${f.name} (inner)`}
                    fill
                    className="object-contain pointer-events-none select-none"
                    draggable={false}
                    // Slightly dimmer to feel “under the glass”
                    style={{ opacity: 0.85 }}
                  />
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

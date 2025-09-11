// components/hero/ProfileCard.tsx
"use client";

import React, { useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import clsx from "clsx";
import { CONTACT } from "@/config/contact";

export interface ProfileCardProps {
  avatarUrl: string;
  iconUrl?: string;
  grainUrl?: string;
  behindGradient?: string;
  innerGradient?: string;
  showBehindGradient?: boolean;
  className?: string;
  enableTilt?: boolean;
  enableMobileTilt?: boolean;
  mobileTiltSensitivity?: number;
  miniAvatarUrl?: string;
  name?: string;
  title?: string;
  handle?: string;            // Ignored if it looks like an email (privacy)
  status?: string;
  contactText?: string;
  showUserInfo?: boolean;
  onContactClick?: () => void;

  /** Portrait controls (unchanged) */
  avatarBlend?: "luminosity" | "screen" | "normal";
  avatarTint?: string;
  avatarTintOpacity?: number;
  avatarDesaturate?: number;
  avatarObjectPosition?: string;
  bottomBlurPx?: number;
  bottomBlurStart?: number;

  /** Interaction knobs */
  tiltGain?: number;
  returnDurationMs?: number;
}

/** Cyan → blue → indigo → violet → soft magenta, same vibe as LedBorder */
const DEFAULT_BEHIND =
  "radial-gradient(farthest-side circle at var(--px) var(--py),hsla(205,100%,82%,var(--op)) 6%,hsla(210,90%,75%,calc(var(--op)*0.6)) 14%,hsla(210,55%,60%,0) 55%)," + // cursor-reactive bloom
  "radial-gradient(38% 55% at 55% 20%,#67e8f980 0%,#0000 100%)," +                                                   // cyan wash
  "radial-gradient(100% 100% at 50% 50%,#a78bfa55 0%,#0000 70%)," +                                                 // subtle violet wash
  "conic-gradient(from 120deg at 50% 50%,#67e8f9 0%,#60a5fa 25%,#818cf8 45%,#a78bfa 65%,#f472b6 85%,#67e8f9 100%)"; // multi-hue ring

const DEFAULT_INNER =
  "linear-gradient(145deg,rgba(2,6,23,0.84) 0%,rgba(17,24,39,0.84) 35%,rgba(96,165,250,0.28) 100%)";

const CFG = { INITIAL: 1500, X0: 70, Y0: 60, BETA_OFFSET: 20 } as const;
const RX_DEN = 5.0;
const RY_DEN = 4.4;

function clamp(n: number, a = 0, b = 100) { return Math.min(Math.max(n, a), b); }
function round(n: number, p = 3) { return parseFloat(n.toFixed(p)); }
function map(v: number, a1: number, a2: number, b1: number, b2: number) { return b1 + ((b2 - b1) * (v - a1)) / (a2 - a1); }
function ease(x: number) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }

const ProfileCardComponent: React.FC<ProfileCardProps> = ({
  avatarUrl,
  iconUrl,
  grainUrl,
  behindGradient,
  innerGradient,
  showBehindGradient = true,
  className = "",
  enableTilt = true,
  enableMobileTilt = false,
  mobileTiltSensitivity = 5,
  miniAvatarUrl,
  name = "Matthew Lew",
  title = "Full-Stack Developer",
  handle = CONTACT.email,     // may be an email, but we will not render it
  status = "Online",
  contactText = "Contact",
  showUserInfo = true,
  onContactClick,

  // portrait defaults
  avatarBlend = "luminosity",
  avatarTint = "rgb(106 160 255)",
  avatarTintOpacity = 0.28,
  avatarDesaturate = 0.35,
  avatarObjectPosition = "50% 65%",
  bottomBlurPx = 16,
  bottomBlurStart = 100,

  // interaction defaults
  tiltGain = 0.65,
  returnDurationMs = 300,
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  /** Tilt engine */
  const handlers = useMemo(() => {
    if (!enableTilt) return null;
    let raf: number | null = null;

    const update = (ox: number, oy: number, card: HTMLElement, wrap: HTMLElement) => {
      const w = card.clientWidth, h = card.clientHeight;
      const px = clamp((100 / w) * ox), py = clamp((100 / h) * oy);
      const cx = px - 50, cy = py - 50;

      const baseRx = -(cx / RX_DEN);
      const baseRy =  (cy / RY_DEN);

      const rx = baseRx * tiltGain;
      const ry = baseRy * tiltGain;

      const props: Record<string, string> = {
        "--px": `${px}%`,
        "--py": `${py}%`,
        "--bgx": `${map(px, 0, 100, 35, 65)}%`,
        "--bgy": `${map(py, 0, 100, 35, 65)}%`,
        "--dist": `${clamp(Math.hypot(py - 50, px - 50) / 50, 0, 1)}`,
        "--pyf": `${py / 100}`,
        "--pxf": `${px / 100}`,
        "--rx": `${round(rx, 2)}deg`,
        "--ry": `${round(ry, 2)}deg`,
      };
      for (const [k, v] of Object.entries(props)) wrap.style.setProperty(k, v);
    };

    const smooth = (dur: number, sx: number, sy: number, card: HTMLElement, wrap: HTMLElement) => {
      const t0 = performance.now();
      const tx = wrap.clientWidth / 2;
      const ty = wrap.clientHeight / 2;
      const loop = (t: number) => {
        const p = Math.min(1, Math.max(0, (t - t0) / dur));
        const e = ease(p);
        update(map(e, 0, 1, sx, tx), map(e, 0, 1, sy, ty), card, wrap);
        if (p < 1) raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    };

    return { update, smooth, cancel: () => { if (raf) { cancelAnimationFrame(raf); raf = null; } } };
  }, [enableTilt, tiltGain]);

  /** Wrapper events */
  const onMove = useCallback((e: PointerEvent) => {
    const card = cardRef.current, wrap = wrapRef.current;
    if (!card || !wrap || !handlers) return;
    const rect = card.getBoundingClientRect();
    handlers.update(e.clientX - rect.left, e.clientY - rect.top, card, wrap);
  }, [handlers]);

  const onEnter = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap || !handlers) return;
    handlers.cancel();
    wrap.classList.add("active");
    wrap.style.setProperty("--op", "1");
  }, [handlers]);

  const onLeave = useCallback((e: PointerEvent) => {
    const card = cardRef.current, wrap = wrapRef.current;
    if (!card || !wrap || !handlers) return;
    const rect = card.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    handlers.smooth(returnDurationMs, x, y, card, wrap);
    wrap.classList.remove("active");
    wrap.style.setProperty("--op", "0");
  }, [handlers, returnDurationMs]);

  const onDevice = useCallback((e: DeviceOrientationEvent) => {
    const card = cardRef.current, wrap = wrapRef.current;
    if (!card || !wrap || !handlers) return;
    const { beta, gamma } = e;
    if (beta == null || gamma == null) return;
    handlers.update(
      card.clientHeight / 2 + gamma * mobileTiltSensitivity,
      card.clientWidth / 2 + (beta - CFG.BETA_OFFSET) * mobileTiltSensitivity,
      card, wrap
    );
  }, [handlers, mobileTiltSensitivity]);

  useEffect(() => {
    if (!handlers) return;
    const wrap = wrapRef.current!;
    const card = cardRef.current!;

    const move = onMove as unknown as EventListener;
    const enter = onEnter as unknown as EventListener;
    const leave = onLeave as unknown as EventListener;
    const dev = onDevice as unknown as EventListener;

    wrap.addEventListener("pointerenter", enter);
    wrap.addEventListener("pointermove", move);
    wrap.addEventListener("pointerleave", leave);

    const handleClick = () => {
      if (!enableMobileTilt || location.protocol !== "https:") return;
      // @ts-expect-error iOS permission
      if (typeof DeviceMotionEvent?.requestPermission === "function") {
        // @ts-expect-error iOS permission
        DeviceMotionEvent.requestPermission().then((state: string) => {
          if (state === "granted") window.addEventListener("deviceorientation", dev);
        }).catch(console.error);
      } else {
        window.addEventListener("deviceorientation", dev);
      }
    };
    wrap.addEventListener("click", handleClick);

    // Initial gentle animate-in
    const ix = wrap.clientWidth - CFG.X0;
    const iy = CFG.Y0;
    handlers.update(ix, iy, card, wrap);
    handlers.smooth(CFG.INITIAL, ix, iy, card, wrap);

    return () => {
      wrap.removeEventListener("pointerenter", enter);
      wrap.removeEventListener("pointermove", move);
      wrap.removeEventListener("pointerleave", leave);
      wrap.removeEventListener("click", handleClick);
      window.removeEventListener("deviceorientation", dev);
      handlers.cancel();
    };
  }, [handlers, onMove, onEnter, onLeave, onDevice, enableMobileTilt]);

  /** Wrapper CSS vars */
  const style = useMemo<React.CSSProperties>(() => ({
    ["--px" as any]: "50%",
    ["--py" as any]: "50%",
    ["--op" as any]: 0 as any,
    ["--rx" as any]: "0deg",
    ["--ry" as any]: "0deg",
    ["--bgx" as any]: "50%",
    ["--bgy" as any]: "50%",
    ["--icon" as any]: iconUrl ? `url(${iconUrl})` : "none",
    ["--grain" as any]: grainUrl ? `url(${grainUrl})` : "none",
  }), [iconUrl, grainUrl]);

  const bgBehind = showBehindGradient ? (behindGradient ?? DEFAULT_BEHIND) : "none";

  /**
   * Chip label: show ONLY a non-sensitive identifier.
   * - If `handle` is an email, ignore it and show `name`.
   * - If `handle` is a non-email (e.g., "matthewlew"), show that; otherwise `name`.
   */
  const looksLikeEmail = !!handle && handle.includes("@");
  const chipText =
    !handle || looksLikeEmail
      ? name
      : handle.startsWith("@")
      ? handle.slice(1)
      : handle;

  return (
    <div
      ref={wrapRef}
      className={clsx("group relative z-10 select-none touch-none [perspective:500px] isolate", className)}
      style={style}
    >
      {/* Glow behind the card */}
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-2 rounded-[30px] -z-10 transition-all duration-500
                   group-hover:[filter:brightness(1.05)_contrast(1.05)_saturate(2.2)_blur(44px)] group-hover:opacity-100
                   group-[.active]:[filter:brightness(1.05)_contrast(1.05)_saturate(2.2)_blur(44px)] group-[.active]:opacity-100"
        style={{
          backgroundImage: bgBehind,
          backgroundSize: "100% 100%",
          backgroundPosition: "inherit",
          filter: "brightness(1.02) contrast(1.05) saturate(2.1) blur(40px)",
          transform: "scale(0.94) translate3d(0,0,0.1px)",
          opacity: 0.9,
        }}
      />

      <section
        ref={cardRef}
        className={clsx(
          "relative grid overflow-hidden rounded-[30px] aspect-[0.718] h-[80svh] max-h-[540px]",
          "bg-blend-color-dodge shadow-[0_10px_30px_-5px_rgba(0,0,0,0.8)]",
          "motion-safe:transition-transform motion-safe:duration-700",
          "group-[.active]:!transition-none hover:!transition-none",
          "[will-change:transform]",
          "[background-size:100%_100%]",
          "[background-position:0_0,0_0,50%_50%,0_0]",
          // cyan → blue → indigo → violet → magenta loop
          "[background-image:radial-gradient(farthest-side_circle_at_var(--px)_var(--py),hsla(210,100%,85%,var(--op))_6%,hsla(210,85%,75%,calc(var(--op)*0.6))_14%,hsla(210,55%,60%,0)_55%),radial-gradient(38%_55%_at_55%_20%,#67e8f980_0%,#0000_100%),radial-gradient(100%_100%_at_50%_50%,#a78bfa55_0%,#0000_70%),conic-gradient(from_120deg_at_50%_50%,#67e8f9_0%,#60a5fa_25%,#818cf8_45%,#a78bfa_65%,#f472b6_85%,#67e8f9_100%)]",
          "[transform:translate3d(0,0,0.1px)_rotateX(var(--ry))_rotateY(var(--rx))]"
        )}
      >
        {/* Cyan/Violet edge ring + soft bloom */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[30px]"
          style={{
            boxShadow:
              "0 0 0 2px rgba(96,165,250,0.95) inset," + // crisp blue edge
              "0 0 48px rgba(56,189,248,0.25)," +        // cyan bloom
              "0 0 140px rgba(167,139,250,0.18)",        // violet halo
          }}
        />

        {/* Inner panel */}
        <div
          className="absolute inset-[1px] rounded-[30px] pointer-events-none"
          style={{
            backgroundImage: innerGradient ?? DEFAULT_INNER,
            backgroundColor: "rgba(0,0,0,0.9)",
            transform: "translate3d(0,0,0.01px)",
          }}
        />

        {/* Holo shimmer */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-[30px] pointer-events-none mix-blend-color-dodge
                     [transform:translate3d(0,0,1px)]
                     [background-blend-mode:color,hard-light]
                     [background-size:500%_500%,300%_300%,200%_200%]
                     [background-repeat:repeat]"
          style={{
            WebkitMaskImage: iconUrl ? `url(${iconUrl})` : "none",
            maskImage: iconUrl ? `url(${iconUrl})` : "none",
            backgroundImage:
              "repeating-linear-gradient(0deg,#67e8f9 5%, #60a5fa 10%, #818cf8 15%, #a78bfa 20%, #f472b6 25%, #67e8f9 30%), " +
              "repeating-linear-gradient(-45deg,#0e152e 0%, hsl(200 15% 60%) 3.8%, hsl(200 29% 66%) 4.5%, hsl(200 15% 60%) 5.2%, #0e152e 10%, #0e152e 12%), " +
              "radial-gradient(farthest-corner_circle_at_var(--px)_var(--py), rgba(0,0,0,.1) 12%, rgba(0,0,0,.25) 120%)",
            backgroundPosition: `0 var(--bgy), var(--bgx) var(--bgy), center`,
            filter: "brightness(.72) contrast(1.28) saturate(.38) opacity(.56)",
          }}
        />

        {/* Glare */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-[30px] z-[4] pointer-events-none"
          style={{
            transform: "translate3d(0,0,1.1px)",
            backgroundImage:
              "radial-gradient(farthest-corner circle at var(--px) var(--py), hsl(215 35% 86%) 12%, hsla(218 45% 28% /.85) 90%)",
            mixBlendMode: "overlay",
            filter: "brightness(.9) contrast(1.2)",
          }}
        />

        {/* Content */}
        <div className="relative">
          {/* Portrait */}
          <div
            className={clsx(
              "absolute inset-0 pointer-events-none",
              avatarBlend === "screen" && "mix-blend-screen",
              avatarBlend === "luminosity" && "mix-blend-luminosity",
              avatarBlend === "normal" && "mix-blend-normal"
            )}
            style={{ zIndex: 1 }}
          >
            <Image
              src={avatarUrl}
              alt={`${name} avatar`}
              fill
              sizes="(max-width:768px) 80vw, 40vw"
              className="object-cover"
              style={{
                objectPosition: avatarObjectPosition,
                filter: `saturate(${1 - avatarDesaturate}) contrast(1.08) brightness(1.02)`,
              }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background: `linear-gradient(180deg, ${avatarTint} 0%, ${avatarTint} 55%, transparent 100%)`,
                mixBlendMode: avatarBlend === "normal" ? "color" : "overlay",
                opacity: avatarTintOpacity,
              }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(0,0,0,.42) 0%, rgba(0,0,0,.20) 18%, rgba(0,0,0,0) 38%)",
              }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                clipPath: `polygon(0% ${bottomBlurStart}%, 100% ${bottomBlurStart}%, 100% 100%, 0% 100%)`,
                backdropFilter: `blur(${bottomBlurPx}px)`,
              }}
            />
          </div>

          {/* Bottom chip (shows only name; no email, no mailto) */}
          {showUserInfo && (
            <div className="absolute left-5 right-5 bottom-5 z-20 flex items-center justify-between rounded-xl border border-white/15 bg-white/10 backdrop-blur-2xl px-3 py-2 pointer-events-auto">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full overflow-hidden border border-white/10 flex-shrink-0">
                  <Image
                    src={miniAvatarUrl || avatarUrl}
                    alt={`${name} mini avatar`}
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-medium text-white/90">{chipText}</span>
                  {status && <span className="text-xs text-white/70">{status}</span>}
                </div>
              </div>
              <button
                type="button"
                className="rounded-md border border-white/15 px-3 py-1.5 text-sm font-semibold text-white/90 hover:border-white/40 transition backdrop-blur"
                onClick={() => onContactClick?.()}
                aria-label={`Contact ${name}`}
              >
                {contactText}
              </button>
            </div>
          )}

          {/* Headings with cyan→violet blend */}
          <div className="pointer-events-none absolute top-12 w-full text-center z-30 [transform:translate3d(calc(var(--pxf)*-6px+3px),calc(var(--pyf)*-6px+3px),0.1px)]">
            <h3 className="m-0 bg-gradient-to-b from-white via-cyan-200 to-violet-300 bg-clip-text text-transparent font-semibold text-[min(5svh,3rem)]">
              {name}
            </h3>
            <p className="mt-[-0.5rem] bg-gradient-to-b from-white/95 via-blue-200 to-pink-300 bg-clip-text text-transparent font-semibold text-sm">
              {title}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

const ProfileCard = React.memo(ProfileCardComponent);
export default ProfileCard;

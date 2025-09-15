// components/hero/ProfileCard.tsx
"use client";

import React, { useEffect, useRef, useCallback, useMemo, useState } from "react";
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
  miniAvatarUrl?: string;      // optional; CONTACT.pfpSrc will be preferred
  name?: string;
  title?: string;
  handle?: string;             // Ignored if it looks like an email (privacy)
  status?: string;
  contactText?: string;
  showUserInfo?: boolean;
  onContactClick?: () => void;

  /** Portrait controls */
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

/** Palette matched to LedBorder.tsx */
const SITE_CONIC =
  "conic-gradient(from 0deg," +
  "hsl(208 92% 66%) 0%," +    // azure
  "hsl(223 90% 64%) 16%," +   // indigo-ish
  "hsl(240 86% 62%) 32%," +   // deep blue
  "hsl(255 82% 58%) 48%," +   // violet
  "hsl(270 78% 54%) 64%," +   // royal purple
  "hsl(292 70% 46%) 80%," +   // darker magenta
  "hsl(208 92% 66%) 100%)";   // loop

/** Behind-the-card glow using the same hues */
const DEFAULT_BEHIND =
  "radial-gradient(farthest-side circle at var(--px) var(--py),hsla(210,100%,82%,var(--op)) 8%,hsla(215,85%,70%,calc(var(--op)*0.6)) 16%,hsla(215,55%,55%,0) 56%)," +
  "radial-gradient(40% 58% at 60% 18%,hsl(208 92% 66%/.35) 0%,#0000 100%)," +
  "radial-gradient(100% 100% at 50% 50%,hsl(270 78% 54%/.34) 0%,#0000 72%)," +
  SITE_CONIC;

const DEFAULT_INNER =
  "linear-gradient(150deg,rgba(2,6,23,0.86) 0%,rgba(17,24,39,0.86) 38%,rgba(56,189,248,0.18) 100%)";

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
  handle = CONTACT.email,
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

  // --- mobile-only: disable tilt/interaction to avoid scroll trap ---
  const [isMobileLike, setIsMobileLike] = useState(false);
  useEffect(() => {
    const mq = typeof window !== "undefined"
      ? window.matchMedia("(hover: none), (pointer: coarse)")
      : null;
    const compute = () => setIsMobileLike(!!(mq?.matches || window.innerWidth <= 640));
    compute();
    mq?.addEventListener?.("change", compute);
    window.addEventListener("resize", compute);
    return () => {
      mq?.removeEventListener?.("change", compute);
      window.removeEventListener("resize", compute);
    };
  }, []);
  // ------------------------------------------------------------------

  /** Tilt engine */
  const handlers = useMemo(() => {
    // mobile-only: when coarse pointer / small screens, skip building the engine entirely
    if (!enableTilt || isMobileLike) return null;
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
  }, [enableTilt, tiltGain, isMobileLike]);

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
    // mobile-only: do not attach any interactive listeners to avoid scroll trap
    if (!handlers || isMobileLike) return;

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
      if (!enableMobileTilt || isMobileLike || location.protocol !== "https:") return;
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
  }, [handlers, onMove, onEnter, onLeave, onDevice, enableMobileTilt, isMobileLike]);

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

  /** Chip label: never show emails */
  const looksLikeEmail = !!handle && handle.includes("@");
  const chipText =
    !handle || looksLikeEmail
      ? name
      : handle.startsWith("@")
      ? handle.slice(1)
      : handle;

  /** Prefer CONTACT.pfpSrc, then prop, then avatarUrl */
  const miniSrc = (CONTACT.pfpSrc?.trim() ? CONTACT.pfpSrc : undefined) ?? miniAvatarUrl ?? avatarUrl;

  if (process.env.NODE_ENV !== "production") {
    // quick sanity check in dev tools
    // eslint-disable-next-line no-console
    console.log("[ProfileCard] miniSrc=", miniSrc, { contactPfp: CONTACT.pfpSrc, miniAvatarUrl, avatarUrl });
  }

  return (
    <div
      ref={wrapRef}
      className={clsx(
        "group relative z-10 select-none [perspective:500px] isolate",
        // mobile-only: allow natural scroll by NOT blocking touch gestures
        isMobileLike ? "touch-pan-y" : "touch-none",
        // mobile-only wrappers from earlier sizing tweak remain intact
        "max-[380px]:mx-auto max-[380px]:w-[90vw]",
        className
      )}
      style={style}
    >
      {/* Glow behind the card */}
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-2 rounded-[30px] -z-10 transition-all duration-500
                   group-hover:[filter:brightness(1.03)_contrast(1.04)_saturate(1.8)_blur(42px)] group-hover:opacity-100
                   group-[.active]:[filter:brightness(1.03)_contrast(1.04)_saturate(1.8)_blur(42px)] group-[.active]:opacity-100"
        style={{
          backgroundImage: bgBehind,
          backgroundSize: "100% 100%",
          backgroundPosition: "inherit",
          filter: "brightness(1.01) contrast(1.03) saturate(1.75) blur(38px)",
          transform: "scale(0.94) translate3d(0,0,0.1px)",
          opacity: 0.9,
        }}
      />

      <section
        ref={cardRef}
        className={clsx(
          "relative grid overflow-hidden rounded-[30px] aspect-[0.718] h-[80svh] max-h-[540px]",
          "max-[380px]:h-[68svh] max-[380px]:max-h-[440px] max-[380px]:rounded-[22px]",
          "bg-blend-color-dodge shadow-[0_10px_30px_-5px_rgba(0,0,0,0.8)]",
          "motion-safe:transition-transform motion-safe:duration-700",
          // mobile-only: no active/hover transition suppression needed when interaction is off
          !isMobileLike && "group-[.active]:!transition-none hover:!transition-none",
          "[will-change:transform]",
          "[background-size:100%_100%]",
          "[background-position:0_0,0_0,50%_50%,0_0]",
          "[background-image:radial-gradient(farthest-side_circle_at_var(--px)_var(--py),hsla(210,100%,85%,var(--op))_6%,hsla(215,85%,70%,calc(var(--op)*0.55))_14%,hsla(215,55%,58%,0)_56%),radial-gradient(38%_55%_at_55%_20%,hsl(208_92%_66%/.45)_0%,#0000_100%),radial-gradient(100%_100%_at_50%_50%,hsl(270_78%_54%/.30)_0%,#0000_70%)," +
            SITE_CONIC +
          "]",
          // mobile-only: keep transform static when interaction is off
          isMobileLike
            ? "[transform:translate3d(0,0,0.1px)]"
            : "[transform:translate3d(0,0,0.1px)_rotateX(var(--ry))_rotateY(var(--rx))]"
        )}
      >
        {/* Edge ring + softer bloom */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[30px] max-[380px]:rounded-[22px]"
          style={{
            boxShadow:
              "0 0 0 2px hsl(223 90% 64% / .95) inset," +
              "0 0 32px hsl(208 92% 66% / .20)," +
              "0 0 100px hsl(270 78% 54% / .14)",
          }}
        />

        {/* Inner panel */}
        <div
          className="absolute inset-[1px] rounded-[30px] pointer-events-none max-[380px]:rounded-[22px]"
          style={{
            backgroundImage: innerGradient ?? DEFAULT_INNER,
            backgroundColor: "rgba(0,0,0,0.9)",
            transform: "translate3d(0,0,0.01px)",
          }}
        />

        {/* Holo shimmer — dialed back */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-[30px] pointer-events-none mix-blend-color-dodge max-[380px]:rounded-[22px]
                     [transform:translate3d(0,0,1px)]
                     [background-blend-mode:color,hard-light]
                     [background-size:500%_500%,300%_300%,200%_200%]
                     [background-repeat:repeat]"
          style={{
            WebkitMaskImage: iconUrl ? `url(${iconUrl})` : "none",
            maskImage: iconUrl ? `url(${iconUrl})` : "none",
            backgroundImage:
              "repeating-linear-gradient(0deg," +
              "hsl(208 92% 66%) 6%, hsl(223 90% 64%) 12%, hsl(240 86% 62%) 18%, hsl(255 82% 58%) 24%, hsl(270 78% 54%) 30%, hsl(292 70% 46%) 36%, hsl(208 92% 66%) 42%), " +
              "repeating-linear-gradient(-45deg,#0e152e 0%, hsl(210 10% 60%) 3.8%, hsl(210 28% 66%) 4.5%, hsl(210 10% 60%) 5.2%, #0e152e 10%, #0e152e 12%), " +
              "radial-gradient(farthest-corner_circle_at_var(--px)_var(--py), rgba(0,0,0,.08) 12%, rgba(0,0,0,.22) 120%)",
            backgroundPosition: `0 var(--bgy), var(--bgx) var(--bgy), center`,
            filter: "brightness(.62) contrast(1.15) saturate(.28) opacity(.42)",
          }}
        />

        {/* Glare — much softer & narrower */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-[30px] z-[4] pointer-events-none max-[380px]:rounded-[22px]"
          style={{
            transform: "translate3d(0,0,1.1px)",
            backgroundImage:
              "radial-gradient(farthest-corner circle at var(--px) var(--py), hsl(214 25% 86% / .55) 8%, hsla(218 45% 26% / .60) 85%)",
            mixBlendMode: "overlay",
            filter: "brightness(.85) contrast(1.12)",
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
                filter: `saturate(${1 - avatarDesaturate}) contrast(1.06) brightness(1.01)`,
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
                  "linear-gradient(to bottom, rgba(0,0,0,.38) 0%, rgba(0,0,0,.18) 20%, rgba(0,0,0,0) 38%)",
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
            <div className="absolute left-5 right-5 bottom-5 z-20 flex items-center justify-between rounded-xl border border-white/12 bg-white/10 backdrop-blur-2xl px-3 py-2 pointer-events-auto max-[380px]:left-3 max-[380px]:right-3 max-[380px]:bottom-3 max-[380px]:px-2.5 max-[380px]:py-1.5">
              <div className="flex items-center gap-3 max-[380px]:gap-2">
                <div className="size-10 rounded-full overflow-hidden border border-white/10 flex-shrink-0 max-[380px]:size-8">
                  <Image
                    key={miniSrc}                 // force re-render if src changes
                    src={miniSrc}
                    alt={`${name} mini avatar`}
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-medium text-white/90 max-[380px]:text-xs">{chipText}</span>
                  {status && <span className="text-xs text-white/70 max-[380px]:text-[11px]">{status}</span>}
                </div>
              </div>
              <button
                type="button"
                className="rounded-md border border-white/12 px-3 py-1.5 text-sm font-semibold text-white/90 hover:border-white/40 transition backdrop-blur max-[380px]:px-2.5 max-[380px]:py-1 max-[380px]:text-xs"
                onClick={() => onContactClick?.()}
                aria-label={`Contact ${name}`}
              >
                {contactText}
              </button>
            </div>
          )}

          {/* Headings with azure→violet blend */}
          <div className="pointer-events-none absolute top-12 w-full text-center z-30 [transform:translate3d(calc(var(--pxf)*-6px+3px),calc(var(--pyf)*-6px+3px),0.1px)] max-[380px]:top-8">
            <h3 className="m-0 bg-gradient-to-b from-white via-[hsl(208_92%_66%)] to-[hsl(255_82%_58%)] bg-clip-text text-transparent font-semibold text-[min(5svh,3rem)] max-[380px]:text-[min(5svh,2.25rem)]">
              {name}
            </h3>
            <p className="mt-[-0.5rem] bg-gradient-to-b from-white/95 via-[hsl(223_90%_64%/0.9)] to-[hsl(292_70%_46%/0.85)] bg-clip-text text-transparent font-semibold text-sm max-[380px]:text-xs">
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

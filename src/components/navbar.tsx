// src/components/Navbar.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Github, Linkedin, FileText, Mail, Menu, X } from "lucide-react";
import { CONTACT } from "@/config/contact";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Navbar
 * - Fixed, translucent, blurred header
 * - Left: name (click → smooth scroll to top, even without #top)
 * - Center: section links with underline that reflects ONLY the section in view (no travel)
 * - Right: Email (copy), LinkedIn, GitHub, Résumé. Copy toast centered below icons.
 * - Mobile: dropdown with same items/order
 */

const HEADER_HEIGHT = 64; // keep in sync with actual rendered height
const UNDERLINE_DURATION = 0.18; // constant tween time (s) for underline appear

type NavItem = { label: string; href: string };
const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { label: "About", href: "/#about" },
  { label: "Projects", href: "/#projects" },
  { label: "Experience", href: "/#experience" },
  { label: "Contact", href: "/#contact" },
] as const;

function clsx(...p: Array<string | false | null | undefined>) {
  return p.filter(Boolean).join(" ");
}

/** Smooth scroll to a hash with sticky-header offset. Falls back to top for unknown ids. */
function scrollToHash(href: string) {
  if (typeof window === "undefined") return;
  const hash = href.split("#")[1];

  // No hash → smooth-scroll to absolute top
  if (!hash) {
    window.history.pushState(null, "", "/");
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  // Try target, with graceful fallback to #hero or top
  const target =
    document.getElementById(hash) || document.getElementById("hero");

  if (!target) {
    window.history.pushState(null, "", `/#${hash}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  const rect = target.getBoundingClientRect();
  const absoluteY = window.scrollY + rect.top;
  const y = Math.max(absoluteY - HEADER_HEIGHT - 8, 0);

  window.history.pushState(null, "", `/#${hash}`);
  window.scrollTo({ top: y, behavior: "smooth" });
}

/** Geometry-based active section detector: picks the section where (top ≤ y < bottom). */
function useActiveSection(sectionIds: string[], offset = HEADER_HEIGHT + 8) {
  const [active, setActive] = useState<string | null>(null);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const els = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    const calc = () => {
      const y = window.scrollY + offset + 1; // bias into the section slightly
      let current: string | null = null;

      for (const el of els) {
        const top = el.offsetTop;
        const bottom = top + el.offsetHeight;
        if (y >= top && y < bottom) {
          current = el.id;
          break;
        }
      }

      if (!current && els.length) {
        // Above first section → null (no underline). Below last → last section.
        if (y < els[0].offsetTop) current = null;
        else current = els[els.length - 1].id;
      }

      setActive(current);
    };

    const schedule = () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(calc);
    };

    calc();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", schedule);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", schedule);
    };
  }, [sectionIds, offset]);

  return active;
}

function DesktopNav({
  items,
  activeId,
  onLinkClick,
}: {
  items: ReadonlyArray<NavItem>;
  activeId: string | null;
  onLinkClick: (href: string) => void;
}) {
  const reduce = useReducedMotion();

  return (
    <nav className="hidden sm:flex items-center gap-6" aria-label="Primary">
      {items.map((item) => {
        const id = item.href.split("#")[1];
        const isActive = !!id && activeId === id;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={(e) => {
              e.preventDefault();
              onLinkClick(item.href);
            }}
            className={clsx(
              "relative px-1 py-1 text-sm font-medium rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
              isActive ? "text-white" : "text-white/80 hover:text-white"
            )}
          >
            {item.label}
            {/* Underline: no travel; constant-duration appear; disappears when inactive */}
            <span className="absolute left-0 right-0 -bottom-1 h-0.5 pointer-events-none">
              {isActive && (
                <motion.span
                  initial={
                    reduce
                      ? { opacity: 1, scaleX: 1 }
                      : { opacity: 0, scaleX: 0.6 }
                  }
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={
                    reduce
                      ? { duration: 0 }
                      : {
                          type: "tween",
                          duration: UNDERLINE_DURATION,
                          ease: "easeOut",
                        }
                  }
                  className="block h-0.5 w-full origin-center rounded-full bg-white"
                />
              )}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedState, setCopiedState] = useState<"idle" | "success" | "error">(
    "idle"
  );

  const sectionIds = useMemo(
    () =>
      NAV_ITEMS.map((n) => n.href.split("#")[1]).filter(Boolean) as string[],
    []
  );
  const activeId = useActiveSection(sectionIds);

  // Close mobile menu on hash navigation
  useEffect(() => {
    if (!isOpen) return;
    const handler = () => setIsOpen(false);
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, [isOpen]);

  async function copyEmail() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(CONTACT.email);
      } else {
        const ta = document.createElement("textarea");
        ta.value = CONTACT.email;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopiedState("success");
    } catch {
      setCopiedState("error");
    } finally {
      window.setTimeout(() => setCopiedState("idle"), 1800);
    }
  }

  return (
    <nav
      id="site-nav"
      className={clsx(
        "fixed top-0 left-0 right-0 z-50",
        "bg-black/60 backdrop-blur-md border-b border-white/10 shadow-sm"
      )}
      role="navigation"
      aria-label="Site"
    >
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        {/* Left: Name — always white; smooth-scrolls to absolute top/hero even without #top */}
        <Link
          href="/"
          onClick={(e) => {
            // If we're already on the same page, prevent navigation and smooth-scroll to top.
            if (
              typeof window !== "undefined" &&
              window.location.pathname === "/"
            ) {
              e.preventDefault();
              scrollToHash("/"); // no hash → smooth to 0
            }
          }}
          className="text-xl font-bold text-white hover:text-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 rounded-md"
          aria-label="Go to top"
        >
          {CONTACT.name}
        </Link>

        {/* Center: section links (desktop) */}
        <DesktopNav
          items={NAV_ITEMS}
          activeId={activeId}
          onLinkClick={(href) => scrollToHash(href)}
        />

        {/* Right: actions (desktop) — Email · LinkedIn · GitHub · Résumé, with centered toast */}
        <div className="hidden sm:flex">
          <div className="relative flex items-center gap-2">
            <button
              type="button"
              onClick={copyEmail}
              aria-label="Copy email address"
              className="p-2 rounded-md text-white/85 hover:text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <Mail className="h-5 w-5" />
            </button>
            <a
              href={CONTACT.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open LinkedIn profile"
              className="p-2 rounded-md text-white/85 hover:text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <Linkedin className="h-5 w-5" />
            </a>
            <a
              href={CONTACT.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open GitHub profile"
              className="p-2 rounded-md text-white/85 hover:text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <Github className="h-5 w-5" />
            </a>
            <a
              href={CONTACT.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white/90 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              aria-label="Open résumé (new tab)"
            >
              <FileText className="h-4 w-4" />
              <span>Resume</span>
            </a>

            {/* Centered copy feedback (absolute; no layout shift) */}
            <div
              className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1 text-xs"
              role="status"
              aria-live="polite"
            >
              {copiedState === "success" && (
                <span className="inline-block whitespace-nowrap rounded bg-emerald-500/20 text-emerald-200 px-2 py-1">
                  Email copied to clipboard!
                </span>
              )}
              {copiedState === "error" && (
                <span className="inline-block whitespace-nowrap rounded bg-red-500/20 text-red-200 px-2 py-1">
                  Couldn’t copy — try again
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setIsOpen((o) => !o)}
          className="sm:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 rounded-md p-2 text-white"
          aria-label="Toggle menu"
          aria-controls="mobile-menu"
          aria-expanded={isOpen}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {isOpen && (
        <div id="mobile-menu" className="sm:hidden px-6 pb-4">
          <ul className="space-y-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToHash(item.href);
                    setIsOpen(false);
                  }}
                  className="block rounded-md px-2 py-2 text-white/90 hover:text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            {/* Same action order on mobile */}
            <li className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={copyEmail}
                aria-label="Copy email address"
                className="p-2 rounded-md text-white/85 hover:text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                <Mail className="h-5 w-5" />
              </button>
              <a
                href={CONTACT.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open LinkedIn profile"
                className="p-2 rounded-md text-white/85 hover:text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href={CONTACT.github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open GitHub profile"
                className="p-2 rounded-md text-white/85 hover:text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href={CONTACT.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white/90 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                aria-label="Open résumé (new tab)"
              >
                <FileText className="h-4 w-4" />
                <span>Resume</span>
              </a>
            </li>

            {(copiedState === "success" || copiedState === "error") && (
              <li className="pt-1 text-xs text-center">
                {copiedState === "success" ? (
                  <span className="inline-block whitespace-nowrap rounded bg-emerald-500/20 text-emerald-200 px-2 py-1">
                    Email copied to clipboard!
                  </span>
                ) : (
                  <span className="inline-block whitespace-nowrap rounded bg-red-500/20 text-red-200 px-2 py-1">
                    Couldn’t copy — try again
                  </span>
                )}
              </li>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
}

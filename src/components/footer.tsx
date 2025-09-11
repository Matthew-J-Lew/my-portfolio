// =============================================
// components/Footer.tsx
// =============================================
"use client";

import Link from "next/link";
import { CONTACT } from "@/config/contact";
import { track as trackEvent } from "@/lib/analytics";
import { Mail, Github, Linkedin, FileText, ChevronUp } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";

/**
 * Manual test checklist (run locally):
 * 1) Keyboard: Tab through links in the footer (nav -> social -> resume -> back-to-top).
 *    Ensure focus outlines are visible and order is logical.
 * 2) Hover: Links underline; icon buttons get subtle bg and scale.
 * 3) Reduced motion: In OS/browser, enable reduced motion and reload. Icons should not scale, smooth scroll should jump.
 * 4) Email: Click the mail icon; email address should copy to clipboard, and a message appears directly beneath the icons.
 * 5) Analytics: If window.gtag or window.umami is present, interactions emit events (see lib/analytics.ts).
 * 6) Responsive: On mobile, rows stack; on md+ they are in a single row with space-between.
 */

function usePrefersReducedMotion() {
  return useMemo(() => {
    if (typeof window === "undefined" || !("matchMedia" in window)) return true;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);
}

export default function Footer({ id = "footer" }: { id?: string }) {
  const rMotion = usePrefersReducedMotion();

  // Use env var if provided; otherwise fall back to CONTACT.email.
  // Add to .env.local (client-exposed): NEXT_PUBLIC_CONTACT_EMAIL="your@email.com"
  const emailAddr =
    (process.env.NEXT_PUBLIC_CONTACT_EMAIL as string | undefined) ?? CONTACT.email;

  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2400);
  }, []);

  const handleCopyEmail = useCallback(async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(emailAddr);
      } else {
        // Fallback for insecure contexts/older browsers
        const ta = document.createElement("textarea");
        ta.value = emailAddr;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      showToast("Email copied to clipboard!");
      trackEvent("click_footer_email");
    } catch {
      showToast("Couldn’t copy email. Please try again.");
    }
  }, [emailAddr, showToast]);

  const handleBackToTop = useCallback(() => {
    const topEl = document.getElementById("top") || document.body;
    if ("scrollTo" in window && !rMotion) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      topEl.scrollIntoView();
    }
  }, [rMotion]);

  const navItems = [
    { label: "About", href: "/#about" },
    { label: "Projects", href: "/#projects" },
    { label: "Experience", href: "/#experience" },
    { label: "Contact", href: "/#contact" },
  ] as const;

  return (
    <footer
      id={id}
      aria-labelledby="footer-heading"
      className="bg-zinc-950 border-t border-white/10 text-white/80"
    >
      <h2 id="footer-heading" className="sr-only">
        Site footer
      </h2>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Top row: quick nav (left) + socials/resume (right with toast below) */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          {/* Quick nav */}
          <nav aria-label="Footer" className="flex flex-wrap items-center gap-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => trackEvent("click_footer_nav", { label: item.label })}
                className="text-sm text-white/80 hover:text-white underline-offset-4 hover:underline transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right column: icons row + centered toast beneath them */}
          <div className="flex flex-col items-center md:items-end gap-2 w-fit self-end">
            {/* Icons row */}
            <div className="flex items-center gap-2">
              {/* Email: copy-to-clipboard (icon-only) */}
              <button
                type="button"
                onClick={handleCopyEmail}
                aria-label={`Copy ${CONTACT.name}'s email to clipboard`}
                title="Copy email"
                className="rounded-md p-2 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 transition motion-safe:hover:scale-105"
              >
                <Mail className="size-5" aria-hidden="true" />
              </button>

              {/* LinkedIn */}
              <a
                href={CONTACT.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn Profile"
                onClick={() => trackEvent("click_footer_linkedin")}
                title="LinkedIn"
                className="rounded-md p-2 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 transition motion-safe:hover:scale-105"
              >
                <Linkedin className="size-5" aria-hidden="true" />
              </a>

              {/* GitHub */}
              <a
                href={CONTACT.github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub Profile"
                onClick={() => trackEvent("click_footer_github")}
                title="GitHub"
                className="rounded-md p-2 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 transition motion-safe:hover:scale-105"
              >
                <Github className="size-5" aria-hidden="true" />
              </a>

              {/* Résumé */}
              <a
                href={CONTACT.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent("click_footer_resume")}
                aria-label="Open résumé (PDF)"
                title="Résumé (PDF)"
                className="rounded-md p-2 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 transition motion-safe:hover:scale-105"
                download
              >
                <FileText className="size-5" aria-hidden="true" />
              </a>
            </div>

            {/* Toast: width matches icons row; centered under them */}
            <div
              aria-live="polite"
              className="min-h-[1.25rem] w-full text-center text-xs text-emerald-300"
            >
              {toast}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Bottom row: meta */}
        <div className="mt-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between text-xs text-white/60">
          <p>
            © {new Date().getFullYear()} {CONTACT.name}. All rights reserved.
          </p>
          <p>
            Built with <span className="text-white/80">Next.js</span>,{" "}
            <span className="text-white/80">TypeScript</span>, and{" "}
            <span className="text-white/80">Tailwind CSS</span>.
          </p>
        </div>
      </div>

      {/* Optional: Back-to-top floating button */}
      <button
        type="button"
        aria-label="Back to top"
        onClick={handleBackToTop}
        className="fixed bottom-6 right-6 z-40 rounded-full border border-white/10 bg-zinc-900/80 backdrop-blur px-3 py-2 text-white/80 shadow-md hover:text-white hover:bg-zinc-800/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 transition motion-safe:hover:scale-105"
      >
        <ChevronUp className="inline size-5 align-middle" aria-hidden="true" />
      </button>
    </footer>
  );
}

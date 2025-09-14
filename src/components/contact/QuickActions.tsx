// src/components/contact/QuickActions.tsx
"use client";

import { CONTACT } from "@/config/contact";
import { track } from "@/lib/analytics";
import { useEffect, useRef, useState } from "react";
import { Mail, Linkedin, Github, FileText } from "lucide-react"; // ← same icons as header

export default function QuickActions() {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(CONTACT.email);
      setCopied(true);
      track("copy_email");
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // secure-context/permissions fallback: open mailto
      window.location.href = `mailto:${CONTACT.email}`;
      track("copy_email_fallback_mailto");
    }
  }

  // Keep the round “puck” container, but put the SAME Lucide icons inside
  const puck =
    "grid size-11 place-items-center rounded-full border border-white/15 " +
    "bg-black/40 text-white/85 hover:text-white hover:bg-white/10 " +
    "transition focus:outline-none focus-visible:ring-2 " +
    "focus-visible:ring-offset-2 focus-visible:ring-cyan-400 ring-offset-zinc-900";

  return (
    <div className="mt-6 flex flex-col items-center">
      <div className="relative flex flex-col items-center gap-3">
        {/* Icon row — circles retained, icons now match the header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={copyEmail}
            className={puck}
            aria-label="Copy email to clipboard"
            title="Copy email"
          >
            <Mail className="size-5" />
            <span className="sr-only">Copy email</span>
          </button>

          <a
            href={CONTACT.linkedin}
            target="_blank"
            rel="noreferrer"
            onClick={() => track("click_linkedin")}
            className={puck}
            aria-label="LinkedIn"
            title="LinkedIn"
          >
            <Linkedin className="size-5" />
            <span className="sr-only">LinkedIn</span>
          </a>

          <a
            href={CONTACT.github}
            target="_blank"
            rel="noreferrer"
            onClick={() => track("click_github")}
            className={puck}
            aria-label="GitHub"
            title="GitHub"
          >
            <Github className="size-5" />
            <span className="sr-only">GitHub</span>
          </a>
        </div>

        {/* Résumé pill — same style as header (icon + label, rounded, subtle border) */}
        <a
          href={CONTACT.resumeUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track("click_resume")}
          aria-label="Open résumé (PDF) in a new tab"
          title="Resume (PDF)"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white/90 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          <FileText className="size-4" />
          <span>Resume</span>
        </a>

        {/* Toast — green, one-line, matching header/footer */}
        <div
          aria-live="polite"
          role="status"
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-[calc(100%+10px)] text-xs"
        >
          <span
            className={
              "inline-block whitespace-nowrap rounded bg-emerald-500/20 text-emerald-200 px-2 py-1 " +
              "transition-all duration-200 " +
              (copied ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1")
            }
          >
            Email copied to clipboard!
          </span>
        </div>
      </div>
    </div>
  );
}

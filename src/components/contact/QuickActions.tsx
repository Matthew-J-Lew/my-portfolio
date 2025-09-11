"use client";

import { CONTACT } from "@/config/contact";
import { track } from "@/lib/analytics";
import { useEffect, useRef, useState } from "react";

// --- tiny inline icons (no extra deps) ---
const IconMail = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <path strokeWidth="1.8" d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />
    <path strokeWidth="1.8" d="m22 8-9.2 5.75a2 2 0 0 1-2.1 0L1 8" />
  </svg>
);
const IconLinkedIn = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8.5h4V23h-4V8.5zM8 8.5H12v2h.06c.55-1.04 1.9-2.14 3.91-2.14 4.18 0 4.95 2.75 4.95 6.33V23h-4v-6.78c0-1.62-.03-3.7-2.25-3.7-2.25 0-2.6 1.76-2.6 3.58V23H8V8.5z"/>
  </svg>
);
const IconGitHub = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" clipRule="evenodd"
      d="M12 .5a11.5 11.5 0 0 0-3.64 22.43c.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.87-1.54-3.87-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.79 1.2 1.79 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.76.41-1.27.75-1.56-2.55-.29-5.23-1.28-5.23-5.72 0-1.26.45-2.3 1.2-3.11-.12-.29-.52-1.47.11-3.07 0 0 .98-.31 3.2 1.18a11.1 11.1 0 0 1 5.82 0c2.22-1.49 3.2-1.18 3.2-1.18.63 1.6.23 2.78.12 3.07.75.81 1.2 1.85 1.2 3.11 0 4.45-2.69 5.42-5.25 5.71.42.37.8 1.1.8 2.22 0 1.61-.01 2.9-.01 3.29 0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z"/>
  </svg>
);

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

  // shared style for icon buttons
  const iconBtn =
    "group grid size-11 place-items-center rounded-full border border-white/15 bg-black/40 text-white/80 " +
    "hover:bg-white/10 hover:text-white/90 transition focus:outline-none " +
    "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cyan-400 ring-offset-zinc-900";

  return (
    <div className="mt-6 flex flex-col items-center">
      {/* relative wrapper so the toast can be absolutely positioned without layout shift */}
      <div className="relative flex flex-col items-center gap-3">
        {/* Row of icons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={copyEmail}
            className={`${iconBtn} ${copied ? "ring-2 ring-cyan-400/40" : ""}`}
            aria-label="Copy email to clipboard"
          >
            <IconMail className="size-5" />
            <span className="sr-only">Copy email</span>
          </button>

          <a
            href={CONTACT.linkedin}
            target="_blank"
            rel="noreferrer"
            onClick={() => track("click_linkedin")}
            className={iconBtn}
            aria-label="LinkedIn"
            title="LinkedIn"
          >
            <IconLinkedIn className="size-5" />
            <span className="sr-only">LinkedIn</span>
          </a>

          <a
            href={CONTACT.github}
            target="_blank"
            rel="noreferrer"
            onClick={() => track("click_github")}
            className={iconBtn}
            aria-label="GitHub"
            title="GitHub"
          >
            <IconGitHub className="size-5" />
            <span className="sr-only">GitHub</span>
          </a>
        </div>

        {/* Résumé button */}
        <a
          href={CONTACT.resumeUrl}
          download
          onClick={() => track("click_resume")}
          className="rounded-full border border-white/20 text-white/90 px-4 py-2 text-sm hover:bg-white/5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-fuchsia-400 ring-offset-zinc-900"
        >
          Download Résumé
        </a>

        {/* Subtle one-line toast, no layout shift */}
        <div
          aria-live="polite"
          role="status"
          className="pointer-events-none absolute left-1/2 top-[calc(100%+10px)] -translate-x-1/2"
        >
          <span
            className={
              "w-max whitespace-nowrap rounded-full border border-white/10 bg-black/70/ " +
              "px-3 py-1 text-xs text-white/70 backdrop-blur-md shadow " +
              "transition-all duration-200 will-change-transform " +
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

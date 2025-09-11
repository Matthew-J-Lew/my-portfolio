// components/contact/ContactForm.tsx
"use client";

import * as React from "react";
import { useState } from "react";
import GlowLedBorder from "@/components/ui/GlowLedBorder";

export default function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<null | boolean>(null);
  const [error, setError] = useState<string | null>(null);

  // LED border interaction (cooler, subtle baseline)
  const [hover, setHover] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);
  const ledGlow = focused ? 1.1 : hover ? 0.8 : 0.45;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setOk(null);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const body = {
      name: String(fd.get("name") || ""),
      email: String(fd.get("email") || ""),
      subject: String(fd.get("subject") || ""),
      message: String(fd.get("message") || ""),
      ch: String(fd.get("ch") || ""),
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed to send");
      setOk(true);
      setPulseKey((p) => p + 1);
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      setOk(false);
      setError(err?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function onBlurCapture(e: React.FocusEvent<HTMLFormElement>) {
    const form = e.currentTarget;
    requestAnimationFrame(() => {
      if (!form.contains(document.activeElement)) setFocused(false);
    });
  }

  const inputClass =
    "w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 " +
    "text-[0.95rem] placeholder-white/40 outline-none transition " +
    "focus:border-transparent focus:ring-2 focus:ring-cyan-400/40";

  return (
    <GlowLedBorder
      glow={ledGlow}
      pulseKey={pulseKey}
      radius={20}
      thickness={3}
      className="mx-auto max-w-3xl"
    >
      <form
        onSubmit={onSubmit}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={onBlurCapture}
        className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-6 text-sm md:p-8"
      >
        <h3 className="text-lg font-semibold">Get in touch</h3>
        <p className="text-white/60 mb-6">I'll respond within 24-48 hours!</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-white/70 mb-2">Name</label>
            <input name="name" required placeholder="Your full name" className={inputClass} />
          </div>
          <div>
            <label className="block text-white/70 mb-2">Email</label>
            <input
              name="email"
              type="email"
              required
              placeholder="you@domain.com"
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-white/70 mb-2">Subject (optional)</label>
          <input name="subject" placeholder="What’s up?" className={inputClass} />
        </div>

        <div className="mt-4">
          <label className="block text-white/70 mb-2">Message</label>
          <textarea
            name="message"
            required
            minLength={20}
            maxLength={2000}
            placeholder="Share details (20–2000 chars)…"
            className={`${inputClass} min-h-[180px]`}
          />
        </div>

        {/* Honeypot (hidden) */}
        <input type="text" name="ch" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

        <div className="mt-6 flex items-center gap-4">
          {/* Cooler gradient pill with restrained glow */}
          <button
            type="submit"
            disabled={loading}
            className={[
              "relative inline-flex items-center justify-center rounded-full p-[2px]",
              "transition-transform focus:outline-none",
              "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cyan-400 ring-offset-zinc-900",
              "hover:scale-[1.02] active:scale-[0.99] disabled:opacity-60",
              // match the form’s border palette (cyan → blue → violet)
              "[background:linear-gradient(90deg,#22d3ee_0%,#60a5fa_40%,#8b5cf6_100%)]",
              // softer, tighter halo so it doesn't bleed upward
              "shadow-[0_0_14px_-6px_rgba(56,189,248,0.35)] hover:shadow-[0_0_20px_-6px_rgba(125,91,255,0.45)]",
            ].join(" ")}
            aria-busy={loading}
          >
            {/* Tamed glow layer (small blur + low opacity, no overspill) */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-px rounded-full blur-[6px] opacity-45
                         [background:linear-gradient(90deg,#22d3ee_0%,#60a5fa_40%,#8b5cf6_100%)]"
              style={{ zIndex: 0 }}
            />
            {/* Inner dark pill */}
            <span className="relative z-[1] rounded-full bg-black/90 px-5 py-2.5 text-[0.95rem] font-semibold text-white">
              {loading ? "Sending…" : "Send message"}
            </span>
          </button>

          {ok === true && <span className="text-emerald-400">Thanks! Your message has been sent.</span>}
          {ok === false && <span className="text-rose-400">Error: {error ?? "please try again."}</span>}
        </div>
      </form>
    </GlowLedBorder>
  );
}

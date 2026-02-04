// components/hero/HeroSection.tsx
"use client";

/**
 * Hero
 * - Transparent section so global particles show through.
 * - Adds a subtle dark overlay for readability.
 * - Keeps your Aurora layer.
 */

import React from "react";
import { TypeAnimation } from "react-type-animation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Github, Linkedin, Mail } from "lucide-react";

import LedBorder from "@/components/contact/LedBorder";
import Aurora from "@/components/hero/Aurora";
import { CONTACT } from "@/config/contact";

// Use the second portrait (more headroom / better circular crop)
const SRC = "/images/pfp.jpg";
const FALLBACK = "https://placehold.co/800x800/png?text=Portrait+not+found";

const HeroSection = () => {

  const [copiedState, setCopiedState] = React.useState<"success" | "error" | null>(null);

  const copyEmail = async () => {
    try {
      // Prefer: keep this off any href / text node
      const email = CONTACT.email;

      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(email);
      } else {
        // Fallback for older browsers
        const ta = document.createElement("textarea");
        ta.value = email;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        ta.style.top = "-9999px";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }

      setCopiedState("success");
    } catch {
      setCopiedState("error");
    } finally {
      window.setTimeout(() => setCopiedState(null), 1800);
    }
  };


  return (
    // Transparent to show particles
    <section id="hero" className="relative min-h-screen flex items-center text-white overflow-hidden">
      {/* Subtle dark wash so text pops while particles remain visible */}
      <div className="absolute inset-0 bg-black/40 z-0" aria-hidden="true" />

      {/* Aurora background */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <Aurora
          colorStops={["#58ADF8", "#673CEB", "#B123C7"]} // azure → violet → dark magenta
          amplitude={0.45}   // calmer texture
          blend={0.65}       // soft edge
          speed={1}
          intensity={1}
          yScale={1.4}       // lower = flatter band
          yShift={0.25}      // move band slightly downward
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full grid grid-cols-1 sm:grid-cols-12 px-10 lg:px-56">
        {/* Left: Text */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="sm:col-span-8 flex flex-col justify-center text-center sm:text-left"
        >
          <h1 className="mb-4 text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
              Hi! I&apos;m Matthew Lew{" "}
            </span>
            <br />
            <TypeAnimation
              sequence={[
                "Software Engineer", 1500,
                "Problem Solver", 1500,
                "Full Stack Dev", 1500,
                "Avid Learner", 1500,
                "Nerd...", 1500,
              ]}
              wrapper="span"
              speed={50}
              repeat={Infinity}
            />
          </h1>

          <p className="text-gray-300 text-base sm:text-lg mb-6 lg:text-xl">
            I love learning and building solutions to real-world problems — One
            line of code at a time!
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="#contact"
              className="px-6 py-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white hover:scale-105 transition-transform w-full sm:w-auto text-center"
            >
              Let&apos;s Chat
            </Link>

            {/* Resume (new tab) */}
            <a
              href={CONTACT.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-1 py-1 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 w-full sm:w-auto text-center"
            >
              <span className="block bg-[#121212] rounded-full px-5 py-2 hover:bg-slate-800 text-white transition-colors">
                My Resume
              </span>
            </a>
          </div>

          {/* Mobile-only quick links (keeps socials visible without opening hamburger) */}
          <div className="relative mt-5 flex items-center justify-center sm:hidden gap-4">
            <button
              type="button"
              onClick={copyEmail}
              aria-label="Copy email address"
              className="rounded-full bg-[#121212]/70 border border-white/10 p-3 hover:scale-105 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <Mail className="h-5 w-5" />
            </button>

            <a
              href={CONTACT.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open LinkedIn profile"
              className="rounded-full bg-[#121212]/70 border border-white/10 p-3 hover:scale-105 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <Linkedin className="h-5 w-5" />
            </a>

            <a
              href={CONTACT.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open GitHub profile"
              className="rounded-full bg-[#121212]/70 border border-white/10 p-3 hover:scale-105 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <Github className="h-5 w-5" />
            </a>

            {/* Centered copy feedback (absolute; no layout shift) */}
            <div
              className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 text-xs"
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

        </motion.div>


        {/* Right: Portrait with LED ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="sm:col-span-4 flex justify-center items-center mt-12 sm:mt-0"
        >
          {/*
            Target inner portrait ≈ 250px (mobile) → 400px (desktop).
            We tighten the inner panel with a slight negative gap and let the image
            bleed 1px past the panel so there's no seam between photo and ring.
          */}
          <LedBorder
            size={`calc(clamp(250px, 38vmin, 400px) + 12px)`}
            thickness={6}
            gap={-1}              // tighten panel by ~1px so ring hugs the image
            spinSec={10}
            glowSec={8}
            glowIntensity={0.5}
            className="shadow-[0_0_40px_-10px_rgba(56,189,248,0.35)]"
          >
            {/* Absolute, full-coverage layer ignores inner padding → stays perfectly round */}
            <div
              className="absolute rounded-full overflow-hidden z-20"
              style={{ inset: "-1px" }}   // bleed past panel edge to kill hairline gap
            >
              <img
                src={SRC}
                alt="Portrait of Matthew Lew"
                className="block w-full h-full object-cover object-[center_42%] select-none"
                draggable={false}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = FALLBACK;
                }}
              />
            </div>
          </LedBorder>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;

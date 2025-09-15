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

import LedBorder from "@/components/contact/LedBorder";
import Aurora from "@/components/hero/Aurora";
import { CONTACT } from "@/config/contact";

// Use the second portrait (more headroom / better circular crop)
const SRC = "/images/pfp.jpg";
const FALLBACK = "https://placehold.co/800x800/png?text=Portrait+not+found";

const HeroSection = () => {
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
          className="col-span-8 flex flex-col justify-center text-center sm:text-left"
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
        </motion.div>

        {/* Right: Portrait with LED ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="col-span-4 flex justify-center items-center mt-12 sm:mt-0"
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

// components/aboutSection.tsx
"use client";

/**
 * About section
 * - Semi-transparent #121212 overlay so global particles remain visible.
 * - Content sits above the overlay.
 */

import React from "react";
import { RevealOnScroll } from "./revealOnScroll";
import SkillsSection from "@/components/SkillsSection";
import GlowLedBorder from "@/components/ui/GlowLedBorder";

const TINT_CLASS = "bg-[#121212]/85"; // adjust opacity to taste

const AboutSection: React.FC = () => {
  return (
    <section
      id="about"
      className="relative min-h-screen py-20 md:py-24 text-white overflow-x-hidden"
    >
      {/* full-bleed grey tint so particles show through */}
      <div aria-hidden className={`absolute inset-0 ${TINT_CLASS}`} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* center vertically on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 lg:min-h-[80vh] items-start lg:items-center">
          {/* Left: About (a bit narrower now) */}
          <div className="lg:col-span-4">
            <RevealOnScroll>
              {/* Apply the offset to the wrapper so the heading + card move together */}
              <div className="flex flex-col gap-5 md:gap-6 lg:-mt-[85px]">
                <h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
                  About Me
                </h2>

                {/* Subtle extra pop: slightly more glow + ring + soft ambient glow + faint top sheen */}
                <GlowLedBorder
                  // brighter focus for descriptive text
                  glow={1}             // 0..1
                  pulseKey={1}         // play one-shot pulse on mount
                  radius={16}
                  thickness={2}
                >
                  <div className="relative rounded-xl p-6 md:p-7 bg-[#1e1e1e] ring-1 ring-blue-400/25 shadow-[0_0_48px_rgba(59,130,246,0.12)]">
                    {/* faint top sheen; super low opacity so it stays classy */}
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 rounded-xl"
                      style={{
                        background:
                          "linear-gradient(180deg, rgba(59,130,246,0.06) 0%, rgba(59,130,246,0.02) 14%, rgba(0,0,0,0) 40%)",
                      }}
                    />
                    <p className="text-gray-300 leading-relaxed mb-4 relative">
                      Hi there! I'm Matthew — a 4th-year Computer Science student at Toronto
                      Metropolitan University with a minor in Cybersecurity.<br />
                      I love building tools and applications that are efficient, impactful,
                      and solve real-world problems.
                    </p>
                    <p className="text-gray-300 leading-relaxed mb-0 relative">
                      My current interests are full-stack development and machine learning.<br />
                      Beyond functionality, I also enjoy adding a bit of personality to the
                      projects I create — including this one!
                    </p>
                  </div>
                </GlowLedBorder>
              </div>
            </RevealOnScroll>
          </div>

          {/* Right: Skills (wider now: 8/12) */}
          <div className="lg:col-span-8">
            <RevealOnScroll>
              <div className="w-full">
                <GlowLedBorder
                  // a little dimmer than the about card to keep hierarchy
                  glow={0.45}         // 0..1
                  pulseKey={0}        // no pulse
                  radius={16}
                  thickness={2}
                >
                  <SkillsSection />
                </GlowLedBorder>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;

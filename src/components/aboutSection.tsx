"use client";

import React from "react";
import { RevealOnScroll } from "./revealOnScroll";
import SkillsSection from "@/components/skills/SkillsSection";


const AboutSection: React.FC = () => {
  return (
    <section id="about" className="min-h-screen py-20 bg-[#121212] text-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left: About (1/3) */}
          <div className="lg:col-span-1">
            <RevealOnScroll>
              <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
                About Me
              </h2>

              <div className="rounded-xl p-6 border border-white/10 bg-[#1e1e1e]">
                <p className="text-gray-300 leading-relaxed mb-4">
                  Hi there! I'm Matthew — a 4th year Computer Science student at Toronto Metropolitan University with a minor in Cybersecurity. I love building tools and applications that are efficient, impactful, and solve real-world problems.
                </p>
                <p className="text-gray-300 leading-relaxed mb-4">
                  My current interests are full-stack development and machine learning. Beyond functionality, I also enjoy adding a bit of personality to the projects I create — including this one!
                </p>
              </div>



            </RevealOnScroll>
          </div>

          <div className="lg:col-span-2">
            <RevealOnScroll>
                <SkillsSection />
            </RevealOnScroll>
          </div>
          
        </div>
      </div>
    </section>
  );
};

export default AboutSection;

"use client";

import { RevealOnScroll } from "./revealOnScroll";

const AboutSection = () => {
  return (
    <section
      id="about"
      className="min-h-screen flex items-center justify-center py-20 bg-[#121212] text-white"
    >
      <RevealOnScroll>
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 text-center">
            About Me
          </h2>

          <div className="rounded-xl p-8 border border-white/10 bg-[#1e1e1e] hover:-translate-y-1 transition-all max-w-2xl">
            <p className="text-gray-300 text-lg leading-relaxed">
              I'm a curious and driven developer who loves building thoughtful full-stack applications, experimenting with new tools, and solving real-world problems through code.
              <br /><br />
              My journey has taken me through Python scripts, Java APIs, React interfaces, and SQL pipelines. I enjoy learning fast, building smart, and shipping things that matter.
              <br /><br />
              When I’m not coding, I’m either exploring tech blogs, refining this portfolio, or planning my next side project.
            </p>
          </div>
        </div>
      </RevealOnScroll>
    </section>
  );
};

export default AboutSection;

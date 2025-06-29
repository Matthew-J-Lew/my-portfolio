"use client";

import React from "react";
import Image from "next/image";
import { TypeAnimation } from "react-type-animation";
import { motion } from "framer-motion";
import Link from "next/link";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center text-white overflow-hidden bg-[#121212]">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/background.png"
          alt="Background"
          fill
          className="object-cover opacity-90"
          priority
        />
      </div>

      {/* Grid layout content */}
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
                "Software Engineer",
                1500,
                "Problem Solver",
                1500,
                "Full Stack Dev",
                1500,
                "Avid Learner",
                1500,
                "Nerd...",
                2000
              ]}
              wrapper="span"
              speed={50}
              repeat={Infinity}
            />
          </h1>

          <p className="text-gray-300 text-base sm:text-lg mb-6 lg:text-xl">
            I love learning and building solutions for real world problems - One line of code at a time!
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="#contact"
              className="px-6 py-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white hover:scale-105 transition-transform w-full sm:w-auto text-center"
            >
              Let's Chat
            </Link>
            <Link
              href="/"
              className="px-1 py-1 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 w-full sm:w-auto text-center"
            >
              <span className="block bg-[#121212] rounded-full px-5 py-2 hover:bg-slate-800 text-white transition-colors">
                My Resume
              </span>
            </Link>
          </div>
        </motion.div>

        {/* Right: Circular Profile Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="col-span-4 flex justify-center items-center mt-12 sm:mt-0"
        >
          <div className="relative rounded-full bg-[#181818] w-[250px] h-[250px] lg:w-[400px] lg:h-[400px]">
            <Image
                src="/images/pfp.jpg"
                alt="hero image"
                fill
                className="object-cover rounded-full"
                priority
            />

          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;

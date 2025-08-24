"use client";

import React, { useState } from "react";
import SkillsGame from "./SkillsGame";
import SkillsCarousel from "./SkillsCarousel";


export default function SkillsSection() {
  const [playing, setPlaying] = useState(false);

  return (
    <section className="rounded-xl p-6 border border-white/10 bg-[#111111]">
      <header className="flex items-start gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold">Skills</h3>
          <p className="text-sm text-gray-400">
            Rotating gallery shows highlights first. Hit <b>Start Game</b> to sort them into categories.
          </p>
        </div>
      </header>

      {!playing ? (
        <>
          <SkillsCarousel />
            <div className="mt-4 flex justify-end">
              <button onClick={() => setPlaying(true)} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700">
                Start Game
              </button>
            </div>
        </>
      ) : (
        <div className="mt-2">
          <SkillsGame onExit={() => setPlaying(false)} />
        </div>
      )}
    </section>
  );
}

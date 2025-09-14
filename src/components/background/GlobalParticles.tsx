// components/background/GlobalParticles.tsx
"use client";

/**
 * Mounts a single global Particles layer (fixed, full-screen).
 * - Always visible behind the site.
 * - Enables mouse-interaction ONLY while #hero is in view.
 */

import { useEffect, useState } from "react";
import Particles from "./Particles";

export default function ParticlesGlobal() {
  const [hoverOn, setHoverOn] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero) {
      setHoverOn(false);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        setHoverOn(e?.isIntersecting ?? false);
      },
      { root: null, threshold: 0.12 }
    );

    io.observe(hero);
    return () => io.disconnect();
  }, []);

  return (
    <Particles
      // Tuning knobs
      particleCount={75}
      particleSpread={10}
      speed={0.12}
      //particleColors={["#e5e7eb", "#cbd5e1", "#93c5fd"]} // soft whites + light blue
      particleColors={['#ffffff']}
      alphaParticles={false}
      particleBaseSize={110}
      sizeRandomness={1}
      cameraDistance={20}
      disableRotation={false}
      // Interaction
      moveParticlesOnHover={hoverOn}
      hoverEventTarget="window"
      // Layer class (z-0)
      className=""
    />
  );
}

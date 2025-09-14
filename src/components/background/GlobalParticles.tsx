// components/background/ParticlesGlobal.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Particles from "./Particles";

export default function ParticlesGlobal() {
  const [hoverOn, setHoverOn] = useState(false);
  const hasObserved = useRef(false);

  useEffect(() => {
    // If there is no #hero yet, try again after mount tick
    const hero = document.getElementById("hero");
    if (!hero || hasObserved.current) return;

    hasObserved.current = true;
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        setHoverOn(e.isIntersecting);
      },
      {
        // treat hero as “active” when ≥30% on screen
        threshold: [0, 0.3, 1],
        rootMargin: "0px",
      }
    );

    io.observe(hero);
    return () => io.disconnect();
  }, []);

  return (
    <Particles
      // visual tuning – tweak to taste
      particleCount={260}
      particleSpread={10}
      speed={0.6}
      particleBaseSize={6}
      sizeRandomness={0.7}
      alphaParticles={true}
      cameraDistance={22}
      particleColors={["#ffffff", "#a6b4ff", "#79e2ff"]}

      // the behavior toggles
      moveParticlesOnHover={hoverOn}
      hoverEventTarget="window"

      // keep it under everything interactive
      className="pointer-events-none"
    />
  );
}

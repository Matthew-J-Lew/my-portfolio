// src/components/hero/Aurora.tsx
"use client";

import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Color, Triangle } from "ogl";

const VERT = `#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3  uColorStops[3];
uniform vec2  uResolution;
uniform float uBlend;

// NEW: vertical controls
uniform float uYScale;     // how tall the band is (bigger = taller)
uniform float uYShift;     // vertical offset of the band
uniform float uIntensity;  // overall thickness/brightness

out vec4 fragColor;

vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

float snoise(vec2 v){
  const vec4 C = vec4(
      0.211324865405187, 0.366025403784439,
      -0.577350269189626, 0.024390243902439
  );
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

struct ColorStop { vec3 color; float position; };

#define COLOR_RAMP(colors, factor, finalColor) {              \
  int index = 0;                                              \
  for (int i = 0; i < 2; i++) {                               \
     ColorStop currentColor = colors[i];                      \
     bool isInBetween = currentColor.position <= factor;      \
     index = int(mix(float(index), float(i), float(isInBetween))); \
  }                                                           \
  ColorStop currentColor = colors[index];                     \
  ColorStop nextColor = colors[index + 1];                    \
  float range = nextColor.position - currentColor.position;   \
  float lerpFactor = (factor - currentColor.position) / range;\
  finalColor = mix(currentColor.color, nextColor.color, lerpFactor); \
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;

  ColorStop colors[3];
  colors[0] = ColorStop(uColorStops[0], 0.0);
  colors[1] = ColorStop(uColorStops[1], 0.5);
  colors[2] = ColorStop(uColorStops[2], 1.0);

  vec3 rampColor;
  COLOR_RAMP(colors, uv.x, rampColor);

  float h = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
  h = exp(h);

  // Original: uv.y * 2.0 - h + 0.2, scaled by 0.6
  // Now: tune with uYScale (height), uYShift (offset), uIntensity (thickness)
  float band      = (uv.y * uYScale - h + uYShift);
  float intensity = uIntensity * band;

  float midPoint = 0.20;
  float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);

  vec3 auroraColor = intensity * rampColor;
  fragColor = vec4(auroraColor * auroraAlpha, auroraAlpha);
}
`;

interface AuroraProps {
  colorStops?: string[];
  amplitude?: number;
  blend?: number;
  time?: number;
  speed?: number; // if 0, draws once (for reduced motion)
  /** Vertical scale of the band: smaller = shorter/flatter, larger = taller */
  yScale?: number; // default 2.0 (matches your previous look)
  /** Vertical offset: move the band up/down (positive pushes it down) */
  yShift?: number; // default 0.2 (matches previous)
  /** Thickness/brightness gain of the band */
  intensity?: number; // default 0.6 (matches previous)
}

export default function Aurora(props: AuroraProps) {
  const {
    colorStops = ["#5227FF", "#7CFF67", "#5227FF"],
    amplitude = 1.0,
    blend = 0.5,
    speed = 1.0,
    yScale = 2.0,
    yShift = 0.2,
    intensity = 0.6,
  } = props;
  const propsRef = useRef<AuroraProps>(props);
  propsRef.current = props;

  const ctnDom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctn = ctnDom.current;
    if (!ctn) return;

    const renderer = new Renderer({
      alpha: true,
      premultipliedAlpha: true,
      antialias: true,
    });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.canvas.style.backgroundColor = "transparent";

    let program: Program | undefined;

    function resize() {
      if (!ctn) return;
      const width = ctn.offsetWidth;
      const height = ctn.offsetHeight;
      renderer.setSize(width, height);
      if (program) {
        (program.uniforms.uResolution.value as [number, number]) = [
          width,
          height,
        ];
      }
    }
    window.addEventListener("resize", resize);

    const geometry = new Triangle(gl);
    if ((geometry as any).attributes?.uv) {
      delete (geometry as any).attributes.uv;
    }

    const colorStopsArray = colorStops.map((hex) => {
      const c = new Color(hex);
      return [c.r, c.g, c.b];
    });

    program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: amplitude },
        uColorStops: { value: colorStopsArray },
        uResolution: { value: [ctn.offsetWidth, ctn.offsetHeight] },
        uBlend: { value: blend },
        // NEW controls
        uYScale: { value: yScale },
        uYShift: { value: yShift },
        uIntensity: { value: intensity },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });
    ctn.appendChild(gl.canvas);

    const draw = (t: number) => {
      const { time = t * 0.01, speed = 1.0 } = propsRef.current;
      if (program) {
        (program.uniforms.uTime.value as number) = time * speed * 0.1;
        (program.uniforms.uAmplitude.value as number) =
          propsRef.current.amplitude ?? amplitude;
        (program.uniforms.uBlend.value as number) =
          propsRef.current.blend ?? blend;

        (program.uniforms.uYScale.value as number) =
          propsRef.current.yScale ?? yScale;
        (program.uniforms.uYShift.value as number) =
          propsRef.current.yShift ?? yShift;
        (program.uniforms.uIntensity.value as number) =
          propsRef.current.intensity ?? intensity;

        const stops = propsRef.current.colorStops ?? colorStops;
        (program.uniforms.uColorStops.value as [number, number, number][]) =
          stops.map((hex: string) => {
            const c = new Color(hex);
            return [c.r, c.g, c.b];
          });
        renderer.render({ scene: mesh });
      }
    };

    let raf = 0;
    const loop = (t: number) => {
      draw(t);
      const s = propsRef.current.speed ?? 1.0;
      if (s !== 0) raf = requestAnimationFrame(loop);
    };

    // first render
    draw(0);
    // animate if requested
    if ((propsRef.current.speed ?? 1) !== 0) raf = requestAnimationFrame(loop);

    resize();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      if (ctn && gl.canvas.parentNode === ctn) ctn.removeChild(gl.canvas);

      // TS-safe way to lose the WebGL context
      const loseCtx = gl.getExtension("WEBGL_lose_context") as unknown as {
        loseContext: () => void;
      } | null;

      loseCtx?.loseContext();
    };
  }, [amplitude, blend, speed, colorStops, yScale, yShift, intensity]);

  return <div ref={ctnDom} className="w-full h-full" />;
}

"use client";

import { useEffect, useRef } from "react";
import { FluidSim } from "@/lib/fluid-sim";

function sectionFade() {
  const hero = document.getElementById("hero");
  if (!hero) return 0;
  const start = Math.max(hero.offsetHeight - window.innerHeight, 0);
  const span = window.innerHeight * 0.28;
  return Math.max(0, Math.min(1, (window.scrollY - start) / span));
}

export default function FluidTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const circle = circleRef.current;
    if (!canvas || !circle) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) return;

    let sim: FluidSim;
    try {
      sim = new FluidSim(canvas);
    } catch {
      return;
    }

    const pointer = {
      x: 0.5,
      y: 0.5,
      clientX: window.innerWidth / 2,
      clientY: window.innerHeight / 2,
      dx: 0,
      dy: 0,
      moved: false,
      primed: false,
    };
    const circlePos = {
      x: pointer.clientX,
      y: pointer.clientY,
    };
    let fade = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      sim.resize(
        Math.floor(window.innerWidth * dpr),
        Math.floor(window.innerHeight * dpr),
      );
    };

    const onPointer = (event: PointerEvent) => {
      const x = event.clientX / window.innerWidth;
      const y = 1 - event.clientY / window.innerHeight;
      pointer.clientX = event.clientX;
      pointer.clientY = event.clientY;
      if (!pointer.primed) {
        pointer.x = x;
        pointer.y = y;
        circlePos.x = event.clientX;
        circlePos.y = event.clientY;
        pointer.primed = true;
        return;
      }
      pointer.dx = (x - pointer.x) * 720;
      pointer.dy = (y - pointer.y) * 720;
      pointer.x = x;
      pointer.y = y;
      pointer.moved = true;
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerdown", onPointer, { passive: true });

    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (document.hidden) {
        last = now;
        return;
      }

      const dt = Math.min((now - last) / 1000, 0.033);
      last = now;
      const menuOpen = document.body.dataset.menu === "open";

      circlePos.x += (pointer.clientX - circlePos.x) * 0.22;
      circlePos.y += (pointer.clientY - circlePos.y) * 0.22;
      circle.style.transform = `translate3d(${circlePos.x}px, ${circlePos.y}px, 0) translate(-50%, -50%)`;

      if (menuOpen) {
        canvas.style.opacity = "0";
        circle.style.opacity = "1";
        document.documentElement.classList.add("cursor-none");
        pointer.moved = false;
        pointer.dx = 0;
        pointer.dy = 0;
        // Keep stepping so residual smoke dissipates while hidden
        sim.step(dt);
        return;
      }

      fade += (sectionFade() - fade) * 0.16;
      const smoke = 1 - fade;
      canvas.style.opacity = String(smoke);
      circle.style.opacity = String(fade);
      document.documentElement.classList.toggle("cursor-none", fade > 0.45);

      if (smoke > 0.02) {
        if (pointer.moved || Math.hypot(pointer.dx, pointer.dy) > 0.4) {
          const speed = Math.min(
            Math.hypot(pointer.dx, pointer.dy) / 28,
            3.2,
          );
          sim.splat(
            pointer.x,
            pointer.y,
            pointer.dx,
            pointer.dy,
            (0.7 + speed) * smoke,
          );
          pointer.moved = false;
          pointer.dx *= 0.55;
          pointer.dy *= 0.55;
        }
        sim.step(dt);
      }
    };

    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onPointer);
      document.documentElement.classList.remove("cursor-none");
      sim.destroy();
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[60] h-full w-full mix-blend-difference"
      />
      <div
        ref={circleRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[60] size-3 rounded-full bg-white mix-blend-difference"
        style={{ opacity: 0 }}
      />
    </>
  );
}

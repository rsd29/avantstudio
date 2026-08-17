"use client";

import { useEffect, useRef } from "react";
import { FluidSim } from "@/lib/fluid-sim";

function sectionFade() {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(
    "--work-progress",
  );
  const progress = Number(raw);
  return Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
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

    document.documentElement.classList.add("cursor-none");
    circle.style.opacity = "1";

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
    circle.style.transform = `translate3d(${circlePos.x}px, ${circlePos.y}px, 0) translate(-50%, -50%)`;

    let sim: FluidSim | null = null;
    if (!reduced) {
      try {
        sim = new FluidSim(canvas);
      } catch {
        sim = null;
      }
    }

    let fade = 0;
    let smoke = 1;

    const resize = () => {
      if (!sim) return;
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
      const caseOpen = document.body.dataset.caseOpen === "true";

      circlePos.x += (pointer.clientX - circlePos.x) * 0.22;
      circlePos.y += (pointer.clientY - circlePos.y) * 0.22;
      circle.style.transform = `translate3d(${circlePos.x}px, ${circlePos.y}px, 0) translate(-50%, -50%)`;
      circle.style.opacity = "1";

      fade += (sectionFade() - fade) * 0.16;
      const work = fade;
      smoke += ((menuOpen || caseOpen ? 0 : 1) - smoke) * 0.08;

      if (!sim) return;

      if (menuOpen) {
        canvas.style.opacity = "0";
        pointer.moved = false;
        pointer.dx = 0;
        pointer.dy = 0;
        sim.step(dt, { dyeDissipation: 0.82, threshold: 0.2, breakup: 0.2 });
        return;
      }

      canvas.style.opacity = String(smoke);

      if (
        smoke > 0.08 &&
        (pointer.moved || Math.hypot(pointer.dx, pointer.dy) > 0.4)
      ) {
        const speed = Math.min(Math.hypot(pointer.dx, pointer.dy) / 28, 3.2);
        const force = 1 - work * 0.28;
        const amount = (0.7 + speed - work * 0.42) * smoke;
        sim.splat(
          pointer.x,
          pointer.y,
          pointer.dx * force,
          pointer.dy * force,
          Math.max(0, amount),
        );
      }
      pointer.moved = false;
      pointer.dx *= 0.55;
      pointer.dy *= 0.55;

      sim.step(dt, {
        dyeDissipation: caseOpen ? 0.84 : 0.965 - work * 0.02,
        threshold: 0.14 + work * 0.1 + (1 - smoke) * 0.35,
        breakup: 0.05 + work * 0.04 + (1 - smoke) * 0.2,
      });
    };

    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onPointer);
      document.documentElement.classList.remove("cursor-none");
      sim?.destroy();
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[80] h-full w-full mix-blend-difference"
      />
      <div
        ref={circleRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[80] size-3 rounded-full bg-white mix-blend-difference"
        style={{ opacity: 1 }}
      />
    </>
  );
}

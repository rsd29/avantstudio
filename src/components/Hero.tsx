"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import AvantWordmark from "@/components/AvantWordmark";
import Container from "@/components/Container";
import PortalNeon from "@/components/PortalNeon";
import { useIntro } from "@/components/IntroProvider";

export default function Hero() {
  const { phase, progress, completeExpand } = useIntro();
  const stageRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const taglineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phase !== "expanding") return;

    const stage = stageRef.current;
    const progressRow = progressRef.current;
    const tagline = taglineRef.current;
    if (!stage) {
      completeExpand();
      return;
    }

    const timeline = gsap.timeline({
      onComplete: completeExpand,
    });

    gsap.set(stage, { width: stage.offsetWidth });

    if (progressRow) {
      timeline.to(
        progressRow,
        { opacity: 0, y: 8, duration: 0.35, ease: "power2.out" },
        0,
      );
    }

    timeline.to(
      stage,
      {
        width: "100%",
        duration: 1.15,
        ease: "power3.inOut",
      },
      0.12,
    );

    if (tagline) {
      gsap.set(tagline, { opacity: 0, y: 12 });
      timeline.to(
        tagline,
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
        0.7,
      );
    }

    return () => {
      timeline.kill();
    };
  }, [phase, completeExpand]);

  const loading = phase === "loading";
  const showProgress = phase === "loading" || phase === "expanding";

  return (
    <section
      id="hero"
      className="relative flex min-h-dvh flex-col overflow-x-hidden bg-white"
      aria-busy={loading}
    >
      <div className="flex min-w-0 flex-1 items-center px-[var(--page-px)]">
        <div
          ref={stageRef}
          className={`relative mx-auto flex flex-col ${
            phase === "ready" ? "w-full" : "w-[min(22rem,70vw)]"
          }`}
        >
          <div className="relative flex items-center">
            <div className="w-full overflow-hidden leading-[0]">
              <div
                className="flex items-center will-change-transform"
                style={{
                  transform: "translate3d(var(--hero-portal-x, 0%), 0, 0)",
                }}
              >
                <AvantWordmark />
              </div>
            </div>
            <PortalNeon facing="left" span="full" opacityVar="--hero-portal-line" />
          </div>
          <div
            ref={progressRef}
            className="absolute left-0 right-0 top-full mt-8 flex items-center gap-4"
            style={{
              visibility: showProgress ? "visible" : "hidden",
              pointerEvents: "none",
            }}
            aria-hidden={!loading}
          >
            <div className="h-px flex-1 overflow-hidden bg-zinc-200">
              <div
                className="h-full bg-zinc-900"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="w-10 text-right text-xs tabular-nums tracking-wide text-zinc-900">
              {String(progress).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>

      <Container className="pb-8 md:pb-10">
        <div
          ref={taglineRef}
          className="flex flex-col items-start gap-1.5"
          style={
            phase === "ready"
              ? {
                  opacity: "var(--hero-copy-opacity, 1)",
                  transform: "none",
                }
              : phase === "loading"
                ? { opacity: 0, transform: "translateY(12px)" }
                : undefined
          }
        >
          <h1 className="text-[clamp(0.7rem,2.1vw,1.5rem)] leading-none tracking-tight text-zinc-900">
            We craft digital experiences that move brands forward.
          </h1>
          <p className="text-[clamp(0.7rem,2.1vw,1.5rem)] leading-none tracking-tight text-zinc-900">
            UX Designer Based in Melbourne
          </p>
        </div>
      </Container>
    </section>
  );
}

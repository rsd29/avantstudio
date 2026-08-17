"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLenis } from "lenis/react";
import Container from "@/components/Container";

gsap.registerPlugin(ScrollTrigger);

const PROJECTS = [
  {
    title: "Northline Brand Refresh",
    category: "Branding",
    year: "2025",
    src: "/works/northline.png",
  },
  {
    title: "Pulse Health App",
    category: "Product Design",
    year: "2025",
    src: "/works/pulse.png",
  },
  {
    title: "Atlas Architecture",
    category: "Web Development",
    year: "2024",
    src: "/works/atlas.png",
  },
  {
    title: "Summit Conference",
    category: "Campaign",
    year: "2024",
    src: "/works/summit.png",
  },
] as const;

// Menu-button cuts: copy panel uses top-left + bottom-right
const TAPER = 20;
const PANEL_CLIP = `polygon(${TAPER}px 0, 100% 0, 100% calc(100% - ${TAPER}px), calc(100% - ${TAPER}px) 100%, 0 100%, 0 ${TAPER}px)`;
const DOT = 12;
const DOT_GAP = 12;

export default function Works() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const slidesRef = useRef<(HTMLImageElement | null)[]>([]);
  const moodRef = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const tweenRef = useRef<gsap.core.Timeline | null>(null);
  const lenis = useLenis();

  useEffect(() => {
    const section = sectionRef.current;
    const pin = pinRef.current;
    if (!section || !pin) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const maxIndex = PROJECTS.length - 1;
    let wheelConsumed = false;
    let wheelTotal = 0;
    let wheelTailSeen = false;
    let lastWheelMagnitude = 0;
    let wheelIdleTimer = 0;
    let touchConsumed = false;
    let touchStartY = 0;

    const slides = () =>
      slidesRef.current.filter((el): el is HTMLImageElement => el !== null);
    const moods = () =>
      moodRef.current.filter((el): el is HTMLDivElement => el !== null);

    const show = (index: number) => {
      slides().forEach((slide, i) => {
        gsap.set(slide, {
          opacity: i === index ? 1 : 0,
          filter: "blur(0px)",
          zIndex: i === index ? 2 : 1,
        });
      });
      moods().forEach((mood, i) => {
        gsap.set(mood, { opacity: i === index ? 1 : 0 });
      });
    };

    const goTo = (index: number, immediate = false) => {
      if (index === activeRef.current && !immediate) return;
      const from = activeRef.current;
      activeRef.current = index;
      setActive(index);

      tweenRef.current?.kill();
      const all = slides();
      const outgoing = all[from];
      const incoming = all[index];
      const moodOut = moods()[from];
      const moodIn = moods()[index];
      if (!incoming) return;

      if (immediate || reduced) {
        show(index);
        return;
      }

      gsap.set(incoming, { zIndex: 3, opacity: 0, filter: "blur(18px)" });
      if (outgoing) gsap.set(outgoing, { zIndex: 2 });

      const tl = gsap.timeline({
        defaults: { overwrite: "auto" },
      });
      tweenRef.current = tl;

      if (outgoing) {
        tl.to(
          outgoing,
          {
            filter: "blur(18px)",
            opacity: 0,
            duration: 0.38,
            ease: "power2.inOut",
          },
          0,
        );
      }
      if (moodOut) {
        tl.to(moodOut, { opacity: 0, duration: 0.55, ease: "power2.inOut" }, 0);
      }
      if (moodIn) {
        tl.fromTo(
          moodIn,
          { opacity: 0 },
          { opacity: 1, duration: 0.6, ease: "power2.out" },
          0.08,
        );
      }

      tl.to(
        incoming,
        {
          filter: "blur(0px)",
          opacity: 1,
          duration: 0.5,
          ease: "power2.out",
        },
        0.12,
      );
    };

    show(0);

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: () => `+=${maxIndex * window.innerHeight * 0.85}`,
      pin: pin,
      anticipatePin: 1,
      snap: false,
    });

    const scrollToIndex = (index: number) => {
      const y =
        trigger.start + (index / maxIndex) * (trigger.end - trigger.start);
      if (lenis) {
        lenis.scrollTo(y, {
          duration: 0.65,
          easing: (t: number) => 1 - (1 - t) ** 3,
          lock: true,
        });
      } else {
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    };

    const step = (dir: 1 | -1) => {
      const next = Math.max(0, Math.min(maxIndex, activeRef.current + dir));
      if (next === activeRef.current) return false;
      goTo(next);
      scrollToIndex(next);
      return true;
    };

    const inPin = () => trigger.isActive;

    const rearmWheelAfterIdle = () => {
      window.clearTimeout(wheelIdleTimer);
      wheelIdleTimer = window.setTimeout(() => {
        wheelConsumed = false;
        wheelTotal = 0;
        wheelTailSeen = false;
        lastWheelMagnitude = 0;
      }, 110);
    };

    const onWheel = (event: WheelEvent) => {
      if (!inPin()) return;
      if (event.deltaY === 0) return;
      const magnitude = Math.abs(event.deltaY);
      rearmWheelAfterIdle();

      if (wheelConsumed) {
        event.preventDefault();
        event.stopImmediatePropagation();

        if (magnitude <= 2.5) {
          wheelTailSeen = true;
        }

        const newImpulse =
          wheelTailSeen &&
          magnitude >= 6 &&
          magnitude > Math.max(lastWheelMagnitude * 1.45, 6);

        lastWheelMagnitude = magnitude;
        if (!newImpulse) return;

        wheelConsumed = false;
        wheelTotal = 0;
        wheelTailSeen = false;
      }

      const dir: 1 | -1 = event.deltaY > 0 ? 1 : -1;
      if (dir < 0 && activeRef.current === 0) return;
      if (dir > 0 && activeRef.current === maxIndex) return;
      event.preventDefault();
      event.stopImmediatePropagation();

      wheelTotal += event.deltaY;
      lastWheelMagnitude = magnitude;
      if (Math.abs(wheelTotal) < 14) return;

      wheelConsumed = true;
      wheelTailSeen = false;
      step(wheelTotal > 0 ? 1 : -1);
    };

    const onTouchStart = (event: TouchEvent) => {
      touchStartY = event.touches[0]?.clientY ?? 0;
      touchConsumed = false;
    };
    const onTouchMove = (event: TouchEvent) => {
      if (!inPin()) return;
      const y = event.touches[0]?.clientY ?? touchStartY;
      const dy = touchStartY - y;
      if (Math.abs(dy) < 36) return;
      if (touchConsumed) {
        event.preventDefault();
        return;
      }
      const dir: 1 | -1 = dy > 0 ? 1 : -1;
      if (dir < 0 && activeRef.current === 0) return;
      if (dir > 0 && activeRef.current === maxIndex) return;
      event.preventDefault();
      touchConsumed = true;
      step(dir);
    };

    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("wheel", onWheel, true);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(wheelIdleTimer);
      trigger.kill();
      tweenRef.current?.kill();
    };
  }, [lenis]);

  const project = PROJECTS[active];

  return (
    <section ref={sectionRef} id="work" className="relative bg-white">
      <div
        ref={pinRef}
        className="relative box-border flex h-dvh max-h-dvh flex-col overflow-hidden"
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {PROJECTS.map((item, index) => (
            <div
              key={item.title}
              ref={(node) => {
                moodRef.current[index] = node;
              }}
              className="absolute inset-0"
              style={{ opacity: index === 0 ? 1 : 0 }}
            >
              <img
                src={item.src}
                alt=""
                className="absolute inset-0 h-full w-full scale-110 object-cover"
              />
              <div className="absolute inset-0 bg-white/25 backdrop-blur-[120px]" />
            </div>
          ))}
        </div>

        <Container className="relative z-10 flex min-h-0 w-full flex-1 flex-col">
          <div className="flex min-h-0 flex-1 items-center pt-8">
          <div className="relative flex w-full items-start">
            <div
              className="relative z-0 flex min-h-0 min-w-0 flex-[1] flex-col justify-center bg-zinc-800 py-8 pr-10 pl-8 text-white md:h-[min(76dvh,38rem)] md:py-12 md:pr-14 md:pl-10"
              style={{
                clipPath: PANEL_CLIP,
                marginRight: `-${TAPER}px`,
              }}
            >
              <h2 className="max-w-md text-[clamp(1.1rem,2.4vw,2.5rem)] leading-[1.1] tracking-tight">
                Projects that shape how brands show up online.
              </h2>
              <p className="mt-3 max-w-sm text-xs leading-relaxed text-white/65 sm:text-sm md:mt-4 md:text-base">
                A mix of brand systems, product interfaces, and digital launches
                for teams who care about craft.
              </p>
              <Link
                href="/projects"
                className="mt-4 inline-block text-xs tracking-wide text-white underline decoration-white/30 underline-offset-4 transition-colors hover:decoration-white sm:text-sm md:mt-6"
              >
                View all projects
              </Link>

              <div className="mt-6 md:mt-10" aria-live="polite">
                <p className="text-base tracking-tight md:text-xl">
                  {project.title}
                </p>
                <p className="mt-1 text-xs tracking-wide text-white/55 sm:text-sm">
                  {project.category}
                  <span className="mx-2 text-white/25">/</span>
                  {project.year}
                </p>
                <p className="mt-2 text-xs tabular-nums tracking-wide text-white/40 md:mt-3">
                  {String(active + 1).padStart(2, "0")} /{" "}
                  {String(PROJECTS.length).padStart(2, "0")}
                </p>
              </div>
            </div>

            <div className="relative z-10 flex w-[min(72%,42rem)] shrink-0 flex-col md:w-[min(68%,52rem)]">
              <div className="relative aspect-[8/5] h-[min(76dvh,38rem)] max-h-full w-full">
                <div className="absolute inset-0 overflow-hidden bg-zinc-100">
                  {PROJECTS.map((item, index) => (
                    <img
                      key={item.title}
                      ref={(node) => {
                        slidesRef.current[index] = node;
                      }}
                      src={item.src}
                      alt=""
                      aria-hidden={index !== active}
                      className="absolute inset-0 h-full w-full object-cover"
                      style={{
                        opacity: index === 0 ? 1 : 0,
                        filter: "blur(0px)",
                      }}
                    />
                  ))}
                </div>
              </div>
              <div
                className="mt-3 flex items-center justify-end"
                style={{ gap: DOT_GAP }}
                aria-hidden="true"
              >
                {PROJECTS.map((item, index) => (
                  <span
                    key={item.title}
                    className={`box-border block origin-center bg-transparent transition-[transform,background-color,border-color] duration-300 ease-out ${
                      index === active
                        ? "border-zinc-900 bg-zinc-900"
                        : "border-zinc-900 bg-transparent"
                    }`}
                    style={{
                      width: DOT,
                      height: DOT,
                      borderWidth: 1,
                      transform: index === active ? "scale(1.35)" : "scale(1)",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          </div>
        </Container>
      </div>
    </section>
  );
}

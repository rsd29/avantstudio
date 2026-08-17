"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";

type LogoProps = {
  className?: string;
  tabIndex?: number;
  divider?: string;
  suffix?: string;
};

export default function Logo({
  className = "",
  tabIndex,
  divider = "/",
  suffix,
}: LogoProps) {
  const next = suffix ? `${divider}\u2003${suffix}` : "";
  const viewportRef = useRef<HTMLSpanElement>(null);
  const currentRef = useRef<HTMLSpanElement>(null);
  const incomingRef = useRef<HTMLSpanElement>(null);
  const shownRef = useRef(next);
  const tweenRef = useRef<gsap.core.Timeline | null>(null);
  const bootRef = useRef(true);

  useLayoutEffect(() => {
    const current = currentRef.current;
    const incoming = incomingRef.current;
    const viewport = viewportRef.current;
    if (!current || !incoming || !viewport) return;

    if (bootRef.current) {
      bootRef.current = false;
      shownRef.current = next;
      current.textContent = next;
      incoming.textContent = next;
      gsap.set(current, { yPercent: 0, opacity: next ? 1 : 0 });
      gsap.set(incoming, { yPercent: 100, opacity: 0 });
      viewport.style.width = next ? `${current.scrollWidth}px` : "0px";
      return;
    }

    if (next === shownRef.current) return;

    const from = shownRef.current;
    shownRef.current = next;
    tweenRef.current?.kill();

    current.textContent = from;
    incoming.textContent = next;
    gsap.set(current, { yPercent: 0, opacity: from ? 1 : 0 });
    gsap.set(incoming, { yPercent: 100, opacity: 0 });
    const width = Math.max(
      from ? current.scrollWidth : 0,
      next ? incoming.scrollWidth : 0,
    );

    const timeline = gsap.timeline({
      defaults: { duration: 0.48, ease: "power2.inOut" },
      onComplete: () => {
        current.textContent = next;
        incoming.textContent = next;
        gsap.set(current, { yPercent: 0, opacity: next ? 1 : 0 });
        gsap.set(incoming, { yPercent: 100, opacity: 0 });
        viewport.style.width = next ? `${current.scrollWidth}px` : "0px";
      },
    });
    timeline.to(current, { yPercent: -100, opacity: 0 }, 0);
    timeline.to(incoming, { yPercent: 0, opacity: next ? 1 : 0 }, 0);
    timeline.to(viewport, { width, duration: 0.48, ease: "power2.inOut" }, 0);
    tweenRef.current = timeline;

    return () => {
      timeline.kill();
    };
  }, [next]);

  return (
    <Link
      href="/"
      aria-label={suffix ? `AVANT ${divider} ${suffix}` : "AVANT"}
      tabIndex={tabIndex}
      className={`inline-flex items-center ${className || "text-zinc-900"}`}
    >
      <span
        id="avant-header-mark"
        className="flex items-end gap-4 leading-none"
      >
        <span className="font-logo text-[2.25rem] tracking-normal uppercase">
          AVANT
        </span>
        <span
          ref={viewportRef}
          className="relative inline-block h-[1.75rem] w-0 overflow-hidden font-sans text-[1.75rem] leading-none font-medium tracking-tight"
          aria-hidden
        >
          <span
            ref={currentRef}
            className="absolute top-0 left-0 whitespace-nowrap will-change-transform"
          />
          <span
            ref={incomingRef}
            className="absolute top-0 left-0 whitespace-nowrap will-change-transform"
          />
        </span>
      </span>
    </Link>
  );
}

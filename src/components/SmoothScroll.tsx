"use client";

import SectionLockProvider, {
  filterLenisVirtualScroll,
} from "@/components/SectionLock";
import { ReactLenis, useLenis } from "lenis/react";
import { useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function LenisGSAPConnector() {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;

    lenis.on("scroll", ScrollTrigger.update);

    const update = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);
    ScrollTrigger.refresh();

    return () => {
      gsap.ticker.remove(update);
      lenis.off("scroll", ScrollTrigger.update);
    };
  }, [lenis]);

  return null;
}

export default function SmoothScroll({
  children,
}: {
  children: React.ReactNode;
}) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    setEnabled(!prefersReducedMotion);
  }, []);

  const content = (
    <SectionLockProvider>
      {enabled ? <LenisGSAPConnector /> : null}
      {children}
    </SectionLockProvider>
  );

  if (!enabled) {
    return content;
  }

  return (
    <ReactLenis
      root
      options={{
        autoRaf: false,
        lerp: 0.1,
        duration: 1.2,
        smoothWheel: true,
        syncTouch: false,
        virtualScroll: filterLenisVirtualScroll,
      }}
    >
      {content}
    </ReactLenis>
  );
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { useLenis } from "lenis/react";
import type { VirtualScrollData } from "lenis";
import { useIntro } from "@/components/IntroProvider";
import { applyAvantPortal, applyWorkProgress } from "@/lib/avant-portal";
import gsap from "gsap";

type Section = "hero" | "work";
type Mode = "hero" | "to-work" | "work" | "to-hero";

type SectionLockValue = {
  section: Section;
  goToWork: () => void;
  goToHero: () => void;
  shuffle: () => void;
  registerStudyCloser: (fn: (() => boolean) | null) => void;
  registerShuffle: (fn: (() => void) | null) => void;
};

const SectionLockContext = createContext<SectionLockValue>({
  section: "hero",
  goToWork: () => {},
  goToHero: () => {},
  shuffle: () => {},
  registerStudyCloser: () => {},
  registerShuffle: () => {},
});

export function useSectionLock() {
  return useContext(SectionLockContext);
}

const SNAP_DURATION = 2.1;

function snapEase(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

let virtualScrollFilter: ((data: VirtualScrollData) => boolean) | null = null;

export function filterLenisVirtualScroll(data: VirtualScrollData) {
  if (virtualScrollFilter) return virtualScrollFilter(data);
  return true;
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function menuIsOpen() {
  return document.body.dataset.menu === "open";
}

function caseStudyIsOpen() {
  return document.body.dataset.caseOpen === "true";
}

export default function SectionLockProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { phase } = useIntro();
  const lenis = useLenis();
  const [section, setSection] = useState<Section>("hero");
  const [menuOpen, setMenuOpen] = useState(false);
  const studyCloserRef = useRef<(() => boolean) | null>(null);
  const shuffleRef = useRef<(() => void) | null>(null);

  const registerStudyCloser = useCallback((fn: (() => boolean) | null) => {
    studyCloserRef.current = fn;
  }, []);

  const registerShuffle = useCallback((fn: (() => void) | null) => {
    shuffleRef.current = fn;
  }, []);

  const shuffle = useCallback(() => {
    shuffleRef.current?.();
  }, []);

  const modeRef = useRef<Mode>("hero");
  const sectionRef = useRef<Section>("hero");
  const phaseRef = useRef(phase);
  const isHomeRef = useRef(isHome);
  const progressRef = useRef(0);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  phaseRef.current = phase;
  isHomeRef.current = isHome;
  sectionRef.current = section;

  const setMode = useCallback((next: Mode) => {
    modeRef.current = next;
    if (next === "work") setSection("work");
    if (next === "hero" || next === "to-hero") setSection("hero");
  }, []);

  const setProgress = useCallback((value: number) => {
    progressRef.current = value;
    applyWorkProgress(value);
  }, []);

  const goToWork = useCallback(
    (immediate = false) => {
      if (!isHomeRef.current) return;
      const mode = modeRef.current;
      if (mode === "work" || mode === "to-work") return;

      setMode("to-work");
      tweenRef.current?.kill();
      const jump = immediate || prefersReducedMotion();
      if (jump) {
        setProgress(1);
        setMode("work");
        return;
      }

      const proxy = { value: progressRef.current };
      tweenRef.current = gsap.to(proxy, {
        value: 1,
        duration: SNAP_DURATION,
        ease: snapEase,
        onUpdate: () => setProgress(proxy.value),
        onComplete: () => {
          if (modeRef.current !== "to-work") return;
          setProgress(1);
          setMode("work");
          tweenRef.current = null;
        },
      });
    },
    [setMode, setProgress],
  );

  const goToHero = useCallback(
    (immediate = false) => {
      if (!isHomeRef.current) return;
      if (studyCloserRef.current?.()) return;
      const mode = modeRef.current;
      if (mode === "hero" || mode === "to-hero") return;

      setMode("to-hero");
      tweenRef.current?.kill();
      const jump = immediate || prefersReducedMotion();
      if (jump) {
        setProgress(0);
        setMode("hero");
        return;
      }

      const proxy = { value: progressRef.current };
      tweenRef.current = gsap.to(proxy, {
        value: 0,
        duration: SNAP_DURATION,
        ease: snapEase,
        onUpdate: () => setProgress(proxy.value),
        onComplete: () => {
          if (modeRef.current !== "to-hero") return;
          setProgress(0);
          setMode("hero");
          tweenRef.current = null;
        },
      });
    },
    [setMode, setProgress],
  );

  const goToWorkRef = useRef(goToWork);
  const goToHeroRef = useRef(goToHero);
  goToWorkRef.current = goToWork;
  goToHeroRef.current = goToHero;

  useEffect(() => {
    const read = () => setMenuOpen(menuIsOpen());
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-menu"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!lenis) return;
    if (!isHome && !menuOpen) {
      lenis.start();
      return;
    }
    lenis.stop();
  }, [lenis, phase, menuOpen, section, isHome]);

  useEffect(() => {
    if (!isHome) return;
    document.body.dataset.sectionLock = section === "work" ? "work" : "";
    if (phase === "ready") {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    }
  }, [isHome, section, phase]);

  useEffect(() => {
    return () => {
      tweenRef.current?.kill();
      delete document.body.dataset.sectionLock;
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (!isHome || phase !== "ready") return;
    if (window.location.hash === "#work") {
      goToWorkRef.current(true);
    }
  }, [isHome, phase]);

  useEffect(() => {
    if (!isHome) {
      if (modeRef.current !== "hero") {
        tweenRef.current?.kill();
        setMode("hero");
        setProgress(0);
      }
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      delete document.body.dataset.sectionLock;
      delete document.body.dataset.universe;
      applyAvantPortal();
      return;
    }

    const onWheel = (event: WheelEvent) => {
      if (phaseRef.current !== "ready" || menuIsOpen()) return;
      const mode = modeRef.current;

      if (mode === "to-work" || mode === "to-hero") {
        event.preventDefault();
        return;
      }

      if (mode === "work") {
        if (caseStudyIsOpen()) return;
        event.preventDefault();
        return;
      }

      event.preventDefault();
      if (event.deltaY > 12) {
        goToWorkRef.current();
      }
    };

    let touchY = 0;
    const onTouchStart = (event: TouchEvent) => {
      touchY = event.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (event: TouchEvent) => {
      if (phaseRef.current !== "ready" || menuIsOpen()) return;
      const mode = modeRef.current;
      if (mode === "to-work" || mode === "to-hero") {
        event.preventDefault();
        return;
      }
      if (mode !== "hero") return;
      const y = event.touches[0]?.clientY ?? touchY;
      if (touchY - y > 28) {
        event.preventDefault();
        goToWorkRef.current();
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (phaseRef.current !== "ready" || menuIsOpen()) return;
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (target?.closest("button, a")) return;

      const mode = modeRef.current;
      if (mode === "hero" && (event.key === "ArrowDown" || event.key === "PageDown" || event.key === " ")) {
        event.preventDefault();
        goToWorkRef.current();
      }
      if (mode === "work" && (event.key === "ArrowUp" || event.key === "PageUp" || event.key === "Home")) {
        event.preventDefault();
      }
    };

    virtualScrollFilter = ({ deltaY }) => {
      if (phaseRef.current !== "ready" || menuIsOpen()) return true;
      if (caseStudyIsOpen()) return false;
      const mode = modeRef.current;
      if (mode === "hero") return deltaY <= 12;
      return false;
    };

    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true, capture: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false, capture: true });
    window.addEventListener("keydown", onKeyDown);

    return () => {
      virtualScrollFilter = null;
      window.removeEventListener("wheel", onWheel, { capture: true });
      window.removeEventListener("touchstart", onTouchStart, { capture: true });
      window.removeEventListener("touchmove", onTouchMove, { capture: true });
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isHome, setMode, setProgress]);

  const value = useMemo(
    () => ({
      section,
      goToWork: () => goToWorkRef.current(),
      goToHero: () => goToHeroRef.current(),
      shuffle,
      registerStudyCloser,
      registerShuffle,
    }),
    [section, shuffle, registerStudyCloser, registerShuffle],
  );

  return (
    <SectionLockContext.Provider value={value}>
      {children}
    </SectionLockContext.Provider>
  );
}

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";

export type IntroPhase = "loading" | "expanding" | "ready";

type IntroContextValue = {
  phase: IntroPhase;
  progress: number;
  completeExpand: () => void;
};

const IntroContext = createContext<IntroContextValue>({
  phase: "loading",
  progress: 0,
  completeExpand: () => {},
});

export function useIntro() {
  return useContext(IntroContext);
}

export default function IntroProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [phase, setPhase] = useState<IntroPhase>(isHome ? "loading" : "ready");
  const [progress, setProgress] = useState(isHome ? 0 : 100);
  const played = useRef(!isHome);

  useEffect(() => {
    if (!isHome) {
      played.current = true;
      setPhase("ready");
      setProgress(100);
      return;
    }

    if (played.current) {
      setPhase("ready");
      setProgress(100);
      return;
    }

    const counter = { value: 0 };

    const tween = gsap.to(counter, {
      value: 100,
      duration: 2,
      ease: "power1.inOut",
      onUpdate: () => setProgress(Math.round(counter.value)),
      onComplete: () => {
        played.current = true;
        setProgress(100);
        setPhase("expanding");
      },
    });

    return () => {
      tween.kill();
    };
  }, [isHome]);

  useEffect(() => {
    document.body.dataset.intro = phase;
    const lock = phase !== "ready";
    document.documentElement.style.overflow = lock ? "hidden" : "";
    document.body.style.overflow = lock ? "hidden" : "";

    return () => {
      delete document.body.dataset.intro;
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [phase]);

  const value = useMemo(
    () => ({
      phase,
      progress,
      completeExpand: () => setPhase("ready"),
    }),
    [phase, progress],
  );

  return (
    <IntroContext.Provider value={value}>{children}</IntroContext.Provider>
  );
}

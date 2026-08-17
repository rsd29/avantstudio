import { useEffect } from "react";
import { useLenis } from "lenis/react";

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function map(progress: number, from: number, to: number) {
  if (to === from) return progress >= to ? 1 : 0;
  return clamp((progress - from) / (to - from));
}

function ease(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) ** 2;
}

export function getPortalProgress(scrollY = window.scrollY) {
  const hero = document.getElementById("hero");
  if (!hero) return 0;
  const start = Math.max(hero.offsetHeight - window.innerHeight * 0.92, 0);
  const span = window.innerHeight * 0.72;
  return clamp((scrollY - start) / span);
}

export function applyAvantPortal(scrollY = window.scrollY) {
  const root = document.documentElement;
  const menuOpen = document.body.dataset.menu === "open";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let p = getPortalProgress(scrollY);
  if (reduced) p = p > 0.5 ? 1 : 0;

  const heroLineIn = ease(map(p, 0, 0.1));
  const heroLineOut = 1 - ease(map(p, 0.72, 0.92));
  const transfer = ease(map(p, 0.06, 0.7));
  const copy = 1 - ease(map(p, 0, 0.18));

  const line = menuOpen ? 0 : heroLineIn * heroLineOut;
  const shown = transfer;
  const clipLeft = (1 - shown) * 100;

  root.style.setProperty("--hero-portal-line", String(line));
  root.style.setProperty("--hero-portal-x", `${shown * 100}%`);
  root.style.setProperty("--hero-copy-opacity", String(copy));
  root.style.setProperty("--header-portal-line", String(line));
  root.style.setProperty("--header-clip-left", `${clipLeft}%`);
}

export function useAvantPortal() {
  useLenis(({ scroll }) => {
    applyAvantPortal(scroll);
  });

  useEffect(() => {
    applyAvantPortal(window.scrollY);
    const update = () => applyAvantPortal(window.scrollY);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
}

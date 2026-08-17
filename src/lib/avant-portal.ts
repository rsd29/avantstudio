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

export function getWorkProgress() {
  const raw = document.documentElement.style.getPropertyValue("--work-progress");
  if (raw === "") {
    const computed = getComputedStyle(document.documentElement).getPropertyValue(
      "--work-progress",
    );
    const fromCss = Number(computed);
    return Number.isFinite(fromCss) ? clamp(fromCss) : 0;
  }
  const value = Number(raw);
  return Number.isFinite(value) ? clamp(value) : 0;
}

export function applyWorkProgress(progress: number) {
  const p = clamp(progress);
  const root = document.documentElement;
  const curve = ease(map(p, 0, 0.58));
  const fade = 1 - ease(map(p, 0.2, 1));
  root.style.setProperty("--work-progress", String(p));
  root.style.setProperty("--hero-curve", String(curve));
  root.style.setProperty("--hero-fade", String(fade));
  root.style.setProperty("--hero-pe", p > 0.92 ? "none" : "auto");
  if (p > 0.42) document.body.dataset.universe = "true";
  else delete document.body.dataset.universe;
  applyAvantPortal();
}

export function applyAvantPortal() {
  const root = document.documentElement;
  const menuOpen = document.body.dataset.menu === "open";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let p = getWorkProgress();
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
  useLenis(() => {
    applyAvantPortal();
  });

  useEffect(() => {
    applyAvantPortal();
    const update = () => applyAvantPortal();
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
    };
  }, []);
}

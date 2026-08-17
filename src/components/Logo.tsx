"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { cropToInk } from "@/lib/crop-ink";

type LogoProps = {
  className?: string;
  tabIndex?: number;
};

export default function Logo({ className = "", tabIndex }: LogoProps) {
  const markRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const mark = markRef.current;
    if (!mark) return;

    const fit = () => cropToInk(mark);
    fit();
    void document.fonts.ready.then(fit);
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  return (
    <Link
      href="/"
      aria-label="Avant Studio"
      tabIndex={tabIndex}
      className={`inline-flex items-center ${className || "text-zinc-900"}`}
    >
      <span
        id="avant-header-mark"
        ref={markRef}
        className="font-logo block text-lg leading-none tracking-normal uppercase md:text-xl"
      >
        AVANT
      </span>
    </Link>
  );
}

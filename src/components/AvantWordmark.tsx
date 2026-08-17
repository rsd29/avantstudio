"use client";

import { useEffect, useRef } from "react";

export default function AvantWordmark() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const text = textRef.current;
    if (!container || !text) return;

    const fit = () => {
      text.style.fontSize = "100px";
      const unscaledWidth = text.scrollWidth;
      if (unscaledWidth <= 0) return;
      const nextSize = (container.clientWidth / unscaledWidth) * 100;
      text.style.fontSize = `${nextSize}px`;
    };

    fit();
    void document.fonts.ready.then(fit);

    let width = container.clientWidth;
    const observer = new ResizeObserver(() => {
      const next = container.clientWidth;
      if (next === width) return;
      width = next;
      fit();
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full min-w-0">
      <p
        id="avant-hero-mark"
        ref={textRef}
        aria-hidden="true"
        className="font-logo block w-max max-w-none select-none whitespace-nowrap tracking-tighter text-zinc-900 uppercase"
      >
        AVANT
      </p>
    </div>
  );
}

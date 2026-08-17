"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useLenis } from "lenis/react";
import gsap from "gsap";

const LINKS = [
  { label: "Work", href: "#work" },
  { label: "Services", href: "#services" },
  { label: "About", href: "#about" },
  { label: "Process", href: "#process" },
  { label: "Insights", href: "#insights" },
  { label: "Contact", href: "#contact" },
] as const;

// Align with header top padding so the panel grows from the menu button
const PANEL_TOP = "1.25rem";

type MenuOverlayProps = {
  open: boolean;
  onClose: () => void;
  onCloseComplete?: () => void;
  buttonRef: RefObject<HTMLButtonElement | null>;
};

function measureTargetRect() {
  const probe = document.createElement("div");
  probe.setAttribute("aria-hidden", "true");
  const wide = window.matchMedia("(min-width: 768px)").matches;
  Object.assign(probe.style, {
    position: "fixed",
    top: PANEL_TOP,
    right: "var(--page-px)",
    bottom: "var(--page-px)",
    width: wide
      ? "min(22rem, calc(38% - var(--page-px)))"
      : "min(20rem, calc(100% - 2 * var(--page-px)))",
    visibility: "hidden",
    pointerEvents: "none",
  });
  document.body.appendChild(probe);
  const rect = probe.getBoundingClientRect();
  probe.remove();
  return rect;
}

export default function MenuOverlay({
  open,
  onClose,
  onCloseComplete,
  buttonRef,
}: MenuOverlayProps) {
  const lenis = useLenis();
  const rootRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLUListElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const hasOpenedRef = useRef(false);
  const onCloseCompleteRef = useRef(onCloseComplete);
  onCloseCompleteRef.current = onCloseComplete;

  useEffect(() => {
    if (!lenis) return;
    if (open) lenis.stop();
    else lenis.start();
  }, [lenis, open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    const button = buttonRef.current;
    const panel = panelRef.current;
    const content = contentRef.current;
    const backdrop = backdropRef.current;
    const root = rootRef.current;
    if (!button || !panel || !content || !backdrop || !root) return;

    timelineRef.current?.kill();

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const buttonRect = button.getBoundingClientRect();
    const target = measureTargetRect();
    const links = content.querySelectorAll("li");

    const setFromButton = () => {
      gsap.set(panel, {
        left: buttonRect.left,
        top: buttonRect.top,
        width: buttonRect.width,
        height: buttonRect.height,
        opacity: 1,
      });
    };

    const setToTarget = () => {
      gsap.set(panel, {
        left: target.left,
        top: target.top,
        width: target.width,
        height: target.height,
        opacity: 1,
      });
    };

    if (open) {
      hasOpenedRef.current = true;
      root.style.pointerEvents = "auto";
      gsap.set(root, { autoAlpha: 1 });

      if (reducedMotion) {
        setToTarget();
        gsap.set(backdrop, { opacity: 1 });
        gsap.set(content, { opacity: 1 });
        gsap.set(links, { opacity: 1, y: 0 });
        return;
      }

      setFromButton();
      gsap.set(backdrop, { opacity: 0 });
      gsap.set(content, { opacity: 1 });
      gsap.set(links, { opacity: 0, y: 14 });

      const tl = gsap.timeline();
      timelineRef.current = tl;

      tl.to(
        backdrop,
        { opacity: 1, duration: 0.5, ease: "power2.out" },
        0,
      )
        .to(
          panel,
          {
            left: target.left,
            top: target.top,
            width: target.width,
            height: target.height,
            duration: 0.75,
            ease: "power3.inOut",
          },
          0,
        )
        .to(
          links,
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.05,
            ease: "power2.out",
          },
          0.42,
        );

      return () => {
        timelineRef.current?.kill();
      };
    }

    // Close
    if (!hasOpenedRef.current) {
      gsap.set(root, { autoAlpha: 0 });
      root.style.pointerEvents = "none";
      return;
    }

    const finishClose = () => {
      root.style.pointerEvents = "none";
      gsap.set(root, { autoAlpha: 0 });
      onCloseCompleteRef.current?.();
    };

    if (reducedMotion) {
      gsap.set(backdrop, { opacity: 0 });
      finishClose();
      return;
    }

    const closeButtonRect = button.getBoundingClientRect();
    const tl = gsap.timeline({
      onComplete: finishClose,
    });
    timelineRef.current = tl;

    tl.to(
      links,
      {
        opacity: 0,
        y: 10,
        duration: 0.22,
        stagger: 0.02,
        ease: "power2.in",
      },
      0,
    )
      .to(
        backdrop,
        { opacity: 0, duration: 0.4, ease: "power2.in" },
        0.05,
      )
      .to(
        panel,
        {
          left: closeButtonRect.left,
          top: closeButtonRect.top,
          width: closeButtonRect.width,
          height: closeButtonRect.height,
          duration: 0.6,
          ease: "power3.inOut",
        },
        0.1,
      )
      .to(panel, { opacity: 0, duration: 0.15, ease: "power2.in" }, 0.55);

    return () => {
      timelineRef.current?.kill();
    };
  }, [open, buttonRef]);

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-40"
      style={{ visibility: "hidden" }}
      aria-hidden={!open}
    >
      <button
        ref={backdropRef}
        type="button"
        aria-label="Close menu"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
        className="absolute inset-0 bg-zinc-900/10 opacity-0"
      />

      <nav
        ref={panelRef}
        id="site-menu"
        aria-label="Primary"
        className="fixed flex flex-col overflow-hidden border border-white/10 bg-zinc-800/70 shadow-[0_24px_80px_rgba(0,0,0,0.18)] backdrop-blur-2xl"
        style={{ opacity: 0 }}
      >
        <ul
          ref={contentRef}
          className="flex min-h-0 flex-1 flex-col justify-evenly px-8 pb-8 pt-14 md:px-10 md:pb-10 md:pt-16"
        >
          {LINKS.map((link, index) => (
            <li key={link.label}>
              <a
                href={link.href}
                tabIndex={open ? 0 : -1}
                onClick={onClose}
                className="group flex items-baseline justify-between text-white transition-colors hover:text-white/70"
              >
                <span className="text-[clamp(1.4rem,2.8vw,2.1rem)] leading-none tracking-tight">
                  {link.label}
                </span>
                <span className="text-xs tabular-nums tracking-wide text-white/40 transition-colors group-hover:text-white/60">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

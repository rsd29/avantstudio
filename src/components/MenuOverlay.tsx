"use client";

import { useEffect, useId, useRef, type ComponentType, type RefObject } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLenis } from "lenis/react";
import gsap from "gsap";
import {
  ArrowUpRight,
  EnvelopeSimple,
  InstagramLogo,
  LinkedinLogo,
  SpeakerHigh,
  SpeakerSlash,
} from "@phosphor-icons/react";
import { useSectionLock } from "@/components/SectionLock";

const LINKS = [
  { label: "Home", href: "/" },
  { label: "Explore", href: "/#work" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

const SOCIAL = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/avantstudio",
    Icon: LinkedinLogo,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/avantstudio",
    Icon: InstagramLogo,
  },
  {
    label: "Email",
    href: "mailto:hello@avantstudio.com",
    Icon: EnvelopeSimple,
  },
] as const;

function KnockoutSquare({
  Icon,
}: {
  Icon: ComponentType<{
    size?: number | string;
    weight?: "fill" | "regular";
    color?: string;
    "aria-hidden"?: boolean;
  }>;
}) {
  const maskId = useId().replace(/:/g, "");
  return (
    <svg
      className="absolute inset-0 size-full"
      viewBox="0 0 36 36"
      aria-hidden="true"
    >
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse">
          <rect width="36" height="36" fill="white" />
          <g transform="translate(7 7)" fill="black">
            <Icon size={22} weight="fill" color="#000" aria-hidden />
          </g>
        </mask>
      </defs>
      <polygon
        points="5,0.5 35.5,0.5 35.5,31 31,35.5 0.5,35.5 0.5,5"
        className="fill-current"
        mask={`url(#${maskId})`}
      />
    </svg>
  );
}

// Full height inside the page inset (`--page-px` on every side)
const PANEL_TOP = "var(--page-px)";
const PANEL_WIDTH = "min(32rem, calc(100% - 2 * var(--page-px)))";
const PANEL_HEIGHT = "calc(100dvh - 2 * var(--page-px))";

type MenuOverlayProps = {
  open: boolean;
  muted: boolean;
  onClose: () => void;
  onCloseComplete?: () => void;
  onToggleMute: () => void;
  buttonRef: RefObject<HTMLButtonElement | null>;
};

function measureTargetRect() {
  const probe = document.createElement("div");
  probe.setAttribute("aria-hidden", "true");
  Object.assign(probe.style, {
    position: "fixed",
    top: PANEL_TOP,
    right: "var(--page-px)",
    width: PANEL_WIDTH,
    height: PANEL_HEIGHT,
    visibility: "hidden",
    pointerEvents: "none",
    boxSizing: "border-box",
  });
  document.body.appendChild(probe);
  const rect = probe.getBoundingClientRect();
  probe.remove();
  return rect;
}

export default function MenuOverlay({
  open,
  muted,
  onClose,
  onCloseComplete,
  onToggleMute,
  buttonRef,
}: MenuOverlayProps) {
  const lenis = useLenis();
  const router = useRouter();
  const pathname = usePathname();
  const { section, goToWork, goToHero } = useSectionLock();
  const rootRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLUListElement>(null);
  const socialRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const hoverCtxRef = useRef<AudioContext | null>(null);
  const hoverBufferRef = useRef<AudioBuffer | null>(null);
  const hoverGainRef = useRef<GainNode | null>(null);
  const hasOpenedRef = useRef(false);
  const openRef = useRef(open);
  openRef.current = open;
  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  const onCloseCompleteRef = useRef(onCloseComplete);
  onCloseCompleteRef.current = onCloseComplete;

  useEffect(() => {
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.gain.value = 0.35;
    gain.connect(ctx.destination);
    hoverCtxRef.current = ctx;
    hoverGainRef.current = gain;

    let cancelled = false;
    fetch("/sounds/menu-hover.m4a")
      .then((response) => response.arrayBuffer())
      .then((data) => ctx.decodeAudioData(data))
      .then((buffer) => {
        if (!cancelled) hoverBufferRef.current = buffer;
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      void ctx.close();
      hoverCtxRef.current = null;
      hoverBufferRef.current = null;
      hoverGainRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    if (hoverCtxRef.current?.state === "suspended") {
      void hoverCtxRef.current.resume();
    }
  }, [open]);

  const playHoverSound = () => {
    if (!openRef.current || mutedRef.current) return;
    const ctx = hoverCtxRef.current;
    const buffer = hoverBufferRef.current;
    const gain = hoverGainRef.current;
    if (!ctx || !buffer || !gain) return;
    if (ctx.state === "suspended") void ctx.resume();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = 1.35;
    source.connect(gain);
    const offset = Math.min(0.05, buffer.duration * 0.08);
    source.start(0, offset);
  };

  useEffect(() => {
    if (!lenis) return;
    if (open) lenis.stop();
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
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;

    const onResize = () => {
      const target = measureTargetRect();
      gsap.set(panel, {
        left: target.left,
        top: target.top,
        width: target.width,
        height: target.height,
      });
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open]);

  useEffect(() => {
    const button = buttonRef.current;
    const panel = panelRef.current;
    const content = contentRef.current;
    const social = socialRef.current;
    const backdrop = backdropRef.current;
    const root = rootRef.current;
    if (!button || !panel || !content || !social || !backdrop || !root) return;

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
        overflow: "auto",
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
        gsap.set(social, { opacity: 1 });
        gsap.set(links, { opacity: 1, y: 0 });
        return;
      }

      setFromButton();
      gsap.set(panel, { overflow: "hidden" });
      gsap.set(backdrop, { opacity: 0 });
      gsap.set(content, { opacity: 1 });
      gsap.set(social, { opacity: 0, y: 10 });
      gsap.set(links, { opacity: 0, y: 14 });

      const tl = gsap.timeline({
        onComplete: () => {
          gsap.set(panel, { overflow: "auto" });
        },
      });
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
        )
        .to(
          social,
          { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
          0.55,
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
    gsap.set(panel, { overflow: "hidden" });
    const tl = gsap.timeline({
      onComplete: finishClose,
    });
    timelineRef.current = tl;

    tl.to(
      links,
      {
        opacity: 0,
        y: 8,
        duration: 0.1,
        stagger: 0.01,
        ease: "power2.in",
      },
      0,
    )
      .to(
        social,
        { opacity: 0, y: 6, duration: 0.1, ease: "power2.in" },
        0,
      )
      .to(
        backdrop,
        { opacity: 0, duration: 0.18, ease: "power2.in" },
        0,
      )
      .to(
        panel,
        {
          left: closeButtonRect.left,
          top: closeButtonRect.top,
          width: closeButtonRect.width,
          height: closeButtonRect.height,
          duration: 0.22,
          ease: "power3.in",
        },
        0,
      )
      .to(panel, { opacity: 0, duration: 0.08, ease: "power2.in" }, 0.14);

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
        className="absolute inset-0 bg-zinc-900/10 opacity-0 backdrop-blur-[8px]"
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
          className="flex shrink-0 flex-col divide-y divide-white/15 px-10 pt-16"
        >
          {LINKS.map((link) => (
            <li key={link.label}>
              <Link
                href={link.href}
                tabIndex={open ? 0 : -1}
                onClick={(event) => {
                  if (link.href === "/") {
                    event.preventDefault();
                    onClose();
                    if (pathname === "/") {
                      if (section !== "hero") goToHero();
                      return;
                    }
                    router.push("/");
                    return;
                  }
                  if (link.href === "/#work") {
                    event.preventDefault();
                    onClose();
                    if (pathname === "/") {
                      if (section !== "work") goToWork();
                      return;
                    }
                    router.push("/#work");
                    return;
                  }
                  if (pathname === link.href) {
                    event.preventDefault();
                    onClose();
                    return;
                  }
                  onClose();
                }}
                className="group flex items-center justify-between gap-6 py-5 text-white/65 transition-colors hover:text-white/90"
                onPointerEnter={playHoverSound}
              >
                <span className="text-[clamp(2.4rem,4.6vw,3.15rem)] leading-none tracking-tight">
                  {link.label}
                </span>
                <svg
                  className="size-[1.15em] shrink-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M4 12h14M13 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="1.25"
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                  />
                </svg>
              </Link>
            </li>
          ))}
        </ul>
        <div
          ref={socialRef}
          className="mt-auto flex items-center justify-between gap-6 px-10 pt-8 pb-10"
        >
          <div className="flex items-center gap-7">
            {SOCIAL.map((item) => (
              <a
                key={item.label}
                href={item.href}
                tabIndex={open ? 0 : -1}
                target={item.href.startsWith("mailto:") ? undefined : "_blank"}
                rel={item.href.startsWith("mailto:") ? undefined : "noreferrer"}
                aria-label={item.label}
                onPointerEnter={playHoverSound}
                className="group relative flex size-11 shrink-0 items-center justify-center text-white/65 transition-colors duration-300 hover:text-white/90"
              >
                <KnockoutSquare Icon={item.Icon} />
                <ArrowUpRight
                  className="pointer-events-none absolute top-1/2 left-full ml-1.5 -translate-y-1/2 text-white/65 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
                  size={16}
                  weight="fill"
                  aria-hidden
                />
              </a>
            ))}
          </div>
          <button
            type="button"
            tabIndex={open ? 0 : -1}
            aria-label={muted ? "Unmute menu sounds" : "Mute menu sounds"}
            aria-pressed={muted}
            onClick={onToggleMute}
            onPointerEnter={playHoverSound}
            className="group relative flex size-11 shrink-0 items-center justify-center text-white/65 transition-colors duration-300 hover:text-white/90"
          >
            <KnockoutSquare Icon={muted ? SpeakerSlash : SpeakerHigh} />
          </button>
        </div>
      </nav>
    </div>
  );
}

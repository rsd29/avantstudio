"use client";

import { useEffect, useRef, useState } from "react";
import Container from "@/components/Container";
import Logo from "@/components/Logo";
import MenuOverlay from "@/components/MenuOverlay";
import { useIntro } from "@/components/IntroProvider";
import PortalNeon from "@/components/PortalNeon";
import { applyAvantPortal, useAvantPortal } from "@/lib/avant-portal";

export default function Header() {
  const { phase } = useIntro();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuActive, setMenuActive] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const headerVisible = phase === "ready";

  useAvantPortal();

  const openMenu = () => {
    setMenuOpen(true);
    setMenuActive(true);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  useEffect(() => {
    if (phase !== "ready" && menuOpen) closeMenu();
  }, [phase, menuOpen]);

  useEffect(() => {
    if (menuActive) {
      document.body.dataset.menu = "open";
    } else {
      delete document.body.dataset.menu;
    }
    applyAvantPortal(window.scrollY);
    return () => {
      delete document.body.dataset.menu;
    };
  }, [menuActive]);

  return (
    <>
      <header
        className={`pointer-events-none fixed inset-x-0 top-0 z-50 bg-transparent transition-opacity duration-500 ease-out ${
          headerVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <Container
          className={`flex items-center justify-between py-5 ${
            headerVisible ? "pointer-events-auto" : "pointer-events-none"
          }`}
        >
          <div data-avant-header-slot className="relative flex items-center leading-[0]">
            <div
              className="flex items-center will-change-[clip-path]"
              style={{
                clipPath: "inset(0 0 0 var(--header-clip-left, 100%))",
              }}
            >
              <Logo
                className={menuActive ? "text-white md:text-zinc-900" : undefined}
              />
            </div>
            <PortalNeon
              facing="right"
              span="full"
              opacityVar="--header-portal-line"
              leftVar="--header-clip-left"
            />
          </div>
          <button
            ref={menuButtonRef}
            type="button"
            aria-label={menuActive ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            onClick={() => (menuOpen ? closeMenu() : openMenu())}
            className={`group relative flex size-9 items-center justify-center transition-colors ${
              menuActive ? "text-white" : "text-zinc-900"
            }`}
          >
            <svg
              className={`absolute inset-0 size-full transition-opacity duration-200 ${
                menuActive ? "opacity-0" : "opacity-100"
              }`}
              viewBox="0 0 36 36"
              fill="none"
              aria-hidden="true"
            >
              <polygon
                points="5,0.5 35.5,0.5 35.5,31 31,35.5 0.5,35.5 0.5,5"
                className="fill-transparent stroke-zinc-900 transition-colors group-hover:fill-zinc-900"
                strokeWidth="1"
              />
            </svg>
            <svg
              className={`relative z-10 transition-colors ${
                menuOpen ? "" : "group-hover:text-white"
              }`}
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
            >
              {menuOpen ? (
                <path
                  d="M2 2l10 10M12 2L2 12"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="square"
                />
              ) : menuActive ? null : (
                <path
                  d="M1 3.5h12M1 7h12M1 10.5h12"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="square"
                />
              )}
            </svg>
          </button>
        </Container>
      </header>
      <MenuOverlay
        open={menuOpen}
        onClose={closeMenu}
        onCloseComplete={() => setMenuActive(false)}
        buttonRef={menuButtonRef}
      />
    </>
  );
}

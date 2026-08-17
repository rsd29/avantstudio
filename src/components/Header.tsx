"use client";

import { useEffect, useRef, useState } from "react";
import Container from "@/components/Container";
import Logo from "@/components/Logo";
import MenuOverlay from "@/components/MenuOverlay";
import { useIntro } from "@/components/IntroProvider";
import PortalNeon from "@/components/PortalNeon";
import { useSectionLock } from "@/components/SectionLock";
import { applyAvantPortal, useAvantPortal } from "@/lib/avant-portal";

export default function Header() {
  const { phase } = useIntro();
  const { section, goToHero } = useSectionLock();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuActive, setMenuActive] = useState(false);
  const [caseOpen, setCaseOpen] = useState(false);
  const [universe, setUniverse] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const headerVisible = phase === "ready";
  const showBack = headerVisible && section === "work" && !menuActive;

  useAvantPortal();

  useEffect(() => {
    const read = () => {
      setCaseOpen(document.body.dataset.caseOpen === "true");
      setUniverse(document.body.dataset.universe === "true");
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-case-open", "data-universe"],
    });
    return () => observer.disconnect();
  }, []);

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
    applyAvantPortal();
    return () => {
      delete document.body.dataset.menu;
    };
  }, [menuActive]);

  const inverted = (universe || section === "work") && !caseOpen && !menuActive;

  return (
    <>
      <header
        className={`pointer-events-none fixed inset-x-0 top-0 z-[70] bg-transparent ${
          inverted ? "text-white mix-blend-difference" : "text-[var(--header-ink)]"
        }`}
      >
        <div
          className={`transition-opacity duration-500 ease-out ${
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
                clipPath:
                  "inset(-0.6em 0 -0.6em var(--header-clip-left, 100%))",
              }}
            >
              <Logo
                suffix={
                  caseOpen ? "Case" : universe || section === "work" ? "Explore" : undefined
                }
                className={
                  menuActive && !inverted
                    ? "text-white md:text-zinc-900"
                    : "text-current"
                }
              />
            </div>
            <PortalNeon
              facing="right"
              span="full"
              opacityVar="--header-portal-line"
              leftVar="--header-clip-left"
            />
          </div>
          <div className="relative flex items-center">
            <button
              type="button"
              aria-label="Back to top"
              tabIndex={showBack ? 0 : -1}
              aria-hidden={!showBack}
              onClick={goToHero}
              className={`group absolute right-full mr-3 flex size-9 items-center justify-center transition-opacity duration-300 ${
                showBack
                  ? "pointer-events-auto opacity-100"
                  : "pointer-events-none opacity-0"
              }`}
            >
              <svg
                className="absolute inset-0 size-full"
                viewBox="0 0 36 36"
                fill="none"
                aria-hidden="true"
              >
                <polygon
                  points="5,0.5 35.5,0.5 35.5,31 31,35.5 0.5,35.5 0.5,5"
                  className={`fill-transparent stroke-current transition-colors duration-[850ms] ease ${
                    inverted ? "group-hover:fill-white" : "group-hover:fill-zinc-900"
                  }`}
                  strokeWidth="1"
                />
              </svg>
              <svg
                className={`relative z-10 text-current transition-colors duration-[850ms] ease ${
                  inverted ? "group-hover:text-black" : "group-hover:text-white"
                }`}
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M7 11.5V2.5M3.5 6 7 2.5 10.5 6"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                />
              </svg>
            </button>
            <button
              ref={menuButtonRef}
              type="button"
              aria-label={menuActive ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="site-menu"
              onClick={() => (menuOpen ? closeMenu() : openMenu())}
              className={`group relative flex size-9 items-center justify-center transition-colors duration-[850ms] ease ${
                menuActive ? "text-white" : "text-current"
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
                className={`fill-transparent stroke-current transition-colors duration-[850ms] ease ${
                  inverted ? "group-hover:fill-white" : "group-hover:fill-zinc-900"
                }`}
                strokeWidth="1"
              />
            </svg>
            <svg
              className={`relative z-10 transition-colors duration-[850ms] ease ${
                menuOpen
                  ? ""
                  : inverted
                    ? "group-hover:text-black"
                    : "group-hover:text-white"
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
          </div>
        </Container>
        </div>
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

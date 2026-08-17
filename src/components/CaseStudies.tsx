"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import {
  CASE_STUDIES,
  GRID_COLS,
  GRID_ROWS,
  type CaseStudy,
} from "@/data/case-studies";
import { createBarrelMap } from "@/lib/barrel-map";
import { useSectionLock } from "@/components/SectionLock";

const COPIES = [-1, 0, 1] as const;
const LERP = 0.1;
const FRICTION = 0.965;
const MIN_VELOCITY = 24;
const SAMPLE_MS = 90;
const CURVE_PAD = 22;
const CLICK_DIST = 10;
const WAVE_STAGGER = 0.18;
const COLOR_DURATION = 0.85;
const TILT_MAX = 3.5;
const TILT_LERP = 0.05;

type View = "grid" | "flood" | "flatten" | "lining" | "detail" | "closing";

type CellOrigin = {
  copyX: number;
  copyY: number;
  col: number;
  row: number;
};

function cellDistance(a: CellOrigin, b: CellOrigin) {
  const dx = a.copyX * GRID_COLS + a.col - (b.copyX * GRID_COLS + b.col);
  const dy = a.copyY * GRID_ROWS + a.row - (b.copyY * GRID_ROWS + b.row);
  return Math.hypot(dx, dy);
}

function originFromStudy(study: CaseStudy): CellOrigin {
  const index = Math.max(
    0,
    CASE_STUDIES.findIndex((item) => item.id === study.id),
  );
  return {
    copyX: 0,
    copyY: 0,
    col: index % GRID_COLS,
    row: Math.floor(index / GRID_COLS),
  };
}

function readOrigin(node: Element | null): CellOrigin | null {
  if (!node) return null;
  const copyX = Number(node.getAttribute("data-copy-x"));
  const copyY = Number(node.getAttribute("data-copy-y"));
  const col = Number(node.getAttribute("data-col"));
  const row = Number(node.getAttribute("data-row"));
  if (![copyX, copyY, col, row].every(Number.isFinite)) return null;
  return { copyX, copyY, col, row };
}

function floodWait() {
  return 1.15;
}

function cellOnScreen(
  copyX: number,
  copyY: number,
  col: number,
  row: number,
  layout: { w: number; h: number; x: number; y: number },
) {
  const left = (col / GRID_COLS + copyX) * layout.w + layout.x;
  const top = (row / GRID_ROWS + copyY) * layout.h + layout.y;
  const width = layout.w / GRID_COLS;
  const height = layout.h / GRID_ROWS;
  return (
    left < layout.w + width &&
    left + width > -width &&
    top < layout.h + height &&
    top + height > -height
  );
}

function StudyCopy({ study }: { study: CaseStudy }) {
  return (
    <div className="flex h-full w-full flex-col gap-10 px-[var(--page-px)] py-24 md:gap-14 md:py-28">
      <header className="flex flex-col gap-4">
        <p className="text-sm tracking-wide opacity-70">
          {study.category}
          <span className="mx-2 opacity-40">/</span>
          {study.year}
        </p>
        <h2 className="text-[clamp(2.8rem,8vw,6.5rem)] leading-[0.9] tracking-tight">
          {study.title}
        </h2>
        <p className="max-w-2xl text-[clamp(1rem,2.2vw,1.5rem)] leading-snug tracking-tight opacity-90">
          {study.lede}
        </p>
      </header>

      <div className="grid gap-10 md:grid-cols-[1.4fr_0.8fr] md:gap-16">
        <div className="flex flex-col gap-5 text-[0.95rem] leading-relaxed tracking-tight opacity-90 md:text-base">
          {study.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <aside className="flex flex-col gap-8">
          <div>
            <p className="text-xs tracking-wide opacity-50">Role</p>
            <p className="mt-1 text-sm tracking-tight">{study.role}</p>
          </div>
          <div>
            <p className="text-xs tracking-wide opacity-50">Services</p>
            <p className="mt-1 text-sm tracking-tight">
              {study.services.join(" / ")}
            </p>
          </div>
          <div
            className="aspect-[4/3] w-full"
            style={{ background: study.ink, opacity: 0.12 }}
          />
        </aside>
      </div>
    </div>
  );
}

function applyHeaderInk(ink?: string) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (ink) root.style.setProperty("--header-ink", ink);
  else root.style.removeProperty("--header-ink");
}

function wrapCentered(value: number, period: number) {
  if (period <= 0) return 0;
  return value - period * Math.round(value / period);
}

function damp(current: number, target: number, lerp: number, dt: number) {
  const alpha = 1 - (1 - lerp) ** (dt * 60);
  return current + (target - current) * alpha;
}

function wheelDelta(event: WheelEvent, size: { w: number; h: number }) {
  let dx = event.deltaX;
  let dy = event.deltaY;
  if (event.deltaMode === 1) {
    dx *= 16;
    dy *= 16;
  } else if (event.deltaMode === 2) {
    dx *= size.w;
    dy *= size.h;
  }
  return { dx, dy };
}

export default function CaseStudies() {
  const { section, registerStudyCloser } = useSectionLock();
  const interactive = section === "work";
  const rootRef = useRef<HTMLElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const curveRef = useRef<HTMLDivElement>(null);
  const pan = useRef({ x: 0, y: 0, tx: 0, ty: 0, vx: 0, vy: 0 });
  const tilt = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const dragging = useRef(false);
  const samples = useRef<{ x: number; y: number; t: number }[]>([]);
  const reducedRef = useRef(false);
  const sizeRef = useRef({ w: 1, h: 1 });
  const [hover, setHover] = useState<CaseStudy | null>(null);
  const [layers, setLayers] = useState<Record<string, number>>({});
  const layerRef = useRef(1);
  const [barrelMap, setBarrelMap] = useState("");
  const [curveScale, setCurveScale] = useState(56);
  const [view, setView] = useState<View>("grid");
  const [selected, setSelected] = useState<CaseStudy | null>(null);
  const [origin, setOrigin] = useState<CellOrigin | null>(null);
  const [showContent, setShowContent] = useState(false);
  const [revealLayout, setRevealLayout] = useState({ w: 1, h: 1, x: 0, y: 0 });
  const viewRef = useRef<View>("grid");
  const selectedRef = useRef<CaseStudy | null>(null);
  const restCurveRef = useRef(56);
  const curveScaleRef = useRef(56);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const interactiveRef = useRef(interactive);
  interactiveRef.current = interactive;
  viewRef.current = view;
  selectedRef.current = selected;
  curveScaleRef.current = curveScale;

  useEffect(() => {
    if (view !== "grid") {
      document.body.dataset.caseOpen = "true";
    } else {
      delete document.body.dataset.caseOpen;
    }
    return () => {
      delete document.body.dataset.caseOpen;
    };
  }, [view]);
  const panning = interactive && view === "grid";

  useEffect(() => {
    setBarrelMap(createBarrelMap());
    const updateScale = () => {
      const next = Math.round(
        Math.min(window.innerWidth, window.innerHeight) * 0.24,
      );
      restCurveRef.current = next;
      if (viewRef.current === "grid") setCurveScale(next);
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  const closeStudy = useCallback(() => {
    if (viewRef.current === "grid") return false;
    if (viewRef.current === "closing") return true;
    timelineRef.current?.kill();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      applyHeaderInk();
      setSelected(null);
      setOrigin(null);
      setShowContent(false);
      setView("grid");
      setCurveScale(restCurveRef.current);
      return true;
    }

    applyHeaderInk();
    setView("closing");
    setShowContent(false);
    const curve = { value: curveScaleRef.current };
    const timeline = gsap.timeline({
      onComplete: () => {
        timelineRef.current = null;
      },
    });
    timeline.to({}, { duration: 0.32 });
    timeline.add(() => setView("flood"));
    timeline.add(() => setSelected(null), "+=0.04");
    timeline.add(() => setOrigin(null));
    timeline.to(curve, {
      value: restCurveRef.current,
      duration: 0.85,
      ease: "power2.inOut",
      onUpdate: () => setCurveScale(Math.round(curve.value)),
    });
    timeline.add(() => {
      setView("grid");
      setCurveScale(restCurveRef.current);
    });
    timelineRef.current = timeline;
    return true;
  }, []);

  const openStudy = useCallback((study: CaseStudy, nextOrigin?: CellOrigin | null) => {
    if (viewRef.current !== "grid") return;
    const originCell = nextOrigin ?? originFromStudy(study);
    timelineRef.current?.kill();
    pan.current.vx = 0;
    pan.current.vy = 0;
    setHover(null);
    setOrigin(originCell);
    setView("flood");
    setRevealLayout({
      w: rootRef.current?.clientWidth || sizeRef.current.w,
      h: rootRef.current?.clientHeight || sizeRef.current.h,
      x: pan.current.x,
      y: pan.current.y,
    });

    applyHeaderInk(study.ink);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setSelected(study);
      setShowContent(true);
      setCurveScale(0);
      setView("detail");
      return;
    }

    requestAnimationFrame(() => {
      setSelected(study);
      setShowContent(false);
      requestAnimationFrame(() => setShowContent(true));
    });

    const curve = { value: restCurveRef.current };
    const timeline = gsap.timeline({
      onComplete: () => {
        timelineRef.current = null;
      },
    });
    timeline.to({}, { duration: floodWait() });
    timeline.add(() => setView("flatten"));
    timeline.to(curve, {
      value: 0,
      duration: 0.55,
      ease: "power2.inOut",
      onUpdate: () => setCurveScale(Math.round(curve.value)),
    });
    timeline.add(() => setView("lining"), "-=0.18");
    timeline.to({}, { duration: 0.42 });
    timeline.add(() => setView("detail"));
    timelineRef.current = timeline;
  }, []);

  const openStudyRef = useRef(openStudy);
  openStudyRef.current = openStudy;
  const closeStudyRef = useRef(closeStudy);
  closeStudyRef.current = closeStudy;

  useEffect(() => {
    registerStudyCloser(() => closeStudyRef.current());
    return () => registerStudyCloser(null);
  }, [registerStudyCloser]);

  useEffect(() => {
    return () => {
      timelineRef.current?.kill();
      applyHeaderInk();
    };
  }, []);

  useEffect(() => {
    if (!panning) return;

    const root = rootRef.current;
    const world = worldRef.current;
    const curve = curveRef.current;
    if (!root || !world || !curve) return;

    reducedRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const measure = () => {
      sizeRef.current = { w: root.clientWidth, h: root.clientHeight };
    };
    measure();

    const wrapTargets = () => {
      const { w, h } = sizeRef.current;
      pan.current.x = wrapCentered(pan.current.x, w);
      pan.current.y = wrapCentered(pan.current.y, h);
      pan.current.tx = pan.current.x + wrapCentered(pan.current.tx - pan.current.x, w);
      pan.current.ty = pan.current.y + wrapCentered(pan.current.ty - pan.current.y, h);
    };

    const apply = () => {
      world.style.transform = `translate3d(${pan.current.x}px, ${pan.current.y}px, 0)`;
    };

    const applyTilt = () => {
      if (reducedRef.current) {
        curve.style.transform = "";
        return;
      }
      const rx = tilt.current.y * TILT_MAX;
      const ry = -tilt.current.x * TILT_MAX;
      curve.style.transform = `perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    };

    const resetTilt = () => {
      tilt.current.x = 0;
      tilt.current.y = 0;
      tilt.current.tx = 0;
      tilt.current.ty = 0;
      curve.style.transform = "";
    };

    const setTiltTarget = (clientX: number, clientY: number) => {
      const rect = root.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((clientY - rect.top) / rect.height) * 2 - 1;
      tilt.current.tx = Math.max(-1, Math.min(1, nx));
      tilt.current.ty = Math.max(-1, Math.min(1, ny));
    };

    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.04);
      last = now;
      if (document.hidden) return;

      if (!dragging.current && !reducedRef.current) {
        pan.current.tx += pan.current.vx * dt;
        pan.current.ty += pan.current.vy * dt;
        const decay = FRICTION ** (dt * 60);
        pan.current.vx *= decay;
        pan.current.vy *= decay;
        if (Math.hypot(pan.current.vx, pan.current.vy) < MIN_VELOCITY) {
          pan.current.vx = 0;
          pan.current.vy = 0;
        }
        pan.current.x = damp(pan.current.x, pan.current.tx, LERP, dt);
        pan.current.y = damp(pan.current.y, pan.current.ty, LERP, dt);
      } else if (!dragging.current) {
        pan.current.x = pan.current.tx;
        pan.current.y = pan.current.ty;
        pan.current.vx = 0;
        pan.current.vy = 0;
      }

      if (!reducedRef.current) {
        tilt.current.x = damp(tilt.current.x, tilt.current.tx, TILT_LERP, dt);
        tilt.current.y = damp(tilt.current.y, tilt.current.ty, TILT_LERP, dt);
      } else {
        tilt.current.x = 0;
        tilt.current.y = 0;
        tilt.current.tx = 0;
        tilt.current.ty = 0;
      }

      wrapTargets();
      apply();
      applyTilt();
    };

    const pushSample = (x: number, y: number, t: number) => {
      const list = samples.current;
      list.push({ x, y, t });
      while (list.length > 1 && t - list[0].t > SAMPLE_MS) {
        list.shift();
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!interactiveRef.current) return;
      if (event.button !== 0) return;
      dragging.current = true;
      pan.current.vx = 0;
      pan.current.vy = 0;
      pan.current.tx = pan.current.x;
      pan.current.ty = pan.current.y;
      samples.current = [{ x: event.clientX, y: event.clientY, t: performance.now() }];
      root.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "mouse") {
        setTiltTarget(event.clientX, event.clientY);
      }
      if (!dragging.current) return;
      const list = samples.current;
      const prev = list[list.length - 1];
      if (!prev) return;
      const dx = event.clientX - prev.x;
      const dy = event.clientY - prev.y;
      pan.current.x += dx;
      pan.current.y += dy;
      pan.current.tx = pan.current.x;
      pan.current.ty = pan.current.y;
      pushSample(event.clientX, event.clientY, performance.now());
      wrapTargets();
      apply();
    };

    const onPointerLeave = () => {
      if (dragging.current) return;
      tilt.current.tx = 0;
      tilt.current.ty = 0;
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!dragging.current) return;
      dragging.current = false;
      if (root.hasPointerCapture(event.pointerId)) {
        root.releasePointerCapture(event.pointerId);
      }
      const bounds = root.getBoundingClientRect();
      const inside =
        event.clientX >= bounds.left &&
        event.clientX <= bounds.right &&
        event.clientY >= bounds.top &&
        event.clientY <= bounds.bottom;
      if (!inside) {
        tilt.current.tx = 0;
        tilt.current.ty = 0;
      }
      const list = samples.current;
      const first = list[0];
      const lastSample = list[list.length - 1];
      if (!first || !lastSample) return;
      const dist = Math.hypot(lastSample.x - first.x, lastSample.y - first.y);
      if (dist < CLICK_DIST) {
        pan.current.vx = 0;
        pan.current.vy = 0;
        const hit = document
          .elementFromPoint(lastSample.x, lastSample.y)
          ?.closest("[data-study-id]");
        const id = hit?.getAttribute("data-study-id");
        const study = CASE_STUDIES.find((item) => item.id === id);
        if (study) openStudyRef.current(study, readOrigin(hit));
        return;
      }
      if (reducedRef.current) {
        pan.current.vx = 0;
        pan.current.vy = 0;
        return;
      }
      const elapsed = Math.max((lastSample.t - first.t) / 1000, 0.016);
      pan.current.vx = (lastSample.x - first.x) / elapsed;
      pan.current.vy = (lastSample.y - first.y) / elapsed;
      if (Math.hypot(pan.current.vx, pan.current.vy) < MIN_VELOCITY) {
        pan.current.vx = 0;
        pan.current.vy = 0;
      }
    };

    const onWheel = (event: WheelEvent) => {
      if (!interactiveRef.current) return;
      event.preventDefault();
      if (event.ctrlKey) return;
      const { dx, dy } = wheelDelta(event, sizeRef.current);
      pan.current.vx = 0;
      pan.current.vy = 0;
      pan.current.tx -= dx;
      pan.current.ty -= dy;
      if (reducedRef.current) {
        pan.current.x = pan.current.tx;
        pan.current.y = pan.current.ty;
        wrapTargets();
        apply();
      }
    };

    frame = requestAnimationFrame(tick);
    window.addEventListener("resize", measure);
    root.addEventListener("pointerdown", onPointerDown);
    root.addEventListener("pointermove", onPointerMove);
    root.addEventListener("pointerup", onPointerUp);
    root.addEventListener("pointercancel", onPointerUp);
    root.addEventListener("lostpointercapture", onPointerUp);
    root.addEventListener("pointerleave", onPointerLeave);
    root.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(frame);
      resetTilt();
      window.removeEventListener("resize", measure);
      root.removeEventListener("pointerdown", onPointerDown);
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerup", onPointerUp);
      root.removeEventListener("pointercancel", onPointerUp);
      root.removeEventListener("lostpointercapture", onPointerUp);
      root.removeEventListener("pointerleave", onPointerLeave);
      root.removeEventListener("wheel", onWheel);
    };
  }, [panning, WAVE_STAGGER]);

  return (
    <section
      ref={rootRef}
      id="work"
      className={`relative h-dvh max-h-dvh overflow-hidden overscroll-none select-none ${
        view === "grid"
          ? "cursor-grab touch-none active:cursor-grabbing"
          : "cursor-default"
      }`}
      style={{
        background: selected?.color ?? "#ffffff",
      }}
      aria-label="Case studies"
    >
      {barrelMap ? (
        <svg
          className="absolute h-0 w-0"
          aria-hidden="true"
          focusable="false"
        >
          <filter
            id="case-studies-curve"
            x="-25%"
            y="-25%"
            width="150%"
            height="150%"
            colorInterpolationFilters="sRGB"
          >
            <feImage
              href={barrelMap}
              xlinkHref={barrelMap}
              x="0"
              y="0"
              width="100%"
              height="100%"
              preserveAspectRatio="none"
              result="map"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              scale={curveScale}
              xChannelSelector="R"
              yChannelSelector="G"
              edgeMode="duplicate"
            />
          </filter>
        </svg>
      ) : null}

      <div
        ref={curveRef}
        className="absolute inset-0 will-change-transform"
        style={{ transformOrigin: "center center" }}
      >
        <div
          className="absolute"
          style={{
            inset: `-${CURVE_PAD}%`,
            filter: barrelMap ? "url(#case-studies-curve)" : undefined,
          }}
        >
        <div
          ref={worldRef}
          className={`case-world absolute will-change-transform${
            view !== "grid" ? " is-flooding" : ""
          }${
            view === "lining" || view === "detail" ? " is-lining" : ""
          }`}
          style={{
            left: `${(CURVE_PAD / (100 + CURVE_PAD * 2)) * 100}%`,
            top: `${(CURVE_PAD / (100 + CURVE_PAD * 2)) * 100}%`,
            width: `${(100 / (100 + CURVE_PAD * 2)) * 100}%`,
            height: `${(100 / (100 + CURVE_PAD * 2)) * 100}%`,
          }}
        >
            {COPIES.map((copyY) =>
              COPIES.map((copyX) =>
                CASE_STUDIES.map((study, index) => {
                  const col = index % GRID_COLS;
                  const row = Math.floor(index / GRID_COLS);
                  const cardKey = `${copyX}:${copyY}:${study.id}`;
                  const dist = origin
                    ? cellDistance(origin, { copyX, copyY, col, row })
                    : 0;
                  const waveDelay =
                    origin && selected && view !== "grid"
                      ? `${dist * WAVE_STAGGER}s`
                      : "0s";
                  return (
                    <button
                      key={cardKey}
                      type="button"
                      data-study-id={study.id}
                      data-copy-x={copyX}
                      data-copy-y={copyY}
                      data-col={col}
                      data-row={row}
                      aria-label={`${study.title}, ${study.category} ${study.year}`}
                      className="case-card absolute origin-center overflow-hidden"
                      style={{
                        left: `${(col / GRID_COLS + copyX) * 100}%`,
                        top: `${(row / GRID_ROWS + copyY) * 100}%`,
                        width: `${100 / GRID_COLS}%`,
                        height: `${100 / GRID_ROWS}%`,
                        background: selected?.color ?? study.color,
                        color: selected?.ink ?? study.ink,
                        zIndex: layers[cardKey] ?? 0,
                        transitionDelay: waveDelay,
                      }}
                      onPointerEnter={() => {
                        if (viewRef.current !== "grid") return;
                        layerRef.current += 1;
                        setLayers((current) => ({
                          ...current,
                          [cardKey]: layerRef.current,
                        }));
                        setHover(study);
                      }}
                      onPointerLeave={() =>
                        setHover((current) =>
                          current?.id === study.id ? null : current,
                        )
                      }
                    />
                  );
                }),
              ),
            )}
        </div>

        {selected ? (
          <div
            className="absolute z-30"
            style={{
              left: `${(CURVE_PAD / (100 + CURVE_PAD * 2)) * 100}%`,
              top: `${(CURVE_PAD / (100 + CURVE_PAD * 2)) * 100}%`,
              width: `${(100 / (100 + CURVE_PAD * 2)) * 100}%`,
              height: `${(100 / (100 + CURVE_PAD * 2)) * 100}%`,
              pointerEvents: view === "detail" ? "auto" : "none",
            }}
          >
            <article
              className="case-study-ui absolute inset-0 overflow-y-auto overscroll-contain bg-transparent transition-opacity duration-500 ease-out"
              style={{
                color: selected.ink,
                opacity: view === "closing" && !showContent ? 0 : 1,
              }}
              aria-hidden={view !== "detail"}
            >
              <StudyCopy study={selected} />
            </article>
            {view === "flood" || view === "flatten" || view === "lining" ? (
              <div className="pointer-events-none absolute inset-0 z-10">
                {COPIES.map((copyY) =>
                  COPIES.map((copyX) =>
                    CASE_STUDIES.map((study, index) => {
                      const col = index % GRID_COLS;
                      const row = Math.floor(index / GRID_COLS);
                      if (
                        !cellOnScreen(
                          copyX,
                          copyY,
                          col,
                          row,
                          revealLayout,
                        )
                      ) {
                        return null;
                      }
                      const dist = origin
                        ? cellDistance(origin, { copyX, copyY, col, row })
                        : 0;
                      return (
                        <div
                          key={`${copyX}:${copyY}:${study.id}`}
                          className="case-shutter"
                          style={{
                            left: `calc(${(col / GRID_COLS + copyX) * 100}% + ${revealLayout.x}px)`,
                            top: `calc(${(row / GRID_ROWS + copyY) * 100}% + ${revealLayout.y}px)`,
                            width: `${100 / GRID_COLS}%`,
                            height: `${100 / GRID_ROWS}%`,
                            background: study.color,
                            opacity: showContent ? 0 : 1,
                            transition: `opacity ${COLOR_DURATION}s ease`,
                            transitionDelay: origin
                              ? `${dist * WAVE_STAGGER}s`
                              : "0s",
                          }}
                        />
                      );
                    }),
                  ),
                )}
              </div>
            ) : null}
          </div>
        ) : null}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-[var(--page-px)] pb-8 md:pb-10">
        <p
          className={`text-sm tracking-tight text-white mix-blend-difference transition-opacity md:text-base ${
            view === "grid" && hover ? "opacity-100" : "opacity-0"
          }`}
        >
          {hover?.title}
        </p>
        <p
          className={`mt-1 text-xs tracking-wide text-white/70 mix-blend-difference transition-opacity md:text-sm ${
            view === "grid" && hover ? "opacity-100" : "opacity-0"
          }`}
        >
          {hover?.category}
          {hover ? <span className="mx-2 opacity-40">/</span> : null}
          {hover?.year}
        </p>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

type Point = { x: number; y: number };
export type ThreadGap = { top: number; bottom: number };
export type ThreadGeometry = {
  width: number;
  height: number;
  d: string;
  knots: Point[];
  gaps: ThreadGap[];
};

/** The pen sits this far down the viewport; the thread is drawn down to it. */
const PEN_LINE = 0.64;
/**
 * The letter is written as soon as its top rises to this line, so the pen
 * speeds up over the last `CATCH_UP` of the viewport to meet it there.
 */
const LETTER_LINE = 0.74;
const CATCH_UP = 0.25;
const SAMPLE_PX = 6;
/** The whole letter is written in this long once the thread reaches it, plus a lift of the pen between strokes. */
const WRITE_MS = 1700;
const LIFT_MS = 120;

/** Vertical handles make the thread hang and swing between its anchors instead of cutting across. */
function threadPath(points: Point[]) {
  if (!points.length) return "";
  let d = `M${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1];
    const to = points[index];
    const reach = (to.y - from.y) * 0.55;
    d += ` C${from.x.toFixed(1)} ${(from.y + reach).toFixed(1)} ${to.x.toFixed(1)} ${(to.y - reach).toFixed(1)} ${to.x.toFixed(1)} ${to.y.toFixed(1)}`;
  }
  return d;
}

function centreWithin(element: Element, box: DOMRect): Point {
  const rect = element.getBoundingClientRect();
  return { x: rect.left + rect.width / 2 - box.left, y: rect.top + rect.height / 2 - box.top };
}

function sameGeometry(a: ThreadGeometry | null, b: ThreadGeometry) {
  return (
    !!a &&
    a.width === b.width &&
    a.height === b.height &&
    a.d === b.d &&
    JSON.stringify(a.knots) === JSON.stringify(b.knots) &&
    JSON.stringify(a.gaps) === JSON.stringify(b.gaps)
  );
}

/**
 * Threads a path through every `[data-thread-anchor]` in the container, in
 * document order, and draws it down to the pen line as the page scrolls.
 * Anchors the pen has passed get `is-reached`, as do `[data-thread-mark]`
 * elements, which react to the pen without bending the path.
 *
 * An anchor with `data-thread-knot` ties a bead onto the thread. Between an
 * anchor marked `data-thread-hide="start"` and the next `data-thread-hide="end"`
 * the thread runs behind the page and is not drawn.
 *
 * Once the pen reaches `[data-thread-letter-host]` it gets `is-written`, and
 * its `[data-thread-letter]` pen paths are written out one after another,
 * timed by `--write-time` and `--write-delay`.
 */
export function useRedThread(containerRef: RefObject<HTMLElement | null>) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [geometry, setGeometry] = useState<ThreadGeometry | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    let frame = 0;
    const measure = () => {
      frame = 0;
      const box = container.getBoundingClientRect();
      const anchors = [...container.querySelectorAll<HTMLElement>("[data-thread-anchor]")];
      const points = anchors.map((anchor) => centreWithin(anchor, box));
      const knots = anchors
        .map((anchor, index) => ("threadKnot" in anchor.dataset ? points[index] : null))
        .filter((point): point is Point => point !== null);
      const gaps: ThreadGap[] = [];
      let open: number | null = null;
      anchors.forEach((anchor, index) => {
        if (anchor.dataset.threadHide === "start") open = points[index].y;
        if (anchor.dataset.threadHide === "end" && open !== null) {
          gaps.push({ top: open, bottom: points[index].y });
          open = null;
        }
      });
      const next = { width: box.width, height: box.height, d: threadPath(points), knots, gaps };
      setGeometry((previous) => (sameGeometry(previous, next) ? previous : next));
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };

    measure();
    const observer = new ResizeObserver(schedule);
    observer.observe(container);
    // Entrance animations move anchors without resizing anything.
    container.addEventListener("animationend", schedule);
    document.fonts?.ready.then(schedule);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      container.removeEventListener("animationend", schedule);
    };
  }, [containerRef]);

  useEffect(() => {
    const container = containerRef.current;
    const svg = svgRef.current;
    if (!geometry?.d || !container || !svg) return undefined;

    const lines = [...svg.querySelectorAll<SVGPathElement>("[data-thread-line]")];
    const bead = svg.querySelector<SVGCircleElement>("[data-thread-bead]");
    const main = lines[0];
    if (!main) return undefined;

    const total = main.getTotalLength();
    const count = Math.max(1, Math.ceil(total / SAMPLE_PX));
    const lengths = new Float32Array(count + 1);
    const lowest = new Float32Array(count + 1);
    const xs = new Float32Array(count + 1);
    const ys = new Float32Array(count + 1);
    let deepest = -Infinity;
    for (let index = 0; index <= count; index += 1) {
      const length = Math.min(total, index * SAMPLE_PX);
      const point = main.getPointAtLength(length);
      deepest = Math.max(deepest, point.y);
      lengths[index] = length;
      lowest[index] = deepest;
      xs[index] = point.x;
      ys[index] = point.y;
    }
    for (const line of lines) line.style.strokeDasharray = `${total} ${total}`;

    const box = container.getBoundingClientRect();
    const anchors = [
      ...container.querySelectorAll<HTMLElement>("[data-thread-anchor], [data-thread-mark]"),
    ].map((element) => ({ element, y: centreWithin(element, box).y }));

    const letterHost = container.querySelector<HTMLElement>("[data-thread-letter-host]");
    const letterStrokes = [...container.querySelectorAll<SVGPathElement>("[data-thread-letter]")];
    const strokeLengths = letterStrokes.map((stroke) => stroke.getTotalLength());
    const letterTotal = strokeLengths.reduce((sum, length) => sum + length, 0);
    let written = 0;
    letterStrokes.forEach((stroke, index) => {
      const share = strokeLengths[index] / (letterTotal || 1);
      stroke.style.setProperty("--write-time", `${Math.round(share * WRITE_MS)}ms`);
      stroke.style.setProperty(
        "--write-delay",
        `${Math.round(written * WRITE_MS + index * LIFT_MS)}ms`,
      );
      written += share;
    });

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = container.getBoundingClientRect();
      const viewport = window.innerHeight;
      const letterTop = letterHost?.getBoundingClientRect().top ?? Infinity;
      const catchUp = Math.min(
        1,
        Math.max(0, (viewport * (LETTER_LINE + CATCH_UP) - letterTop) / (viewport * CATCH_UP)),
      );
      const penLine = viewport * (PEN_LINE + (LETTER_LINE - PEN_LINE) * catchUp);
      const pen = reduced ? Infinity : penLine - rect.top;

      let low = 0;
      let high = count;
      while (low < high) {
        const mid = (low + high + 1) >> 1;
        if (lowest[mid] <= pen) low = mid;
        else high = mid - 1;
      }
      const drawn = pen < lowest[0] ? 0 : lengths[low];
      for (const line of lines) line.style.strokeDashoffset = `${total - drawn}`;

      if (bead) {
        bead.setAttribute("cx", `${xs[low]}`);
        bead.setAttribute("cy", `${ys[low]}`);
        bead.style.opacity = drawn > 0 && drawn < total - 1 ? "1" : "0";
      }

      for (const anchor of anchors) {
        anchor.element.classList.toggle("is-reached", pen >= anchor.y);
      }

      letterHost?.classList.toggle("is-written", pen >= letterTop - rect.top - 1);
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    container.dataset.thread = "live";
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [containerRef, geometry]);

  return { svgRef, geometry };
}

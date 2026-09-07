"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Locale } from "@rad/types";
import { POLAROID_TILTS } from "@/components/home/const";
import type { PolaroidFrame } from "@/components/home/type";
import { useLocale } from "@/components/i18n";
import { usePolaroidSwap } from "./hooks";
import "./polaroid-swap.css";

const code39Patterns: Readonly<Record<string, string>> = {
  "0": "nnnwwnwnn", "1": "wnnwnnnnw", "3": "wnwwnnnnn", "4": "nnnwwnnnw",
  "5": "wnnwwnnnn", "6": "nnwwwnnnn", "8": "wnnwnnwnn", "9": "nnwwnnwnn",
  A: "wnnnnwnnw", D: "nnnnwwnnw", R: "wnnnnnwwn", "-": "nwnnnnwnw",
  "*": "nwnnwnwnn",
};

function code39Segments(value: string) {
  return `*${value}*`.split("").flatMap((character, characterIndex, characters) => {
    const pattern = code39Patterns[character];
    if (!pattern) return [];
    const segments = pattern.split("").map((width, index) => ({
      bar: index % 2 === 0,
      key: `${characterIndex}-${index}`,
      width: width === "w" ? 3 : 1,
    }));
    return characterIndex < characters.length - 1
      ? [...segments, { bar: false, key: `${characterIndex}-gap`, width: 1 }]
      : segments;
  });
}

function conceptFrames(locale: Locale): PolaroidFrame[] {
  const isFa = locale === "fa";

  return [
    {
      href: "/studio",
      src: "/home/polaroid/alabaster-walnut-lamp.png",
      alt: isFa
        ? "چراغ سنگی دست‌تراش با پایه چوب گردو"
        : "Hand-carved alabaster lamp with a walnut base",
      caption: isFa ? "چراغ سنگ و گردو" : "Alabaster & walnut lamp",
      material: isFa ? "سنگ مرمر · چوب گردو" : "Alabaster · walnut",
      archiveNumber: "041",
      barcode: "RAD-1405-041",
      note: isFa ? "نور از دل سنگ رد می‌شود." : "Light passes through the stone.",
      tone: "stone",
    },
    {
      href: "/studio",
      src: "/home/polaroid/topographic-wall-textile.png",
      alt: isFa
        ? "بافته دیواری دست‌باف با نقش توپوگرافیک"
        : "Handwoven wall textile with a topographic composition",
      caption: isFa ? "بافته توپوگرافیک" : "Topographic textile",
      material: isFa ? "پشم دست‌باف" : "Handwoven wool",
      archiveNumber: "086",
      barcode: "RAD-1405-086",
      note: isFa ? "رد کوه، میان تار و پود." : "A mountain trace, held in the weave.",
      tone: "textile",
    },
    {
      href: "/studio",
      src: "/home/polaroid/blackened-brass-incense.png",
      alt: isFa
        ? "عودسوز مجسمه‌گون از برنج سیاه‌کاری‌شده"
        : "Sculptural incense holder in blackened brass",
      caption: isFa ? "عودسوز برنجی هلال" : "Crescent brass incense holder",
      material: isFa ? "برنج سیاه‌کاری‌شده" : "Blackened brass",
      archiveNumber: "113",
      barcode: "RAD-1405-113",
      note: isFa ? "دود، شکل ناپیدای اثر است." : "Smoke is the work’s unseen form.",
      tone: "metal",
    },
  ];
}

export function PolaroidSwap() {
  const { locale, href, t } = useLocale();
  const frames = conceptFrames(locale);
  const stackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(true);
  const { front, leaving } = usePolaroidSwap(frames.length, paused || !inView);

  useEffect(() => {
    const stack = stackRef.current;
    if (!stack || typeof IntersectionObserver === "undefined") return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.2 },
    );
    observer.observe(stack);
    return () => observer.disconnect();
  }, []);

  if (!frames.length) return null;

  return (
    <div
      ref={stackRef}
      className="polaroid-swap"
      dir={locale === "fa" ? "rtl" : "ltr"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      {frames.map((frame, index) => {
        const depth = (index - front + frames.length) % frames.length;
        const tilt = POLAROID_TILTS[index % POLAROID_TILTS.length];
        const isFront = depth === 0;
        const isLeaving = leaving === index;

        return (
          <Link
            key={frame.src}
            href={href(frame.href)}
            className={`polaroid${isLeaving ? " polaroid--leave" : ""}`}
            data-tone={frame.tone}
            data-front={isFront ? "true" : "false"}
            style={{
              zIndex: isLeaving ? frames.length + 2 : frames.length - depth,
              ["--polaroid-tilt" as string]: `${tilt}deg`,
              ["--polaroid-x" as string]: `${depth * -5}px`,
              ["--polaroid-y" as string]: `${depth * 11}px`,
              ["--polaroid-scale" as string]: 1 - depth * 0.018,
            }}
            aria-current={isFront ? "true" : undefined}
            aria-label={frame.caption}
          >
            <span className="polaroid-sheet">
              <span className="polaroid-face polaroid-face--front">
                <span className="polaroid-pin" aria-hidden="true" />
                <span className="polaroid-window">
                  <img src={frame.src} alt={frame.alt} />
                  <span className="hero-identifier" aria-hidden="true">
                    <span>RĀD / {frame.archiveNumber}</span>
                    <span>{t("tehranSlashYear")}</span>
                  </span>
                </span>
                <span className="polaroid-caption">
                  <b>{t("editionMark")}</b>
                  <span>{frame.caption}</span>
                  <small>{frame.material}</small>
                </span>
              </span>
              <span className="polaroid-face polaroid-face--back" aria-hidden="true">
                <span className="polaroid-back-index">RĀD / {frame.archiveNumber}</span>
                <em>{frame.note}</em>
                <span className="polaroid-barcode">
                  <span className="polaroid-bars">
                    {code39Segments(frame.barcode).map((segment) => (
                      <i
                        key={`${frame.barcode}-${segment.key}`}
                        style={{
                          flex: `${segment.width} 1 0`,
                          opacity: segment.bar ? 1 : 0,
                        }}
                      />
                    ))}
                  </span>
                  <code>{frame.barcode}</code>
                </span>
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}

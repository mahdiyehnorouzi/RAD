"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/components/i18n";
import { ORDER_SAMPLES, orderCopy } from "../const";
import { StudioIcon } from "../studio-icon";
import styles from "./order-samples.module.css";
import order from "./custom-order.module.css";

export function OrderSamples() {
  const { locale, href } = useLocale();
  const c = orderCopy[locale];
  const rtl = locale === "fa";
  const trackRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const box = track.getBoundingClientRect();
    const edge = rtl ? box.right : box.left;
    let nearest = 0;
    let distance = Infinity;
    Array.from(track.children).forEach((child, index) => {
      const rect = child.getBoundingClientRect();
      const gap = Math.abs((rtl ? rect.right : rect.left) - edge);
      if (gap < distance) {
        distance = gap;
        nearest = index;
      }
    });
    setActive(nearest);
    setAtStart(Math.abs(track.scrollLeft) < 2);
    setAtEnd(
      Math.abs(track.scrollLeft) + track.clientWidth >= track.scrollWidth - 2,
    );
  }, [rtl]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    // Some engines restore a mid-scroll position for RTL overflow containers on mount; force the true start.
    track.scrollLeft = 0;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [measure]);

  const goTo = (index: number) => {
    const track = trackRef.current;
    const clamped = Math.max(0, Math.min(index, ORDER_SAMPLES.length - 1));
    const item = track?.children[clamped];
    if (!track || !item) return;
    const box = track.getBoundingClientRect();
    const rect = item.getBoundingClientRect();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollBy({
      left: rtl ? rect.right - box.right : rect.left - box.left,
      behavior: reduce ? "auto" : "smooth",
    });
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const left = event.key === "ArrowLeft";
    const right = event.key === "ArrowRight";
    if (!left && !right) return;
    event.preventDefault();
    const forward = rtl ? left : right;
    goTo(active + (forward ? 1 : -1));
  };

  return (
    <section
      id="samples"
      className={`${order.csSection} ${styles.csSamples}`}
      aria-labelledby="custom-order-samples"
    >
      <header className={`${order.csHead} ${styles.csSamplesHead}`}>
        <div>
          <h2 id="custom-order-samples">{c.samplesTitle}</h2>
          <p>{c.samplesLede}</p>
        </div>
        <Link href={href("/differences")} className={styles.csSamplesAll}>
          {c.samplesViewAll}
        </Link>
      </header>

      <div
        className={styles.csSamplesViewport}
        role="region"
        aria-roledescription={rtl ? "اسلایدر" : "carousel"}
        aria-label={c.samplesTitle}
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        <ul ref={trackRef} className={styles.csSamplesTrack} onScroll={measure}>
          {ORDER_SAMPLES.map((sample) => (
            <li key={sample.id} className={styles.csSamplesSlide}>
              <span className={styles.csSamplesArt}>
                <Image
                  src={sample.image.src}
                  alt={sample.alt[locale]}
                  width={sample.image.width}
                  height={sample.image.height}
                  sizes="(min-width: 960px) 24rem, 72vw"
                  loading="lazy"
                />
              </span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className={`${styles.csSamplesArrow} ${styles.isPrev}`}
          onClick={() => goTo(active - 1)}
          disabled={atStart}
          aria-label={c.samplesPrev}
        >
          <StudioIcon name={rtl ? "chevron_right" : "chevron_left"} size={20} />
        </button>
        <button
          type="button"
          className={`${styles.csSamplesArrow} ${styles.isNext}`}
          onClick={() => goTo(active + 1)}
          disabled={atEnd}
          aria-label={c.samplesNext}
        >
          <StudioIcon name={rtl ? "chevron_left" : "chevron_right"} size={20} />
        </button>
      </div>

      <div className={styles.csSamplesDots}>
        {ORDER_SAMPLES.map((sample, index) => (
          <button
            key={sample.id}
            type="button"
            aria-label={`${c.samplesGoTo} ${index + 1}`}
            aria-current={index === active ? "true" : undefined}
            onClick={() => goTo(index)}
          />
        ))}
      </div>
    </section>
  );
}

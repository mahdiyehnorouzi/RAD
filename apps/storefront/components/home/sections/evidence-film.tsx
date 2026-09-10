"use client";

import { useEffect, useRef } from "react";
import { useLocale } from "@/components/i18n";
import { useInView } from "../hooks";
import "./evidence-film.css";

export function EvidenceFilm() {
  const { t } = useLocale();
  const { ref, inView } = useInView<HTMLElement>({ once: true, threshold: 0.22 });
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const section = ref.current;
    if (!video || !section) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void video.play().catch(() => undefined);
        } else {
          video.pause();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, [ref]);

  return (
    <section
      ref={ref}
      className={`evidence-film${inView ? " is-active" : ""}`}
      aria-labelledby="evidence-title"
    >
      <video
        ref={videoRef}
        className="studio-film"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/studio-process.jpg"
        disablePictureInPicture
        aria-label={t("evidenceFilmAlt")}
      >
        <source src="/studio-process.mp4" type="video/mp4" />
      </video>
      <div className="evidence-overlay">
        <h2 id="evidence-title">{t("evidenceTitle")}</h2>
        <p>{t("evidenceBody")}</p>
        <small>{t("evidenceMeta")}</small>
      </div>
    </section>
  );
}

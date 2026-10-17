"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useTransform } from "motion/react";
import { useLocale } from "@/components/i18n";
import { ButtonLink } from "@/components/ui/button-link";
import { journeyCopy, journeyMedia } from "./const";
import { useVerticalStepper } from "./hooks";
import styles from "./journey-custom.module.css";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * Custom order: one full-bleed scene photo (torn paper baked in, a blank
 * panel on the physical left for the pitch, a thin blank strip on the
 * physical right for the stepper) with real HTML text, CTA and stepper laid
 * over it. The first step stays the thread's anchor so the page-wide thread
 * still finds it.
 */
export function JourneyCustom() {
  const { locale, t, number } = useLocale();
  const copy = journeyCopy[locale];
  const reduceMotion = useReducedMotion();

  const { containerRef, markerRefs, progress, active, track } =
    useVerticalStepper(copy.customSteps.length);

  const fillScale = useTransform(progress, [0, 1], [0, 1]);

  // When the system prefers reduced motion, every entrance prop below is
  // left out entirely (not just given a no-op initial) so content never
  // depends on an IntersectionObserver firing: it renders at its plain CSS
  // state immediately, with nothing for motion to hold back.
  const enter = (delay = 0, duration = 0.5) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 8 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.5 },
          transition: { duration, ease: EASE, delay },
        };

  return (
    <article
      className={styles.journeyCustom}
      aria-labelledby="journey-custom-title"
    >
      <Image
        src={journeyMedia.customScene}
        alt={copy.customPhotoAlt}
        fill
        sizes="(max-width: 899px) 100vw, 76rem"
        className={styles.journeyCustomScene}
      />

      <motion.div
        className={styles.journeyCustomCard}
        {...(reduceMotion
          ? {}
          : {
              initial: { opacity: 0, y: 16 },
              whileInView: { opacity: 1, y: 0 },
              viewport: { once: true, amount: 0.5 },
              transition: { duration: 0.75, ease: EASE },
            })}
      >
        <motion.h2 id="journey-custom-title" {...enter(0.08)}>
          {t("createPathTitle")}
        </motion.h2>
        <motion.p {...enter(0.16)}>
          {copy.customLine.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </motion.p>
        <motion.div {...enter(0.24)}>
          <ButtonLink href="/studio">{t("startDesign")}</ButtonLink>
        </motion.div>
      </motion.div>

      <ol
        ref={containerRef}
        className={styles.journeyCustomSteps}
        aria-label={copy.customStepsLabel}
        style={
          {
            "--track-top": `${track.top}px`,
            "--track-height": `${track.height}px`,
          } as CSSProperties
        }
      >
        <span
          className={styles.journeyCustomThreadAnchor}
          data-thread-anchor
          aria-hidden="true"
        />
        <span
          className={styles.journeyCustomThreadAnchorEnd}
          data-thread-anchor
          aria-hidden="true"
        />
        <motion.span
          aria-hidden="true"
          className={styles.journeyCustomStepsFill}
          style={{ scaleY: fillScale }}
        />
        {copy.customSteps.map((step, index) => {
          const isActive = index <= active;
          const isCurrent = index === active;
          return (
            <li
              key={step}
              className={styles.journeyCustomStep}
              data-active={isActive || undefined}
              data-current={isCurrent || undefined}
            >
              <motion.span
                ref={(element) => {
                  markerRefs.current[index] = element;
                }}
                className={styles.journeyCustomStepNumber}
                aria-hidden="true"
                animate={{ scale: isCurrent ? 1.08 : 1 }}
                transition={{ duration: reduceMotion ? 0 : 0.3, ease: EASE }}
              >
                {number(index + 1)}
              </motion.span>
              <span className={styles.journeyCustomStepLabel}>{step}</span>
              <span
                className={styles.journeyCustomStepMark}
                data-thread-mark
                aria-hidden="true"
              />
            </li>
          );
        })}
      </ol>
    </article>
  );
}

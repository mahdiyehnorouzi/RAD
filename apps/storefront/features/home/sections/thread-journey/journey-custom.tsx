"use client";

import { Fragment, type CSSProperties } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useTransform } from "motion/react";
import { useLocale } from "@/components/i18n";
import { ButtonLink } from "@/components/ui/button-link";
import { journeyCopy, journeyMedia } from "./const";
import { useVerticalStepper } from "./hooks";
import styles from "./journey-custom.module.css";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * Custom order: one scene photo, cropped to a fixed, deliberately taller
 * aspect ratio (not the photo's native one) via a constant CSS aspect-ratio
 * + object-fit: cover - constant so the crop never changes with viewport
 * width, which is what keeps the percentage-positioned overlays below
 * aligned to the photo's own baked panel/stepper strip at every width.
 * Nothing here recreates a paper edge the photo already paints.
 *
 * The stepper's connector is built as real flow elements, not one
 * full-height line behind everything: each step is [circle, label], and a
 * separate flex-grown connector segment sits only in the gap to the next
 * step, so it can never run behind a label. The first step stays the
 * page-wide thread's anchor so that thread still finds it.
 */
export function JourneyCustom() {
  const { locale, t, number } = useLocale();
  const copy = journeyCopy[locale];
  const reduceMotion = useReducedMotion();
  const stepCount = copy.customSteps.length;

  const { containerRef, markerRefs, progress, active, track } =
    useVerticalStepper(stepCount);

  // One connector fill per gap between steps, approximating each step's
  // even share of the scroll range (the hook measures real marker
  // positions for `active`, but doesn't expose per-gap fractions) - still
  // continuously driven by `progress`, so it animates smoothly with scroll
  // in both directions, just not pixel-perfect to uneven spacing. Unrolled
  // (not a loop calling useTransform) to keep every hook call static, at
  // the four steps this stepper always has.
  const gapCount = Math.max(1, stepCount - 1);
  const segmentFills = [
    useTransform(progress, [0 / gapCount, 1 / gapCount], [0, 1], {
      clamp: true,
    }),
    useTransform(progress, [1 / gapCount, 2 / gapCount], [0, 1], {
      clamp: true,
    }),
    useTransform(progress, [2 / gapCount, 3 / gapCount], [0, 1], {
      clamp: true,
    }),
  ];

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
      <div className={styles.journeyCustomFrame}>
        <Image
          src={journeyMedia.customScene}
          alt={copy.customPhotoAlt}
          width={1448}
          height={1086}
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
          {copy.customSteps.map((step, index) => {
            const isActive = index <= active;
            const isCurrent = index === active;
            return (
              <Fragment key={step}>
                <li
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
                    transition={{
                      duration: reduceMotion ? 0 : 0.3,
                      ease: EASE,
                    }}
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
                {index < stepCount - 1 ? (
                  <li
                    className={styles.journeyCustomConnector}
                    aria-hidden="true"
                  >
                    <motion.span
                      className={styles.journeyCustomConnectorFill}
                      style={{ scaleY: segmentFills[index] }}
                    />
                  </li>
                ) : null}
              </Fragment>
            );
          })}
        </ol>
      </div>
    </article>
  );
}

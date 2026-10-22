import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { LivePiece } from "@/components/now/type";
import { getTranslations } from "@/lib/i18n-server";
import { journeyCopy, journeyMedia } from "./const";
import { JourneySpark } from "./journey-spark";
import styles from "./journey-workshop.module.css";

/**
 * Today in the workshop: one scene photo, shown at its own natural aspect
 * ratio (never cropped by object-fit, so its baked-in torn paper and blank
 * panel always land at the same fixed percentages) with real HTML text laid
 * directly over the panel - no CSS paper, border or tear recreates what the
 * photo already paints. The thread just passes through on its way to Ready
 * Works.
 *
 * `piece` only decides the CTA's destination: the live `in_workshop`
 * product's own /now/[code] page when one exists, otherwise the /now
 * journal index. The scene photo itself is the approved static reference
 * image, not the live piece's listing photo - this is a teaser into the
 * workshop, not a claim about which exact piece is on the bench today.
 *
 * A Server Component, not "use client": its only prior client dependency
 * was useLocale() for text/links, which getTranslations() now resolves
 * from the route's own `[locale]` segment (next/root-params) - nothing
 * here is interactive. It's instantiated from page.tsx (a true Server
 * Component) and handed into ThreadJourney as the `workshopSlot` prop,
 * the same composition pattern already used there for `hero`/`works`/
 * `closing`, since a Client Component can't directly render a Server
 * Component in its own body.
 */
export async function JourneyWorkshop({
  piece,
}: {
  piece?: Pick<LivePiece, "code" | "image"> | null;
}) {
  const { locale, t, href } = await getTranslations();
  const copy = journeyCopy[locale];
  const Arrow = locale === "fa" ? ArrowLeft : ArrowRight;
  const linkHref = piece?.code ? href(`/now/${piece.code}`) : href("/now");

  return (
    <article
      className={styles.journeyWorkshop}
      aria-labelledby="journey-workshop-title"
    >
      {/* Mobile/tablet only (<1024px): the baked-panel overlay photo. */}
      <Image
        src={journeyMedia.workshopScene}
        alt=""
        width={1448}
        height={1086}
        sizes="100vw"
        className={styles.journeyWorkshopScene}
      />
      {/* Desktop only (>=1024px): a plain standalone photo, no baked
          panel - the text panel beside it is real HTML. */}
      <Image
        src={journeyMedia.workshopSceneDesktop}
        alt=""
        width={1672}
        height={941}
        sizes="(max-width: 1023px) 0px, 55vw"
        className={styles.journeyWorkshopSceneDesktop}
      />
      <div className={styles.journeyWorkshopSheet}>
        <h2 id="journey-workshop-title">{t("todayWorkshop")}</h2>
        <p>{copy.workshopLine}</p>
        <Link href={linkHref} className={styles.journeyWorkshopLink}>
          {copy.workshopLink}
          <Arrow aria-hidden="true" />
        </Link>
      </div>
      <JourneySpark className={styles.journeyWorkshopSpark} />
      {/* The thread just passes through here on its way to Ready Works - no decorative dot. */}
      <span
        className={styles.journeyWorkshopExit}
        data-thread-anchor
        aria-hidden="true"
      />
    </article>
  );
}

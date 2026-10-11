"use client";

import Link from "next/link";
import type { Artwork } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { useProductStatus } from "@/hooks/use-product-status";
import { ProductMedia } from "@/components/product/listing";
import type { RadPassport } from "@/components/passport/type";
import { productFromArtwork } from "@/lib/artworks";
import {
  catalogLifestylePhotoSrc,
  hasStudioPhotos,
} from "@/lib/catalog/photo-works";
import { formatPassportCode } from "@/lib/passport";
import { StudioIcon, readingChevron } from "../../studio-icon";
import { fill, quizCopy } from "../const";
import styles from "./result-card.module.css";

export function ResultCard({
  passport,
  artwork,
  order,
}: {
  passport: RadPassport;
  artwork: Artwork | undefined;
  order: number;
}) {
  const { locale, number, href } = useLocale();
  const c = quizCopy[locale];
  const target = passport.productSlug
    ? `/products/${passport.productSlug}`
    : `/passport/${passport.code}`;
  const line = artwork?.description[locale];
  const photo = hasStudioPhotos(artwork ?? { images: passport.finalPhotos })
    ? catalogLifestylePhotoSrc(passport.slug)
    : passport.finalPhotos[0]?.src;
  const { badge } = useProductStatus({
    slug: passport.slug,
    status: artwork?.status ?? passport.status,
    reservedUntil: artwork?.reservedUntil,
  });

  return (
    <li
      className={styles.sqCard}
      style={{ "--i": order } as React.CSSProperties}
    >
      <Link href={href(target)}>
        <span className={styles.sqCardCopy}>
          <span className={styles.sqCardCode}>
            {fill(c.code, {
              code: formatPassportCode(passport.code, locale, number),
            })}
          </span>
          <strong className={styles.sqCardName}>{passport.name[locale]}</strong>
          {line ? <span className={styles.sqCardLine}>{line}</span> : null}
          <span className={styles.sqCardGo}>
            {c.view}
            <span className={styles.sqCardArrow} aria-hidden="true">
              <StudioIcon name={readingChevron(locale, "forward")} size={17} />
            </span>
          </span>
        </span>
        <span className={styles.sqCardPhoto}>
          {photo ? (
            <img
              src={photo}
              alt={
                passport.finalPhotos[0]?.note[locale] ?? passport.name[locale]
              }
              loading="lazy"
            />
          ) : artwork ? (
            <span className={styles.sqCardDrawn}>
              <ProductMedia
                product={productFromArtwork(artwork)}
                showStatusBadge={false}
                sizes="(max-width: 960px) 44vw, 253px"
              />
            </span>
          ) : null}
          {badge ? <span className="sold-media-badge">{badge}</span> : null}
        </span>
      </Link>
    </li>
  );
}

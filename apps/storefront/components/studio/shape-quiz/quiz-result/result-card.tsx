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
    <li className="sq-card" style={{ "--i": order } as React.CSSProperties}>
      <Link href={href(target)}>
        <span className="sq-card-copy">
          <span className="sq-card-code">
            {fill(c.code, {
              code: formatPassportCode(passport.code, locale, number),
            })}
          </span>
          <strong className="sq-card-name">{passport.name[locale]}</strong>
          {line ? <span className="sq-card-line">{line}</span> : null}
          <span className="sq-card-go">
            {c.view}
            <span className="sq-card-arrow" aria-hidden="true">
              <StudioIcon name={readingChevron(locale, "forward")} size={17} />
            </span>
          </span>
        </span>
        <span className="sq-card-photo">
          {photo ? (
            <img
              src={photo}
              alt={
                passport.finalPhotos[0]?.note[locale] ?? passport.name[locale]
              }
              loading="lazy"
            />
          ) : artwork ? (
            <span className="sq-card-drawn">
              <ProductMedia
                product={productFromArtwork(artwork)}
                showStatusBadge={false}
              />
            </span>
          ) : null}
          {badge ? <span className="sold-media-badge">{badge}</span> : null}
        </span>
      </Link>
    </li>
  );
}

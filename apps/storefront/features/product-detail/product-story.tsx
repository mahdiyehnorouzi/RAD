"use client";
import type { Artwork, Product } from "@rad/types";
import { useLocale } from "@/components/i18n";
import type { WorkTexture } from "@/lib/catalog/material-texture";
import { productCopy } from "@/lib/catalog/products";
import { formatRadDigits, ProductMedia } from "@/components/product/listing";
import { pdpCopy } from "./const";
import { MaterialTexture } from "./material-texture";
import { PdpSection } from "./pdp-section";
import { WorkStroke } from "./work-stroke";
import styles from "./product-story.module.css";

export function ProductStory({
  product,
  artwork,
  textures,
  index,
}: {
  product: Product;
  artwork?: Artwork;
  textures: WorkTexture[];
  index: number;
}) {
  const { locale, number } = useLocale();
  const c = pdpCopy[locale];
  const story = productCopy(product, locale).story;
  const hasFigure = (product.images?.length ?? 0) > 1;
  const note = artwork?.difference?.artistNotes[0]?.[locale];

  if (!story && !hasFigure) return null;

  return (
    <PdpSection
      id="pdp-story-title"
      title={c.aboutTitle}
      lede={c.aboutLede}
      mark={<WorkStroke textures={textures} index={index} />}
      className={styles.story}
      bodyClassName={styles.storyBody}
    >
      {product.radNumber ? (
        <span className={styles.storyNumber} aria-hidden="true">
          {formatRadDigits(product.radNumber, number, locale)}
        </span>
      ) : null}
      <MaterialTexture
        texture={textures[0]}
        shape="strip"
        className={styles.storyStrip}
      />
      {story ? <p>{story}</p> : null}
      {hasFigure ? (
        <figure className={styles.storyFigure}>
          <ProductMedia
            product={product}
            imageIndex={1}
            showStatusBadge={false}
            sizes="(max-width: 700px) 100vw, (max-width: 1100px) 55vw, 42vw"
          />
        </figure>
      ) : null}
      {note && artwork ? (
        <figure className={styles.storyNote}>
          <blockquote aria-label={c.makerNote}>
            <p>{note}</p>
          </blockquote>
          <figcaption>
            <svg viewBox="0 0 120 16" aria-hidden="true">
              <path d="M2 11c10-7 18-8 24-3s10 6 17 0 14-6 21-1 12 5 20 0 17-6 34-2" />
            </svg>
            {artwork.artist.name[locale]}
          </figcaption>
        </figure>
      ) : null}
    </PdpSection>
  );
}

"use client";
import type { CSSProperties } from "react";
import type { Artwork, Product, WorkMark } from "@rad/types";
import { useLocale } from "@/components/i18n";
import {
  isFileProductImage,
  productPhotoSrc,
} from "@/lib/catalog/category-defaults";
import { catalogPhotoSrc, hasStudioPhotos } from "@/lib/catalog/photo-works";
import { pdpCopy } from "./const";
import type { WorkTexture } from "@/lib/catalog/material-texture";
import { PdpSection } from "./pdp-section";
import { WorkStroke } from "./work-stroke";

/** Marks drawn on one of the work's photos, else the passport's marks on its first. */
function anatomyOf(product: Product, artwork?: Artwork) {
  const images = product.images ?? [];
  const found = images.findIndex((image) => image.marks?.length);
  const index = found >= 0 ? found : 0;
  const marks: WorkMark[] | undefined =
    found >= 0 ? images[found].marks : artwork?.passport?.marks;
  if (!marks?.length) return null;
  const src = hasStudioPhotos(product)
    ? catalogPhotoSrc(product.slug, index)
    : isFileProductImage(images[index]?.src)
      ? productPhotoSrc(images[index].src)
      : null;
  return src ? { src, marks, image: images[index] } : null;
}

export function ProductAnatomy({
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
  const anatomy = anatomyOf(product, artwork);
  if (!anatomy) return null;
  const numeral = (value: number) =>
    locale === "fa" ? number(value) : String(value);

  return (
    <PdpSection
      id="pdp-anatomy-title"
      title={c.anatomyTitle}
      lede={c.anatomyLede}
      mark={<WorkStroke textures={textures} index={index} />}
      className="pdp-anatomy"
    >
      <div className="pdp-anatomy-body">
        <div
          className="pdp-anatomy-plate"
          style={{ "--plate-color": product.color } as CSSProperties}
        >
          <figure className="pdp-anatomy-figure">
            <img
              loading="lazy"
              decoding="async"
              src={anatomy.src}
              alt={
                locale === "fa"
                  ? anatomy.image?.alt || product.name
                  : anatomy.image?.enAlt || product.en.name
              }
            />
            {anatomy.marks.map((mark, index) => (
              <span
                key={`${mark.x}-${mark.y}`}
                className={`pdp-anatomy-mark ${mark.x < 50 ? "is-left" : "is-right"}`}
                style={
                  {
                    "--mark-x": `${mark.x}%`,
                    "--mark-y": `${mark.y}%`,
                  } as CSSProperties
                }
                aria-hidden="true"
              >
                <i className="pdp-anatomy-leader" />
                <b className="pdp-anatomy-dot">{numeral(index + 1)}</b>
                <span className="pdp-anatomy-label">
                  <b>{mark.title[locale]}</b>
                  <span>{mark.note[locale]}</span>
                </span>
              </span>
            ))}
          </figure>
        </div>
        <ol className="pdp-anatomy-list">
          {anatomy.marks.map((mark, index) => (
            <li key={`${mark.x}-${mark.y}`}>
              <i aria-hidden="true">{numeral(index + 1)}</i>
              <b>{mark.title[locale]}</b>
              <span>{mark.note[locale]}</span>
            </li>
          ))}
        </ol>
      </div>
    </PdpSection>
  );
}

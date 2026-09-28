"use client";
import type { Artwork, Locale, Product } from "@rad/types";
import { useLocale } from "@/components/i18n";
import type { RadPassport } from "@/components/passport/type";
import { categoryLabel } from "@/lib/catalog/artwork";
import type { WorkTexture } from "@/lib/catalog/material-texture";
import { productCopy } from "@/lib/catalog/products";
import { formatArtworkNumber } from "../listing";
import { pdpCopy } from "./const";
import { MaterialTexture } from "./material-texture";
import { PdpSection } from "./pdp-section";

type SpecRow = { label: string; value?: string; material?: boolean };

function specRows(
  product: Product,
  artwork: Artwork | undefined,
  passport: RadPassport | undefined,
  locale: Locale,
) {
  const c = pdpCopy[locale];
  const maker = product.vendor
    ? locale === "fa"
      ? product.vendor.displayName
      : product.vendor.displayNameEn
    : c.studio;
  const recorded: SpecRow[] = artwork
    ? [
        {
          label: c.specMaterial,
          value: artwork.materials.body[locale],
          material: true,
        },
        { label: c.specSurface, value: artwork.materials.surface?.[locale] },
        { label: c.specProcess, value: artwork.materials.process?.[locale] },
        { label: c.specSize, value: artwork.dimensions?.[locale] },
      ]
    : productCopy(product, locale)
        .details.slice(0, -1)
        .map((line) => ({ label: c.specDetail, value: line }));
  const rows: SpecRow[] = [
    { label: c.specCategory, value: categoryLabel(product.category, locale) },
    ...recorded,
    { label: c.specMaker, value: maker },
    { label: c.specMade, value: passport?.dateCreated[locale] },
  ];
  return rows.filter((row): row is SpecRow & { value: string } =>
    Boolean(row.value),
  );
}

/** Authored spots name their own materials; otherwise the body line gets one found swatch. */
function MaterialValue({
  value,
  textures,
}: {
  value: string;
  textures: WorkTexture[];
}) {
  const { locale } = useLocale();
  const named = textures.filter((texture) => texture.spot);
  const items: { key: string; texture?: WorkTexture; label: string }[] =
    named.length
      ? named.map((texture) => ({
          key: texture.spot!.material.en,
          texture,
          label: texture.spot!.material[locale],
        }))
      : [{ key: value, texture: textures[0], label: value }];

  return (
    <ul className="pdp-spec-materials">
      {items.map((item) => (
        <li key={item.key}>
          <MaterialTexture texture={item.texture} shape="swatch" />
          <span>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

export function ProductSpecs({
  product,
  artwork,
  passport,
  textures,
}: {
  product: Product;
  artwork?: Artwork;
  passport?: RadPassport;
  textures: WorkTexture[];
}) {
  const { locale, number } = useLocale();
  const c = pdpCopy[locale];
  const rows = specRows(product, artwork, passport, locale);
  const recordNumber = formatArtworkNumber(product, number, locale);

  return (
    <PdpSection
      id="pdp-specs-title"
      title={c.specsTitle}
      desktop="open"
      className="pdp-specs"
    >
      <dl>
        {rows.map((row) => (
          <div key={row.label + row.value}>
            <dt>{row.label}</dt>
            <dd>
              {row.material ? (
                <MaterialValue value={row.value} textures={textures} />
              ) : (
                row.value
              )}
            </dd>
          </div>
        ))}
        {recordNumber ? (
          <div>
            <dt>{c.specEdition}</dt>
            <dd className="pdp-spec-edition">
              <span>{recordNumber}</span>
              <span>{c.oneOfOne}</span>
            </dd>
          </div>
        ) : null}
      </dl>
    </PdpSection>
  );
}

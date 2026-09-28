"use client";
import type { ReactNode } from "react";
import {
  Clock3,
  Hand,
  Layers,
  Paintbrush,
  Ruler,
  ScrollText,
  SquareStack,
} from "lucide-react";
import type { Artwork, Locale, Product } from "@rad/types";
import { RadFingerprint } from "@/components/identity";
import { useLocale } from "@/components/i18n";
import type { RadPassport } from "@/components/passport/type";
import { categoryLabel } from "@/lib/catalog/artwork";
import type { WorkTexture } from "@/lib/catalog/material-texture";
import { productCopy } from "@/lib/catalog/products";
import { formatArtworkNumber } from "../listing";
import { CATEGORY_ICONS, pdpCopy } from "./const";
import { MaterialTexture } from "./material-texture";
import { PdpSection } from "./pdp-section";
import { WorkStroke } from "./work-stroke";

type SpecRow = {
  key: string;
  label: string;
  value?: ReactNode;
  icon: ReactNode;
};

/** Authored spots name the materials seen up close, beneath the body line. */
function NamedMaterials({ textures }: { textures: WorkTexture[] }) {
  const { locale } = useLocale();
  const named = textures.filter((texture) => texture.spot);
  if (named.length < 2) return null;
  return (
    <ul className="pdp-spec-materials">
      {named.map((texture) => (
        <li key={texture.spot!.material.en}>
          <MaterialTexture texture={texture} shape="swatch" />
          <span>{texture.spot!.material[locale]}</span>
        </li>
      ))}
    </ul>
  );
}

function specRows(
  product: Product,
  artwork: Artwork | undefined,
  passport: RadPassport | undefined,
  textures: WorkTexture[],
  locale: Locale,
  recordNumber: string | null,
): SpecRow[] {
  const c = pdpCopy[locale];
  const maker = product.vendor
    ? locale === "fa"
      ? product.vendor.displayName
      : product.vendor.displayNameEn
    : c.studio;
  const Category = CATEGORY_ICONS[product.category];
  const body = artwork?.materials.body[locale];
  const recorded: SpecRow[] = artwork
    ? [
        {
          key: "material",
          label: c.specMaterial,
          value: body ? (
            <>
              {body}
              <NamedMaterials textures={textures} />
            </>
          ) : undefined,
          icon: textures[0] ? (
            <MaterialTexture texture={textures[0]} shape="swatch" />
          ) : (
            <Layers />
          ),
        },
        {
          key: "surface",
          label: c.specSurface,
          value: artwork.materials.surface?.[locale],
          icon: <Paintbrush />,
        },
        {
          key: "process",
          label: c.specProcess,
          value: artwork.materials.process?.[locale],
          icon: <Hand />,
        },
        {
          key: "size",
          label: c.specSize,
          value: artwork.dimensions?.[locale],
          icon: <Ruler />,
        },
      ]
    : productCopy(product, locale)
        .details.slice(0, -1)
        .map((line, index) => ({
          key: `detail-${index}`,
          label: c.specDetail,
          value: line,
          icon: <ScrollText />,
        }));

  return [
    {
      key: "category",
      label: c.specCategory,
      value: categoryLabel(product.category, locale),
      icon: <Category />,
    },
    ...recorded,
    {
      key: "maker",
      label: c.specMaker,
      value: maker,
      icon: product.radNumber ? (
        <RadFingerprint radNumber={product.radNumber} />
      ) : (
        <Hand />
      ),
    },
    {
      key: "made",
      label: c.specMade,
      value: passport?.dateCreated[locale],
      icon: <Clock3 />,
    },
    {
      key: "edition",
      label: c.specEdition,
      value: recordNumber ? (
        <span className="pdp-spec-edition">
          <span>{recordNumber}</span>
          <span>{c.oneOfOne}</span>
        </span>
      ) : undefined,
      icon: <SquareStack />,
    },
  ].filter((row) => Boolean(row.value));
}

export function ProductSpecs({
  product,
  artwork,
  passport,
  textures,
  index,
}: {
  product: Product;
  artwork?: Artwork;
  passport?: RadPassport;
  textures: WorkTexture[];
  index: number;
}) {
  const { locale, number } = useLocale();
  const c = pdpCopy[locale];
  const recordNumber = formatArtworkNumber(product, number, locale);
  const rows = specRows(
    product,
    artwork,
    passport,
    textures,
    locale,
    recordNumber,
  );

  return (
    <PdpSection
      id="pdp-specs-title"
      title={c.specsTitle}
      lede={c.specsLede}
      mark={<WorkStroke textures={textures} index={index} />}
      desktop="open"
      className="pdp-specs"
    >
      <dl>
        {rows.map((row) => (
          <div key={row.key} className={`is-${row.key}`}>
            <span className="pdp-spec-icon" aria-hidden="true">
              {row.icon}
            </span>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </PdpSection>
  );
}

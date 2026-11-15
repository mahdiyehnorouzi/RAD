"use client";
import type { ReactNode } from "react";
import {
  Blend,
  Clock3,
  Droplets,
  Hand,
  Hash,
  Layers,
  MoveVertical,
  Paintbrush,
  Palette,
  Ruler,
  ScrollText,
  SquareStack,
  Weight,
  type LucideIcon,
} from "lucide-react";
import type { Artwork, Locale, Product } from "@rad/types";
import { RadFingerprint } from "@/components/identity";
import { useLocale } from "@/components/i18n";
import type { RadPassport } from "@/components/passport/type";
import { categoryLabel } from "@/lib/catalog/artwork";
import type { WorkTexture } from "@/lib/catalog/material-texture";
import { productCopy } from "@/lib/catalog/products";
import { formatArtworkNumber } from "@/components/product/listing";
import {
  ARTWORK_SPEC_FACT_KEYS,
  editionIdentity,
  isArtworkDescriptionCopy,
} from "./pdp-content";
import {
  SPEC_ATTRIBUTE_ICON_FALLBACKS,
  specAttributeIconName,
} from "./spec-icons";
import { CATEGORY_ICONS, pdpCopy } from "./const";
import { MaterialTexture } from "./material-texture";
import { PdpSection } from "./pdp-section";
import styles from "./product-specs.module.css";

type SpecRow = {
  key: string;
  label: string;
  value?: ReactNode;
  icon: ReactNode;
};

const ATTRIBUTE_ICON: Record<string, LucideIcon> = {
  Palette,
  Hand,
  Clock3,
  Hash,
  MoveVertical,
  Weight,
  Droplets,
  ScrollText,
  Blend,
  SquareStack,
};

function attributeIcon(name: string) {
  const Icon = ATTRIBUTE_ICON[name] ?? ScrollText;
  return <Icon />;
}

/** Authored spots name the materials seen up close, beneath the body line. */
function NamedMaterials({ textures }: { textures: WorkTexture[] }) {
  const { locale } = useLocale();
  const named = textures.filter((texture) => texture.spot);
  if (named.length < 2) return null;
  return (
    <ul className={styles.specMaterials}>
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
  const copy = productCopy(product, locale);
  const described = (value: string | null | undefined) =>
    isArtworkDescriptionCopy(value, copy.subtitle, copy.story);
  const maker = product.vendor
    ? locale === "fa"
      ? product.vendor.displayName
      : product.vendor.displayNameEn
    : c.studio;
  const Category = CATEGORY_ICONS[product.category];
  const body = artwork?.materials.body[locale];
  const materialProse = body && !described(body) ? body : undefined;
  const namedSpots = textures.filter((texture) => texture.spot).length >= 2;
  const artworkFact = (
    key: (typeof ARTWORK_SPEC_FACT_KEYS)[number],
  ): SpecRow => {
    if (key === "material") {
      return {
        key,
        label: c.specMaterial,
        value:
          materialProse || namedSpots ? (
            <>
              {materialProse}
              <NamedMaterials textures={textures} />
            </>
          ) : undefined,
        icon: textures[0] ? (
          <MaterialTexture texture={textures[0]} shape="swatch" />
        ) : (
          <Blend />
        ),
      };
    }
    if (key === "surface") {
      const surface = artwork?.materials.surface?.[locale];
      return {
        key,
        label: c.specSurface,
        value: surface && !described(surface) ? surface : undefined,
        icon: <Paintbrush />,
      };
    }
    return {
      key,
      label: c.specSize,
      value: artwork?.dimensions?.[locale],
      icon: <Ruler />,
    };
  };
  const recorded: SpecRow[] = artwork
    ? ARTWORK_SPEC_FACT_KEYS.map(artworkFact)
    : copy.details
        .slice(0, -1)
        .filter((line) => !described(line))
        .map((line, index) => ({
          key: `detail-${index}`,
          label: c.specDetail,
          value: line,
          icon: attributeIcon(
            SPEC_ATTRIBUTE_ICON_FALLBACKS[
              index % SPEC_ATTRIBUTE_ICON_FALLBACKS.length
            ],
          ),
        }));

  // Admin-defined specs (رنگ، جنس، ابعاد، …) for this product's category,
  // already formatted for display by the API; hidden when empty so
  // products saved before this feature existed render unchanged.
  const usedAttributeIcons = new Set<string>([
    "Blend",
    "Paintbrush",
    "Ruler",
    "ScrollText",
    "Hand",
    "Clock3",
    "SquareStack",
  ]);
  const dynamicAttributes: SpecRow[] = (product.attributes ?? [])
    .filter((attribute) => !described(attribute.value))
    .map((attribute) => {
      const name = specAttributeIconName(attribute.key, usedAttributeIcons);
      usedAttributeIcons.add(name);
      return {
        key: `attribute-${attribute.key}`,
        label: attribute.label,
        value: attribute.value,
        icon: attributeIcon(name),
      };
    });

  const edition = editionIdentity(recordNumber);
  return [
    {
      key: "category",
      label: c.specCategory,
      value: categoryLabel(product.category, locale),
      icon: <Category />,
    },
    ...recorded,
    ...dynamicAttributes,
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
      value: edition ? (
        <span className={styles.specEdition}>{edition}</span>
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
}: {
  product: Product;
  artwork?: Artwork;
  passport?: RadPassport;
  textures: WorkTexture[];
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
      mark={<Layers aria-hidden="true" />}
      openByDefault
      className={styles.specs}
    >
      <dl>
        {rows.map((row) => (
          <div key={row.key}>
            <dt>
              <span className={styles.specIcon} aria-hidden="true">
                {row.icon}
              </span>
              <span>{row.label}</span>
            </dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </PdpSection>
  );
}

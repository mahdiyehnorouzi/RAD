import type { CSSProperties } from "react";
import Image from "next/image";
import type { ProductCategory } from "@rad/types";
import type { LucideIcon } from "lucide-react";
import {
  Box,
  CircleDot,
  Droplets,
  Flame,
  Gem,
  Hammer,
  Layers3,
  Palette,
  Paintbrush,
  Scissors,
  Sparkles,
  Stamp,
  TreePine,
  Waves,
} from "lucide-react";
import {
  categoryArtifacts,
  categoryOrbitImages,
  type CategoryArtifactName,
} from "./const";

const artifactIcons: Record<CategoryArtifactName, LucideIcon> = {
  box: Box,
  circle: CircleDot,
  droplets: Droplets,
  flame: Flame,
  gem: Gem,
  hammer: Hammer,
  layers: Layers3,
  palette: Palette,
  paintbrush: Paintbrush,
  scissors: Scissors,
  sparkles: Sparkles,
  stamp: Stamp,
  tree: TreePine,
  waves: Waves,
};

export function CategoryOrbitItems({
  category,
}: {
  category: ProductCategory;
}) {
  const images = categoryOrbitImages[category];

  return (
    <div className="pdp-category-orbit is-text-orbit" aria-hidden="true">
      {categoryArtifacts[category].map((artifact, index) => {
        const Icon = artifactIcons[artifact];
        const image = images?.[index] ?? null;
        return (
          <span
            key={`${artifact}-${index}`}
            className={`pdp-category-orbit-track track-${index + 1}`}
            style={{ "--orbit-index": index } as CSSProperties}
          >
            <span
              className={`pdp-category-artifact artifact-${index + 1}${image ? " is-graphic" : ""}`}
              data-artifact={artifact}
            >
              {image ? (
                <Image
                  src={image}
                  alt=""
                  fill
                  sizes="220px"
                  className="pdp-category-artifact-image"
                />
              ) : (
                <Icon />
              )}
            </span>
          </span>
        );
      })}
    </div>
  );
}

export function CategoryDetailIcon({
  category,
  index,
}: {
  category: ProductCategory;
  index: number;
}) {
  const artifact = categoryArtifacts[category][index % 3];
  const Icon = artifactIcons[artifact];

  return (
    <span
      className="pdp-material-icon"
      data-artifact={artifact}
      aria-hidden="true"
    >
      <Icon />
    </span>
  );
}

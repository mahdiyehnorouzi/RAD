import type { CSSProperties } from "react";
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
import { categoryArtifacts, type CategoryArtifactName } from "./const";

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
  return (
    <div className="pdp-category-orbit" aria-hidden="true">
      {categoryArtifacts[category].map((artifact, index) => {
        const Icon = artifactIcons[artifact];
        return (
          <span
            key={`${artifact}-${index}`}
            className={`pdp-category-artifact artifact-${index + 1}`}
            data-artifact={artifact}
            style={{ "--artifact-index": index } as CSSProperties}
          >
            <Icon />
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

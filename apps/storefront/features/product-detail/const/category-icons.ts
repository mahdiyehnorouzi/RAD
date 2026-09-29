import {
  Amphora,
  Axe,
  Gem,
  Palette,
  Shapes,
  Spool,
  Stamp,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import type { ProductCategory } from "@rad/types";

export const CATEGORY_ICONS: Record<ProductCategory, LucideIcon> = {
  ceramics: Amphora,
  vases: Amphora,
  tableware: UtensilsCrossed,
  sculpture: Shapes,
  painting: Palette,
  print: Stamp,
  textile: Spool,
  woodwork: Axe,
  jewelry: Gem,
};

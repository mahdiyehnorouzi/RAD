import { Flame, ShoppingBag, ShoppingCart } from "lucide-react";
import type { ProductBadgeTone } from "../type";

const ICONS: Partial<Record<ProductBadgeTone, typeof Flame>> = {
  sold: ShoppingBag,
  bag: ShoppingCart,
  popular: Flame,
};

export function ProductCardBadge({
  tone,
  label,
}: {
  tone: ProductBadgeTone;
  label: string;
}) {
  const Icon = ICONS[tone];
  return (
    <span className="rad-badge" data-tone={tone}>
      {Icon ? <Icon aria-hidden="true" /> : null}
      {label}
    </span>
  );
}

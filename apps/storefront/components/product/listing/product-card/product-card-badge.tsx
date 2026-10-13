import { Flame } from "lucide-react";
import type { ProductBadgeTone } from "../type";

/** Purchase happens on PDP, not here — no bag/cart icons on listing cards. */
const ICONS: Partial<Record<ProductBadgeTone, typeof Flame>> = {
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

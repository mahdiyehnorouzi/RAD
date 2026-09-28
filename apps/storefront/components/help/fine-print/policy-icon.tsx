import {
  Lock,
  Package,
  Palette,
  Scale,
  ShoppingBag,
  Truck,
  type LucideProps,
} from "lucide-react";
import type { PolicyIcon as PolicyIconName } from "../type";

const ICONS = {
  bag: ShoppingBag,
  palette: Palette,
  truck: Truck,
  package: Package,
  scale: Scale,
  lock: Lock,
} satisfies Record<PolicyIconName, unknown>;

export function PolicyIcon({
  name,
  ...props
}: { name: PolicyIconName } & LucideProps) {
  const Icon = ICONS[name];
  return <Icon strokeWidth={1.6} aria-hidden="true" {...props} />;
}

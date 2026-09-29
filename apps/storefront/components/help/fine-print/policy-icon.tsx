import {
  BadgeCheck,
  Ban,
  Camera,
  CircleX,
  Clock3,
  CreditCard,
  Fingerprint,
  Hammer,
  History,
  Lock,
  Map,
  MapPin,
  Package,
  Palette,
  PencilLine,
  ReceiptText,
  RotateCcw,
  Route,
  Scale,
  ShieldCheck,
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
  ban: Ban,
  card: CreditCard,
  fingerprint: Fingerprint,
  clock: Clock3,
  receipt: ReceiptText,
  shield: ShieldCheck,
  pin: MapPin,
  map: Map,
  route: Route,
  undo: RotateCcw,
  camera: Camera,
  hammer: Hammer,
  pen: PencilLine,
  cancel: CircleX,
  check: BadgeCheck,
  history: History,
} satisfies Record<PolicyIconName, unknown>;

export function PolicyIcon({
  name,
  ...props
}: { name: PolicyIconName } & LucideProps) {
  const Icon = ICONS[name];
  return <Icon strokeWidth={1.6} aria-hidden="true" {...props} />;
}

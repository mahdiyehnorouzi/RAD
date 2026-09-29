import {
  CircleCheck,
  CircleX,
  Flame,
  HandCoins,
  Heart,
  Megaphone,
  MessageCircle,
  Package,
  PackageCheck,
  PenLine,
  ShoppingBag,
  Truck,
  type LucideIcon,
} from "lucide-react";
import type { NoticeKind } from "@rad/types";

export const NOTICE_ICON: Record<NoticeKind, LucideIcon> = {
  welcome: Megaphone,
  favorite: Heart,
  cart: ShoppingBag,
  order: Package,
  order_confirmed: PackageCheck,
  order_rejected: CircleX,
  commission_approved: CircleCheck,
  commission_declined: CircleX,
  commission_change: PenLine,
  commission_message: MessageCircle,
  commission_quote: HandCoins,
  commission_pre_kiln: Flame,
  commission_firing: Flame,
  commission_balance: HandCoins,
  commission_shipped: Truck,
};

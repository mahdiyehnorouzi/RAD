import { CartItem } from "./cart-item.entity";
import { Commission } from "./commission.entity";
import { ContactMessage } from "./contact-message.entity";
import { DamageReport } from "./damage-report.entity";
import { Favorite } from "./favorite.entity";
import { Notice } from "./notice.entity";
import { Order } from "./order.entity";
import { OrderItem } from "./order-item.entity";
import { PasswordResetToken } from "./password-reset-token.entity";
import { PaymentIntent } from "./payment-intent.entity";
import { Product } from "./product.entity";
import { ProductImage } from "./product-image.entity";
import { Review } from "./review.entity";
import { User } from "./user.entity";
import { Vendor } from "./vendor.entity";

export const entities = [
  User,
  PasswordResetToken,
  Vendor,
  Product,
  ProductImage,
  CartItem,
  Favorite,
  Review,
  Order,
  OrderItem,
  Notice,
  Commission,
  PaymentIntent,
  ContactMessage,
  DamageReport,
] as const;

export type EntityClass = (typeof entities)[number];

export {
  CartItem,
  Commission,
  ContactMessage,
  DamageReport,
  Favorite,
  Notice,
  Order,
  OrderItem,
  PasswordResetToken,
  PaymentIntent,
  Product,
  ProductImage,
  Review,
  User,
  Vendor,
};

import { ArtistApplication } from "./artist-application.entity";
import { CartItem } from "./cart-item.entity";
import { Commission } from "./commission.entity";
import { ContactMessage } from "./contact-message.entity";
import { DamageReport } from "./damage-report.entity";
import { Favorite } from "./favorite.entity";
import { HelpQuestion } from "./help-question.entity";
import { Notice } from "./notice.entity";
import { Order } from "./order.entity";
import { OrderItem } from "./order-item.entity";
import { PasswordResetToken } from "./password-reset-token.entity";
import { PaymentIntent } from "./payment-intent.entity";
import { Product } from "./product.entity";
import { ProductImage } from "./product-image.entity";
import { ProductAttribute } from "./product-attribute.entity";
import { ProductAttributeOption } from "./product-attribute-option.entity";
import { ProductAttributeCategory } from "./product-attribute-category.entity";
import { ProductAttributeValue } from "./product-attribute-value.entity";
import { Review } from "./review.entity";
import { ShapeQuestion } from "./shape-question.entity";
import { User } from "./user.entity";
import { Vendor } from "./vendor.entity";

export const entities = [
  User,
  PasswordResetToken,
  Vendor,
  Product,
  ProductImage,
  ProductAttribute,
  ProductAttributeOption,
  ProductAttributeCategory,
  ProductAttributeValue,
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
  ShapeQuestion,
  HelpQuestion,
  ArtistApplication,
] as const;

export type EntityClass = (typeof entities)[number];

export {
  ArtistApplication,
  CartItem,
  Commission,
  ContactMessage,
  DamageReport,
  Favorite,
  HelpQuestion,
  Notice,
  Order,
  OrderItem,
  PasswordResetToken,
  PaymentIntent,
  Product,
  ProductImage,
  ProductAttribute,
  ProductAttributeOption,
  ProductAttributeCategory,
  ProductAttributeValue,
  Review,
  ShapeQuestion,
  User,
  Vendor,
};

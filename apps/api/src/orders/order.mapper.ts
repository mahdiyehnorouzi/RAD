import {
  manualCardDetails,
  paymentMode,
  paymentProvider,
} from "../payment/payment-session";
import { normalizeStoreOrderStatus } from "./store-order-status";
import type {
  OrderPayment,
  OrderPaymentProvider,
  OrderPaymentStatus,
  OrderRow,
  StoreOrderStatus,
} from "./type";

export function toOrder(order: OrderRow, redirectUrl?: string) {
  const status = normalizeStoreOrderStatus(order.status);
  return {
    id: order.id,
    slugs: order.items.map((item) => item.productSlug),
    total: order.total,
    usdTotal: order.usdTotal,
    createdAt: order.createdAt.getTime(),
    status,
    delivery: {
      name: order.name,
      city: order.city,
      phone: order.phone,
      address: order.address,
    },
    trackingCode: order.trackingCode || undefined,
    estimatedDeliveryAt: order.estimatedDeliveryAt?.getTime() ?? undefined,
    payment: toPayment(order, status, redirectUrl),
  };
}

function toPayment(
  order: OrderRow,
  status: StoreOrderStatus,
  redirectUrl?: string,
): OrderPayment | undefined {
  if (!order.payment) return undefined;
  const provider = (order.payment.provider ||
    paymentProvider()) as OrderPaymentProvider;
  const payment: OrderPayment = {
    mode: provider === "zarinpal" ? "gateway" : paymentMode(),
    provider,
    status: order.payment.status as OrderPaymentStatus,
    amount: order.payment.amount,
    receiptImage: order.payment.receiptImage || undefined,
    trackingNumber: order.payment.trackingNumber || undefined,
    submittedAt: order.payment.submittedAt?.getTime(),
    reviewedAt: order.payment.reviewedAt?.getTime(),
    rejectionReason: order.payment.rejectionReason || undefined,
  };

  if (status === "pending_payment") {
    if (!redirectUrl && provider !== "zarinpal") {
      payment.mode = "manual_card";
      payment.manualCard = manualCardDetails();
    }
    if (redirectUrl) payment.redirectUrl = redirectUrl;
    if (order.paymentDueAt) payment.dueAt = order.paymentDueAt.getTime();
  }
  return payment;
}

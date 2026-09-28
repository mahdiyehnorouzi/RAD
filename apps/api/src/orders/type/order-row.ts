export type OrderRow = {
  id: string;
  total: number;
  usdTotal: number;
  createdAt: Date;
  status: string;
  name: string;
  city: string;
  phone: string;
  address: string;
  trackingCode?: string | null;
  estimatedDeliveryAt?: Date | null;
  deliveredAt?: Date | null;
  policyVersions?: Record<string, string> | null;
  policiesAcceptedAt?: Date | null;
  paymentDueAt?: Date | null;
  items: Array<{ productSlug: string }>;
  payment?: {
    provider: string;
    status: string;
    amount: number;
    receiptImage?: string | null;
    trackingNumber?: string | null;
    submittedAt?: Date | null;
    reviewedAt?: Date | null;
    rejectionReason?: string | null;
  } | null;
};

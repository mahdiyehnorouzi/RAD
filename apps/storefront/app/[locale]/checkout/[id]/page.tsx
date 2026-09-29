"use client";

import { useParams } from "next/navigation";
import { CheckoutPayment } from "@/components/checkout";

export default function CheckoutPaymentPage() {
  const params = useParams<{ id: string }>();
  return <CheckoutPayment id={decodeURIComponent(String(params.id ?? ""))} />;
}

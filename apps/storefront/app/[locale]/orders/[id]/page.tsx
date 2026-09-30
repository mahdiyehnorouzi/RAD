"use client";

import { useParams } from "next/navigation";
import { OrderDetail } from "@/components/orders";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  return <OrderDetail id={decodeURIComponent(String(params.id ?? ""))} />;
}

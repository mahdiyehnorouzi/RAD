"use client";

import { useParams } from "next/navigation";
import { CustomerMakingDetail } from "@/components/customer-making";

export default function MakingDetailPage() {
  const params = useParams<{ id: string }>();
  return <CustomerMakingDetail id={String(params.id ?? "")} />;
}

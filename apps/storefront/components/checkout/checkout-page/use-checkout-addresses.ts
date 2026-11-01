"use client";

import { useEffect, useState } from "react";
import type { CustomerAddress } from "@rad/types";
import { fetchAddresses } from "@/lib/api";
import { checkoutAddressLoadStatus } from "./checkout-delivery";

const NO_ADDRESSES: CustomerAddress[] = [];

export type CheckoutAddressStatus =
  "idle" | "loading" | "ready" | "error" | "expired";

export function useCheckoutAddresses(userId: string): {
  status: CheckoutAddressStatus;
  addresses: CustomerAddress[];
  retry: () => void;
} {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    userId: string;
    attempt: number;
    status: "ready" | "error" | "expired";
    addresses: CustomerAddress[];
  } | null>(null);

  useEffect(() => {
    if (!userId) return;
    let ignore = false;
    fetchAddresses()
      .then((loaded) => {
        if (ignore) return;
        setResult({
          userId,
          attempt,
          status: "ready",
          addresses: loaded.addresses,
        });
      })
      .catch((error: unknown) => {
        if (ignore) return;
        setResult({
          userId,
          attempt,
          status: checkoutAddressLoadStatus(error),
          addresses: [],
        });
      });
    return () => {
      ignore = true;
    };
  }, [attempt, userId]);

  const current =
    result?.userId === userId && result.attempt === attempt ? result : null;

  return {
    status: !userId ? "idle" : current ? current.status : "loading",
    addresses: current?.addresses ?? NO_ADDRESSES,
    retry: () => setAttempt((value) => value + 1),
  };
}

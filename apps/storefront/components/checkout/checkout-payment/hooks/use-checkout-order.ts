import { useEffect, useState } from "react";
import type { Order } from "@rad/types";
import { useCommerce } from "@/components/commerce";
import { fetchOrder } from "@/lib/api";

/** The order from the session list, or fetched directly for a fresh tab. */
export function useCheckoutOrder(id: string) {
  const { orders } = useCommerce();
  const [fetched, setFetched] = useState<Order | null>(null);
  const [ready, setReady] = useState(false);
  const known = orders.find((item) => item.id === id);

  useEffect(() => {
    if (known) {
      setReady(true);
      return undefined;
    }
    let cancelled = false;
    fetchOrder(id)
      .then((payload) => {
        if (!cancelled) setFetched(payload);
      })
      .catch(() => {
        if (!cancelled) setFetched(null);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id, known]);

  return { order: known ?? fetched, ready };
}

import { useCallback, useEffect, useRef, useState } from "react";
import type { Product } from "@rad/types";
import { fetchProduct } from "@/lib/api";
import { useOnline } from "@/hooks/use-online";

const POLL_MS = 20_000;

export type LiveProduct = {
  /** Latest API copy; undefined until the first check answers. */
  product?: Product;
  /** The API now answers 404: withdrawn or back to draft while being viewed. */
  withdrawn: boolean;
  /** The last check could not reach the API. */
  failed: boolean;
  online: boolean;
  checking: boolean;
  check: () => Promise<void>;
};

/** Keeps a product page's availability current while the visitor is looking at it. */
export function useLiveProduct(slug: string): LiveProduct {
  const online = useOnline();
  const [product, setProduct] = useState<Product>();
  const [withdrawn, setWithdrawn] = useState(false);
  const [failed, setFailed] = useState(false);
  const [checking, setChecking] = useState(false);
  const inFlight = useRef(false);

  const check = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setChecking(true);
    try {
      const next = await fetchProduct(slug);
      setFailed(false);
      setWithdrawn(next === null);
      if (next) setProduct(next);
    } catch {
      setFailed(true);
    } finally {
      inFlight.current = false;
      setChecking(false);
    }
  }, [slug]);

  useEffect(() => {
    setProduct(undefined);
    setWithdrawn(false);
    setFailed(false);
    void check();
    const whenVisible = () => {
      if (document.visibilityState === "visible") void check();
    };
    const timer = window.setInterval(whenVisible, POLL_MS);
    document.addEventListener("visibilitychange", whenVisible);
    window.addEventListener("online", whenVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", whenVisible);
      window.removeEventListener("online", whenVisible);
    };
  }, [check]);

  const reservedUntil =
    product?.status === "sold" ? product.reservedUntil : undefined;
  useEffect(() => {
    if (!reservedUntil) return undefined;
    // The API sweeps expired holds every 30 s; ask shortly after the deadline.
    const timer = window.setTimeout(
      () => void check(),
      Math.max(0, reservedUntil - Date.now()) + 2_000,
    );
    return () => window.clearTimeout(timer);
  }, [reservedUntil, check]);

  return { product, withdrawn, failed, online, checking, check };
}

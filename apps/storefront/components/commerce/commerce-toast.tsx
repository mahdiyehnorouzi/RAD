"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { productCopy } from "@/lib/products";
import { useCatalog } from "@/components/catalog-provider";
import { useLocale } from "@/components/i18n";

export type Toast = {
  id: number;
  kind: "favoriteAdded" | "favoriteRemoved" | "cartAdded" | "reviewAdded";
  productSlug?: string;
};

export function CommerceToast({
  toast,
  onClose,
}: {
  toast: Toast | null;
  onClose: () => void;
}) {
  const { getProduct } = useCatalog();
  const { locale, t } = useLocale();

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(onClose, 3200);
    return () => window.clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const toastProduct = getProduct(toast.productSlug ?? "");
  const toastName = toastProduct ? productCopy(toastProduct, locale).name : "";
  const toastText =
    toast.kind === "favoriteAdded"
      ? `${t("toastFavoriteAdded")} ${toastName}`
      : toast.kind === "favoriteRemoved"
        ? `${t("toastFavoriteRemoved")} ${toastName}`
        : toast.kind === "cartAdded"
          ? `${t("toastCartAdded")} ${toastName}`
          : t("toastReviewAdded");

  return (
    <div
      className="fixed bottom-6 start-page z-[60] flex max-w-md items-center gap-3 border border-rad-line bg-rad-paper px-4 py-3 text-sm shadow-lg"
      role="status"
      aria-live="polite"
    >
      <span>{toastText}</span>
      <button
        type="button"
        className="border-0 bg-transparent"
        onClick={onClose}
        aria-label={t("closeToast")}
      >
        <X aria-hidden="true" />
      </button>
    </div>
  );
}

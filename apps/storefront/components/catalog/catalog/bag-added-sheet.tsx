"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, X } from "lucide-react";
import type { Product } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { ProductMedia } from "@/components/product/listing";
import { productCopy } from "@/lib/catalog/products";
import { productPrice } from "@/lib/money";
import "./bag-added-sheet.css";
export function BagAddedSheet({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const { locale, href } = useLocale();
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current;
    const trigger = document.activeElement;
    const overflow = document.body.style.overflow;
    node?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      node?.close();
      document.body.style.overflow = overflow;
      if (trigger instanceof HTMLElement) trigger.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="bag-added-sheet"
      aria-labelledby="bag-added-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientY < r.top ||
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <div className="bag-added-handle" />
      <button
        className="bag-added-close"
        onClick={onClose}
        aria-label={locale === "fa" ? "بستن" : "Close"}
      >
        <X />
      </button>
      <div className="bag-added-product">
        <span className="bag-added-photo">
          <ProductMedia product={product} showStatusBadge={false} />
        </span>
        <div>
          <h2 id="bag-added-title">{productCopy(product, locale).name}</h2>
          <b>{productPrice(product, locale)}</b>
        </div>
      </div>
      <p className="bag-added-status">
        <CheckCircle2 />
        {locale === "fa" ? "به کیسه خرید اضافه شد." : "Added to your bag."}
      </p>
      <Link
        className="bag-added-primary"
        href={href("/cart")}
        onClick={onClose}
      >
        {locale === "fa" ? "رفتن به کیسه" : "Go to bag"}
        <ArrowLeft />
      </Link>
      <button className="bag-added-continue" onClick={onClose}>
        {locale === "fa" ? "ادامه دیدن آثار" : "Continue browsing"}
      </button>
    </dialog>
  );
}

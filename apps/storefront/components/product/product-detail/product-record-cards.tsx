"use client";
import Link from "next/link";
import { ArrowLeft, ArrowRight, QrCode } from "lucide-react";
import type { Product } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { ObjectStamp, RadFingerprint } from "@/components/identity";
import type { RadPassport } from "@/components/passport/type";
import { formatPassportCode, passportYear } from "@/lib/passport";
import { ProductMedia } from "../listing";
import { pdpCopy } from "./const";

export function ProductRecordCards({
  product,
  passport,
  qrSvg,
}: {
  product: Product;
  passport?: RadPassport;
  /** Server-rendered code for this work's short link; the icon stands in without it. */
  qrSvg?: string;
}) {
  const { locale, t, href, number } = useLocale();
  const c = pdpCopy[locale];
  const Arrow = locale === "fa" ? ArrowLeft : ArrowRight;
  const code = passport
    ? formatPassportCode(passport.code, locale, number)
    : undefined;
  const year = passport ? passportYear(passport, locale) : undefined;
  const oneOfOne = locale === "fa" ? "تنها یک نسخه" : "one of one";

  return (
    <div className="pdp-records">
      {passport && code ? (
        <div className="pdp-passport">
          <Link
            className="pdp-record is-passport"
            href={href(`/passport/${passport.code}`)}
          >
            <RadFingerprint
              radNumber={passport.radNumber}
              density="field"
              className="pdp-passport-print"
              animate
            />
            <strong>{t("pdpPassportLink")}</strong>
            <span className="pdp-record-body">{c.passportCardBody}</span>
            <span className="pdp-record-go">
              <i aria-hidden="true">
                <Arrow />
              </i>
              {c.passportAction}
            </span>
            <span className="pdp-record-media" aria-hidden="true">
              <ProductMedia
                product={product}
                imageIndex={0}
                showStatusBadge={false}
              />
            </span>
          </Link>
          <ObjectStamp
            className="pdp-stamp"
            radNumber={passport.radNumber}
            code={code}
            year={year}
            label={[`${c.stampOf} RĀD ${code}`, oneOfOne, year]
              .filter(Boolean)
              .join(locale === "fa" ? "، " : ", ")}
          />
        </div>
      ) : null}
      <Link
        className="pdp-record is-qr"
        href={href(`/products/${product.slug}/qr`)}
      >
        {qrSvg ? (
          <span
            className="pdp-record-qr"
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
        ) : (
          <span className="pdp-record-qr" aria-hidden="true">
            <QrCode />
          </span>
        )}
        <span className="pdp-record-text">
          <strong>{t("pdpQrLink")}</strong>
          <span className="pdp-record-body">{c.qrCardBody}</span>
        </span>
        {product.radNumber ? (
          <RadFingerprint
            radNumber={product.radNumber}
            className="pdp-record-qr-print"
            animate
          />
        ) : null}
      </Link>
    </div>
  );
}

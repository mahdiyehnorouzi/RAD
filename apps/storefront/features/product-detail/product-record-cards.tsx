"use client";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Product } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { ObjectStamp, RadFingerprint } from "@/components/identity";
import type { RadPassport } from "@/components/passport/type";
import { formatPassportCode, passportYear } from "@/lib/passport";
import { ProductMedia } from "@/components/product/listing";
import { pdpCopy } from "./const";
import styles from "./product-record-cards.module.css";

export function ProductRecordCards({
  product,
  passport,
}: {
  product: Product;
  passport?: RadPassport;
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
    <div className={styles.records}>
      {passport && code ? (
        <div className={styles.passport}>
          <Link
            className={`${styles.record} ${styles.passportCard}`}
            href={href(`/passport/${passport.code}`)}
          >
            <RadFingerprint
              radNumber={passport.radNumber}
              density="field"
              className={styles.passportPrint}
              animate
            />
            <strong>{t("pdpPassportLink")}</strong>
            <span className={styles.recordBody}>{c.passportCardBody}</span>
            <span className={styles.recordGo}>
              <i aria-hidden="true">
                <Arrow />
              </i>
              {c.passportAction}
            </span>
            <span className={styles.recordMedia} aria-hidden="true">
              <ProductMedia
                product={product}
                imageIndex={0}
                showStatusBadge={false}
                sizes="(max-width: 700px) 36vw, (max-width: 1100px) 20vw, 15vw"
              />
            </span>
          </Link>
          <ObjectStamp
            className={styles.stamp}
            radNumber={passport.radNumber}
            code={code}
            year={year}
            label={[`${c.stampOf} RĀD ${code}`, oneOfOne, year]
              .filter(Boolean)
              .join(locale === "fa" ? "، " : ", ")}
          />
        </div>
      ) : null}
    </div>
  );
}

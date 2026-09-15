"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useCommerce } from "@/components/commerce";
import { useLocale } from "@/components/i18n";
import {
  findPassport,
  formatPassportCode,
  formatPassportName,
  passportForProduct,
} from "@/lib/passport";
import "./collection.css";

/** Collection is privately owned pieces — only delivered orders for this account. */
const OWNED_STATUSES = new Set(["delivered"]);

export function Collection() {
  const { locale, t, number, href } = useLocale();
  const { orders, ready } = useCommerce();

  const pieces = useMemo(() => {
    const slugs = [
      ...new Set(
        orders
          .filter((order) => OWNED_STATUSES.has(order.status))
          .flatMap((order) => order.slugs),
      ),
    ];
    return slugs
      .map((slug) => passportForProduct({ slug, artworkNumber: "" }) ?? findPassport(slug))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  }, [orders]);

  return (
    <section className="my-rads">
      <header>
        <span className="eyebrow">{t("myRadsEyebrow")}</span>
        <h2>{t("myRadsTitle")}</h2>
        <p>{t("myRadsBody")}</p>
      </header>
      {!ready ? null : pieces.length ? (
        <ol>
          {pieces.map((passport) => (
            <li key={passport.code}>
              <Link href={href(`/passport/${passport.code}`)}>
                <small>{formatPassportCode(passport.code, locale, number)}</small>
                <b>{formatPassportName(passport, locale, number)}</b>
                <span>{t("collectionOwnedHint")}</span>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <p className="my-rads-empty" role="status">
          {t("myRadsEmpty")}
        </p>
      )}
    </section>
  );
}

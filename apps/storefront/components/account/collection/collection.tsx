"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { useCommerce } from "@/components/commerce";
import { useLocale } from "@/components/i18n";
import { usePassports } from "@/hooks/use-artworks";
import {
  findPassport,
  formatPassportCode,
  formatPassportName,
} from "@/lib/passport";
import { AccountHeading } from "../account-heading";
import "./collection.css";

/** Collection is privately owned pieces — only delivered orders for this account. */
const OWNED_STATUSES = new Set(["delivered"]);

export function Collection() {
  const { locale, t, number, href } = useLocale();
  const { orders, ready } = useCommerce();
  const passports = usePassports();
  const Chevron = locale === "fa" ? ChevronLeft : ChevronRight;

  const pieces = useMemo(() => {
    const slugs = [
      ...new Set(
        orders
          .filter((order) => OWNED_STATUSES.has(order.status))
          .flatMap((order) => order.slugs),
      ),
    ];
    return slugs
      .map((slug) => findPassport(passports, slug))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  }, [orders, passports]);

  return (
    <section className="my-rads" aria-labelledby="my-rads-title">
      <AccountHeading
        as="h2"
        id="my-rads-title"
        icon={ShoppingBag}
        title={t("myRadsTitle")}
        body={t("myRadsBody")}
      />
      {!ready ? null : pieces.length ? (
        <ol className="account-list">
          {pieces.map((passport) => (
            <li key={passport.code}>
              <Link href={href(`/passport/${passport.code}`)}>
                <span className="my-rads-copy">
                  <small>{formatPassportCode(passport.code, locale, number)}</small>
                  <b>{formatPassportName(passport, locale, number)}</b>
                  <span>{t("collectionOwnedHint")}</span>
                </span>
                <Chevron className="account-list-chevron" aria-hidden="true" strokeWidth={1.6} />
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <div className="account-empty" role="status">
          <p>{t("myRadsEmpty")}</p>
          <Link className="account-button account-button--quiet" href={href("/products")}>
            {t("viewAvailableWorks")}
          </Link>
        </div>
      )}
    </section>
  );
}

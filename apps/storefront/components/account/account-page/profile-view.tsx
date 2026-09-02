"use client";

import { Heart, PackageSearch } from "lucide-react";
import { useCommerce } from "@/components/commerce/commerce-provider";
import { Button, ButtonLink } from "@/components/ui/button-link";
import { Eyebrow, PageSection } from "@/components/ui/section";
import { useLocale } from "@/components/i18n";

export function ProfileView() {
  const { user, logout, favorites, orders } = useCommerce();
  const { t, number } = useLocale();
  if (!user) return null;
  return (
    <PageSection>
      <header className="mb-10 flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <span
            className="grid h-16 w-16 place-items-center rounded-full bg-rad-moss text-2xl text-rad-paper"
            aria-hidden="true"
          >
            {user.name.trim().charAt(0)}
          </span>
          <div>
            <Eyebrow>{t("profileEyebrow")}</Eyebrow>
            <h1 className="m-0 text-h2 font-normal">
              {t("hello")} {user.name}
            </h1>
            <p className="m-0 text-rad-muted">{user.email}</p>
          </div>
        </div>
        <Button type="button" variant="outline" onClick={logout}>
          {t("logout")}
        </Button>
      </header>
      <div className="grid gap-6 sm:grid-cols-2">
        <section className="border border-rad-line bg-rad-paper p-8">
          <Heart aria-hidden="true" />
          <Eyebrow className="mt-4">{t("favoriteEyebrow")}</Eyebrow>
          <h2 className="m-0 text-h3 font-normal">
            {number(favorites.length)} {t("savedWorks")}
          </h2>
          <p className="my-4 text-prose">{t("favoriteProfileBody")}</p>
          <ButtonLink href="/favorites">{t("viewFavorites")}</ButtonLink>
        </section>
        <section className="border border-rad-line bg-rad-paper p-8">
          <PackageSearch aria-hidden="true" />
          <Eyebrow className="mt-4">{t("makingEyebrow")}</Eyebrow>
          <h2 className="m-0 text-h3 font-normal">{t("makingTitle")}</h2>
          <p className="my-4 text-prose">{t("makingBody")}</p>
          <ButtonLink href="/making">{t("makingNav")}</ButtonLink>
        </section>
        <section className="border border-rad-line bg-rad-paper p-8">
          <PackageSearch aria-hidden="true" />
          <Eyebrow className="mt-4">{t("ordersEyebrow")}</Eyebrow>
          <h2 className="m-0 text-h3 font-normal">
            {number(orders.length)} {t("orders")}
          </h2>
          <p className="my-4 text-prose">{t("noOrdersBody")}</p>
          <ButtonLink href="/orders">{t("orders")}</ButtonLink>
        </section>
      </div>
    </PageSection>
  );
}

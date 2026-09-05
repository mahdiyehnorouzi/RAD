"use client";

import { useMemo } from "react";
import { useMaking } from "@/hooks/use-making-workspace";
import { useLocale } from "@/components/i18n";
import { groupWorkshopCommissions } from "./group-commissions";
import { WorkshopCard } from "./workshop-card";
import type {MakingCommission} from "@/components/making/type";

function WorkshopColumn({
  title,
  items,
  empty,
}: {
  title: string;
  items: MakingCommission[];
  empty: string;
}) {
  return (
    <section>
      <h2>{title}</h2>
      {items.length ? (
        items.map((item) => <WorkshopCard key={item.id} commission={item} />)
      ) : (
        <p className="making-empty">{empty}</p>
      )}
    </section>
  );
}

export function ArtistWorkshopBoard() {
  const { commissions, ready } = useMaking();
  const { locale, t } = useLocale();
  const grouped = useMemo(() => groupWorkshopCommissions(commissions), [commissions]);

  if (!ready) {
    return (
      <section className="workshop-page section">
        <p>{locale === "fa" ? "کارگاه در حال باز شدن است…" : "Opening the workshop…"}</p>
      </section>
    );
  }

  return (
    <section className="workshop-page section">
      <header className="making-heading">
        <span className="eyebrow">{t("workshopEyebrow")}</span>
        <h1>{t("workshopTitle")}</h1>
        <p>{t("workshopBody")}</p>
      </header>
      <div className="workshop-columns">
        <WorkshopColumn title={t("workshopNeeds")} items={grouped.needs} empty={t("workshopQuiet")} />
        <WorkshopColumn title={t("workshopWaiting")} items={grouped.waiting} empty={t("workshopQuiet")} />
        <WorkshopColumn title={t("workshopStages")} items={grouped.rest} empty={t("workshopQuiet")} />
      </div>
    </section>
  );
}

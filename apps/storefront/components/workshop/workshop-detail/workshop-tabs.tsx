"use client";
import "./workshop-tabs.css";

import type {MakingCommission} from "@/components/making/type";
import { useMaking } from "@/hooks/use-making-workspace";
import { useLocale } from "@/components/i18n";
import {
  AuditTrail,
  ChangeCards,
  MessageComposer,
  PaymentHistory,
  PreKilnCard,
  ProgressPhotographs,
  QuoteCard,
  StageMessages,
} from "@/components/making";
import { FeasibilityPanel } from "./feasibility-panel";
import { FiringPanel } from "./firing-panel";
import { MakingPanel } from "./making-panel";
import { PreKilnPanel } from "./pre-kiln-panel";
import { QuotePanel } from "./quote-panel";
import { ShipPanel } from "./ship-panel";

export function WorkshopWorkTab({ commission }: { commission: MakingCommission }) {
  const making = useMaking();
  const { locale } = useLocale();
  return (
    <div className="making-layout">
      <div className="making-main">
        <FeasibilityPanel commission={commission} />
        <QuotePanel commission={commission} />
        <MakingPanel commission={commission} />
        <PreKilnPanel commission={commission} />
        <FiringPanel commission={commission} />
        <ShipPanel commission={commission} />
        <ChangeCards commission={commission} />
        <QuoteCard commission={commission} />
        {commission.approvedSnapshot ? <QuoteCard commission={commission} snapshot /> : null}
        <PreKilnCard commission={commission} />
        <ProgressPhotographs commission={commission} />
      </div>
      <aside className="making-side">
        <h2>{locale === "fa" ? "وضعیت پرداخت" : "Payment status"}</h2>
        <PaymentHistory commission={commission} />
        <h2>{locale === "fa" ? "پیام‌های مشتری" : "Customer messages"}</h2>
        <StageMessages commission={commission} />
        <MessageComposer
          onSend={(body) => making.addMessage(commission.id, { author: "artist", body })}
        />
        <h2>{locale === "fa" ? "یادداشت داخلی" : "Internal notes"}</h2>
        <StageMessages commission={commission} internalOnly />
        <MessageComposer
          internal
          onSend={(body) => making.addMessage(commission.id, { author: "artist", body, internal: true })}
        />
      </aside>
    </div>
  );
}

export function WorkshopAuditTab({ commission }: { commission: MakingCommission }) {
  return <AuditTrail commission={commission} />;
}

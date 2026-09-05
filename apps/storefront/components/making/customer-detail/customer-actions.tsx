"use client";

import type {MakingCommission} from "@/components/making/type";
import { copy } from "@/lib/making";
import { useMaking } from "@/hooks/use-making-workspace";
import { useLocale } from "@/components/i18n";

export function CustomerChangeActions({ commission }: { commission: MakingCommission }) {
  const { customerResolveChange } = useMaking();
  const { locale } = useLocale();
  const openChange = commission.changeRequests.find((item) => item.status === "open");
  if (!openChange || commission.nextActor !== "customer") return null;
  return (
    <div className="making-actions">
      <button className="button" type="button" onClick={() => customerResolveChange(commission.id, true)}>
        {locale === "fa" ? "پذیرش تغییر" : "Accept the change"}
      </button>
      <button
        className="button outline"
        type="button"
        onClick={() => customerResolveChange(commission.id, false)}
      >
        {locale === "fa" ? "درخواست بدیل" : "Ask for an alternative"}
      </button>
    </div>
  );
}

export function CustomerDepositAction({ commission }: { commission: MakingCommission }) {
  const { customerApproveDeposit } = useMaking();
  const { locale } = useLocale();
  if (commission.stage !== "approval_deposit" || !commission.quote) return null;
  return (
    <div className="making-actions">
      <button className="button" type="button" onClick={() => customerApproveDeposit(commission.id)}>
        {locale === "fa" ? "پذیرش مشخصات و پرداخت بیعانه" : "Accept specification and pay deposit"}
      </button>
      <small>
        {locale === "fa"
          ? "این نسخه نمایشی است؛ مبلغی از درگاه کم نمی‌شود. نسخه تأییدشده قفل می‌شود."
          : "This is a prototype; no card is charged. The approved snapshot is locked."}
      </small>
    </div>
  );
}

export function CustomerKilnAction({ commission }: { commission: MakingCommission }) {
  const { customerApproveKiln } = useMaking();
  const { locale } = useLocale();
  if (commission.stage !== "pre_kiln" || commission.nextActor !== "customer") return null;
  return (
    <div className="making-actions">
      <button className="button" type="button" onClick={() => customerApproveKiln(commission.id)}>
        {locale === "fa" ? "تأیید ورود به کوره" : "Approve kiln entry"}
      </button>
      <small className="making-warning">
        {locale === "fa"
          ? "پس از تأیید، فرم و لعاب دیگر تغییر نمی‌کنند."
          : "After approval, form and glaze cannot be changed."}
      </small>
    </div>
  );
}

export function CustomerFiringResolution({ commission }: { commission: MakingCommission }) {
  const { customerAcceptResolution } = useMaking();
  const { locale } = useLocale();
  if (!commission.firing?.unexpected || commission.stage !== "firing") return null;
  return (
    <div className="making-actions">
      <p>
        {copy(
          commission.firing.resolution ?? {
            fa: "نتیجه از بازه فاصله گرفته است.",
            en: "The result sits outside the approved range.",
          },
          locale,
        )}
      </p>
      <button className="button" type="button" onClick={() => customerAcceptResolution(commission.id)}>
        {locale === "fa" ? "پذیرش نتیجه و ادامه به رونمایی" : "Accept the result and continue to reveal"}
      </button>
    </div>
  );
}

export function CustomerBalanceAction({ commission }: { commission: MakingCommission }) {
  const { customerPayBalance } = useMaking();
  const { locale } = useLocale();
  if (commission.stage !== "reveal") return null;
  return (
    <div className="making-actions">
      <button className="button" type="button" onClick={() => customerPayBalance(commission.id)}>
        {locale === "fa" ? "پرداخت مانده حساب" : "Pay remaining balance"}
      </button>
    </div>
  );
}

"use client";
import "./checkout-payment.css";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Info } from "lucide-react";
import { ORDER_PAYMENT_WINDOW_MINUTES, type Product } from "@rad/types";
import type { PaymentReceiptInput } from "@/types/api";
import { useCatalog } from "@/components/catalog";
import { useCommerce } from "@/components/commerce";
import { HelpPanel } from "@/components/contact";
import { useLocale } from "@/components/i18n";
import { StatePanel } from "@/components/ui/state-panel";
import { ButtonLink } from "@/components/ui/button-link";
import { CardListSkeleton } from "@/components/ui/skeleton";
import { useCountdown } from "@/hooks/use-countdown";
import { readableErrorMessage } from "@/lib/api";
import { formatCountdown } from "@/lib/catalog/product-status";
import { formatTotal } from "@/lib/money";
import { checkoutCopy } from "../const";
import { CheckoutMeter, CheckoutSteps, CheckoutSummary, PaymentJourney } from "../flow";
import { useCheckoutOrder } from "./hooks";
import { PaymentCard } from "./payment-card";
import { PaymentReceipt } from "./payment-receipt";
import { PaymentResult } from "./payment-result";

const RECEIPT_FORM_ID = "checkout-receipt";

export function CheckoutPayment({ id }: { id: string }) {
  const { order, ready } = useCheckoutOrder(id);
  const { confirmDemoPayment, cancelOrder } = useCommerce();
  const { getProduct } = useCatalog();
  const { locale, number } = useLocale();
  const c = checkoutCopy[locale];
  const remaining = useCountdown(order?.payment?.dueAt);
  const [busy, setBusy] = useState<"receipt" | "cancel" | null>(null);
  const [error, setError] = useState("");
  const [asking, setAsking] = useState(false);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const ArrowIcon = locale === "fa" ? ArrowLeft : ArrowRight;

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  if (!ready && !order) {
    return (
      <section className="checkout-flow section" aria-busy="true">
        <CheckoutSteps current={1} />
        <CardListSkeleton count={2} />
      </section>
    );
  }

  if (!order) {
    return (
      <section className="checkout-flow section">
        <StatePanel
          as="h1"
          title={c.missingTitle}
          actions={<ButtonLink href="/orders">{c.ordersLink}</ButtonLink>}
        >
          <p>{c.missingBody}</p>
        </StatePanel>
      </section>
    );
  }

  const items = order.slugs
    .map((slug) => getProduct(slug))
    .filter((item): item is Product => Boolean(item));
  const tomanDue = order.payment?.amount ?? order.total;
  const tomanLabel =
    locale === "fa"
      ? formatTotal(tomanDue, "fa")
      : `${new Intl.NumberFormat("en-US").format(tomanDue)} toman`;
  const usdTotal =
    order.usdTotal ?? items.reduce((sum, product) => sum + (product.usdPrice ?? 0), 0);
  const summaryTotal = locale === "fa" ? tomanLabel : formatTotal(usdTotal, "en");

  if (order.status !== "pending_payment") {
    return (
      <section className="checkout-flow section">
        <CheckoutSteps current={2} />
        <div className="checkout-flow-body is-result">
          <div className="checkout-flow-main">
            <PaymentResult order={order} amount={tomanLabel} />
          </div>
          <aside className="checkout-flow-aside">
            <CheckoutSummary items={items} total={summaryTotal} />
          </aside>
        </div>
      </section>
    );
  }

  const run = async (kind: "receipt" | "cancel", action: () => Promise<unknown>) => {
    try {
      setBusy(kind);
      setError("");
      await action();
    } catch (err) {
      setError(
        readableErrorMessage(err, kind === "receipt" ? c.receiptFailed : c.requestFailed),
      );
    } finally {
      setBusy(null);
    }
  };

  const submitReceipt = (receipt: PaymentReceiptInput) =>
    run("receipt", () => confirmDemoPayment(order.id, receipt));

  const expired = remaining !== null && remaining <= 0;
  const manualCard = order.payment?.manualCard;
  const redirectUrl = order.payment?.redirectUrl;

  return (
    <section className="checkout-flow section">
      <CheckoutSteps current={1} />
      <PaymentJourney current={3} />
      <header className="checkout-flow-head">
        <h1>{c.payTitle}</h1>
        <p>{c.payLede}</p>
      </header>

      <div className="checkout-flow-body">
        <div className="checkout-flow-main checkout-pay">
          {redirectUrl ? (
            <div className="payment-gateway">
              <p>{c.gatewayHint}</p>
              <button
                type="button"
                className="checkout-submit"
                onClick={() => window.location.assign(redirectUrl)}
              >
                <span>{c.gatewayGo}</span>
                <ArrowIcon aria-hidden="true" />
              </button>
            </div>
          ) : manualCard ? (
            <PaymentCard
              card={manualCard}
              amount={tomanLabel}
              amountDigits={String(tomanDue)}
            />
          ) : (
            <p className="checkout-alert" role="status">
              {c.noCard}
            </p>
          )}

          <div className="payment-exact">
            <Info aria-hidden="true" />
            <p>
              <b>{c.exactTitle}</b> {c.exactBody}
            </p>
          </div>

          {remaining !== null ? (
            <CheckoutMeter
              title={expired ? c.deadlineExpired : c.deadlineLabel}
              time={expired ? undefined : formatCountdown(remaining, locale, number)}
              fraction={remaining / (ORDER_PAYMENT_WINDOW_MINUTES * 60_000)}
            />
          ) : null}

          {redirectUrl || expired ? null : (
            <PaymentReceipt
              id={RECEIPT_FORM_ID}
              busy={busy !== null}
              onSubmit={(receipt) => void submitReceipt(receipt)}
            />
          )}
        </div>

        <aside className="checkout-flow-aside">
          <CheckoutSummary items={items} total={summaryTotal} />
        </aside>

        <div className="checkout-flow-action">
          {error ? (
            <p ref={errorRef} className="checkout-alert" role="alert" tabIndex={-1}>
              {error}
            </p>
          ) : null}
          {redirectUrl || expired ? null : (
            <button
              type="submit"
              form={RECEIPT_FORM_ID}
              className="checkout-submit"
              disabled={busy !== null}
              aria-busy={busy === "receipt" || undefined}
            >
              <span>{busy === "receipt" ? c.submittingReceipt : c.submitReceipt}</span>
              <ArrowIcon aria-hidden="true" />
            </button>
          )}

          <div className="payment-cancel">
            {asking ? (
              <>
                <p role="status">{c.cancelAsk}</p>
                <div>
                  <button
                    type="button"
                    className="payment-cancel-yes"
                    disabled={busy !== null}
                    onClick={() =>
                      void run("cancel", () => cancelOrder(order.id)).then(() =>
                        setAsking(false),
                      )
                    }
                  >
                    {c.cancelYes}
                  </button>
                  <button
                    type="button"
                    className="payment-cancel-no"
                    disabled={busy !== null}
                    onClick={() => setAsking(false)}
                  >
                    {c.cancelNo}
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                className="payment-cancel-open"
                disabled={busy !== null}
                onClick={() => setAsking(true)}
              >
                {c.cancel}
              </button>
            )}
          </div>
        </div>

        <div className="checkout-flow-help">
          <HelpPanel context="order" tone="payment" orderId={order.id} />
        </div>
      </div>
    </section>
  );
}

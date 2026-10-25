"use client";
import "./checkout-payment.css";
import "../flow/purchase-design.css";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
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
import { CheckoutMeter, CheckoutSteps, CheckoutSummary } from "../flow";
import { useCheckoutOrder } from "./hooks";
import { PaymentCard } from "./payment-card";
import { PaymentReceipt } from "./payment-receipt";
import { PaymentResult } from "./payment-result";

const RECEIPT_FORM_ID = "checkout-receipt";

export function CheckoutPayment({ id }: { id: string }) {
  const { order, ready } = useCheckoutOrder(id);
  const { confirmDemoPayment, verifyPayment, retryPayment, cancelOrder } =
    useCommerce();
  const { getProduct } = useCatalog();
  const { locale, number, href } = useLocale();
  const c = checkoutCopy[locale];
  const remaining = useCountdown(order?.payment?.dueAt);
  const [busy, setBusy] = useState<"receipt" | "cancel" | "retry" | null>(null);
  const [error, setError] = useState("");
  const [asking, setAsking] = useState(false);
  const [receiptStep, setReceiptStep] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyFailed, setVerifyFailed] = useState(false);
  useEffect(() => {
    setReceiptStep(
      new URLSearchParams(window.location.search).get("step") === "receipt",
    );
  }, []);

  // ZarinPal lands the buyer back here with `Authority` + `Status` in the
  // query string. Verify server-to-server exactly once per landing, then
  // scrub those params so a refresh re-checks state instead of re-posting.
  const verifyOnReturn = async () => {
    const params = new URLSearchParams(window.location.search);
    const authority = params.get("Authority") ?? undefined;
    const status = params.get("Status") ?? undefined;
    if (!authority) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("Authority");
    url.searchParams.delete("Status");
    window.history.replaceState(window.history.state, "", url);
    setVerifying(true);
    setVerifyFailed(false);
    try {
      await verifyPayment(id, { authority, status });
    } catch {
      setVerifyFailed(true);
    } finally {
      setVerifying(false);
    }
  };
  useEffect(() => {
    void verifyOnReturn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  const showReceipt = (value: boolean) => {
    setReceiptStep(value);
    const url = new URL(window.location.href);
    if (value) url.searchParams.set("step", "receipt");
    else url.searchParams.delete("step");
    window.history.replaceState(window.history.state, "", url);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const errorRef = useRef<HTMLParagraphElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, [receiptStep]);
  const ArrowIcon = locale === "fa" ? ArrowLeft : ArrowRight;

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  if (!ready && !order) {
    return (
      <section className="checkout-flow section" aria-busy="true">
        <CheckoutSteps current={2} />
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

  if (verifying) {
    return (
      <section className="checkout-flow section">
        <CheckoutSteps current={3} />
        <div
          className="payment-result is-pending"
          role="status"
          aria-busy="true"
        >
          <span className="payment-result-spinner" aria-hidden="true" />
          <h1>{c.verifyingTitle}</h1>
          <p>{c.verifyingBody}</p>
        </div>
      </section>
    );
  }

  if (verifyFailed) {
    return (
      <section className="checkout-flow section">
        <CheckoutSteps current={3} />
        <div className="payment-result is-pending" role="alert">
          <h1>{c.verifyErrorTitle}</h1>
          <p>{c.verifyErrorBody}</p>
          <div className="payment-result-actions">
            <button
              type="button"
              className="checkout-submit"
              onClick={() => void verifyOnReturn()}
            >
              {c.verifyRetry}
            </button>
            <ButtonLink href={`/orders/${encodeURIComponent(id)}`} outline>
              {c.trackOrder}
            </ButtonLink>
          </div>
        </div>
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
  const summaryTotal = tomanLabel;

  if (order.status !== "pending_payment") {
    return (
      <section className="checkout-flow section">
        <CheckoutSteps current={3} />
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

  const run = async (
    kind: "receipt" | "cancel" | "retry",
    action: () => Promise<unknown>,
  ) => {
    try {
      setBusy(kind);
      setError("");
      await action();
    } catch (err) {
      setError(
        readableErrorMessage(
          err,
          kind === "receipt" ? c.receiptFailed : c.requestFailed,
        ),
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
  // A gateway order can land here with no *live* redirectUrl — it's only
  // ever returned once, right after checkout() or retryGatewayPayment().
  // A revisit (verify_error, verify_conflict, or just a stale tab) needs a
  // fresh session rather than the manual-transfer UI.
  const gatewayOrder = order.payment?.provider === "zarinpal";
  // The backend refuses to retry a verify_conflict payment (money already
  // captured, reservation lost — needs a human refund) and treats
  // verify_error as "reconcile first": retryPayment safely re-checks the
  // ORIGINAL attempt before ever starting a new charge, so the same call
  // works for both, but the copy must not promise "pay again" when nothing
  // new is actually being charged.
  const paymentConflict = order.payment?.status === "verify_conflict";
  const paymentAmbiguous = order.payment?.status === "verify_error";
  // A live session exists (status redirected) but we don't have its URL in
  // hand — e.g. the buyer refreshed this page instead of clicking through,
  // or came back without ever visiting the gateway. Nothing has failed;
  // retryPayment safely re-checks it (and only replaces it if it's truly
  // unused), so this must not show "payment didn't go through" copy.
  const sessionStale =
    gatewayOrder && !redirectUrl && order.payment?.status === "redirected";
  const retry = () =>
    run("retry", async () => {
      const updated = await retryPayment(order.id);
      const url = updated.payment?.redirectUrl;
      if (url) window.location.assign(url);
    });

  return (
    <section className="checkout-flow section">
      <CheckoutSteps current={2} />
      <header className="checkout-flow-head">
        <h1 ref={headingRef} tabIndex={-1}>
          {receiptStep
            ? c.receiptTitle
            : redirectUrl
              ? c.securePayTitle
              : gatewayOrder
                ? c.reviewTitle
                : c.payTitle}
        </h1>
        <p>
          {receiptStep
            ? locale === "fa"
              ? "عکس یا اسکرین‌شات رسید پرداخت را اینجا بفرستید."
              : "Upload a photo or screenshot of your payment receipt."
            : redirectUrl
              ? c.securePayLede
              : gatewayOrder
                ? ""
                : c.payLede}
        </p>
      </header>

      <div className="checkout-flow-body">
        <div
          className={`checkout-flow-main checkout-pay${receiptStep ? " checkout-receipt-step" : ""}`}
        >
          {!receiptStep && gatewayOrder ? (
            <section
              className="delivery-recap"
              aria-labelledby="delivery-recap-title"
            >
              <div className="delivery-recap-head">
                <h2 id="delivery-recap-title">{c.deliveryRecapTitle}</h2>
                <Link href={href("/checkout")} className="delivery-recap-edit">
                  {c.deliveryRecapEdit}
                </Link>
              </div>
              <address>
                <span>{order.delivery.name}</span>
                <span dir="ltr">{order.delivery.phone}</span>
                <span>
                  {[order.delivery.city, order.delivery.address]
                    .map((part) => part?.trim())
                    .filter(Boolean)
                    .join("، ")}
                </span>
              </address>
            </section>
          ) : null}
          {!receiptStep &&
            (redirectUrl ? (
              <div className="payment-gateway">
                <button
                  type="button"
                  className="checkout-submit"
                  onClick={() => window.location.assign(redirectUrl)}
                >
                  <span>{c.gatewayGo}</span>
                  <ArrowIcon aria-hidden="true" />
                </button>
                <p className="payment-gateway-hint">{c.gatewayHint}</p>
              </div>
            ) : gatewayOrder && paymentConflict ? (
              <div className="payment-gateway">
                <h2>{c.conflictTitle}</h2>
                <p className="checkout-alert" role="alert">
                  {c.conflictBody}
                </p>
              </div>
            ) : gatewayOrder && paymentAmbiguous && !expired ? (
              <div className="payment-gateway">
                <h2>{c.pendingReviewTitle}</h2>
                <p className="checkout-alert" role="status">
                  {c.pendingReviewBody}
                </p>
                <button
                  type="button"
                  className="checkout-submit"
                  disabled={busy !== null}
                  aria-busy={busy === "retry" || undefined}
                  onClick={() => void retry()}
                >
                  <span>
                    {busy === "retry" ? c.submitting : c.recheckPayment}
                  </span>
                  <ArrowIcon aria-hidden="true" />
                </button>
              </div>
            ) : sessionStale && !expired ? (
              <div className="payment-gateway">
                <h2>{c.securePayTitle}</h2>
                <p>{c.securePayLede}</p>
                <button
                  type="button"
                  className="checkout-submit"
                  disabled={busy !== null}
                  aria-busy={busy === "retry" || undefined}
                  onClick={() => void retry()}
                >
                  <span>{busy === "retry" ? c.submitting : c.gatewayGo}</span>
                  <ArrowIcon aria-hidden="true" />
                </button>
              </div>
            ) : gatewayOrder && !expired ? (
              <div className="payment-gateway">
                <h2>{c.paymentFailedTitle}</h2>
                <p className="checkout-alert" role="status">
                  {c.paymentFailedBody}
                </p>
                <button
                  type="button"
                  className="checkout-submit"
                  disabled={busy !== null}
                  aria-busy={busy === "retry" || undefined}
                  onClick={() => void retry()}
                >
                  <span>{busy === "retry" ? c.submitting : c.retryPay}</span>
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
            ))}

          {remaining !== null ? (
            <CheckoutMeter
              title={
                expired
                  ? c.deadlineExpired
                  : gatewayOrder
                    ? c.deadlineLabelGateway
                    : c.deadlineLabel
              }
              time={
                expired ? undefined : formatCountdown(remaining, locale, number)
              }
              fraction={remaining / (ORDER_PAYMENT_WINDOW_MINUTES * 60_000)}
            />
          ) : null}

          {redirectUrl || expired || gatewayOrder ? null : (
            <div hidden={!receiptStep}>
              <PaymentReceipt
                id={RECEIPT_FORM_ID}
                busy={busy !== null}
                onSubmit={(receipt) => void submitReceipt(receipt)}
              />
            </div>
          )}
        </div>

        <aside className="checkout-flow-aside">
          <CheckoutSummary items={items} total={summaryTotal} />
        </aside>

        <div className="checkout-flow-action">
          {error ? (
            <p
              ref={errorRef}
              className="checkout-alert"
              role="alert"
              tabIndex={-1}
            >
              {error}
            </p>
          ) : null}
          {redirectUrl || expired || gatewayOrder ? null : receiptStep ? (
            <button
              type="submit"
              form={RECEIPT_FORM_ID}
              className="checkout-submit"
              disabled={busy !== null}
              aria-busy={busy === "receipt" || undefined}
            >
              <span>
                {busy === "receipt" ? c.submittingReceipt : c.submitReceipt}
              </span>
              <ArrowIcon aria-hidden="true" />
            </button>
          ) : (
            <div className="transfer-next">
              <p>
                {locale === "fa"
                  ? "واریز را انجام دادید؟"
                  : "Have you made the transfer?"}
              </p>
              <button
                type="button"
                className="checkout-submit"
                onClick={() => showReceipt(true)}
              >
                <span>
                  {locale === "fa"
                    ? "بله، رسید رو می‌فرستم"
                    : "Yes, send my receipt"}
                </span>
                <ArrowIcon aria-hidden="true" />
              </button>
              <ButtonLink href="/cart" outline>
                {locale === "fa" ? "هنوز نه" : "Not yet"}
              </ButtonLink>
            </div>
          )}
          {receiptStep && (
            <button
              className="transfer-back"
              type="button"
              onClick={() => showReceipt(false)}
            >
              {locale === "fa"
                ? "بازگشت به اطلاعات پرداخت"
                : "Back to payment details"}
            </button>
          )}

          {paymentConflict || paymentAmbiguous ? null : (
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
                        void run("cancel", () => cancelOrder(order.id)).then(
                          () => setAsking(false),
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
          )}
        </div>

        <div className="checkout-flow-help">
          <HelpPanel
            context="order"
            tone={gatewayOrder ? "gatewayPayment" : "payment"}
            orderId={order.id}
          />
        </div>
      </div>
    </section>
  );
}

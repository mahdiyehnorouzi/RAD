"use client";
import { effectiveProductStatus } from "@rad/types";

import { useEffect, useState } from "react";
import {
  Archive,
  ChevronLeft,
  Eye,
  EyeOff,
  Inbox,
  ScrollText,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { useAdminChrome, type AdminWorkspace } from "./admin-shell";
import { passwordChangeError } from "../lib/password-change";
import {
  commissionStageLabels,
  productStatusLabel,
  type AdminContactMessage,
  type AdminProduct,
  type AdminSection,
} from "../lib/admin-data";
import { AdminCommissions } from "./admin-commissions";
import { AdminDamageReports } from "./admin-damage-reports";
import { AdminOrders } from "./orders/admin-orders";
import "./orders/admin-orders.css";
import type { DamageReview } from "./admin-damage-report";
import { Field } from "./admin-dialog";
import { AdminProductAttributes } from "./admin-product-attributes";
import { StatusBadge } from "./admin-list-chrome";
import { InviteDialog, Members } from "./admin-members";
import { UsersPanel } from "./admin-users";
import { OverviewStats } from "./admin-overview-stats";
import { briefExcerpt } from "../lib/product-cover";
import { ProductThumb } from "../features/products/admin-products";

const number = new Intl.NumberFormat("fa-IR");
const date = (value: number) =>
  new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(value);

function statusTone(
  product: Pick<AdminProduct, "status" | "reservedUntil">,
): "green" | "oxide" | "sand" | "muted" {
  const effective = effectiveProductStatus(product);
  if (effective === "available") return "green";
  if (effective === "reserved") return "sand";
  if (effective === "sold") return "oxide";
  return "muted";
}

const relativeUnits: [number, string][] = [
  [60, "لحظاتی پیش"],
  [3600, "دقیقه پیش"],
  [86400, "ساعت پیش"],
  [2592000, "روز پیش"],
];
function relativeTime(value: number) {
  const diff = Math.max(0, Math.floor((Date.now() - value) / 1000));
  if (diff < relativeUnits[0][0]) return relativeUnits[0][1];
  if (diff < relativeUnits[1][0])
    return `${number.format(Math.floor(diff / 60))} ${relativeUnits[1][1]}`;
  if (diff < relativeUnits[2][0])
    return `${number.format(Math.floor(diff / 3600))} ${relativeUnits[2][1]}`;
  if (diff < relativeUnits[3][0])
    return `${number.format(Math.floor(diff / 86400))} ${relativeUnits[3][1]}`;
  return date(value);
}

// A refresh or direct link to a Custom Orders detail (#commissions/<id>,
// set by AdminCommissions) must land back in that section, not Overview —
// this is the one spot in the shell that reads the hash; every other
// section still opens on "overview" as before.
type AsyncKey = "reviews" | "shapeQuestions" | "users" | "members";

function sectionAsync(
  workspace: {
    loadedKeys: { has(key: AsyncKey): boolean };
    loadErrors: { has(key: AsyncKey): boolean };
    refreshingKeys: { has(key: AsyncKey): boolean };
    refreshErrors: { has(key: AsyncKey): boolean };
    retryResource: (key: AsyncKey) => unknown;
  },
  key: AsyncKey,
) {
  return {
    loading: !workspace.loadedKeys.has(key) && !workspace.loadErrors.has(key),
    loadError: workspace.loadErrors.has(key),
    refreshing: workspace.refreshingKeys.has(key),
    refreshError: workspace.refreshErrors.has(key),
    onRetry: () => {
      void workspace.retryResource(key);
    },
  };
}

export function AdminDashboard() {
  const { workspace, section, go, announce, handedOrderId, clearHandedOrder } =
    useAdminChrome();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [focusOrderId, setFocusOrderId] = useState<string | null>(null);

  const openOrder = (orderId: string) => {
    setFocusOrderId(orderId);
    go("orders");
    window.requestAnimationFrame(() => {
      document
        .getElementById(`order-${orderId}`)
        ?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  };

  useEffect(() => {
    if (section !== "orders" || !handedOrderId) return;
    const id = handedOrderId;
    setFocusOrderId(id);
    clearHandedOrder();
    window.requestAnimationFrame(() => {
      document
        .getElementById(`order-${id}`)
        ?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  }, [section, handedOrderId, clearHandedOrder]);

  const setMessageStatus = async (
    id: string,
    status: AdminContactMessage["status"],
  ) => {
    await workspace.setMessageStatus(id, status);
    announce(
      status === "resolved" ? "پیام رسیدگی‌شده ثبت شد." : "پیام دوباره باز شد.",
    );
  };

  const replyToMessage = async (id: string, body: string) => {
    await workspace.replyToMessage(id, body);
    announce("پاسخ برای مشتری ارسال شد.");
  };

  const reviewDamage = async (id: string, review: DamageReview) => {
    try {
      await workspace.reviewDamageReport(id, review);
      announce(
        review.status === "reviewing"
          ? "گزارش آسیب در حال بررسی است."
          : "تصمیم گزارش آسیب ثبت شد و مشتری آن را در صفحه‌ی سفارش می‌بیند.",
      );
      return true;
    } catch (error) {
      announce((error as Error).message);
      return false;
    }
  };

  const signedInUser = workspace.user;
  if (!signedInUser) return null;

  return (
    <>
      {section === "overview" && (
        <Overview workspace={workspace} onNavigate={go} />
      )}
      {section === "orders" && (
        <AdminOrders
          orders={workspace.orders}
          products={workspace.products}
          focusOrderId={focusOrderId}
          loading={
            !workspace.loadedKeys.has("orders") &&
            !workspace.loadErrors.has("orders")
          }
          loadError={workspace.loadErrors.has("orders")}
          onRetry={() => workspace.retryResource("orders")}
          messages={workspace.messages}
          onSetMessageStatus={setMessageStatus}
          onReplyMessage={replyToMessage}
          damageReports={workspace.damageReports}
          onReviewDamage={reviewDamage}
          canWrite={workspace.can("order.write")}
          onChange={async (order) => {
            try {
              await workspace.updateOrder(order);
              announce("وضعیت سفارش ذخیره شد.");
            } catch (error) {
              announce((error as Error).message);
            }
          }}
          onApprovePayment={async (id) => {
            try {
              await workspace.approvePayment(id);
              announce("پرداخت تأیید شد و به مشتری اطلاع داده شد.");
              return true;
            } catch (error) {
              announce((error as Error).message);
              return false;
            }
          }}
          onRejectPayment={async (id, reason) => {
            try {
              await workspace.rejectPayment(id, reason);
              announce("پرداخت رد شد و اثر به فروشگاه برگشت.");
              return true;
            } catch (error) {
              announce((error as Error).message);
              return false;
            }
          }}
        />
      )}
      {section === "damage" && (
        <AdminDamageReports
          reports={workspace.damageReports}
          loading={
            !workspace.loadedKeys.has("damageReports") &&
            !workspace.loadErrors.has("damageReports")
          }
          loadError={workspace.loadErrors.has("damageReports")}
          onRetry={() => workspace.retryResource("damageReports")}
          orders={workspace.orders}
          canWrite={workspace.can("order.write")}
          onReview={reviewDamage}
          onOpenOrder={openOrder}
        />
      )}
      {section === "commissions" && (
        <AdminCommissions
          commissions={workspace.commissions}
          loading={
            !workspace.loadedKeys.has("commissions") &&
            !workspace.loadErrors.has("commissions")
          }
          loadError={workspace.loadErrors.has("commissions")}
          onRetry={() => workspace.retryResource("commissions")}
          canWrite={workspace.can("order.write")}
          onBeginReview={async (id) => {
            try {
              await workspace.beginCommissionReview(id);
            } catch (error) {
              announce((error as Error).message);
              throw error;
            }
          }}
          onDecide={async (input) => {
            try {
              await workspace.decideCommission(input);
              announce("تصمیم برای مشتری ارسال شد.");
            } catch (error) {
              announce((error as Error).message);
              // Re-thrown (unlike this file's other section handlers,
              // which only toast) so CommissionDecisionForm's own
              // inline error + retry — more durable than a 2.8s toast
              // for a failed stage decision — actually fires; see the
              // same note on onMessage below.
              throw error;
            }
          }}
          onMessage={async (id, body, internal) => {
            try {
              await workspace.messageCommission(id, body, internal);
              announce("پیام برای مشتری ارسال شد.");
            } catch (error) {
              announce((error as Error).message);
              // Re-thrown so CommissionMessages sees the rejection and
              // shows its inline error + retry button instead of the
              // failure being swallowed here and only ever surfacing
              // as a toast that's gone in 2.8s.
              throw error;
            }
          }}
        />
      )}
      {section === "attributes" && (
        <AdminProductAttributes
          attributes={workspace.productAttributes}
          canWrite={workspace.can("product.write")}
          onSave={async (input, id) => {
            try {
              await workspace.saveProductAttribute(input, id);
              announce(id ? "ویژگی ذخیره شد." : "ویژگی تازه اضافه شد.");
              return true;
            } catch (error) {
              announce((error as Error).message);
              return false;
            }
          }}
          onDelete={async (id) => {
            try {
              await workspace.deleteProductAttribute(id);
              announce("ویژگی حذف شد.");
              return true;
            } catch (error) {
              announce((error as Error).message);
              return false;
            }
          }}
          onReorder={async (ids) => {
            try {
              await workspace.reorderProductAttributes(ids);
            } catch (error) {
              announce((error as Error).message);
            }
          }}
        />
      )}
      {section === "users" && (
        <UsersPanel
          users={workspace.users}
          {...sectionAsync(workspace, "users")}
        />
      )}
      {section === "members" && (
        <Members
          members={workspace.members}
          {...sectionAsync(workspace, "members")}
          canWrite={workspace.can("member.write")}
          onInvite={() => setInviteOpen(true)}
          onChange={async (member) => {
            await workspace.updateMember(member);
            announce("سطح دسترسی به‌روزرسانی شد.");
          }}
        />
      )}
      {section === "account" && (
        <AccountSettings
          user={signedInUser}
          onChangePassword={workspace.changePassword}
          onDone={(message) => announce(message)}
        />
      )}
      {inviteOpen && (
        <InviteDialog
          onClose={() => setInviteOpen(false)}
          onInvite={async (member) => {
            await workspace.inviteMember(member);
            setInviteOpen(false);
            announce("عضو جدید در پایگاه داده ثبت شد.");
          }}
        />
      )}
    </>
  );
}

function Overview({
  workspace,
  onNavigate,
}: {
  workspace: AdminWorkspace;
  onNavigate: (section: AdminSection) => void;
}) {
  const recentProducts = [...workspace.products]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 6);
  const todayLabel = new Intl.DateTimeFormat("fa-IR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(Date.now());
  return (
    <div className="view-stack">
      <section className="overview-hero">
        <div>
          <span className="eyebrow">وضعیت امروز</span>
          <h2>سلام {workspace.user?.name.split(" ")[0]}،</h2>
          <p>امروز در استودیو رَد چه خبر است؟ · {todayLabel}</p>
        </div>
      </section>
      <OverviewStats
        products={workspace.products}
        loading={!workspace.loadedKeys.has("products")}
      />
      <section className="shortcut-grid">
        <ShortcutTile
          icon={<Archive />}
          label="آثار و محصولات"
          onClick={() => onNavigate("products")}
        />
        <ShortcutTile
          icon={<ShoppingBag />}
          label="سفارش‌های فروشگاه"
          onClick={() => onNavigate("orders")}
        />
        <ShortcutTile
          icon={<ScrollText />}
          label="سفارش اختصاصی"
          onClick={() => onNavigate("commissions")}
        />
        <ShortcutTile
          icon={<Inbox />}
          label="پیام‌ها"
          onClick={() => onNavigate("messages")}
        />
      </section>
      <section>
        <div className="panel-heading">
          <div>
            <span className="eyebrow">تازه‌ترین تغییرات</span>
            <h3>آخرین آثار</h3>
          </div>
          <button
            className="text-action"
            type="button"
            onClick={() => onNavigate("products")}
          >
            دیدن همه
          </button>
        </div>
        <div className="recent-products">
          {recentProducts.map((product) => (
            <div className="recent-card" key={product.id}>
              <ProductThumb product={product} />
              <strong>{product.name}</strong>
              <StatusBadge
                label={productStatusLabel(product)}
                tone={statusTone(product)}
              />
            </div>
          ))}
          {!recentProducts.length && <p>هنوز اثری ثبت نشده است.</p>}
        </div>
        <div className="activity-list">
          {recentProducts.slice(0, 4).map((product) => (
            <div className="activity-row" key={`activity-${product.id}`}>
              <ProductThumb product={product} />
              <div>
                <strong>{product.name}</strong>
                <small>
                  {product.category} ·{" "}
                  {product.status === "available"
                    ? "اثر آمادهٔ فروش شد"
                    : "اطلاعات اثر به‌روزرسانی شد"}{" "}
                  · {relativeTime(product.updatedAt)}
                </small>
              </div>
              <StatusBadge
                label={productStatusLabel(product)}
                tone={statusTone(product)}
              />
            </div>
          ))}
        </div>
      </section>
      <section className="split-grid">
        <article className="paper-panel overview-commissions">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">سفارش اختصاصی</span>
              <h3>صندوق بازبینی</h3>
            </div>
            <button
              className="text-action"
              type="button"
              onClick={() => onNavigate("commissions")}
            >
              دیدن همه
            </button>
          </div>
          {workspace.commissions.slice(0, 3).map((item) => (
            <button
              className="compact-row"
              type="button"
              key={item.id}
              onClick={() => onNavigate("commissions")}
            >
              <div>
                <strong>{item.customerName}</strong>
                <small className="compact-row-id">{item.id}</small>
                {item.concept ? (
                  <p className="compact-row-excerpt">
                    {briefExcerpt(item.concept)}
                  </p>
                ) : null}
              </div>
              <StatusBadge
                label={commissionStageLabels[item.stage]}
                tone={
                  item.stage === "declined"
                    ? "muted"
                    : item.nextActor === "artist"
                      ? "oxide"
                      : "green"
                }
              />
            </button>
          ))}
          {!workspace.commissions.length && (
            <p>هنوز طرح اختصاصی‌ای نرسیده است.</p>
          )}
        </article>
        <article className="dark-panel">
          <span className="eyebrow">دسترسی تیم</span>
          <ShieldCheck />
          <h3>نقش‌ها روشن، مسئولیت‌ها دقیق.</h3>
          <p>مالک، مدیر، ویرایشگر و مشاهده‌گر هرکدام سطح دسترسی مشخص دارند.</p>
          <button
            className="light-action"
            type="button"
            onClick={() => onNavigate("members")}
          >
            مدیریت افراد
          </button>
        </article>
      </section>
    </div>
  );
}

function ShortcutTile({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button className="shortcut-tile" type="button" onClick={onClick}>
      <span className="stat-icon">{icon}</span>
      <span>{label}</span>
      <ChevronLeft />
    </button>
  );
}

function AccountSettings({
  user,
  onChangePassword,
  onDone,
}: {
  user: { name: string; email: string | null };
  onChangePassword: (input: {
    currentPassword: string;
    newPassword: string;
  }) => Promise<{ ok: boolean }>;
  onDone: (message: string) => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [shown, setShown] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <section className="paper-panel data-view account-view">
      <div className="view-heading">
        <div>
          <span className="eyebrow">امنیت حساب</span>
          <h2>حساب کاربری</h2>
          <p>
            {user.name}
            {user.email ? (
              <>
                {" · "}
                <span dir="ltr">{user.email}</span>
              </>
            ) : null}
          </p>
        </div>
      </div>
      <form
        className="editor-form account-form"
        noValidate
        onSubmit={async (event) => {
          event.preventDefault();
          if (saving) return;
          const validation = passwordChangeError({
            currentPassword,
            newPassword,
            confirmPassword,
          });
          if (validation) {
            setSaved("");
            setError(validation);
            return;
          }
          try {
            setSaving(true);
            setError("");
            await onChangePassword({ currentPassword, newPassword });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setShown({ current: false, next: false, confirm: false });
            const message =
              "رمز عبور با موفقیت تغییر کرد. در این دستگاه وارد می‌مانید.";
            setSaved(message);
            onDone(message);
          } catch (err) {
            setSaved("");
            setError((err as Error).message);
          } finally {
            setSaving(false);
          }
        }}
      >
        {error && (
          <small className="field-error" role="alert">
            {error}
          </small>
        )}
        {saved && (
          <p className="login-success" role="status">
            {saved}
          </p>
        )}
        <Field label="رمز عبور فعلی">
          <SecretInput
            name="current-password"
            value={currentPassword}
            shown={shown.current}
            disabled={saving}
            autoComplete="current-password"
            onChange={setCurrentPassword}
            onToggle={() =>
              setShown((current) => ({ ...current, current: !current.current }))
            }
          />
        </Field>
        <div className="form-grid">
          <Field label="رمز عبور جدید">
            <SecretInput
              name="new-password"
              value={newPassword}
              shown={shown.next}
              disabled={saving}
              autoComplete="new-password"
              onChange={setNewPassword}
              onToggle={() =>
                setShown((current) => ({ ...current, next: !current.next }))
              }
            />
          </Field>
          <Field label="تکرار رمز عبور جدید">
            <SecretInput
              name="confirm-password"
              value={confirmPassword}
              shown={shown.confirm}
              disabled={saving}
              autoComplete="new-password"
              onChange={setConfirmPassword}
              onToggle={() =>
                setShown((current) => ({
                  ...current,
                  confirm: !current.confirm,
                }))
              }
            />
          </Field>
        </div>
        <p className="account-note">
          نشست‌های باز تا پایان اعتبارشان باقی می‌مانند. ورود بعدی با رمز تازه
          انجام می‌شود.
        </p>
        <div className="dialog-actions account-actions">
          <button
            className="primary-action"
            type="submit"
            disabled={saving}
            aria-busy={saving || undefined}
          >
            {saving ? "در حال ذخیره…" : "ذخیره رمز عبور"}
          </button>
        </div>
      </form>
    </section>
  );
}

function SecretInput({
  name,
  value,
  shown,
  disabled,
  autoComplete,
  onChange,
  onToggle,
}: {
  name: string;
  value: string;
  shown: boolean;
  disabled: boolean;
  autoComplete: "current-password" | "new-password";
  onChange: (value: string) => void;
  onToggle: () => void;
}) {
  return (
    <div className="password-field">
      <input
        dir="ltr"
        type={shown ? "text" : "password"}
        name={name}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        minLength={8}
        required
      />
      <button
        type="button"
        className="password-toggle"
        aria-pressed={shown}
        aria-label={shown ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"}
        onClick={onToggle}
      >
        {shown ? <EyeOff /> : <Eye />}
      </button>
    </div>
  );
}

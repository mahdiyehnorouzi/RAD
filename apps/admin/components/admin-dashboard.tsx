"use client";
import { api } from "../lib/api";
import { effectiveProductStatus } from "@rad/types";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  ArrowLeft,
  Bell,
  Boxes,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  CircleGauge,
  CircleHelp,
  Eye,
  EyeOff,
  Hammer,
  Image as ImageIcon,
  MessageSquareQuote,
  Shapes,
  ImagePlus,
  Inbox,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreVertical,
  Package,
  PackageCheck,
  PackageX,
  Pencil,
  Plus,
  ScrollText,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Tag,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useAdminWorkspace } from "../hooks/use-admin-workspace";
import {
  loadRememberedEmail,
  loadRememberMe,
  saveLoginPreferences,
} from "../lib/admin-storage";
import {
  isVideoStorage,
  orderStatusLabels,
  orderStatusOptions,
  orderStatusProgress,
  isTerminalOrderStatus,
  productStatusLabel,
  productStatusLabels,
  productStatusOptions,
  PRODUCT_CATEGORY_LABELS,
  roleLabels,
  stageCountLabel,
  type AdminContactMessage,
  type AdminDamageReport,
  type AdminMember,
  type AdminOrder,
  type AdminProduct,
  type AdminRemoteMediaStorage,
  type AdminRole,
  type AdminSection,
  type AdminUser,
  type ProductAttribute,
  type ProductAttributeValue,
} from "../lib/admin-data";
import { AdminCommissions } from "./admin-commissions";
import { AdminOrderPayment } from "./admin-order-payment";
import { AdminMessages } from "./admin-messages";
import { AdminOrderMessages } from "./admin-order-messages";
import { AdminDamageReports } from "./admin-damage-reports";
import { AdminOrderDamage } from "./admin-order-damage";
import { AdminOrderPolicies } from "./admin-order-policies";
import type { DamageReview } from "./admin-damage-report";
import {
  ConfirmDialog,
  DialogShell,
  Field,
  useBodyScrollLock,
} from "./admin-dialog";
import { AdminReviews } from "./admin-reviews";
import { AdminShapeQuestions } from "./admin-shape-questions";
import { AdminHelpQuestions } from "./admin-help-questions";
import { AdminProductAttributes } from "./admin-product-attributes";
import { ProductAttributeFields } from "./admin-product-attribute-fields";
import { StageMeter } from "@rad/ui";

const navItems: { id: AdminSection; label: string; icon: typeof Package }[] = [
  { id: "overview", label: "مرور استودیو", icon: LayoutDashboard },
  { id: "products", label: "آثار و محصولات", icon: Archive },
  { id: "orders", label: "سفارش‌های فروشگاه", icon: ShoppingBag },
  { id: "messages", label: "پیام‌ها", icon: Inbox },
  { id: "damage", label: "گزارش‌های آسیب", icon: PackageX },
  { id: "commissions", label: "سفارش اختصاصی", icon: ScrollText },
  { id: "reviews", label: "نظر مشتریان", icon: MessageSquareQuote },
  { id: "shape", label: "پرسشنامه‌ی شکل", icon: Shapes },
  { id: "help", label: "پرسش‌های راهنما", icon: CircleHelp },
  { id: "attributes", label: "ویژگی‌های محصول", icon: SlidersHorizontal },
  { id: "users", label: "مشتریان", icon: UserRound },
  { id: "members", label: "افراد و دسترسی", icon: Users },
  { id: "account", label: "حساب کاربری", icon: KeyRound },
];

const number = new Intl.NumberFormat("fa-IR");
const money = (value: number) => `${number.format(value)} تومان`;
const date = (value: number) =>
  new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(value);
const dateTime = (value: number) =>
  new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);

function parsePriceInput(raw: string) {
  const persian = "۰۱۲۳۴۵۶۷۸۹";
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  const digits = raw
    .replace(/[۰-۹]/g, (digit) => String(persian.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabic.indexOf(digit)))
    .replace(/[^\d]/g, "");
  if (!digits) return 0;
  return Number(digits);
}

function formatPriceInput(value: number) {
  if (!value) return "";
  return number.format(value);
}

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

export function AdminDashboard() {
  const workspace = useAdminWorkspace();
  const [section, setSection] = useState<AdminSection>("overview");
  const [mobileNav, setMobileNav] = useState(false);
  const [productEditor, setProductEditor] = useState<
    AdminProduct | "new" | null
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [toast, setToast] = useState("");

  const announce = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  };

  const go = (next: AdminSection) => {
    setSection(next);
    setMobileNav(false);
    void workspace.loadSection(next);
  };

  // Loads the starting section's data once a session is confirmed — not
  // before (see `ready`/`authStatus` below), and not every resource.
  useEffect(() => {
    if (workspace.authStatus === "authenticated") {
      void workspace.loadSection(section);
    }
    // Intentionally only re-runs when auth settles, not on every `section`
    // change — `go()` above already loads the section being navigated to.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace.authStatus]);

  const openOrder = (orderId: string) => {
    go("orders");
    window.requestAnimationFrame(() => {
      document
        .getElementById(`order-${orderId}`)
        ?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  };

  const setMessageStatus = async (
    id: string,
    status: AdminContactMessage["status"],
  ) => {
    try {
      await workspace.setMessageStatus(id, status);
      announce(
        status === "resolved"
          ? "پیام رسیدگی‌شده ثبت شد."
          : "پیام دوباره باز شد.",
      );
    } catch (error) {
      announce((error as Error).message);
    }
  };

  const replyToMessage = async (id: string, body: string) => {
    try {
      await workspace.replyToMessage(id, body);
      announce("پاسخ برای مشتری ارسال شد.");
    } catch (error) {
      announce((error as Error).message);
    }
  };

  const openMessages = workspace.messages.filter(
    (message) => !message.parentId && message.status === "new",
  ).length;
  const openDamage = workspace.damageReports.filter(
    (report) => report.status === "submitted" || report.status === "reviewing",
  ).length;

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

  if (!workspace.ready)
    return (
      <div className="admin-shell">
        <main className="admin-main">
          <p className="admin-loading">در حال اتصال به پایگاه داده…</p>
        </main>
      </div>
    );
  if (workspace.authStatus === "error")
    return (
      <div className="admin-shell">
        <main className="admin-main">
          <div className="auth-error-state">
            <p>
              اتصال به پایگاه داده برقرار نشد. اتصال اینترنت را بررسی و دوباره
              تلاش کنید.
            </p>
            <button
              className="primary-action"
              type="button"
              onClick={() => {
                void workspace.retryAuth();
              }}
            >
              تلاش دوباره
            </button>
          </div>
        </main>
      </div>
    );
  if (!workspace.user?.adminRole)
    return (
      <AdminLogin
        onLogin={workspace.login}
        onForgotPassword={workspace.forgotPassword}
      />
    );

  return (
    <div className="admin-shell">
      <aside
        className={`admin-sidebar ${mobileNav ? "is-open" : ""}`}
        aria-label="ناوبری مدیریت"
      >
        <button
          className="nav-close"
          type="button"
          onClick={() => setMobileNav(false)}
          aria-label="بستن منو"
        >
          <X />
        </button>
        <div className="brand-lockup">
          <span className="brand-mark">
            <img src="/rad-logo.png" alt="رَد" width={52} height={52} />
          </span>
          <div>
            <strong>دفتر کوره</strong>
            <small>پنل مدیریت استودیو</small>
          </div>
        </div>
        <nav className="admin-nav">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={section === id ? "active" : ""}
              onClick={() => go(id)}
            >
              <Icon />
              <span>
                {label}
                {id === "messages" && openMessages ? (
                  <em
                    className="nav-count"
                    aria-label={`${number.format(openMessages)} پیام رسیدگی‌نشده`}
                  >
                    {number.format(openMessages)}
                  </em>
                ) : null}
                {id === "damage" && openDamage ? (
                  <em
                    className="nav-count"
                    aria-label={`${number.format(openDamage)} گزارش آسیب باز`}
                  >
                    {number.format(openDamage)}
                  </em>
                ) : null}
              </span>
              <ChevronLeft />
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="avatar">{workspace.user.name.trim().charAt(0)}</div>
          <div>
            <strong>{workspace.user.name}</strong>
            <small>{roleLabels[workspace.currentRole]}</small>
          </div>
          <button
            type="button"
            aria-label="خروج از حساب"
            onClick={() => {
              void workspace.logout();
            }}
          >
            <LogOut />
          </button>
        </div>
      </aside>

      {mobileNav && (
        <button
          className="nav-scrim"
          type="button"
          onClick={() => setMobileNav(false)}
          aria-label="بستن منو"
        />
      )}

      <main className="admin-main">
        <header className="admin-topbar">
          <button
            className="menu-button"
            type="button"
            onClick={() => setMobileNav(true)}
            aria-label="باز کردن منو"
          >
            <Menu />
          </button>
          <div>
            <span className="context-label">رَد / عملیات استودیو</span>
            <h1>{navItems.find((item) => item.id === section)?.label}</h1>
          </div>
          <button
            className="topbar-bell"
            type="button"
            onClick={() => go("messages")}
            aria-label={
              openMessages
                ? `${number.format(openMessages)} پیام رسیدگی‌نشده`
                : "پیام‌ها"
            }
          >
            <Bell />
            {openMessages > 0 && (
              <em className="nav-count">{number.format(openMessages)}</em>
            )}
          </button>
          <div className="topbar-status">
            <span className="live-dot" />
            پایگاه داده Postgres
          </div>
        </header>

        {section === "overview" && (
          <Overview workspace={workspace} onNavigate={go} />
        )}
        {section === "products" && (
          <Products
            products={workspace.products}
            canWrite={workspace.can("product.write")}
            onCreate={() => setProductEditor("new")}
            onEdit={setProductEditor}
            onDelete={setDeleteTarget}
          />
        )}
        {section === "orders" && (
          <Orders
            orders={workspace.orders}
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
        {section === "messages" && (
          <AdminMessages
            messages={workspace.messages}
            orders={workspace.orders}
            canWrite={workspace.can("order.write")}
            onSetStatus={setMessageStatus}
            onReply={replyToMessage}
            onOpenOrder={openOrder}
          />
        )}
        {section === "damage" && (
          <AdminDamageReports
            reports={workspace.damageReports}
            orders={workspace.orders}
            canWrite={workspace.can("order.write")}
            onReview={reviewDamage}
            onOpenOrder={openOrder}
          />
        )}
        {section === "commissions" && (
          <AdminCommissions
            commissions={workspace.commissions}
            canWrite={workspace.can("order.write")}
            onBeginReview={async (id) => {
              try {
                await workspace.beginCommissionReview(id);
              } catch (error) {
                announce((error as Error).message);
              }
            }}
            onDecide={async (input) => {
              try {
                await workspace.decideCommission(input);
                announce("تصمیم برای مشتری ارسال شد.");
              } catch (error) {
                announce((error as Error).message);
              }
            }}
            onMessage={async (id, body, internal) => {
              try {
                await workspace.messageCommission(id, body, internal);
                announce("پیام برای مشتری ارسال شد.");
              } catch (error) {
                announce((error as Error).message);
              }
            }}
          />
        )}
        {section === "reviews" && (
          <AdminReviews
            reviews={workspace.reviews}
            canWrite={workspace.can("content.write")}
            onSetHidden={async (id, hidden) => {
              try {
                await workspace.setReviewHidden(id, hidden);
                announce(
                  hidden
                    ? "نظر از فروشگاه پنهان شد."
                    : "نظر دوباره در فروشگاه دیده می‌شود.",
                );
              } catch (error) {
                announce((error as Error).message);
              }
            }}
            onDelete={async (id) => {
              try {
                await workspace.deleteReview(id);
                announce("نظر حذف شد.");
                return true;
              } catch (error) {
                announce((error as Error).message);
                return false;
              }
            }}
          />
        )}
        {section === "shape" && (
          <AdminShapeQuestions
            questions={workspace.shapeQuestions}
            canWrite={workspace.can("content.write")}
            onSave={async (input, id) => {
              try {
                await workspace.saveShapeQuestion(input, id);
                announce(
                  id ? "سؤال ذخیره شد." : "سؤال تازه به پرسشنامه اضافه شد.",
                );
                return true;
              } catch (error) {
                announce((error as Error).message);
                return false;
              }
            }}
            onDelete={async (id) => {
              try {
                await workspace.deleteShapeQuestion(id);
                announce("سؤال از پرسشنامه حذف شد.");
                return true;
              } catch (error) {
                announce((error as Error).message);
                return false;
              }
            }}
            onReorder={async (ids) => {
              try {
                await workspace.reorderShapeQuestions(ids);
              } catch (error) {
                announce((error as Error).message);
              }
            }}
          />
        )}
        {section === "help" && (
          <AdminHelpQuestions
            questions={workspace.helpQuestions}
            canWrite={workspace.can("content.write")}
            onSave={async (input, id) => {
              try {
                await workspace.saveHelpQuestion(input, id);
                announce(
                  id
                    ? "سؤال ذخیره شد."
                    : "سؤال تازه به صفحه‌ی راهنما اضافه شد.",
                );
                return true;
              } catch (error) {
                announce((error as Error).message);
                return false;
              }
            }}
            onDelete={async (id) => {
              try {
                await workspace.deleteHelpQuestion(id);
                announce("سؤال از صفحه‌ی راهنما حذف شد.");
                return true;
              } catch (error) {
                announce((error as Error).message);
                return false;
              }
            }}
            onReorder={async (ids) => {
              try {
                await workspace.reorderHelpQuestions(ids);
              } catch (error) {
                announce((error as Error).message);
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
        {section === "users" && <UsersPanel users={workspace.users} />}
        {section === "members" && (
          <Members
            members={workspace.members}
            canWrite={workspace.can("member.write")}
            onInvite={() => setInviteOpen(true)}
            onChange={async (member) => {
              try {
                await workspace.updateMember(member);
                announce("سطح دسترسی به‌روزرسانی شد.");
              } catch (error) {
                announce((error as Error).message);
              }
            }}
          />
        )}
        {section === "account" && (
          <AccountSettings
            user={workspace.user}
            onChangePassword={workspace.changePassword}
            onDone={(message) => announce(message)}
          />
        )}
      </main>

      {productEditor && (
        <ProductDialog
          product={productEditor === "new" ? null : productEditor}
          onUploadImage={workspace.uploadProductImage}
          onFetchAttributes={workspace.fetchAttributesForCategory}
          onClose={() => setProductEditor(null)}
          onDelete={
            productEditor !== "new"
              ? () => {
                  setDeleteTarget(productEditor);
                  setProductEditor(null);
                }
              : undefined
          }
          onSave={async (product) => {
            try {
              await workspace.saveProduct(product);
              setProductEditor(null);
              announce(
                productEditor === "new"
                  ? "محصول جدید در پایگاه داده ذخیره شد."
                  : "تغییرات محصول ذخیره شد.",
              );
            } catch (error) {
              announce((error as Error).message);
            }
          }}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          title={`حذف «${deleteTarget.name}»؟`}
          description="این محصول از پایگاه داده حذف می‌شود و دیگر در فروشگاه دیده نخواهد شد."
          onCancel={() => setDeleteTarget(null)}
          onConfirm={async () => {
            try {
              await workspace.deleteProduct(deleteTarget.id);
              setDeleteTarget(null);
              announce("محصول حذف شد.");
            } catch (error) {
              announce((error as Error).message);
            }
          }}
        />
      )}
      {inviteOpen && (
        <InviteDialog
          onClose={() => setInviteOpen(false)}
          onInvite={async (member) => {
            try {
              await workspace.inviteMember(member);
              setInviteOpen(false);
              announce("عضو جدید در پایگاه داده ثبت شد.");
            } catch (error) {
              announce((error as Error).message);
            }
          }}
        />
      )}
      <div
        className={`admin-toast ${toast ? "visible" : ""}`}
        role="status"
        aria-live="polite"
      >
        {toast}
      </div>
    </div>
  );
}

function Overview({
  workspace,
  onNavigate,
}: {
  workspace: ReturnType<typeof useAdminWorkspace>;
  onNavigate: (section: AdminSection) => void;
}) {
  const statsLoading = !workspace.loadedKeys.has("products");
  const available = workspace.products.filter(
    (item) => item.status === "available",
  ).length;
  const inWorkshop = workspace.products.filter(
    (item) => item.status === "in_workshop",
  ).length;
  const sold = workspace.products.filter(
    (item) => item.status === "sold",
  ).length;
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
      <section className="stat-grid">
        <StatTile
          icon={<PackageCheck />}
          value={available}
          label="آماده فروش"
          loading={statsLoading}
        />
        <StatTile
          icon={<Hammer />}
          value={inWorkshop}
          label="در کارگاه"
          loading={statsLoading}
        />
        <StatTile
          icon={<Boxes />}
          value={sold}
          label="فروخته شده"
          loading={statsLoading}
        />
        <StatTile
          icon={<CircleGauge />}
          value={workspace.products.length}
          label="اثر ثبت‌شده"
          loading={statsLoading}
        />
      </section>
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
        <div className="recent-products" style={{ paddingTop: 18 }}>
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
        <div className="activity-list" style={{ paddingTop: 10 }}>
          {recentProducts.slice(0, 4).map((product) => (
            <div className="activity-row" key={`activity-${product.id}`}>
              <ProductThumb product={product} />
              <div>
                <strong>{product.name}</strong>
                <small>
                  {product.status === "available"
                    ? "اثر آمادهٔ فروش شد"
                    : "اطلاعات اثر به‌روزرسانی شد"}{" "}
                  · {relativeTime(product.updatedAt)}
                </small>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="split-grid">
        <article className="paper-panel">
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
            <div className="compact-row" key={item.id}>
              <div>
                <strong>{item.customerName}</strong>
                <small>
                  {item.id} · {item.concept}
                </small>
              </div>
            </div>
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

function StatTile({
  icon,
  value,
  label,
  loading = false,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  /** Before the first successful load only — a later background refetch
   * keeps showing the previous number instead of reverting to this. */
  loading?: boolean;
}) {
  return (
    <article className="stat-tile">
      <span className="stat-icon">{icon}</span>
      {loading ? (
        <span className="stat-skeleton" aria-hidden="true" />
      ) : (
        <strong>{number.format(value)}</strong>
      )}
      <span>{label}</span>
    </article>
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

type ProductSort = "newest" | "oldest" | "price_desc" | "price_asc";

const PAGE_SIZE = 10;

function Products({
  products,
  canWrite,
  onCreate,
  onEdit,
  onDelete,
}: {
  products: AdminProduct[];
  canWrite: boolean;
  onCreate: () => void;
  onEdit: (product: AdminProduct) => void;
  onDelete: (product: AdminProduct) => void;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<ProductSort>("newest");
  const [statusFilter, setStatusFilter] = useState<
    AdminProduct["status"] | "all"
  >("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const categories = useMemo(
    () => Array.from(new Set(products.map((item) => item.category))),
    [products],
  );

  const filtered = useMemo(() => {
    const list = products
      .filter((product) =>
        `${product.name} ${product.artist} ${product.slug}`.includes(
          query.trim(),
        ),
      )
      .filter(
        (product) => statusFilter === "all" || product.status === statusFilter,
      )
      .filter(
        (product) =>
          categoryFilter === "all" || product.category === categoryFilter,
      );
    return [...list].sort((a, b) => {
      if (sort === "newest") return b.updatedAt - a.updatedAt;
      if (sort === "oldest") return a.updatedAt - b.updatedAt;
      if (sort === "price_desc") return b.price - a.price;
      return a.price - b.price;
    });
  }, [products, query, statusFilter, categoryFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const resetToFirstPage = () => setPage(1);

  return (
    <section className="paper-panel data-view">
      <div className="view-heading">
        <div>
          <span className="eyebrow">کاتالوگ یک‌به‌یک</span>
          <h2>آثار و محصولات</h2>
          <p>تمام آثار ثبت‌شده در استودیو؛ هر اثر فقط یک‌بار ساخته شده است.</p>
        </div>
        <button
          className="primary-action"
          type="button"
          onClick={onCreate}
          disabled={!canWrite}
        >
          <Plus />
          افزودن اثر
        </button>
      </div>
      <div className="toolbar">
        <div className="search-field">
          <Search />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              resetToFirstPage();
            }}
            placeholder="جست‌وجوی نام، هنرمند یا شناسه"
            aria-label="جست‌وجوی محصولات"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
                resetToFirstPage();
              }}
              aria-label="پاک کردن جست‌وجو"
            >
              <X />
            </button>
          )}
        </div>
      </div>
      <div className="filters-row">
        <select
          className="filter-select"
          value={sort}
          onChange={(event) => setSort(event.target.value as ProductSort)}
          aria-label="مرتب‌سازی"
        >
          <option value="newest">جدیدترین</option>
          <option value="oldest">قدیمی‌ترین</option>
          <option value="price_desc">گران‌ترین</option>
          <option value="price_asc">ارزان‌ترین</option>
        </select>
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(
              event.target.value as AdminProduct["status"] | "all",
            );
            resetToFirstPage();
          }}
          aria-label="وضعیت"
        >
          <option value="all">همه وضعیت‌ها</option>
          {Object.entries(productStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          className="filter-select"
          value={categoryFilter}
          onChange={(event) => {
            setCategoryFilter(event.target.value);
            resetToFirstPage();
          }}
          aria-label="دسته‌بندی"
        >
          <option value="all">همه دسته‌ها</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <span className="results-count">
          {number.format(filtered.length)} محصول در این نما
        </span>
      </div>
      {pageItems.length ? (
        <>
          <div className="admin-table-wrap">
            <table className="products-table">
              <thead>
                <tr>
                  <th>کاور</th>
                  <th>نام اثر</th>
                  <th>شناسه</th>
                  <th>دسته‌بندی</th>
                  <th>وضعیت</th>
                  <th>قیمت (تومان)</th>
                  <th>آخرین ویرایش</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((product) => (
                  <tr key={product.id}>
                    <td className="cell-thumb">
                      <ProductThumb product={product} />
                    </td>
                    <td>{product.name}</td>
                    <td>{product.slug}</td>
                    <td>{product.category}</td>
                    <td>
                      <StatusBadge
                        label={productStatusLabel(product)}
                        tone={statusTone(product)}
                      />
                    </td>
                    <td>{money(product.price)}</td>
                    <td>{date(product.updatedAt)}</td>
                    <td className="cell-actions">
                      <RowMenu
                        open={openMenuId === product.id}
                        onToggle={() =>
                          setOpenMenuId((current) =>
                            current === product.id ? null : product.id,
                          )
                        }
                        canWrite={canWrite}
                        onEdit={() => {
                          setOpenMenuId(null);
                          onEdit(product);
                        }}
                        onDelete={() => {
                          setOpenMenuId(null);
                          onDelete(product);
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="product-list">
            {pageItems.map((product) => (
              <article className="product-row" key={product.id}>
                <ProductThumb product={product} />
                <div className="product-primary">
                  <span>
                    {product.category} · {product.artist}
                  </span>
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                </div>
                <div className="product-meta">
                  <StatusBadge
                    label={productStatusLabel(product)}
                    tone={statusTone(product)}
                  />
                  <strong>{money(product.price)}</strong>
                  <small>ویرایش {date(product.updatedAt)}</small>
                </div>
                <RowMenu
                  open={openMenuId === product.id}
                  onToggle={() =>
                    setOpenMenuId((current) =>
                      current === product.id ? null : product.id,
                    )
                  }
                  canWrite={canWrite}
                  onEdit={() => {
                    setOpenMenuId(null);
                    onEdit(product);
                  }}
                  onDelete={() => {
                    setOpenMenuId(null);
                    onDelete(product);
                  }}
                />
              </article>
            ))}
          </div>
          {totalPages > 1 && (
            <nav className="pagination" aria-label="صفحه‌بندی محصولات">
              <button
                type="button"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={currentPage === 1}
                aria-label="صفحه قبل"
              >
                <ChevronRight />
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    className={pageNumber === currentPage ? "active" : ""}
                    onClick={() => setPage(pageNumber)}
                  >
                    {number.format(pageNumber)}
                  </button>
                ),
              )}
              <button
                type="button"
                onClick={() =>
                  setPage((value) => Math.min(totalPages, value + 1))
                }
                disabled={currentPage === totalPages}
                aria-label="صفحه بعد"
              >
                <ChevronLeft />
              </button>
            </nav>
          )}
        </>
      ) : (
        <EmptyState
          title="محصولی پیدا نشد"
          description="عبارت جست‌وجو یا فیلترها را تغییر دهید یا محصول تازه‌ای اضافه کنید."
        />
      )}
    </section>
  );
}

function RowMenu({
  open,
  onToggle,
  canWrite,
  onEdit,
  onDelete,
}: {
  open: boolean;
  onToggle: () => void;
  canWrite: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <button
        className="row-menu-trigger"
        type="button"
        onClick={onToggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="عملیات"
      >
        <MoreVertical />
      </button>
      {open && (
        <div className="row-menu" role="menu">
          <button type="button" onClick={onEdit} disabled={!canWrite}>
            <Pencil />
            ویرایش
          </button>
          <button
            type="button"
            className="danger"
            onClick={onDelete}
            disabled={!canWrite}
          >
            <Trash2 />
            حذف
          </button>
        </div>
      )}
    </>
  );
}

function ProductThumb({ product }: { product: AdminProduct }) {
  return (
    <div className="product-thumb">
      {product.images[0]?.src ? (
        <img src={product.images[0].src} alt="" />
      ) : (
        <Package />
      )}
      <span>{number.format(product.images.length)} عکس</span>
    </div>
  );
}

function Orders({
  orders,
  messages,
  onSetMessageStatus,
  onReplyMessage,
  damageReports,
  onReviewDamage,
  canWrite,
  onChange,
  onApprovePayment,
  onRejectPayment,
}: {
  orders: AdminOrder[];
  messages: AdminContactMessage[];
  onSetMessageStatus: (
    id: string,
    status: AdminContactMessage["status"],
  ) => Promise<void>;
  onReplyMessage: (id: string, body: string) => Promise<void>;
  damageReports: AdminDamageReport[];
  onReviewDamage: (id: string, review: DamageReview) => Promise<boolean>;
  canWrite: boolean;
  onChange: (order: AdminOrder) => void | Promise<void>;
  onApprovePayment: (id: string) => Promise<boolean>;
  onRejectPayment: (id: string, reason: string) => Promise<boolean>;
}) {
  return (
    <section className="paper-panel data-view">
      <div className="view-heading">
        <div>
          <span className="eyebrow">از ثبت تا تحویل</span>
          <h2>سفارش‌های فروشگاه</h2>
          <p>
            این فهرست خرید آثار آماده است: پرداخت، بسته‌بندی و ارسال. ساخت
            سفارشی در بخش سفارش اختصاصی است.
          </p>
        </div>
      </div>
      {orders.length ? (
        <div className="order-process-list">
          {orders.map((order) => {
            const terminal = isTerminalOrderStatus(order.status);
            const progressIndex = orderStatusProgress.indexOf(order.status);
            const current = terminal
              ? orderStatusProgress.length - 1
              : Math.max(0, progressIndex);
            const nextStatus =
              terminal || progressIndex < 0
                ? undefined
                : orderStatusProgress[progressIndex + 1];
            const next = nextStatus ? orderStatusLabels[nextStatus] : undefined;
            const awaitingReceiptReview =
              order.status === "pending_verification";
            // No automated process ever resolves these (see orders.service.ts
            // retryGatewayPayment/verifyAndApplyGatewayResult): a gateway
            // payment stuck here waits on the buyer's own retry, or forever
            // if they never click it. Surface it the same way a manual-card
            // receipt review is surfaced, so staff can find it without
            // opening every order.
            const awaitingGatewayReview =
              order.paymentProvider === "zarinpal" &&
              (order.paymentStatus === "verify_error" ||
                order.paymentStatus === "verify_conflict");
            const statusOptions = orderStatusOptions(order.status);
            return (
              <article
                id={`order-${order.id}`}
                className={`order-process-card${awaitingReceiptReview || awaitingGatewayReview ? " needs-receipt-review" : ""}${terminal ? " is-terminal" : ""}`}
                key={order.id}
              >
                <header>
                  <div>
                    <strong>سفارش #{order.id}</strong>
                    <small>{orderStatusLabels[order.status]}</small>
                  </div>
                  <div className="order-process-meta">
                    <b>{order.productName}</b>
                    <span>{money(order.amount)}</span>
                  </div>
                  <select
                    value={order.status}
                    disabled={!canWrite || statusOptions.length < 2}
                    onChange={(event) =>
                      onChange({
                        ...order,
                        status: event.target.value as AdminOrder["status"],
                      })
                    }
                    aria-label={`وضعیت سفارش ${order.id}`}
                  >
                    {statusOptions.map((value) => (
                      <option key={value} value={value}>
                        {orderStatusLabels[value]}
                      </option>
                    ))}
                  </select>
                </header>
                <dl className="order-facts">
                  <div>
                    <dt>مشتری</dt>
                    <dd>{order.customer}</dd>
                  </div>
                  <div>
                    <dt>تلفن</dt>
                    <dd dir="ltr">
                      {order.phone ? (
                        <a href={`tel:${order.phone}`}>{order.phone}</a>
                      ) : (
                        "—"
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>اثر</dt>
                    <dd>
                      {order.products.map((product) => (
                        <span key={product.slug}>
                          {product.name}
                          {product.radNumber
                            ? ` · RAD/${String(product.radNumber).padStart(3, "0")}`
                            : ""}
                        </span>
                      ))}
                    </dd>
                  </div>
                  <div>
                    <dt>مبلغ</dt>
                    <dd>{money(order.amount)}</dd>
                  </div>
                  <div>
                    <dt>زمان ثبت</dt>
                    <dd>{dateTime(order.createdAt)}</dd>
                  </div>
                  {order.deliveredAt ? (
                    <div>
                      <dt>تحویل</dt>
                      <dd>{dateTime(order.deliveredAt)}</dd>
                    </div>
                  ) : null}
                </dl>
                <AdminOrderPayment
                  order={order}
                  canWrite={canWrite}
                  onApprove={onApprovePayment}
                  onReject={onRejectPayment}
                />
                <AdminOrderMessages
                  messages={messages.filter(
                    (message) => message.orderId === order.id,
                  )}
                  canWrite={canWrite}
                  onSetStatus={onSetMessageStatus}
                  onReply={onReplyMessage}
                />
                <AdminOrderDamage
                  reports={damageReports.filter(
                    (report) => report.orderId === order.id,
                  )}
                  canWrite={canWrite}
                  onReview={onReviewDamage}
                />
                <AdminOrderPolicies order={order} />
                <StageMeter
                  index={current}
                  total={orderStatusProgress.length}
                  label={orderStatusLabels[order.status]}
                  countLabel={
                    terminal
                      ? "شاخهٔ استثنایی"
                      : stageCountLabel(current, orderStatusProgress.length)
                  }
                  kicker="وضعیت فعلی"
                  nextKicker={next ? "مرحله بعد" : undefined}
                  nextLabel={next}
                  compact
                />
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="سفارشی در پایگاه داده نیست"
          description="پس از ثبت سفارش فروشگاه، مسیر کارگاه اینجا دیده می‌شود."
        />
      )}
    </section>
  );
}

function UsersPanel({ users }: { users: AdminUser[] }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const filtered = useMemo(
    () =>
      users.filter((user) =>
        `${user.name} ${user.email} ${user.id}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      ),
    [users, query],
  );

  return (
    <section className="paper-panel data-view">
      <div className="view-heading">
        <div>
          <span className="eyebrow">حساب‌های فروشگاه</span>
          <h2>مشتریان</h2>
          <p>کاربرانی که از فروشگاه ثبت‌نام کرده‌اند.</p>
        </div>
      </div>
      <div className="toolbar">
        <div className="search-field">
          <Search />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="جست‌وجوی نام، ایمیل یا شناسه"
            aria-label="جست‌وجوی مشتریان"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label="پاک کردن جست‌وجو"
            >
              <X />
            </button>
          ) : null}
        </div>
      </div>
      {filtered.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>نام</th>
                <th>ایمیل</th>
                <th>وضعیت</th>
                <th>تاریخ ثبت‌نام</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.name}</strong>
                    <small>{user.id}</small>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <StatusBadge
                      label={user.status === "active" ? "فعال" : "دعوت‌شده"}
                      tone={user.status === "active" ? "green" : "muted"}
                    />
                  </td>
                  <td>{date(user.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="مشتری‌ای پیدا نشد"
          description={
            users.length
              ? "عبارت جست‌وجو را تغییر دهید."
              : "هنوز کسی از فروشگاه ثبت‌نام نکرده است."
          }
        />
      )}
    </section>
  );
}

function Members({
  members,
  canWrite,
  onInvite,
  onChange,
}: {
  members: AdminMember[];
  canWrite: boolean;
  onInvite: () => void;
  onChange: (member: AdminMember) => void | Promise<void>;
}) {
  return (
    <section className="paper-panel data-view">
      <div className="view-heading">
        <div>
          <span className="eyebrow">حریم کارگاه</span>
          <h2>افراد و دسترسی</h2>
          <p>دسترسی هر فرد را بر اساس مسئولیت واقعی او تنظیم کنید.</p>
        </div>
        <button
          className="primary-action"
          type="button"
          onClick={onInvite}
          disabled={!canWrite}
        >
          <Plus />
          دعوت فرد جدید
        </button>
      </div>
      <div className="member-list">
        {members.map((member) => (
          <article className="member-row" key={member.id}>
            <div className="member-avatar">{member.name.slice(0, 1)}</div>
            <div>
              <strong>{member.name}</strong>
              <small>{member.email}</small>
            </div>
            <StatusBadge
              label={member.status === "active" ? "فعال" : "دعوت‌شده"}
              tone={member.status === "active" ? "green" : "muted"}
            />
            <select
              value={member.role}
              disabled={!canWrite || member.role === "owner"}
              onChange={(event) =>
                onChange({ ...member, role: event.target.value as AdminRole })
              }
              aria-label={`نقش ${member.name}`}
            >
              {Object.entries(roleLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </article>
        ))}
      </div>
      <div className="permission-note">
        <ShieldCheck />
        <div>
          <strong>مجوزها روی سرور بررسی می‌شوند</strong>
          <p>
            هر تغییر محصول، سفارش یا عضو از طریق API و نقش ذخیره‌شده در پایگاه
            داده کنترل می‌شود.
          </p>
        </div>
      </div>
    </section>
  );
}

function ProductDialog({
  product,
  onClose,
  onSave,
  onUploadImage,
  onFetchAttributes,
  onDelete,
}: {
  product: AdminProduct | null;
  onClose: () => void;
  onSave: (product: AdminProduct) => void | Promise<void>;
  onUploadImage: (
    slug: string,
    file: File,
    onProgress?: (value: number) => void,
    signal?: AbortSignal,
  ) => Promise<{
    storage: AdminRemoteMediaStorage;
    objectKey: string;
  }>;
  onFetchAttributes: (category: string) => Promise<ProductAttribute[]>;
  onDelete?: () => void;
}) {
  useBodyScrollLock();
  const [draft, setDraft] = useState<AdminProduct>(
    product ?? {
      id: crypto.randomUUID(),
      slug: "",
      name: "",
      description: "",
      category: "گلدان",
      price: 0,
      status: "draft",
      artist: "استودیو رَد",
      images: [],
      updatedAt: Date.now(),
      attributeValues: {},
    },
  );
  const [imageError, setImageError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [attributeErrors, setAttributeErrors] = useState<
    Record<string, string>
  >({});
  const [saving, setSaving] = useState(false);
  const [limits, setLimits] = useState<{ image: number; video: number } | null>(
    null,
  );
  const [categoryAttributes, setCategoryAttributes] = useState<
    ProductAttribute[]
  >([]);
  const [attributesLoading, setAttributesLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setAttributesLoading(true);
    onFetchAttributes(draft.category)
      .then((list) => {
        if (active) setCategoryAttributes(list);
      })
      .catch(() => {
        if (active) setCategoryAttributes([]);
      })
      .finally(() => {
        if (active) setAttributesLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.category]);
  const [uploads, setUploads] = useState<
    Record<
      string,
      { file: File; progress: number; error?: string; pending: boolean }
    >
  >({});
  const controllers = useRef(new Map<string, AbortController>());
  const previewUrlsRef = useRef<string[]>([]);
  const uploadingCount = Object.values(uploads).filter(
    (item) => item.pending,
  ).length;
  const unresolvedUploads = Object.values(uploads).some(
    (item) => item.pending || item.error,
  );
  useEffect(() => {
    let mounted = true;
    api<{ image: number; video: number }>("/admin/media/limits")
      .then((value) => {
        if (mounted) setLimits(value);
      })
      .catch(() => {
        if (mounted)
          setImageError(
            "دریافت محدودیت فایل ممکن نشد. پنجره را دوباره باز کنید.",
          );
      });
    const activeControllers = controllers.current;
    return () => {
      mounted = false;
      activeControllers.forEach((controller) => controller.abort());
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving || unresolvedUploads) return;
    const next: Record<string, string> = {};
    if (!draft.name.trim()) next.name = "نام محصول را وارد کنید.";
    if (!draft.description.trim())
      next.description = "توضیحات محصول را وارد کنید.";
    if (!draft.slug.trim()) next.slug = "شناسهٔ URL را وارد کنید.";
    if (!draft.artist.trim()) next.artist = "نام هنرمند را وارد کنید.";
    if (!Number.isFinite(draft.price) || draft.price <= 0)
      next.price = "قیمت باید بیشتر از صفر باشد.";
    if (!draft.images.some((image) => !isVideoStorage(image.storage))) {
      setImageError("حداقل یک تصویر برای اثر لازم است.");
      return;
    }
    const nextAttributeErrors: Record<string, string> = {};
    for (const attribute of categoryAttributes) {
      if (!attribute.required) continue;
      const value = draft.attributeValues?.[attribute.id];
      const empty =
        value === undefined ||
        value === null ||
        value === "" ||
        (Array.isArray(value) && value.length === 0);
      if (empty) nextAttributeErrors[attribute.id] = "این ویژگی الزامی است.";
    }
    setErrors(next);
    setAttributeErrors(nextAttributeErrors);
    if (Object.keys(next).length || Object.keys(nextAttributeErrors).length)
      return;
    setSaving(true);
    try {
      await onSave({ ...draft, updatedAt: Date.now() });
    } finally {
      setSaving(false);
    }
  };
  const setAttributeValue = (
    attributeId: string,
    value: ProductAttributeValue | undefined,
  ) =>
    setDraft((item) => {
      const attributeValues = { ...(item.attributeValues ?? {}) };
      if (value === undefined) delete attributeValues[attributeId];
      else attributeValues[attributeId] = value;
      return { ...item, attributeValues };
    });
  const uploadFile = async (file: File, previewUrl: string) => {
    const controller = new AbortController();
    controllers.current.set(previewUrl, controller);
    setUploads((items) => ({
      ...items,
      [previewUrl]: { file, progress: 0, pending: true },
    }));
    try {
      if (
        !limits ||
        ![
          "image/jpeg",
          "image/png",
          "image/webp",
          "video/mp4",
          "video/webm",
        ].includes(file.type)
      )
        throw new Error(
          "فقط تصویر JPEG، PNG، WebP یا ویدیوی MP4، WebM مجاز است.",
        );
      if (
        !file.size ||
        file.size > limits[file.type.startsWith("video/") ? "video" : "image"]
      )
        throw new Error(
          "فایل خالی است یا حجم آن از محدودیت اعلام‌شده بیشتر است.",
        );
      const result = await onUploadImage(
        draft.slug,
        file,
        (progress) =>
          setUploads((items) =>
            items[previewUrl]
              ? { ...items, [previewUrl]: { ...items[previewUrl], progress } }
              : items,
          ),
        controller.signal,
      );
      if (controller.signal.aborted) return;
      setDraft((item) => ({
        ...item,
        images: item.images.map((image) =>
          image.src === previewUrl ? { ...result, src: previewUrl } : image,
        ),
      }));
      setUploads((items) => ({
        ...items,
        [previewUrl]: { file, progress: 100, pending: false },
      }));
    } catch (error) {
      if (!controller.signal.aborted)
        setUploads((items) => ({
          ...items,
          [previewUrl]: {
            file,
            progress: 0,
            pending: false,
            error:
              error instanceof Error
                ? error.message
                : "بارگذاری ناموفق بود. دوباره تلاش کنید.",
          },
        }));
    } finally {
      controllers.current.delete(previewUrl);
    }
  };
  const addImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    setImageError("");
    for (const file of files) {
      const src = URL.createObjectURL(file);
      previewUrlsRef.current.push(src);
      setDraft((item) => ({
        ...item,
        images: [
          ...item.images,
          {
            storage: file.type.startsWith("video/")
              ? "cloudinary_video"
              : "cloudinary",
            objectKey: "",
            src,
          },
        ],
      }));
      void uploadFile(file, src);
    }
  };
  const removeMedia = (index: number) => {
    const src = draft.images[index].src;
    if (src) {
      controllers.current.get(src)?.abort();
      setUploads((items) => {
        const copy = { ...items };
        delete copy[src];
        return copy;
      });
      if (src.startsWith("blob:")) URL.revokeObjectURL(src);
    }
    setDraft((item) => ({
      ...item,
      images: item.images.filter((_, i) => i !== index),
    }));
  };
  const moveMedia = (index: number, offset: number) =>
    setDraft((item) => {
      const images = [...item.images];
      [images[index], images[index + offset]] = [
        images[index + offset],
        images[index],
      ];
      return { ...item, images };
    });
  const sections: { id: string; label: string; icon: React.ReactNode }[] = [
    { id: "section-basics", label: "اطلاعات اصلی", icon: <Pencil /> },
    { id: "section-category", label: "دسته‌بندی", icon: <Tag /> },
    {
      id: "section-attributes",
      label: "ویژگی‌های محصول",
      icon: <SlidersHorizontal />,
    },
    {
      id: "section-pricing",
      label: "وضعیت و قیمت",
      icon: <CircleDollarSign />,
    },
    { id: "section-images", label: "تصویر و ویدیوی اثر", icon: <ImageIcon /> },
  ];
  const [activeSection, setActiveSection] = useState(sections[0].id);
  const goToSection = (id: string) => {
    setActiveSection(id);
    document
      .getElementById(id)
      ?.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  return (
    <div
      className="editor-shell"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        className="editor-dialog"
        onSubmit={submit}
        noValidate
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-title"
      >
        <aside className="editor-aside">
          <button className="editor-back" type="button" onClick={onClose}>
            <ChevronRight />
            بازگشت به لیست
          </button>
          <div className="editor-cover">
            {draft.images[0]?.src ? (
              <img
                className="product-thumb"
                src={draft.images[0].src}
                alt=""
                style={{ objectFit: "cover" }}
              />
            ) : (
              <div className="product-thumb">
                <Package />
              </div>
            )}
            <label>
              <ImagePlus />
              تغییر کاور
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={addImage}
                aria-label="تغییر تصویر اصلی"
                hidden
              />
            </label>
          </div>
          <nav className="editor-section-nav">
            {sections.map((item) => (
              <button
                key={item.id}
                type="button"
                className={activeSection === item.id ? "active" : ""}
                onClick={() => goToSection(item.id)}
              >
                {item.icon}
                <span>{item.label}</span>
                <ChevronLeft />
              </button>
            ))}
            {product && onDelete && (
              <button className="danger" type="button" onClick={onDelete}>
                <Trash2 />
                <span>حذف محصول</span>
              </button>
            )}
          </nav>
        </aside>

        <div className="editor-main">
          <div className="editor-main-head">
            <h2 id="editor-title">{product ? "ویرایش اثر" : "اثر تازه"}</h2>
            <button
              className="primary-action"
              type="submit"
              disabled={saving || unresolvedUploads}
            >
              <PackageCheck />
              {saving
                ? "در حال ذخیره…"
                : uploadingCount > 0
                  ? "در حال بارگذاری…"
                  : "ذخیره تغییرات"}
            </button>
          </div>

          <section id="section-basics" className="editor-section-card">
            <h3>
              <Pencil />
              اطلاعات اصلی
            </h3>
            <div className="form-grid">
              <Field label="نام اثر" error={errors.name}>
                <input
                  value={draft.name}
                  onChange={(event) =>
                    setDraft({ ...draft, name: event.target.value })
                  }
                  aria-invalid={Boolean(errors.name)}
                />
              </Field>
              <Field label="شناسه (خودکار)" error={errors.slug}>
                <input
                  dir="ltr"
                  value={draft.slug}
                  readOnly={Boolean(product)}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      slug: event.target.value
                        .toLowerCase()
                        .replace(/\s+/g, "-"),
                    })
                  }
                  aria-invalid={Boolean(errors.slug)}
                />
              </Field>
              <Field label="هنرمند" error={errors.artist}>
                <input
                  value={draft.artist}
                  onChange={(event) =>
                    setDraft({ ...draft, artist: event.target.value })
                  }
                  aria-invalid={Boolean(errors.artist)}
                />
              </Field>
            </div>
            <Field label="توضیحات اثر" error={errors.description}>
              <textarea
                rows={5}
                value={draft.description}
                onChange={(event) =>
                  setDraft({ ...draft, description: event.target.value })
                }
                aria-invalid={Boolean(errors.description)}
              />
            </Field>
          </section>

          <section id="section-category" className="editor-section-card">
            <h3>
              <Tag />
              دسته‌بندی
            </h3>
            <div className="form-grid">
              <Field label="دسته‌بندی فرعی">
                <select
                  value={draft.category}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      category: event.target.value as AdminProduct["category"],
                    })
                  }
                >
                  {PRODUCT_CATEGORY_LABELS.map((label) => (
                    <option key={label}>{label}</option>
                  ))}
                </select>
              </Field>
            </div>
          </section>

          <section id="section-attributes" className="editor-section-card">
            <h3>
              <SlidersHorizontal />
              ویژگی‌های محصول
            </h3>
            <ProductAttributeFields
              attributes={categoryAttributes}
              loading={attributesLoading}
              values={draft.attributeValues ?? {}}
              errors={attributeErrors}
              onChange={setAttributeValue}
            />
          </section>

          <section id="section-pricing" className="editor-section-card">
            <h3>
              <CircleDollarSign />
              وضعیت و قیمت
            </h3>
            <div className="form-grid">
              <Field label="قیمت اثر (تومان)" error={errors.price}>
                <input
                  dir="ltr"
                  inputMode="numeric"
                  value={formatPriceInput(draft.price)}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      price: parsePriceInput(event.target.value),
                    })
                  }
                  aria-invalid={Boolean(errors.price)}
                />
              </Field>
              <Field label="وضعیت اثر">
                <select
                  value={draft.status}
                  disabled={Boolean(product?.held)}
                  title={
                    product?.held ? productStatusLabel(product) : undefined
                  }
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      status: event.target.value as AdminProduct["status"],
                    })
                  }
                >
                  {productStatusOptions(product?.status).map((value) => (
                    <option key={value} value={value}>
                      {productStatusLabels[value]}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </section>

          <section id="section-images" className="editor-section-card">
            <h3>
              <ImageIcon />
              تصویر و ویدیوی اثر
            </h3>
            <div className="image-editor">
              <p>حداقل یک تصویر لازم است؛ اولین تصویر، تصویر اصلی اثر است.</p>
              <p>
                {limits
                  ? `تصویر JPEG، PNG، WebP تا ${number.format(limits.image / 1024 / 1024)} مگابایت؛ ویدیوی MP4، WebM تا ${number.format(limits.video / 1024 / 1024)} مگابایت.`
                  : "در حال دریافت محدودیت فایل…"}
              </p>
              <label className="upload-button">
                <ImagePlus /> افزودن تصویر یا ویدیو
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                  onChange={addImage}
                  disabled={!limits || saving}
                  aria-label="بارگذاری تصویر یا ویدیوی اثر"
                />
              </label>
              {imageError && (
                <p className="field-error" role="alert">
                  {imageError}
                </p>
              )}
              {unresolvedUploads && (
                <p role="status">
                  برای ذخیره، منتظر پایان بارگذاری بمانید و فایل‌های ناموفق را
                  دوباره بارگذاری یا حذف کنید.
                </p>
              )}
              <div className="product-media-list">
                {draft.images.map((image, index) => {
                  const upload = image.src ? uploads[image.src] : undefined;
                  return (
                    <div
                      className="product-media-item"
                      key={image.src || image.objectKey || index}
                    >
                      {isVideoStorage(image.storage) ? (
                        <video
                          src={image.src ?? undefined}
                          controls
                          playsInline
                          preload="metadata"
                        />
                      ) : (
                        <img
                          src={image.src ?? undefined}
                          alt={`تصویر ${number.format(index + 1)}`}
                        />
                      )}
                      {upload && <small>{upload.file.name}</small>}
                      {upload?.pending && (
                        <>
                          <progress
                            max={100}
                            value={upload.progress}
                            aria-label="پیشرفت بارگذاری"
                          />
                          <small role="status">
                            {upload.progress === 100
                              ? "در حال بررسی فایل…"
                              : `بارگذاری ${number.format(upload.progress)}٪`}
                          </small>
                        </>
                      )}
                      {upload?.error && (
                        <p className="field-error" role="alert">
                          {upload.error}
                        </p>
                      )}
                      <div className="product-media-actions">
                        {upload?.error && (
                          <button
                            type="button"
                            onClick={() =>
                              void uploadFile(upload.file, image.src!)
                            }
                          >
                            تلاش دوباره
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => removeMedia(index)}
                          aria-label={`حذف فایل ${number.format(index + 1)}`}
                        >
                          حذف
                        </button>
                        <button
                          type="button"
                          disabled={saving || index === 0}
                          onClick={() => moveMedia(index, -1)}
                          aria-label={`جابه‌جایی فایل ${number.format(index + 1)} به قبل`}
                        >
                          قبل
                        </button>
                        <button
                          type="button"
                          disabled={saving || index === draft.images.length - 1}
                          onClick={() => moveMedia(index, 1)}
                          aria-label={`جابه‌جایی فایل ${number.format(index + 1)} به بعد`}
                        >
                          بعد
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </form>
    </div>
  );
}

function InviteDialog({
  onClose,
  onInvite,
}: {
  onClose: () => void;
  onInvite: (member: AdminMember) => void | Promise<void>;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminRole>("viewer");
  const [error, setError] = useState("");
  return (
    <DialogShell
      title="دعوت فرد جدید"
      description="نقش را متناسب با مسئولیت فرد انتخاب کنید."
      onClose={onClose}
    >
      <form
        className="editor-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
            setError("نام و ایمیل معتبر را وارد کنید.");
            return;
          }
          onInvite({
            id: crypto.randomUUID(),
            name,
            email,
            role,
            status: "invited",
          });
        }}
      >
        <Field label="نام و نام خانوادگی">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field label="ایمیل" error={error}>
          <input
            dir="ltr"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(error)}
          />
        </Field>
        <Field label="سطح دسترسی">
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as AdminRole)}
          >
            {Object.entries(roleLabels)
              .filter(([value]) => value !== "owner")
              .map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
          </select>
        </Field>
        <div className="dialog-actions">
          <button className="secondary-action" type="button" onClick={onClose}>
            انصراف
          </button>
          <button className="primary-action" type="submit">
            افزودن دعوت
          </button>
        </div>
      </form>
    </DialogShell>
  );
}

function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "green" | "oxide" | "sand" | "muted";
}) {
  return <span className={`status-badge ${tone}`}>{label}</span>;
}
function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="empty-state">
      <Package />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function AccountSettings({
  user,
  onChangePassword,
  onDone,
}: {
  user: { name: string; email: string };
  onChangePassword: (input: {
    currentPassword: string;
    newPassword: string;
  }) => Promise<{ ok: boolean }>;
  onDone: (message: string) => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  return (
    <section className="paper-panel data-view account-view">
      <div className="view-heading">
        <div>
          <span className="eyebrow">امنیت حساب</span>
          <h2>حساب کاربری</h2>
          <p>
            {user.name} · <span dir="ltr">{user.email}</span>
          </p>
        </div>
      </div>
      <form
        className="editor-form account-form"
        noValidate
        onSubmit={async (event) => {
          event.preventDefault();
          if (newPassword.length < 8) {
            setError("رمز عبور جدید باید حداقل ۸ نویسه باشد.");
            return;
          }
          if (newPassword !== confirmPassword) {
            setError("تکرار رمز عبور با رمز جدید یکسان نیست.");
            return;
          }
          try {
            setError("");
            await onChangePassword({ currentPassword, newPassword });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            onDone("رمز عبور با موفقیت تغییر کرد.");
          } catch (err) {
            setError((err as Error).message);
          }
        }}
      >
        {error && (
          <small className="field-error" role="alert">
            {error}
          </small>
        )}
        <Field label="رمز عبور فعلی">
          <input
            dir="ltr"
            type="password"
            name="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
            minLength={8}
            required
          />
        </Field>
        <div className="form-grid">
          <Field label="رمز عبور جدید">
            <input
              dir="ltr"
              type="password"
              name="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </Field>
          <Field label="تکرار رمز عبور جدید">
            <input
              dir="ltr"
              type="password"
              name="confirm-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </Field>
        </div>
        <p className="account-note">
          مرورگر دسکتاپ می‌تواند رمز جدید را پس از ذخیره، برای ورودهای بعدی
          پیشنهاد دهد.
        </p>
        <div className="dialog-actions account-actions">
          <button className="primary-action" type="submit">
            ذخیره رمز عبور
          </button>
        </div>
      </form>
    </section>
  );
}

function LoginVisual({ tagline }: { tagline?: string }) {
  return (
    <div className="login-visual">
      <svg className="visual-thread" viewBox="0 0 400 600" aria-hidden="true">
        <path d="M60 110 C140 150 90 230 180 220 C 260 212 220 140 320 150" />
      </svg>
      <span className="visual-stone" aria-hidden="true" />
      <div className="brand-block">
        <span className="brand-mark">
          <img src="/rad-logo.png" alt="رَد" width={56} height={56} />
        </span>
        <strong>پنل مدیریت استودیو</strong>
        <small>رَد</small>
      </div>
      {tagline && <p className="visual-tagline">{tagline}</p>}
    </div>
  );
}

function ConnectingScreen() {
  return (
    <div className="connecting-screen" role="status" aria-live="polite">
      <span className="visual-stone" aria-hidden="true" />
      <div className="connecting-dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <p>در حال اتصال به پنل مدیریت…</p>
    </div>
  );
}

function AdminLogin({
  onLogin,
  onForgotPassword,
}: {
  onLogin: (input: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }) => Promise<void>;
  onForgotPassword: (email: string) => Promise<{ message: string }>;
}) {
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState(() => loadRememberedEmail());
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => loadRememberMe());
  const [error, setError] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");
  // Brief "connecting" state shown while the login request is in flight —
  // there is no dedicated backend step for this, it just covers the real
  // request latency so the panel doesn't jump straight from form to shell.
  const [connecting, setConnecting] = useState(false);

  if (connecting) return <ConnectingScreen />;

  if (mode === "forgot") {
    return (
      <div className="login-screen">
        <LoginVisual />
        <div className="login-form-side">
          <section className="login-form-card">
            <span className="eyebrow">دفتر کوره</span>
            <h1>فراموشی رمز عبور</h1>
            <p>
              ایمیل حساب مدیریتی خود را وارد کنید. یک کد ۶ رقمی به ایمیل شما
              ارسال می‌شود.
            </p>
            <form
              className="editor-form"
              noValidate
              onSubmit={async (event) => {
                event.preventDefault();
                try {
                  setError("");
                  const result = await onForgotPassword(email.trim());
                  setForgotMessage(result.message);
                } catch (err) {
                  setError((err as Error).message);
                }
              }}
            >
              {error && (
                <small className="field-error" role="alert">
                  {error}
                </small>
              )}
              {forgotMessage && (
                <div className="login-success" role="status">
                  <p>{forgotMessage}</p>
                  <a
                    className="text-link"
                    href={`/reset-password?email=${encodeURIComponent(email.trim())}`}
                  >
                    وارد کردن کد بازیابی
                  </a>
                </div>
              )}
              <Field label="ایمیل">
                <input
                  dir="ltr"
                  type="email"
                  name="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="username"
                  required
                />
              </Field>
              <button className="primary-action" type="submit">
                ارسال کد بازیابی
              </button>
              <button
                className="text-link-button"
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                  setForgotMessage("");
                }}
              >
                بازگشت به ورود
              </button>
            </form>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="login-screen">
      <LoginVisual tagline="هیچ دو رَدی یکسان نیست." />
      <div className="login-form-side">
        <section className="login-form-card">
          <span className="eyebrow">دفتر کوره</span>
          <h1>ورود به مدیریت رَد</h1>
          <p>
            حساب‌های جدید مشتری از فروشگاه ساخته می‌شوند. محصولات تازه را پس از
            ورود در همین پنل اضافه کنید.
          </p>
          <form
            className="editor-form"
            noValidate
            onSubmit={async (event) => {
              event.preventDefault();
              try {
                setError("");
                saveLoginPreferences(email, rememberMe);
                setConnecting(true);
                await onLogin({ email: email.trim(), password, rememberMe });
              } catch (err) {
                setConnecting(false);
                setError((err as Error).message);
              }
            }}
          >
            {error && (
              <small className="field-error" role="alert">
                {error}
              </small>
            )}
            <Field label="ایمیل">
              <input
                dir="ltr"
                type="email"
                name="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                required
              />
            </Field>
            <Field label="رمز عبور">
              <div className="password-field">
                <input
                  dir="ltr"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={
                    showPassword ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"
                  }
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </Field>
            <label className="remember-field">
              <input
                type="checkbox"
                name="remember"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              <span>
                مرا به خاطر بسپار — ایمیل و ورود در این مرورگر نگه داشته شود
              </span>
            </label>
            <div className="login-actions">
              <button className="primary-action" type="submit">
                ورود
                <ArrowLeft />
              </button>
              <button
                className="text-link-button"
                type="button"
                onClick={() => {
                  setMode("forgot");
                  setError("");
                }}
              >
                رمز عبور را فراموش کرده‌اید؟
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

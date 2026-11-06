"use client";
import { api } from "../lib/api";
import { effectiveProductStatus } from "@rad/types";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Eye,
  EyeOff,
  Image as ImageIcon,
  ImagePlus,
  Inbox,
  Package,
  PackageCheck,
  Pencil,
  Plus,
  ScrollText,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { useAdminChrome, type AdminWorkspace } from "./admin-shell";
import { passwordChangeError } from "../lib/password-change";
import {
  commissionStageLabels,
  isVideoStorage,
  productStatusLabel,
  productStatusLabels,
  productStatusOptions,
  PRODUCT_CATEGORY_LABELS,
  type AdminContactMessage,
  type AdminProduct,
  type AdminRemoteMediaStorage,
  type AdminSection,
  type ProductAttribute,
  type ProductAttributeValue,
} from "../lib/admin-data";
import { AdminCommissions } from "./admin-commissions";
import { AdminDamageReports } from "./admin-damage-reports";
import { AdminOrders } from "./orders/admin-orders";
import "./orders/admin-orders.css";
import type { DamageReview } from "./admin-damage-report";
import {
  ConfirmDialog,
  Field,
  useBodyScrollLock,
  useIsMobileViewport,
} from "./admin-dialog";
import { AdminShapeQuestions } from "./admin-shape-questions";
import { AdminProductAttributes } from "./admin-product-attributes";
import { EmptyState, StatusBadge } from "./admin-list-chrome";
import { InviteDialog, Members } from "./admin-members";
import { UsersPanel } from "./admin-users";
import { ProductAttributeFields } from "./admin-product-attribute-fields";
import { AdminRowMenu } from "./admin-row-menu";
import { OverviewStats } from "./admin-overview-stats";
import {
  briefExcerpt,
  canSelectAsCover,
  coverImage,
  selectAsCover,
  selectAsCoverBySrc,
} from "../lib/product-cover";

const number = new Intl.NumberFormat("fa-IR");
const money = (value: number) => `${number.format(value)} تومان`;
const date = (value: number) =>
  new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(value);

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
  const [productEditor, setProductEditor] = useState<
    AdminProduct | "new" | null
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null);
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
      {section === "shape" && (
        <AdminShapeQuestions
          questions={workspace.shapeQuestions}
          {...sectionAsync(workspace, "shapeQuestions")}
          canWrite={workspace.can("content.write")}
          onSave={async (input, id) => {
            await workspace.saveShapeQuestion(input, id);
            announce(id ? "سؤال ذخیره شد." : "سؤال تازه به پرسشنامه اضافه شد.");
            return true;
          }}
          onDelete={async (id) => {
            await workspace.deleteShapeQuestion(id);
            announce("سؤال از پرسشنامه حذف شد.");
          }}
          onReorder={async (ids) => {
            await workspace.reorderShapeQuestions(ids);
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
  const isMobile = useIsMobileViewport();
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
                      {isMobile ? null : (
                        <AdminRowMenu
                          open={openMenuId === product.id}
                          onToggle={() =>
                            setOpenMenuId((current) =>
                              current === product.id ? null : product.id,
                            )
                          }
                          onClose={() => setOpenMenuId(null)}
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
                      )}
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
                <div className="product-copy">
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
                </div>
                {isMobile ? (
                  <AdminRowMenu
                    open={openMenuId === product.id}
                    onToggle={() =>
                      setOpenMenuId((current) =>
                        current === product.id ? null : product.id,
                      )
                    }
                    onClose={() => setOpenMenuId(null)}
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
                ) : null}
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

function ProductThumb({ product }: { product: AdminProduct }) {
  const cover = coverImage(product.images);
  return (
    <div className="product-thumb">
      {cover?.src ? <img src={cover.src} alt="" /> : <Package />}
      <span>{number.format(product.images.length)} عکس</span>
    </div>
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
      subtitle: "",
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
  const pendingCover = useRef(new Set<string>());
  const mediaInputId = "product-media-upload";
  const coverInputId = "product-cover-upload";
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
      setDraft((item) => {
        const images = item.images.map((image) =>
          image.src === previewUrl ? { ...result, src: previewUrl } : image,
        );
        return pendingCover.current.has(previewUrl)
          ? { ...item, images: selectAsCoverBySrc(images, previewUrl) }
          : { ...item, images };
      });
      pendingCover.current.delete(previewUrl);
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
  const addImage = (
    event: React.ChangeEvent<HTMLInputElement>,
    asCover = false,
  ) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    setImageError("");
    for (const file of files) {
      if (asCover && file.type.startsWith("video/")) {
        setImageError("کاور اثر باید تصویر باشد، نه ویدیو.");
        continue;
      }
      const src = URL.createObjectURL(file);
      previewUrlsRef.current.push(src);
      if (asCover) pendingCover.current.add(src);
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
      pendingCover.current.delete(src);
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
  const setCover = (index: number) =>
    setDraft((item) => ({
      ...item,
      images: selectAsCover(item.images, index, uploads),
    }));
  const previewCover = coverImage(draft.images, uploads);
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
            {previewCover?.src ? (
              <img
                className="product-thumb"
                src={previewCover.src}
                alt=""
                style={{ objectFit: "cover" }}
              />
            ) : (
              <div className="product-thumb">
                <Package />
              </div>
            )}
            <label htmlFor={coverInputId} className="upload-button">
              <ImagePlus />
              تغییر کاور
            </label>
            <input
              id={coverInputId}
              className="sr-file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => addImage(event, true)}
              disabled={!limits || saving}
            />
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
            <Field label="زیرعنوان کوتاه (اختیاری)">
              <input
                value={draft.subtitle ?? ""}
                placeholder="خالی بماند تا از ابتدای توضیحات ساخته شود"
                onChange={(event) =>
                  setDraft({ ...draft, subtitle: event.target.value })
                }
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
              <p>
                حداقل یک تصویر لازم است. تصویر کاور در کارت فروشگاه و اولین
                تصویر صفحهٔ اثر نمایش داده می‌شود.
              </p>
              <p>
                {limits
                  ? `تصویر JPEG، PNG، WebP تا ${number.format(limits.image / 1024 / 1024)} مگابایت؛ ویدیوی MP4، WebM تا ${number.format(limits.video / 1024 / 1024)} مگابایت.`
                  : "در حال دریافت محدودیت فایل…"}
              </p>
              <label htmlFor={mediaInputId} className="upload-button">
                <ImagePlus /> افزودن تصویر یا ویدیو
              </label>
              <input
                id={mediaInputId}
                className="sr-file"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                onChange={(event) => addImage(event)}
                disabled={!limits || saving}
              />
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
                  const isCover = coverImage(draft.images, uploads) === image;
                  const coverReady = canSelectAsCover(image, upload);
                  return (
                    <div
                      className={`product-media-item${isCover ? " is-cover" : ""}`}
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
                      {isCover && (
                        <span className="cover-badge">کاور انتخاب‌شده</span>
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
                        {!isVideoStorage(image.storage) && (
                          <button
                            type="button"
                            className={isCover ? "cover-selected" : ""}
                            disabled={saving || isCover || !coverReady}
                            onClick={() => setCover(index)}
                          >
                            {isCover ? "کاور فعلی" : "انتخاب به‌عنوان کاور"}
                          </button>
                        )}
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

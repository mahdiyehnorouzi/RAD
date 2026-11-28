"use client";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  effectiveProductStatus,
  formatRadCode,
  type AdminCategory,
} from "@rad/types";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Package,
  Plus,
  Search,
} from "lucide-react";
import { AdminSearchField, Button } from "@rad/ui";
import {
  productStatusLabel,
  productStatusLabels,
  type AdminProduct,
} from "../../lib/admin-data";
import { AdminRowMenu } from "../../components/admin-row-menu";
import { EmptyState, StatusBadge } from "../../components/admin-list-chrome";
import { API_BASE } from "../../lib/api";
import { coverImage } from "../../lib/product-cover";
import { persianSearchIncludes } from "../../lib/persian-text";
import { childrenOf, parentsOf } from "../../lib/product-category";
import "./products-workspace.css";

const number = new Intl.NumberFormat("fa-IR");
const money = (value: number) => `${number.format(value)} تومان`;
const date = (value: number) =>
  new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(value);

export function productStatusTone(
  product: Pick<AdminProduct, "status" | "reservedUntil">,
): "green" | "oxide" | "sand" | "muted" {
  const effective = effectiveProductStatus(product);
  if (effective === "available") return "green";
  if (effective === "reserved") return "sand";
  if (effective === "sold") return "oxide";
  return "muted";
}

type ProductSort = "newest" | "oldest" | "price_desc" | "price_asc";

const PAGE_SIZE = 10;

export function Products({
  products,
  canWrite,
  onCreate,
  onEdit,
  onDelete,
  selectedId = null,
  catalog = [],
}: {
  products: AdminProduct[];
  canWrite: boolean;
  onCreate: () => void;
  onEdit: (product: AdminProduct) => void;
  onDelete: (product: AdminProduct) => void;
  selectedId?: string | null;
  catalog?: AdminCategory[];
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<ProductSort>("newest");
  const [statusFilter, setStatusFilter] = useState<
    AdminProduct["status"] | "all"
  >("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [trackedSelection, setTrackedSelection] = useState(selectedId);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const filtersActive =
    sort !== "newest" || statusFilter !== "all" || categoryFilter !== "all";

  const categoryLabel = useCallback(
    (product: AdminProduct) => {
      if (!catalog.length) return product.category;
      const parent = product.categorySlug
        ? parentsOf(catalog).find((item) => item.slug === product.categorySlug)
        : parentsOf(catalog).find((item) => item.name.fa === product.category);
      if (!parent) return product.category;
      const child = product.subcategory
        ? childrenOf(parent.slug, catalog).find(
            (item) => item.slug === product.subcategory,
          )
        : undefined;
      return child ? `${parent.name.fa} / ${child.name.fa}` : parent.name.fa;
    },
    [catalog],
  );
  const categories = useMemo(
    () => Array.from(new Set(products.map((item) => categoryLabel(item)))),
    [products, categoryLabel],
  );

  const filtered = useMemo(() => {
    const list = products
      .filter((product) =>
        persianSearchIncludes(
          `${product.name} ${product.artist} ${product.slug}`,
          query,
        ),
      )
      .filter(
        (product) => statusFilter === "all" || product.status === statusFilter,
      )
      .filter(
        (product) =>
          categoryFilter === "all" || categoryLabel(product) === categoryFilter,
      );
    return [...list].sort((a, b) => {
      if (sort === "newest") return b.updatedAt - a.updatedAt;
      if (sort === "oldest") return a.updatedAt - b.updatedAt;
      if (sort === "price_desc") return b.price - a.price;
      return a.price - b.price;
    });
  }, [products, query, statusFilter, categoryFilter, sort, categoryLabel]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const resetToFirstPage = () => setPage(1);
  if (selectedId !== trackedSelection) {
    setTrackedSelection(selectedId);
    if (selectedId) {
      const index = filtered.findIndex((item) => item.id === selectedId);
      if (index >= 0) setPage(Math.floor(index / PAGE_SIZE) + 1);
    }
  }

  const selectedHidden =
    Boolean(selectedId) &&
    products.some((item) => item.id === selectedId) &&
    !filtered.some((item) => item.id === selectedId);

  return (
    <section
      className="product-pane products-list-pane"
      aria-label="فهرست آثار"
    >
      <div className="product-pane-head">
        <div>
          <span className="eyebrow">کاتالوگ یک‌به‌یک</span>
          <h2>آثار و محصولات</h2>
          <p>تمام آثار ثبت‌شده در استودیو؛ هر اثر فقط یک‌بار ساخته شده است.</p>
        </div>
        <Button
          className="product-add"
          shape="icon"
          size="sm"
          onClick={onCreate}
          disabled={!canWrite}
          aria-label="افزودن اثر"
        >
          <Plus />
        </Button>
      </div>
      <AdminSearchField
        ref={inputRef}
        icon={<Search />}
        value={query}
        onChange={(next) => {
          setQuery(next);
          resetToFirstPage();
          if (!next) inputRef.current?.focus();
        }}
        placeholder="جست‌وجوی نام، هنرمند یا شناسه"
        aria-label="جست‌وجوی محصولات"
        clearLabel="پاک کردن جست‌وجو"
      />
      <button
        type="button"
        className={`product-filter-toggle${filtersOpen ? " is-open" : ""}`}
        aria-expanded={filtersOpen}
        onClick={() => setFiltersOpen((open) => !open)}
      >
        <span>
          فیلترها
          {filtersActive ? (
            <span className="product-filter-active">فعال</span>
          ) : null}
        </span>
        <ChevronDown aria-hidden="true" />
      </button>
      <div className={`product-filters${filtersOpen ? " is-open" : ""}`}>
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
        <span className="product-results">
          {number.format(filtered.length)} محصول
        </span>
      </div>
      {selectedHidden ? (
        <p className="product-results" role="status">
          اثر انتخاب‌شده با جست‌وجو یا فیلتر فعلی دیده نمی‌شود. فیلتر را عوض
          کنید تا در فهرست برگردد.
        </p>
      ) : null}
      {pageItems.length ? (
        <>
          <ul className="product-card-list">
            {pageItems.map((product) => {
              const selected = product.id === selectedId;
              return (
                <li key={product.id}>
                  <article
                    id={`product-card-${product.id}`}
                    className={`product-card${selected ? " is-selected" : ""}`}
                  >
                    <div className="product-card-top">
                      <span className="product-card-kicker">
                        <span className="product-card-category">
                          {categoryLabel(product)}
                        </span>
                        <span className="product-card-artist">
                          {product.artist}
                        </span>
                      </span>
                      <StatusBadge
                        label={productStatusLabel(product)}
                        tone={productStatusTone(product)}
                      />
                    </div>
                    <div className="product-card-main">
                      <button
                        type="button"
                        className="product-card-open"
                        aria-pressed={selected}
                        onClick={() => onEdit(product)}
                      >
                        <div className="product-card-copy">
                          <h3>{product.name}</h3>
                          <span className="product-card-price">
                            {money(product.price)}
                          </span>
                          <span className="product-card-meta">
                            {product.radNumber
                              ? `RAD-${formatRadCode(product.radNumber)} · `
                              : ""}
                            {`ویرایش ${date(product.updatedAt)}`}
                          </span>
                        </div>
                        <div className="product-card-side">
                          <ProductThumb product={product} />
                          <span className="product-photo-count">
                            {number.format(product.images.length)} عکس
                          </span>
                        </div>
                      </button>
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
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
          {totalPages > 1 && (
            <nav className="pagination" aria-label="صفحه‌بندی محصولات">
              <Button
                variant="ghost"
                shape="icon"
                size="sm"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={currentPage === 1}
                aria-label="صفحه قبل"
              >
                <ChevronRight />
              </Button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (pageNumber) => (
                  <Button
                    key={pageNumber}
                    variant="ghost"
                    shape="icon"
                    size="sm"
                    className={pageNumber === currentPage ? "active" : ""}
                    aria-pressed={pageNumber === currentPage}
                    aria-label={`صفحه ${number.format(pageNumber)}`}
                    onClick={() => setPage(pageNumber)}
                  >
                    {number.format(pageNumber)}
                  </Button>
                ),
              )}
              <Button
                variant="ghost"
                shape="icon"
                size="sm"
                onClick={() =>
                  setPage((value) => Math.min(totalPages, value + 1))
                }
                disabled={currentPage === totalPages}
                aria-label="صفحه بعد"
              >
                <ChevronLeft />
              </Button>
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

export function ProductThumb({ product }: { product: AdminProduct }) {
  const cover = coverImage(product.images);
  return (
    <div className="product-thumb">
      {cover?.src ? (
        <img
          src={
            cover.src.startsWith("/") && !cover.src.startsWith("//")
              ? `${API_BASE}${cover.src}`
              : cover.src
          }
          alt=""
        />
      ) : (
        <Package />
      )}
    </div>
  );
}

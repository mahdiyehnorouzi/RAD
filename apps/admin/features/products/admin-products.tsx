"use client";
import { useMemo, useRef, useState } from "react";
import { effectiveProductStatus, formatRadCode } from "@rad/types";
import {
  ChevronLeft,
  ChevronRight,
  Package,
  Plus,
  Search,
  X,
} from "lucide-react";
import { Button } from "@rad/ui";
import {
  productStatusLabel,
  productStatusLabels,
  type AdminProduct,
} from "../../lib/admin-data";
import { AdminRowMenu } from "../../components/admin-row-menu";
import { EmptyState, StatusBadge } from "../../components/admin-list-chrome";
import { coverImage } from "../../lib/product-cover";
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
}: {
  products: AdminProduct[];
  canWrite: boolean;
  onCreate: () => void;
  onEdit: (product: AdminProduct) => void;
  onDelete: (product: AdminProduct) => void;
  selectedId?: string | null;
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
        <Button className="product-add" onClick={onCreate} disabled={!canWrite}>
          <Plus />
          افزودن اثر
        </Button>
      </div>
      <div className="product-search">
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
          <Button
            variant="ghost"
            shape="icon"
            size="sm"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
              resetToFirstPage();
            }}
            aria-label="پاک کردن جست‌وجو"
          >
            <X />
          </Button>
        )}
      </div>
      <div className="product-filters">
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
                    <button
                      type="button"
                      className="product-card-open"
                      aria-pressed={selected}
                      onClick={() => onEdit(product)}
                    >
                      <div className="product-card-copy">
                        <span className="product-card-kicker">
                          {product.category} · {product.artist}
                        </span>
                        <h3>{product.name}</h3>
                        <span className="product-card-meta">
                          {product.slug}
                        </span>
                        <div className="product-card-row">
                          <StatusBadge
                            label={productStatusLabel(product)}
                            tone={productStatusTone(product)}
                          />
                          <strong>{money(product.price)}</strong>
                        </div>
                        <span className="product-card-meta">
                          {product.radNumber
                            ? `RAD-${formatRadCode(product.radNumber)} · `
                            : ""}
                          ویرایش {date(product.updatedAt)}
                        </span>
                      </div>
                      <ProductThumb product={product} />
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
      {cover?.src ? <img src={cover.src} alt="" /> : <Package />}
      <span>{number.format(product.images.length)} عکس</span>
    </div>
  );
}

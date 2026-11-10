"use client";
import { useMemo, useRef, useState } from "react";
import { effectiveProductStatus } from "@rad/types";
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
import { useIsMobileViewport } from "../../components/admin-dialog";
import { AdminRowMenu } from "../../components/admin-row-menu";
import { EmptyState, StatusBadge } from "../../components/admin-list-chrome";
import { coverImage } from "../../lib/product-cover";

const number = new Intl.NumberFormat("fa-IR");
const money = (value: number) => `${number.format(value)} تومان`;
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

type ProductSort = "newest" | "oldest" | "price_desc" | "price_asc";

const PAGE_SIZE = 10;

export function Products({
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
        <Button onClick={onCreate} disabled={!canWrite}>
          <Plus />
          افزودن اثر
        </Button>
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

export function ProductThumb({ product }: { product: AdminProduct }) {
  const cover = coverImage(product.images);
  return (
    <div className="product-thumb">
      {cover?.src ? <img src={cover.src} alt="" /> : <Package />}
      <span>{number.format(product.images.length)} عکس</span>
    </div>
  );
}

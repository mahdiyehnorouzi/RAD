"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  formatRadCode,
  type RadIdentityBatchView,
  type RadIdentitySummary,
  type RadIdentityView,
} from "@rad/types";
import { AdminSearchField, Button } from "@rad/ui";
import { QrCode, Search } from "lucide-react";
import { useAdminChrome } from "../../components/admin-shell";
import { StatTile } from "../../components/admin-stat-tile";
import { api, API_BASE } from "../../lib/api";
import type { AdminProduct } from "../../lib/admin-data";
import { readDownload, shouldShareDownload } from "../../lib/download-file";
import {
  activeIdentityCard,
  artworkStoryIsPublic,
  identityFilterForCard,
  productEditorHref,
  publicPassportUrl,
  type IdentitySummaryCard,
} from "../../lib/identity-registry";
import { coverImage } from "../../lib/product-cover";
import { useDebouncedValue } from "../../hooks/use-debounced-value";
import { useLatestRequest } from "../../hooks/use-latest-request";

const number = new Intl.NumberFormat("fa-IR");
const date = new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" });
const PAGE_SIZE = 24;

const statusLabel = {
  reserved: "رزرو",
  assigned: "متصل به اثر",
  retired: "بازنشسته",
} as const;

type Detail = RadIdentityView & {
  events?: RadIdentityView["events"];
};

export function TagsPage() {
  const { workspace, announce } = useAdminChrome();
  const canWrite = workspace.can("product.write");
  const [summary, setSummary] = useState<RadIdentitySummary | null>(null);
  const [rows, setRows] = useState<RadIdentityView[]>([]);
  const [batches, setBatches] = useState<RadIdentityBatchView[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<
    "" | "reserved" | "assigned" | "retired"
  >("");
  const [assignment, setAssignment] = useState<"" | "unassigned" | "assigned">(
    "",
  );
  const [printed, setPrinted] = useState<"" | "printed">("");
  const [batchId, setBatchId] = useState("");
  const [page, setPage] = useState(0);
  const [quantity, setQuantity] = useState(100);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Detail | null>(null);
  const [assignProductId, setAssignProductId] = useState("");
  const [busyDownload, setBusyDownload] = useState<string | null>(null);

  const debouncedQuery = useDebouncedValue(query, 300);
  const { begin, isLatest } = useLatestRequest();

  const load = useCallback(async () => {
    const requestId = begin();
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
    if (status) params.set("status", status);
    if (assignment) params.set("assignment", assignment);
    if (batchId) params.set("batchId", batchId);
    const suffix = params.size ? `?${params}` : "";
    try {
      const [nextSummary, nextRows, nextBatches] = await Promise.all([
        api<RadIdentitySummary>("/admin/identities/summary"),
        api<RadIdentityView[]>(`/admin/identities${suffix}`),
        api<RadIdentityBatchView[]>("/admin/identities/batches"),
      ]);
      if (!isLatest(requestId)) return;
      setSummary(nextSummary);
      setRows(nextRows);
      setBatches(nextBatches);
    } catch (cause) {
      if (!isLatest(requestId)) return;
      setError((cause as Error).message);
    } finally {
      if (isLatest(requestId)) setLoading(false);
    }
  }, [assignment, batchId, debouncedQuery, status, begin, isLatest]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(0);
  }, [debouncedQuery, status, assignment, printed, batchId]);

  const visible = useMemo(
    () => rows.filter((row) => (printed === "printed" ? row.printed : true)),
    [printed, rows],
  );
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const pageRows = visible.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const activeCard = activeIdentityCard({
    status,
    assignment,
    printed,
    batchId,
  });

  const openProducts = useMemo(
    () =>
      workspace.products.filter(
        (product) => product.radNumber == null && product.id,
      ),
    [workspace.products],
  );
  const productById = useMemo(
    () => new Map(workspace.products.map((product) => [product.id, product])),
    [workspace.products],
  );

  function applyCard(card: IdentitySummaryCard) {
    const next = identityFilterForCard(card);
    setQuery("");
    setStatus(next.status);
    setAssignment(next.assignment);
    setPrinted(next.printed);
    setBatchId("");
    document
      .getElementById("identity-registry")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function reserve() {
    try {
      const result = await api<{
        startNumber: number;
        endNumber: number;
        replayed: boolean;
      }>("/admin/identities/batches", {
        method: "POST",
        body: JSON.stringify({
          quantity,
          idempotencyKey: crypto.randomUUID().replace(/-/g, ""),
        }),
      });
      announce(
        result.replayed
          ? "همین درخواست قبلاً ثبت شده بود."
          : `شماره‌های ${formatRadCode(result.startNumber)} تا ${formatRadCode(result.endNumber)} رزرو شد.`,
      );
      await load();
    } catch (cause) {
      announce((cause as Error).message);
    }
  }

  async function openIdentity(id: string) {
    try {
      const detail = await api<Detail>(`/admin/identities/${id}`);
      setSelected(detail);
      setAssignProductId("");
      requestAnimationFrame(() => {
        document
          .getElementById("identity-detail")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (cause) {
      announce((cause as Error).message);
    }
  }

  async function assign() {
    if (!selected || !assignProductId) return;
    try {
      await api(`/admin/identities/${selected.id}/assign`, {
        method: "POST",
        body: JSON.stringify({ productId: assignProductId }),
      });
      announce("شماره به اثر وصل شد.");
      setSelected(null);
      await load();
    } catch (cause) {
      announce((cause as Error).message);
    }
  }

  async function downloadFile(path: string, fallback: string) {
    if (busyDownload) return;
    setBusyDownload(path);
    try {
      const response = await fetch(`${API_BASE}${path}`, {
        credentials: "include",
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(data.message || "دانلود انجام نشد. دوباره تلاش کنید.");
      }
      const result = await readDownload(response, fallback);
      if ("error" in result) throw new Error(result.error);
      const file = new File([result.blob], result.filename, {
        type: result.blob.type || "application/octet-stream",
      });
      const canShare =
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] });
      if (shouldShareDownload(navigator.userAgent, canShare)) {
        try {
          await navigator.share({ files: [file], title: result.filename });
        } catch (cause) {
          if ((cause as Error).name === "AbortError") return;
          throw cause;
        }
        return;
      }
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      announce("دانلود شروع شد.");
    } catch (cause) {
      announce((cause as Error).message);
    } finally {
      setBusyDownload(null);
    }
  }

  async function markPrinted(id: string) {
    try {
      await api(`/admin/identities/batches/${id}/printed`, { method: "POST" });
      announce("چاپ این دسته ثبت شد.");
      await load();
    } catch (cause) {
      announce((cause as Error).message);
    }
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      announce("پیوند کپی شد.");
    } catch {
      announce("کپی پیوند ناموفق بود.");
    }
  }

  const filtersActive = Boolean(
    status || assignment || printed || batchId || query,
  );

  return (
    <section className="admin-section tags-workspace">
      <div className="panel-heading">
        <div>
          <h1>تگ‌ها و QR</h1>
          <p>
            شماره رَد چاپ‌شده عوض نمی‌شود، حتی اگر نام یا نشانی اثر عوض شود.
          </p>
        </div>
      </div>
      <div className="stat-grid">
        <StatTile
          icon={<QrCode />}
          value={summary?.total ?? 0}
          label="همه شماره‌ها"
          loading={loading && !summary}
          pressed={activeCard === "all"}
          onSelect={() => applyCard("all")}
        />
        <StatTile
          icon={<QrCode />}
          value={summary?.unassigned ?? 0}
          label="رزرو و بدون اثر"
          loading={loading && !summary}
          pressed={activeCard === "unassigned"}
          onSelect={() => applyCard("unassigned")}
        />
        <StatTile
          icon={<QrCode />}
          value={summary?.assigned ?? 0}
          label="متصل به اثر"
          loading={loading && !summary}
          pressed={activeCard === "assigned"}
          onSelect={() => applyCard("assigned")}
        />
        <StatTile
          icon={<QrCode />}
          value={summary?.printed ?? 0}
          label="چاپ‌شده"
          loading={loading && !summary}
          pressed={activeCard === "printed"}
          onSelect={() => applyCard("printed")}
        />
        <StatTile
          icon={<QrCode />}
          value={summary?.retired ?? 0}
          label="بازنشسته"
          loading={loading && !summary}
          pressed={activeCard === "retired"}
          onSelect={() => applyCard("retired")}
        />
      </div>

      <div className="paper-panel identity-registry" id="identity-registry">
        <div className="form-grid">
          <label>
            جستجو
            <AdminSearchField
              icon={<Search />}
              value={query}
              onChange={setQuery}
              placeholder="شماره، RAD-082 یا نام اثر"
              aria-label="جستجوی شماره رَد"
            />
          </label>
          <label>
            وضعیت
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as typeof status)
              }
            >
              <option value="">همه</option>
              <option value="reserved">رزرو</option>
              <option value="assigned">متصل</option>
              <option value="retired">بازنشسته</option>
            </select>
          </label>
          <label>
            اتصال
            <select
              value={assignment}
              onChange={(event) =>
                setAssignment(event.target.value as typeof assignment)
              }
            >
              <option value="">همه</option>
              <option value="unassigned">بدون اثر</option>
              <option value="assigned">دارای اثر</option>
            </select>
          </label>
          <label>
            دسته چاپ
            <select
              value={batchId}
              onChange={(event) => setBatchId(event.target.value)}
            >
              <option value="">همه</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.startCode}–{batch.endCode}
                  {batch.printedAt ? " · چاپ‌شده" : ""}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="identity-filters">
          <p className="identity-count" role="status">
            {loading
              ? "در حال جستجو…"
              : `${number.format(visible.length)} شماره`}
          </p>
          {filtersActive ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => applyCard("all")}
            >
              پاک کردن فیلترها
            </Button>
          ) : null}
        </div>
        {error ? <p role="alert">{error}</p> : null}
        {!loading && visible.length === 0 ? (
          <p>شماره‌ای با این فیلتر نیست.</p>
        ) : null}
        <ul className="identity-cards">
          {pageRows.map((row) => (
            <li key={row.id}>
              <IdentityResult
                row={row}
                product={
                  row.productId ? productById.get(row.productId) : undefined
                }
                onOpen={() => void openIdentity(row.id)}
              />
            </li>
          ))}
        </ul>
        <div className="identity-table-wrap">
          <table className="identity-table">
            <thead>
              <tr>
                <th>شماره</th>
                <th>اثر</th>
                <th>وضعیت</th>
                <th>چاپ</th>
                <th>دسته</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => (
                <tr key={row.id}>
                  <td dir="ltr">
                    <Button
                      variant="link"
                      onClick={() => void openIdentity(row.id)}
                    >
                      {row.label}
                    </Button>
                  </td>
                  <td>{row.productName ?? "بدون اثر"}</td>
                  <td>{statusLabel[row.status]}</td>
                  <td>{row.printed ? "چاپ شده" : "چاپ نشده"}</td>
                  <td>{row.batchId ? row.batchId.slice(-6) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pageCount > 1 ? (
          <div className="identity-pager">
            <Button
              type="button"
              variant="secondary"
              disabled={page === 0}
              onClick={() => setPage((current) => current - 1)}
            >
              قبلی
            </Button>
            <span>
              {number.format(page + 1)} از {number.format(pageCount)}
            </span>
            <Button
              type="button"
              variant="secondary"
              disabled={page + 1 >= pageCount}
              onClick={() => setPage((current) => current + 1)}
            >
              بعدی
            </Button>
          </div>
        ) : null}
      </div>

      {selected ? (
        <IdentityDetail
          selected={selected}
          product={
            selected.productId ? productById.get(selected.productId) : undefined
          }
          canWrite={canWrite}
          busyDownload={busyDownload}
          openProducts={openProducts}
          assignProductId={assignProductId}
          onAssignProductId={setAssignProductId}
          onAssign={() => void assign()}
          onCopy={() => void copyUrl(selected.permanentUrl)}
          onDownload={(path, filename) => void downloadFile(path, filename)}
          onClose={() => setSelected(null)}
        />
      ) : null}

      {canWrite ? (
        <details className="paper-panel identity-secondary">
          <summary>رزرو دسته‌ای شماره‌ها</summary>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void reserve();
            }}
          >
            <label>
              تعداد
              <input
                type="number"
                min={1}
                max={200}
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
              />
            </label>
            <Button type="submit">رزرو دسته‌ای شماره‌ها</Button>
          </form>
        </details>
      ) : null}

      {canWrite ? (
        <details className="paper-panel identity-secondary">
          <summary>خروجی QR آثار موجود</summary>
          <p>
            SVG، PNG و فهرست اثرها برای شماره‌هایی که همین حالا روی آثار هستند.
            این خروجی به دسته چاپ وصل نیست و شماره رزروشده تازه‌ای مصرف نمی‌کند.
          </p>
          <Button
            type="button"
            disabled={Boolean(busyDownload)}
            onClick={() =>
              void downloadFile(
                "/admin/identities/legacy-artworks/export",
                "rad-legacy-artworks.zip",
              )
            }
          >
            {busyDownload?.endsWith("legacy-artworks/export")
              ? "در حال آماده‌سازی…"
              : "دانلود QR آثار موجود"}
          </Button>
        </details>
      ) : null}

      {batchId && canWrite ? (
        <details className="paper-panel identity-secondary" open>
          <summary>خروجی دسته چاپ</summary>
          <p>
            فایل ZIP فقط وقتی دانلود می‌شود که هر QR همان نشانی دائمی را
            برگرداند. علامت چاپ بعد از بررسی آدرس عمومی ثبت می‌شود.
          </p>
          <div className="identity-actions">
            <Button
              type="button"
              disabled={Boolean(busyDownload)}
              onClick={() =>
                void downloadFile(
                  `/admin/identities/batches/${batchId}/export`,
                  `RAD-batch-${batchId.slice(-6)}.zip`,
                )
              }
            >
              {busyDownload?.includes("/export")
                ? "در حال آماده‌سازی…"
                : "دانلود SVG و PNG"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void markPrinted(batchId)}
            >
              علامت‌گذاری به‌عنوان چاپ‌شده
            </Button>
          </div>
        </details>
      ) : null}
    </section>
  );
}

function IdentityResult({
  row,
  product,
  onOpen,
}: {
  row: RadIdentityView;
  product: AdminProduct | undefined;
  onOpen: () => void;
}) {
  const thumb = product ? coverImage(product.images)?.src : null;
  return (
    <button type="button" className="identity-card" onClick={onOpen}>
      <span className="identity-card-head">
        {thumb ? <img src={thumb} alt="" /> : <QrCode />}
        <strong dir="ltr">{row.label}</strong>
      </span>
      <span className="identity-meta">
        <span>{statusLabel[row.status]}</span>
        <span>{row.productName ?? "بدون اثر"}</span>
        <span>{row.printed ? "چاپ شده" : "چاپ نشده"}</span>
      </span>
    </button>
  );
}

function IdentityDetail({
  selected,
  product,
  canWrite,
  busyDownload,
  openProducts,
  assignProductId,
  onAssignProductId,
  onAssign,
  onCopy,
  onDownload,
  onClose,
}: {
  selected: Detail;
  product: AdminProduct | undefined;
  canWrite: boolean;
  busyDownload: string | null;
  openProducts: AdminProduct[];
  assignProductId: string;
  onAssignProductId: (value: string) => void;
  onAssign: () => void;
  onCopy: () => void;
  onDownload: (path: string, filename: string) => void;
  onClose: () => void;
}) {
  const published = artworkStoryIsPublic(product?.status);
  const svgPath = `/admin/identities/${selected.id}/qr.svg`;
  const pngPath = `/admin/identities/${selected.id}/qr.png`;
  return (
    <aside className="paper-panel identity-detail" id="identity-detail">
      <h2 dir="ltr">{selected.label}</h2>
      <svg
        className="identity-qr"
        viewBox={`0 0 ${selected.qr.size} ${selected.qr.size}`}
        aria-label={`QR ${selected.label}`}
      >
        <rect width="100%" height="100%" fill="#ffffff" />
        <path d={selected.qr.d} fill="#18231f" />
      </svg>
      <p className="identity-meta">
        <span>{statusLabel[selected.status]}</span>
        <span>{selected.printed ? "چاپ شده" : "چاپ نشده"}</span>
        {selected.batchId ? (
          <span>دسته {selected.batchId.slice(-6)}</span>
        ) : null}
      </p>
      {selected.productName ? (
        <p>اثر: {selected.productName}</p>
      ) : (
        <p>این شماره هنوز به اثری وصل نشده است.</p>
      )}
      <p dir="ltr">{selected.permanentUrl}</p>
      <div className="identity-actions">
        <a
          className="rad-button rad-button-secondary rad-button-md"
          href={selected.permanentUrl}
          target="_blank"
          rel="noreferrer"
        >
          مشاهده صفحه عمومی
        </a>
        <Button type="button" variant="secondary" onClick={onCopy}>
          کپی لینک دائمی
        </Button>
        {published ? (
          <a
            className="rad-button rad-button-secondary rad-button-md"
            href={publicPassportUrl(selected.permanentUrl, selected.code)}
            target="_blank"
            rel="noreferrer"
          >
            گذرنامه اثر
          </a>
        ) : null}
        {selected.productId ? (
          <>
            <Link
              className="rad-button rad-button-secondary rad-button-md"
              href={productEditorHref(selected.productId, "artwork")}
            >
              ویرایش اثر
            </Link>
            <Link
              className="rad-button rad-button-secondary rad-button-md"
              href={productEditorHref(selected.productId, "story")}
            >
              ویرایش داستان اثر
            </Link>
          </>
        ) : null}
        <Button
          type="button"
          disabled={Boolean(busyDownload)}
          onClick={() => onDownload(svgPath, `${selected.label}.svg`)}
        >
          {busyDownload === svgPath ? "در حال آماده‌سازی…" : "دانلود QR"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={Boolean(busyDownload)}
          onClick={() => onDownload(pngPath, `${selected.label}.png`)}
        >
          {busyDownload === pngPath ? "در حال آماده‌سازی…" : "دانلود PNG"}
        </Button>
      </div>
      {selected.status === "reserved" && canWrite ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onAssign();
          }}
        >
          <label>
            اتصال به اثر
            <select
              value={assignProductId}
              onChange={(event) => onAssignProductId(event.target.value)}
            >
              <option value="">انتخاب اثر</option>
              {openProducts.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" disabled={!assignProductId}>
            اتصال شماره
          </Button>
        </form>
      ) : null}
      <h3>تاریخچه</h3>
      <ul>
        {(selected.events ?? []).map((event, index) => (
          <li key={`${event.kind}-${index}`}>
            {event.kind} · {date.format(event.at)}
          </li>
        ))}
      </ul>
      <p>
        رزرو {date.format(selected.reservedAt)}
        {selected.assignedAt
          ? ` · اتصال ${date.format(selected.assignedAt)}`
          : ""}
        {selected.printedAt ? ` · چاپ ${date.format(selected.printedAt)}` : ""}
      </p>
      <Button type="button" variant="secondary" onClick={onClose}>
        بستن
      </Button>
    </aside>
  );
}

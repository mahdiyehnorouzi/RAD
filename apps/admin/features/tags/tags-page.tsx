"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  formatRadCode,
  type RadIdentityBatchView,
  type RadIdentitySummary,
  type RadIdentityView,
} from "@rad/types";
import { Button } from "@rad/ui";
import { QrCode } from "lucide-react";
import { useAdminChrome } from "../../components/admin-shell";
import { StatTile } from "../../components/admin-stat-tile";
import { api, API_BASE } from "../../lib/api";
import type { AdminProduct } from "../../lib/admin-data";

const number = new Intl.NumberFormat("fa-IR");
const date = new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" });

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
  const [status, setStatus] = useState("");
  const [assignment, setAssignment] = useState("");
  const [batchId, setBatchId] = useState("");
  const [quantity, setQuantity] = useState(100);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Detail | null>(null);
  const [assignProductId, setAssignProductId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
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
      setSummary(nextSummary);
      setRows(nextRows);
      setBatches(nextBatches);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setLoading(false);
    }
  }, [assignment, batchId, query, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const openProducts = useMemo(
    () =>
      workspace.products.filter(
        (product) => product.radNumber == null && product.id,
      ),
    [workspace.products],
  );

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

  async function downloadFile(path: string, filename: string) {
    try {
      const response = await fetch(`${API_BASE}${path}`, {
        credentials: "include",
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(data.message || "فایل چاپ ساخته نشد.");
      }
      const blob = await response.blob();
      if (!blob.size || blob.type.includes("text/html")) {
        throw new Error("فایل دانلود نامعتبر است.");
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch (cause) {
      announce((cause as Error).message);
    }
  }

  async function downloadLegacy() {
    await downloadFile(
      "/admin/identities/legacy-artworks/export",
      "rad-legacy-artworks.zip",
    );
  }

  async function downloadBatch(id: string) {
    await downloadFile(
      `/admin/identities/batches/${id}/export`,
      "rad-tags.zip",
    );
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
        />
        <StatTile
          icon={<QrCode />}
          value={summary?.unassigned ?? 0}
          label="رزرو و بدون اثر"
          loading={loading && !summary}
        />
        <StatTile
          icon={<QrCode />}
          value={summary?.assigned ?? 0}
          label="متصل به اثر"
          loading={loading && !summary}
        />
        <StatTile
          icon={<QrCode />}
          value={summary?.printed ?? 0}
          label="چاپ‌شده"
          loading={loading && !summary}
        />
        <StatTile
          icon={<QrCode />}
          value={summary?.retired ?? 0}
          label="بازنشسته"
          loading={loading && !summary}
        />
      </div>

      {canWrite && (
        <form
          className="paper-panel"
          onSubmit={(event) => {
            event.preventDefault();
            void reserve();
          }}
        >
          <h2>رزرو دسته‌ای شماره‌ها</h2>
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
      )}

      <div className="paper-panel">
        <div className="form-grid">
          <label>
            جستجو
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="شماره یا نام اثر"
            />
          </label>
          <label>
            وضعیت
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
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
              onChange={(event) => setAssignment(event.target.value)}
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
        {error ? <p>{error}</p> : null}
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>شماره</th>
                <th>QR</th>
                <th>اثر</th>
                <th>وضعیت</th>
                <th>چاپ</th>
                <th>دسته</th>
                <th>تاریخ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td dir="ltr">
                    <Button
                      variant="link"
                      onClick={() => void openIdentity(row.id)}
                    >
                      {row.label}
                    </Button>
                  </td>
                  <td>
                    <svg
                      viewBox={`0 0 ${row.qr.size} ${row.qr.size}`}
                      width="48"
                      height="48"
                      aria-hidden="true"
                    >
                      <rect width="100%" height="100%" fill="#ffffff" />
                      <path d={row.qr.d} fill="#18231f" />
                    </svg>
                  </td>
                  <td>{row.productName ?? "—"}</td>
                  <td>{statusLabel[row.status]}</td>
                  <td>{row.printed ? "چاپ شده" : "چاپ نشده"}</td>
                  <td>{row.batchId ? row.batchId.slice(-6) : "—"}</td>
                  <td>{date.format(row.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && rows.length === 0 ? (
          <p>شماره‌ای با این فیلتر نیست.</p>
        ) : null}
      </div>

      {canWrite ? (
        <div className="paper-panel">
          <h2>QR آثار موجود</h2>
          <p>
            SVG، PNG و فهرست اثرها برای شماره‌هایی که همین حالا روی آثار هستند.
            این خروجی به دسته چاپ وصل نیست و شماره رزروشده تازه‌ای مصرف نمی‌کند.
            اگر شماره اثر با شناسه دائمی یکی نباشد، فایل ساخته نمی‌شود.
          </p>
          <Button type="button" onClick={() => void downloadLegacy()}>
            دانلود QR آثار موجود
          </Button>
        </div>
      ) : null}

      {batchId && canWrite ? (
        <div className="paper-panel">
          <h2>خروجی چاپ</h2>
          <p>
            فایل ZIP فقط وقتی دانلود می‌شود که هر QR همان نشانی دائمی را
            برگرداند. علامت چاپ بعد از بررسی آدرس عمومی ثبت می‌شود.
          </p>
          <Button type="button" onClick={() => void downloadBatch(batchId)}>
            دانلود SVG و PNG
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void markPrinted(batchId)}
          >
            علامت‌گذاری به‌عنوان چاپ‌شده
          </Button>
        </div>
      ) : null}

      {selected ? (
        <aside className="paper-panel">
          <h2>{selected.label}</h2>
          <p dir="ltr">{selected.permanentUrl}</p>
          <Button
            type="button"
            onClick={() => void copyUrl(selected.permanentUrl)}
          >
            کپی پیوند
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              void downloadFile(
                `/admin/identities/${selected.id}/qr.svg`,
                `${selected.label.replace(/[^a-zA-Z0-9-]/g, "-")}.svg`,
              )
            }
          >
            دانلود SVG
          </Button>
          {selected.productName ? <p>اثر: {selected.productName}</p> : null}
          {selected.status === "reserved" && canWrite ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void assign();
              }}
            >
              <label>
                اتصال به اثر
                <select
                  value={assignProductId}
                  onChange={(event) => setAssignProductId(event.target.value)}
                >
                  <option value="">انتخاب اثر</option>
                  {openProducts.map((product: AdminProduct) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </label>
              <Button type="submit">اتصال شماره</Button>
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
            {selected.printedAt
              ? ` · چاپ ${date.format(selected.printedAt)}`
              : ""}
          </p>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setSelected(null)}
          >
            بستن
          </Button>
        </aside>
      ) : null}
      <p>{number.format(rows.length)} شماره در این فهرست</p>
    </section>
  );
}

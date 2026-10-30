"use client";

import { useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import type { AdminUser } from "../lib/admin-data";
import { AdminAsyncRegion } from "./admin-async-region";
import { EmptyState, StatusBadge } from "./admin-list-chrome";

const date = (value: number) =>
  new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(value);

export function UsersPanel({
  users,
  loading,
  loadError,
  refreshing = false,
  refreshError = false,
  onRetry,
}: {
  users: AdminUser[];
  loading: boolean;
  loadError: boolean;
  refreshing?: boolean;
  refreshError?: boolean;
  onRetry: () => void;
}) {
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
      <AdminAsyncRegion
        loading={loading}
        loadError={loadError}
        refreshing={refreshing}
        refreshError={refreshError}
        onRetry={onRetry}
        errorMessage="دریافت فهرست مشتریان ناموفق بود. اتصال اینترنت را بررسی و دوباره تلاش کنید."
        loadingLabel="در حال بارگذاری مشتریان…"
        skeleton="table"
      >
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
      </AdminAsyncRegion>
    </section>
  );
}

"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { AdminCategory } from "@rad/types";
import { Button } from "@rad/ui";
import { AdminAsyncRegion } from "../../components/admin-async-region";
import { ConfirmDialog } from "../../components/admin-dialog";
import { parentsOf } from "../../lib/product-category";
import {
  AdminCategoryDialog,
  type CategoryInput,
} from "./admin-category-dialog";

const number = new Intl.NumberFormat("fa-IR");

export function AdminCategories({
  categories,
  loading,
  loadError,
  refreshing = false,
  refreshError = false,
  onRetry,
  canWrite,
  onSave,
  onToggleActive,
  onDelete,
}: {
  categories: AdminCategory[];
  loading: boolean;
  loadError: boolean;
  refreshing?: boolean;
  refreshError?: boolean;
  onRetry: () => void;
  canWrite: boolean;
  onSave: (input: CategoryInput, id?: string) => Promise<void>;
  onToggleActive: (category: AdminCategory) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState<AdminCategory | "new" | null>(null);
  const [parentForNew, setParentForNew] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminCategory | null>(null);
  const [actionError, setActionError] = useState("");
  const parents = parentsOf(categories);

  const openCreate = (parentId: string | null) => {
    setActionError("");
    setParentForNew(parentId);
    setEditing("new");
  };

  return (
    <section className="paper-panel data-view">
      <div className="view-heading">
        <div>
          <h2>دسته‌بندی آثار</h2>
          <p>
            هر اثر یک دستهٔ اصلی دارد و می‌تواند یک زیردسته از همان دسته داشته
            باشد. غیرفعال کردن دسته، اثرها را پاک نمی‌کند.
          </p>
        </div>
        {canWrite ? (
          <Button type="button" onClick={() => openCreate(null)}>
            <Plus />
            دستهٔ تازه
          </Button>
        ) : (
          <p className="content-meta">
            مشاهده فقط. ویرایش اثر برای تغییر لازم است.
          </p>
        )}
      </div>
      {actionError ? (
        <p className="admin-inline-error" role="alert">
          {actionError}
        </p>
      ) : null}
      <AdminAsyncRegion
        loading={loading}
        loadError={loadError}
        refreshing={refreshing}
        refreshError={refreshError}
        onRetry={onRetry}
        errorMessage="فهرست دسته‌ها بارگذاری نشد."
        loadingLabel="در حال بارگذاری دسته‌ها…"
        skeleton="list"
      >
        {parents.length ? (
          <ol className="category-tree">
            {parents.map((parent) => (
              <li key={parent.id}>
                <CategoryCard
                  category={parent}
                  canWrite={canWrite}
                  onEdit={() => {
                    setActionError("");
                    setEditing(parent);
                  }}
                  onAddChild={() => openCreate(parent.id)}
                  onToggle={() => {
                    setActionError("");
                    void onToggleActive(parent).catch((error: unknown) => {
                      setActionError(
                        error instanceof Error && error.message
                          ? error.message
                          : "تغییر وضعیت دسته ناموفق بود.",
                      );
                    });
                  }}
                  onDelete={() => setDeleteTarget(parent)}
                />
                {parent.children.length ? (
                  <ol className="category-children">
                    {parent.children.map((child) => (
                      <li key={child.id} className="category-child">
                        <CategoryCard
                          category={child}
                          canWrite={canWrite}
                          onEdit={() => {
                            setActionError("");
                            setEditing(child);
                          }}
                          onToggle={() => {
                            setActionError("");
                            void onToggleActive(child).catch(
                              (error: unknown) => {
                                setActionError(
                                  error instanceof Error && error.message
                                    ? error.message
                                    : "تغییر وضعیت دسته ناموفق بود.",
                                );
                              },
                            );
                          }}
                          onDelete={() => setDeleteTarget(child)}
                        />
                      </li>
                    ))}
                  </ol>
                ) : null}
              </li>
            ))}
          </ol>
        ) : (
          <p className="contact-message-empty">هنوز دسته‌ای ثبت نشده است.</p>
        )}
      </AdminAsyncRegion>
      {editing ? (
        <AdminCategoryDialog
          category={editing === "new" ? null : editing}
          parents={parents}
          initialParentId={editing === "new" ? parentForNew : null}
          onClose={() => setEditing(null)}
          onSave={async (input) => {
            await onSave(input, editing === "new" ? undefined : editing.id);
            setEditing(null);
          }}
        />
      ) : null}
      {deleteTarget ? (
        <ConfirmDialog
          title="حذف این دسته‌بندی؟"
          description={deleteDescription(deleteTarget)}
          confirmLabel="حذف دسته‌بندی"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={async () => {
            await onDelete(deleteTarget.id);
            setDeleteTarget(null);
          }}
        />
      ) : null}
    </section>
  );
}

function deleteDescription(category: AdminCategory) {
  const name = `«${category.name.fa}»`;
  if (category.children.length && category.productCount) {
    return `${name} زیردسته و اثر دارد. تا وقتی به اثری وصل است حذف نمی‌شود.`;
  }
  if (category.children.length) {
    return `${name} زیردسته دارد. تا وقتی زیردسته‌ای زیر آن است حذف نمی‌شود.`;
  }
  if (category.productCount) {
    return `${name} روی ${number.format(category.productCount)} اثر است و حذف نمی‌شود.`;
  }
  return `${name} حذف می‌شود. اثرها دست نمی‌خورند.`;
}

function CategoryCard({
  category,
  canWrite,
  onEdit,
  onAddChild,
  onToggle,
  onDelete,
}: {
  category: AdminCategory;
  canWrite: boolean;
  onEdit: () => void;
  onAddChild?: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <article
      className={`category-card${category.active ? "" : " category-inactive"}`}
    >
      <div className="category-row">
        <div>
          <h3>{category.name.fa}</h3>
          <p dir="ltr">{category.name.en}</p>
          <div className="category-meta">
            <span>
              شناسه <bdi dir="ltr">{category.slug}</bdi>
            </span>
            <span>{category.active ? "فعال" : "غیرفعال"}</span>
            <span>{number.format(category.productCount)} اثر</span>
          </div>
        </div>
        {canWrite ? (
          <div className="category-actions">
            {onAddChild ? (
              <Button type="button" variant="secondary" onClick={onAddChild}>
                زیردسته
              </Button>
            ) : null}
            <Button type="button" variant="secondary" onClick={onToggle}>
              {category.active ? "غیرفعال کردن" : "فعال کردن"}
            </Button>
            <Button type="button" variant="secondary" onClick={onEdit}>
              ویرایش
            </Button>
            <Button type="button" variant="secondary" onClick={onDelete}>
              حذف
            </Button>
          </div>
        ) : null}
      </div>
    </article>
  );
}

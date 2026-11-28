"use client";

import { useAdminChrome } from "../../components/admin-shell";
import { AdminCategories } from "./admin-categories";
import "./categories.css";

export function CategoriesPage() {
  const { workspace, announce } = useAdminChrome();
  const loading =
    !workspace.loadedKeys.has("categories") &&
    !workspace.loadErrors.has("categories");
  const canWrite = workspace.can("product.write");
  return (
    <AdminCategories
      categories={workspace.categories}
      loading={loading}
      loadError={workspace.loadErrors.has("categories")}
      refreshing={workspace.refreshingKeys.has("categories")}
      refreshError={workspace.refreshErrors.has("categories")}
      onRetry={() => {
        void workspace.retryResource("categories");
      }}
      canWrite={canWrite}
      onSave={async (input, id) => {
        await workspace.saveCategory(input, id);
        announce(id ? "دسته‌بندی ذخیره شد." : "دسته‌بندی اضافه شد.");
      }}
      onToggleActive={async (category) => {
        await workspace.saveCategory(
          {
            slug: category.slug,
            name: category.name,
            sortOrder: category.sortOrder,
            active: !category.active,
            parentId: category.parentId,
          },
          category.id,
        );
        announce(
          category.active ? "دسته‌بندی غیرفعال شد." : "دسته‌بندی فعال شد.",
        );
      }}
      onDelete={async (id) => {
        await workspace.deleteCategory(id);
        announce("دسته‌بندی حذف شد.");
      }}
    />
  );
}

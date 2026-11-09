"use client";

import { useState } from "react";
import { useAdminChrome } from "../../components/admin-shell";
import { ConfirmDialog } from "../../components/admin-dialog";
import type { AdminProduct } from "../../lib/admin-data";
import { Products } from "./admin-products";
import { ProductDialog } from "./admin-product-dialog";

export function ProductsPage() {
  const { workspace, announce } = useAdminChrome();
  const [productEditor, setProductEditor] = useState<
    AdminProduct | "new" | null
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null);

  return (
    <>
      <Products
        products={workspace.products}
        canWrite={workspace.can("product.write")}
        onCreate={() => setProductEditor("new")}
        onEdit={setProductEditor}
        onDelete={setDeleteTarget}
      />
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
    </>
  );
}

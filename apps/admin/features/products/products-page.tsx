"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Package } from "lucide-react";
import { Button } from "@rad/ui";
import { useAdminChrome } from "../../components/admin-shell";
import { AdminAsyncRegion } from "../../components/admin-async-region";
import { ConfirmDialog } from "../../components/admin-dialog";
import type { AdminProduct } from "../../lib/admin-data";
import { Products } from "./admin-products";
import { ProductDialog } from "./admin-product-dialog";
import {
  NEW_PRODUCT_EDIT,
  UNSAVED_PRODUCT_MESSAGE,
  productEditHref,
  productListHref,
  readProductEdit,
  resolveEditedProduct,
} from "./product-workspace";
import "./products-workspace.css";

export function ProductsPage() {
  const { workspace, announce } = useAdminChrome();
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const urlEdit = readProductEdit(search);
  const [editKey, setEditKey] = useState<string | null>(urlEdit);
  const [saveGeneration, setSaveGeneration] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null);
  const dirtyRef = useRef(false);
  const restoring = useRef(false);
  const listScroll = useRef(0);
  const onDirtyChange = useCallback((dirty: boolean) => {
    dirtyRef.current = dirty;
  }, []);

  const loading =
    !workspace.loadedKeys.has("products") &&
    !workspace.loadErrors.has("products");
  const edited = loading
    ? { kind: "list" as const }
    : resolveEditedProduct(workspace.products, editKey);
  const canWrite = workspace.can("product.write");

  const hrefFor = useCallback(
    (next: string | null) =>
      next ? productEditHref(search, next) : productListHref(search),
    [search],
  );

  const navigate = useCallback(
    (next: string | null) => {
      if (next === editKey) return;
      if (dirtyRef.current && !window.confirm(UNSAVED_PRODUCT_MESSAGE)) return;
      dirtyRef.current = false;
      setEditKey(next);
      router.push(hrefFor(next), { scroll: false });
    },
    [editKey, hrefFor, router],
  );

  useEffect(() => {
    if (urlEdit === editKey) {
      restoring.current = false;
      return;
    }
    if (restoring.current) return;
    if (dirtyRef.current && !window.confirm(UNSAVED_PRODUCT_MESSAGE)) {
      restoring.current = true;
      router.replace(hrefFor(editKey), { scroll: false });
      return;
    }
    dirtyRef.current = false;
    setEditKey(urlEdit);
  }, [editKey, hrefFor, router, urlEdit]);

  useEffect(() => {
    if (!window.matchMedia("(max-width: 900px)").matches) return;
    if (editKey) {
      listScroll.current = window.scrollY;
      window.scrollTo(0, 0);
      return;
    }
    window.scrollTo(0, listScroll.current);
  }, [editKey]);

  return (
    <>
      <AdminAsyncRegion
        loading={loading}
        loadError={workspace.loadErrors.has("products")}
        refreshing={workspace.refreshingKeys.has("products")}
        refreshError={workspace.refreshErrors.has("products")}
        onRetry={() => {
          void workspace.retryResource("products");
        }}
        errorMessage="فهرست آثار بارگذاری نشد."
        loadingLabel="در حال بارگذاری آثار…"
        skeleton="list"
      >
        <div className={`products-workspace${editKey ? " is-editing" : ""}`}>
          <Products
            products={workspace.products}
            canWrite={canWrite}
            selectedId={edited.kind === "edit" ? edited.product.id : null}
            onCreate={() => navigate(NEW_PRODUCT_EDIT)}
            onEdit={(product) => navigate(product.id)}
            onDelete={setDeleteTarget}
          />
          <div className="products-editor-pane">
            {edited.kind === "new" || edited.kind === "edit" ? (
              <div className="product-pane">
                <ProductDialog
                  key={`${editKey ?? "list"}:${saveGeneration}`}
                  product={edited.kind === "edit" ? edited.product : null}
                  canWrite={canWrite}
                  onDirtyChange={onDirtyChange}
                  onUploadImage={workspace.uploadProductImage}
                  onFetchAttributes={workspace.fetchAttributesForCategory}
                  onClose={() => navigate(null)}
                  onDelete={
                    edited.kind === "edit" && canWrite
                      ? () => setDeleteTarget(edited.product)
                      : undefined
                  }
                  onSave={async (product) => {
                    try {
                      const saved = await workspace.saveProduct(product);
                      dirtyRef.current = false;
                      setSaveGeneration((value) => value + 1);
                      if (editKey === NEW_PRODUCT_EDIT) {
                        setEditKey(saved.id);
                        router.replace(productEditHref(search, saved.id), {
                          scroll: false,
                        });
                      }
                      announce(
                        editKey === NEW_PRODUCT_EDIT
                          ? saved.radNumber
                            ? `محصول ذخیره شد. شماره RAD-${String(saved.radNumber).padStart(3, "0")} ثبت شد.`
                            : "محصول جدید در پایگاه داده ذخیره شد."
                          : "تغییرات محصول ذخیره شد.",
                      );
                    } catch (error) {
                      announce((error as Error).message);
                    }
                  }}
                />
              </div>
            ) : (
              <div className="product-pane product-editor-empty">
                <Package />
                <h2>
                  {edited.kind === "missing"
                    ? "این اثر در فهرست نیست"
                    : "اثری انتخاب نشده"}
                </h2>
                <p>
                  {edited.kind === "missing"
                    ? "شناسهٔ این پیوند با محصولی که هنوز در استودیو هست جور نیست."
                    : "از فهرست یک اثر را انتخاب کنید، یا اثر تازه‌ای بسازید."}
                </p>
                {edited.kind === "missing" ? (
                  <Button variant="secondary" onClick={() => navigate(null)}>
                    بازگشت به فهرست
                  </Button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </AdminAsyncRegion>
      {deleteTarget && (
        <ConfirmDialog
          title={`حذف «${deleteTarget.name}»؟`}
          description="این محصول از پایگاه داده حذف می‌شود و دیگر در فروشگاه دیده نخواهد شد."
          onCancel={() => setDeleteTarget(null)}
          onConfirm={async () => {
            try {
              await workspace.deleteProduct(deleteTarget.id);
              if (editKey === deleteTarget.id) {
                dirtyRef.current = false;
                setEditKey(null);
                router.replace(productListHref(search), { scroll: false });
              }
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

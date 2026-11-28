import type { AdminProduct } from "../../lib/admin-data";

export const PRODUCT_EDIT_PARAM = "edit";
export const NEW_PRODUCT_EDIT = "new";

export const UNSAVED_PRODUCT_MESSAGE =
  "تغییرات این اثر هنوز ذخیره نشده است. اگر ادامه دهید، این تغییرات از بین می‌رود.";

export function readProductEdit(search: string) {
  const value = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  )
    .get(PRODUCT_EDIT_PARAM)
    ?.trim();
  return value ? value : null;
}

export function productListHref(search = "") {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  params.delete(PRODUCT_EDIT_PARAM);
  const query = params.toString();
  return query ? `/products?${query}` : "/products";
}

export function productEditHref(search: string, id: string) {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  params.set(PRODUCT_EDIT_PARAM, id);
  return `/products?${params.toString()}`;
}

export type EditedProduct =
  | { kind: "list" }
  | { kind: "new" }
  | { kind: "edit"; product: AdminProduct }
  | { kind: "missing" };

export function resolveEditedProduct(
  products: readonly AdminProduct[],
  editKey: string | null,
): EditedProduct {
  if (!editKey) return { kind: "list" };
  if (editKey === NEW_PRODUCT_EDIT) return { kind: "new" };
  const product = products.find((item) => item.id === editKey);
  return product ? { kind: "edit", product } : { kind: "missing" };
}

/** Comparable draft of the fields the editor can change. */
export function productSnapshot(
  product: Pick<
    AdminProduct,
    | "name"
    | "slug"
    | "description"
    | "subtitle"
    | "category"
    | "price"
    | "status"
    | "artist"
    | "reservedRadNumber"
    | "attributeValues"
    | "images"
  >,
) {
  return JSON.stringify({
    name: product.name,
    slug: product.slug,
    description: product.description,
    subtitle: product.subtitle ?? "",
    category: product.category,
    price: product.price,
    status: product.status,
    artist: product.artist,
    reservedRadNumber: product.reservedRadNumber ?? null,
    attributeValues: product.attributeValues ?? {},
    images: product.images.map((image) => ({
      storage: image.storage,
      src: image.src ?? null,
      objectKey: "objectKey" in image ? (image.objectKey ?? null) : null,
    })),
  });
}

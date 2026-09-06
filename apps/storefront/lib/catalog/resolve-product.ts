import type { Product } from "@rad/types";
import { hasRealProductImage } from "./category-defaults";

export function overlayRemoteProduct(
  local: Product | undefined,
  remote: Product | null | undefined,
): Product | undefined {
  if (!local) return remote ?? undefined;
  if (!remote) return local;
  const images = hasRealProductImage(remote) ? remote.images : local.images;
  return { ...local, ...remote, images: images ?? local.images };
}

export function overlayRemoteCatalog(local: Product[], remote: Product[]) {
  const remoteBySlug = new Map(remote.map((item) => [item.slug, item]));
  const merged = local.map(
    (item) => overlayRemoteProduct(item, remoteBySlug.get(item.slug)) ?? item,
  );
  const seen = new Set(merged.map((item) => item.slug));
  for (const item of remote) {
    if (!seen.has(item.slug)) merged.push(item);
  }
  return merged;
}

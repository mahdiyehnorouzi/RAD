"use server";

import { updateTag } from "next/cache";
import { CATALOG_TAG } from "./catalog-tag";

/** After a bag, order or availability change: the next render reads fresh statuses. */
export async function refreshCatalog() {
  updateTag(CATALOG_TAG);
}

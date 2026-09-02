import type {Notice, NoticeKind} from "@rad/types";
import { api } from "./client";

type NoticesPayload = { notices: Notice[] };

export async function fetchNotices() {
  return api<NoticesPayload>("/notices");
}

export async function createNotice(kind: NoticeKind, productSlug?: string) {
  return api<NoticesPayload>("/notices", {
    method: "POST",
    body: JSON.stringify({ kind, productSlug }),
  });
}

export async function markNoticesRead() {
  return api<NoticesPayload>("/notices/read", { method: "POST" });
}

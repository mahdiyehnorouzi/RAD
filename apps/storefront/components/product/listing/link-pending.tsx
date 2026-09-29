"use client";

import { useLinkStatus } from "next/link";
import "./link-pending.css";

/** Must render inside a `<Link>`; shows progress while a dynamic product page loads. */
export function LinkPending() {
  const { pending } = useLinkStatus();
  return (
    <span
      className={`link-pending${pending ? " is-pending" : ""}`}
      aria-hidden="true"
    />
  );
}

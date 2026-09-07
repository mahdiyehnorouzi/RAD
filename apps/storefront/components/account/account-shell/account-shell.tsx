"use client";

import type { ReactNode } from "react";
import { useCommerce } from "@/components/commerce";
import { AccountLogin } from "../account-page/account-login";
import { AccountNav } from "./account-nav";
import "./account-shell.css";

export function AccountShell({
  children,
  requireAuth = false,
}: {
  children: ReactNode;
  requireAuth?: boolean;
}) {
  const { user } = useCommerce();
  if (!user) {
    if (requireAuth) return <AccountLogin />;
    return children;
  }
  return (
    <div className="account-shell">
      <AccountNav />
      <div className="account-shell-main">{children}</div>
    </div>
  );
}

"use client";

import type { ReactNode } from "react";
import { useCommerce } from "@/components/commerce";
import { AccountLogin } from "../account-page/account-login";
import { AccountNav } from "./account-nav";
import { CardListSkeleton, Skeleton, SkeletonScreen } from "@/components/ui/skeleton";
import "./account-shell.css";

export function AccountShell({
  children,
  requireAuth = false,
}: {
  children: ReactNode;
  requireAuth?: boolean;
}) {
  const { user, ready } = useCommerce();
  if (!ready) {
    return (
      <section className="section">
        <SkeletonScreen>
          <div className="skeleton-identity">
            <Skeleton className="skeleton-circle" />
            <div>
              <Skeleton className="skeleton-line short" />
              <Skeleton className="skeleton-line" />
            </div>
          </div>
          <CardListSkeleton count={3} />
        </SkeletonScreen>
      </section>
    );
  }
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

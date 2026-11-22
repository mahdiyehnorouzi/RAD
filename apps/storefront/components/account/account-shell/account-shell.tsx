"use client";

import type { ReactNode } from "react";
import { usePublicPathname } from "@/hooks/use-public-pathname";
import { useCommerce } from "@/components/commerce";
import { AccountLogin } from "../account-page/account-login";
import { ACCOUNT_HUB } from "../const";
import { useProfileTabs } from "../profile-tabs";
import { AccountNav } from "./account-nav";
import {
  CardListSkeleton,
  Skeleton,
  SkeletonScreen,
} from "@/components/ui/skeleton";
import "../account-heading.css";
import "./account-shell.css";

export function AccountShell({
  children,
  requireAuth = false,
}: {
  children: ReactNode;
  requireAuth?: boolean;
}) {
  const pathname = usePublicPathname();
  const tabs = useProfileTabs();
  const { user, ready } = useCommerce();
  const hub = tabs ? tabs.section === "collection" : pathname === ACCOUNT_HUB;
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
    if (requireAuth) return <AccountLogin returnTo={pathname} />;
    return children;
  }
  return (
    <div
      className="account-shell"
      data-hub={hub ? "" : undefined}
    >
      <AccountNav />
      <div className="account-shell-main">{children}</div>
    </div>
  );
}

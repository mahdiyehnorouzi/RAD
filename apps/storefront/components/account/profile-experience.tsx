"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { AccountPage } from "./account-page";
import { AccountInfoPage } from "./account-info";
import { AccountShell } from "./account-shell";
import { NotificationsPage } from "./notifications-page";
import { ProfileTabsContext } from "./profile-tabs";
import { sectionAfterPop, type ProfileSection } from "./profile-section";
import { CustomerMakingList } from "@/components/making";
import { OrdersPage } from "@/components/orders";
import { FavoritesPage } from "@/components/favorites";
import { AddressBookPage } from "@/features/address-book";

/**
 * Profile sections share one shell and keep the URL that was opened.
 * Tab changes push a history entry with the same URL so Back and Forward
 * restore the section while this page stays mounted. A refresh follows the
 * URL again, because the path does not name the tab.
 * Order and making records keep their own URLs (/orders/:id, /making/:id).
 */
export function ProfileExperience({ initial }: { initial: ProfileSection }) {
  const [section, setSection] = useState(initial);
  const [mounted, setMounted] = useState<ProfileSection[]>([initial]);
  const panelRef = useRef<HTMLDivElement>(null);
  const skipFocus = useRef(true);

  useEffect(() => {
    const onPop = (event: PopStateEvent) => {
      const next = sectionAfterPop(event.state, initial);
      setMounted((currentSections) =>
        currentSections.includes(next)
          ? currentSections
          : [...currentSections, next],
      );
      setSection(next);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [initial]);

  useEffect(() => {
    if (skipFocus.current) {
      skipFocus.current = false;
      return;
    }
    panelRef.current?.focus();
  }, [section]);

  const select = (next: ProfileSection) => {
    setMounted((current) =>
      current.includes(next) ? current : [...current, next],
    );
    if (next === section) {
      panelRef.current?.focus();
      return;
    }
    const current = window.history.state;
    window.history.pushState(
      {
        ...(current && typeof current === "object" ? current : {}),
        profileSection: next,
      },
      "",
      window.location.href,
    );
    setSection(next);
  };

  const show = (id: ProfileSection) => mounted.includes(id);

  return (
    <ProfileTabsContext.Provider value={{ section, select }}>
      <AccountShell requireAuth>
        <div
          ref={panelRef}
          id="profile-panel"
          role="tabpanel"
          aria-labelledby={`profile-tab-${section}`}
          tabIndex={-1}
          className="profile-panel"
        >
          {show("collection") ? (
            <div hidden={section !== "collection" || undefined}>
              <AccountPage embedded />
            </div>
          ) : null}
          {show("orders") ? (
            <div hidden={section !== "orders" || undefined}>
              <OrdersPage embedded />
            </div>
          ) : null}
          {show("making") ? (
            <div hidden={section !== "making" || undefined}>
              <CustomerMakingList embedded />
            </div>
          ) : null}
          {show("favorites") ? (
            <div hidden={section !== "favorites" || undefined}>
              <Suspense fallback={null}>
                <FavoritesPage embedded />
              </Suspense>
            </div>
          ) : null}
          {show("notifications") ? (
            <div hidden={section !== "notifications" || undefined}>
              <NotificationsPage embedded />
            </div>
          ) : null}
          {show("addresses") ? (
            <div hidden={section !== "addresses" || undefined}>
              <AddressBookPage embedded />
            </div>
          ) : null}
          {show("info") ? (
            <div hidden={section !== "info" || undefined}>
              <AccountInfoPage embedded />
            </div>
          ) : null}
        </div>
      </AccountShell>
    </ProfileTabsContext.Provider>
  );
}

"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Archive,
  Bell,
  ChevronLeft,
  CircleHelp,
  Inbox,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareQuote,
  PackageX,
  ScrollText,
  Shapes,
  ShoppingBag,
  SlidersHorizontal,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useAdminWorkspace } from "../hooks/use-admin-workspace";
import { roleLabels, type AdminSection } from "../lib/admin-data";
import {
  initialDashboardSection,
  isHelpPath,
  isMessagesPath,
  isReviewsPath,
  isShapePath,
  settleStudioPath,
  staffGate,
  startHelpLink,
  startMessagesLink,
  startReviewsLink,
  startSectionSelect,
  startShapeLink,
  studioHistoryHref,
  studioNavHref,
  withOrderFocus,
  type PendingNavigation,
} from "../lib/staff-navigation";
import { AdminLogin } from "./admin-login";

const navItems: { id: AdminSection; label: string; icon: typeof Archive }[] = [
  { id: "overview", label: "مرور استودیو", icon: LayoutDashboard },
  { id: "products", label: "آثار و محصولات", icon: Archive },
  { id: "orders", label: "سفارش‌های فروشگاه", icon: ShoppingBag },
  { id: "messages", label: "پیام‌ها", icon: Inbox },
  { id: "damage", label: "گزارش‌های آسیب", icon: PackageX },
  { id: "commissions", label: "سفارش اختصاصی", icon: ScrollText },
  { id: "reviews", label: "نظر مشتریان", icon: MessageSquareQuote },
  { id: "shape", label: "پرسشنامه‌ی شکل", icon: Shapes },
  { id: "help", label: "پرسش‌های راهنما", icon: CircleHelp },
  { id: "attributes", label: "ویژگی‌های محصول", icon: SlidersHorizontal },
  { id: "users", label: "مشتریان", icon: UserRound },
  { id: "members", label: "افراد و دسترسی", icon: Users },
  { id: "account", label: "حساب کاربری", icon: KeyRound },
];

const number = new Intl.NumberFormat("fa-IR");

export type AdminWorkspace = ReturnType<typeof useAdminWorkspace>;

type AdminChrome = {
  workspace: AdminWorkspace;
  section: AdminSection;
  go: (section: AdminSection) => void;
  announce: (message: string) => void;
  /** Opens an order on `/` after leaving a studio route such as `/messages`. */
  openOrder: (orderId: string) => void;
  /** Order id from the Messages handoff that just committed. Null after it is used or canceled. */
  handedOrderId: string | null;
  clearHandedOrder: () => void;
};

const AdminChromeContext = createContext<AdminChrome | null>(null);

export function useAdminChrome() {
  const chrome = useContext(AdminChromeContext);
  if (!chrome) {
    throw new Error("Admin chrome is only available inside the studio shell");
  }
  return chrome;
}

export function AdminShell({ children }: { children: ReactNode }) {
  const workspace = useAdminWorkspace();
  const pathname = usePathname();
  const router = useRouter();
  const [section, setSection] = useState<AdminSection>(() =>
    initialDashboardSection(
      typeof window === "undefined" ? "" : window.location.hash,
    ),
  );
  const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState("");
  const reviewsActive = isReviewsPath(pathname);
  const helpActive = isHelpPath(pathname);
  const messagesActive = isMessagesPath(pathname);
  const shapeActive = isShapePath(pathname);
  const routeActive =
    reviewsActive || helpActive || messagesActive || shapeActive;
  // skip: go() already fetched for a path change. pending: latest choice
  // whose URL has not committed. seen: last pathname this effect applied.
  const skipPathLoad = useRef<AdminSection | null>(null);
  const seenPath = useRef<string | null>(null);
  const pendingNav = useRef<PendingNavigation | null>(null);
  const sectionRef = useRef(section);
  useEffect(() => {
    sectionRef.current = section;
  }, [section]);

  const announce = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  };

  const go = (next: AdminSection) => {
    setMobileNav(false);
    const action = startSectionSelect(
      { pathname, section },
      pendingNav.current,
      next,
    );
    pendingNav.current = action.pending;
    skipPathLoad.current = action.skip;
    if (action.section !== section) setSection(action.section);
    sectionRef.current = action.section;
    if (action.push) router.push(action.push);
    else if (action.replace) {
      router.replace(
        studioHistoryHref(
          action.replace,
          typeof window === "undefined" ? "" : window.location.hash,
        ),
      );
    }
    if (action.load) void workspace.loadSection(action.load);
    return action;
  };

  const [handedOrderId, setHandedOrderId] = useState<string | null>(null);
  const clearHandedOrder = useCallback(() => setHandedOrderId(null), []);
  const openOrder = (orderId: string) => {
    const action = go("orders");
    pendingNav.current = withOrderFocus(action.pending, orderId);
  };

  const followStudioLink = (
    route: "reviews" | "help" | "messages" | "shape",
  ) => {
    setMobileNav(false);
    const visible = { pathname, section: sectionRef.current };
    const action =
      route === "reviews"
        ? startReviewsLink(visible, pendingNav.current)
        : route === "help"
          ? startHelpLink(visible, pendingNav.current)
          : route === "messages"
            ? startMessagesLink(visible, pendingNav.current)
            : startShapeLink(visible, pendingNav.current);
    pendingNav.current = action.pending;
    skipPathLoad.current = action.skip;
    if (action.replace) router.replace(action.replace);
  };

  // Back/Forward cancels an uncommitted choice before React paints the
  // restored URL, so that choice cannot overwrite the remembered section
  // or skip its fetch. Hash updates use pushState and do not fire this.
  useEffect(() => {
    const onPop = () => {
      pendingNav.current = null;
      skipPathLoad.current = null;
      setHandedOrderId(null);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // First authenticated paint, refresh, a studio link, and browser
  // history. Explicit choices load inside go(); skipPathLoad stops the
  // matching path change from fetching again. Logout clears skip, because
  // it also clears loaded data.
  useEffect(() => {
    const settled = settleStudioPath({
      auth: workspace.authStatus,
      pathname,
      section,
      seen: seenPath.current,
      skip: skipPathLoad.current,
      pending: pendingNav.current,
    });
    seenPath.current = settled.seen;
    skipPathLoad.current = settled.skip;
    pendingNav.current = settled.pending;
    sectionRef.current = settled.section;
    setHandedOrderId((current) =>
      current === settled.focusOrderId ? current : settled.focusOrderId,
    );
    if (settled.section !== section) setSection(settled.section);
    if (settled.load) void workspace.loadSection(settled.load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace.authStatus, pathname]);

  const gate = staffGate(
    workspace.authStatus,
    Boolean(workspace.user?.adminRole),
  );
  if (gate === "loading") {
    return (
      <div className="admin-shell">
        <main className="admin-main">
          <p className="admin-loading">در حال اتصال به پایگاه داده…</p>
        </main>
      </div>
    );
  }
  if (gate === "error") {
    return (
      <div className="admin-shell">
        <main className="admin-main">
          <div className="auth-error-state">
            <p>
              اتصال به پایگاه داده برقرار نشد. اتصال اینترنت را بررسی و دوباره
              تلاش کنید.
            </p>
            <button
              className="primary-action"
              type="button"
              onClick={() => {
                void workspace.retryAuth();
              }}
            >
              تلاش دوباره
            </button>
          </div>
        </main>
      </div>
    );
  }
  if (gate === "login") {
    return (
      <AdminLogin
        onLogin={workspace.login}
        onForgotPassword={workspace.forgotPassword}
      />
    );
  }

  const openMessages = workspace.messages.filter(
    (message) => !message.parentId && message.status === "new",
  ).length;
  const openDamage = workspace.damageReports.filter(
    (report) => report.status === "submitted" || report.status === "reviewing",
  ).length;
  const title = reviewsActive
    ? "نظر مشتریان"
    : helpActive
      ? "پرسش‌های راهنما"
      : messagesActive
        ? "پیام‌ها"
        : shapeActive
          ? "پرسشنامه‌ی شکل"
          : navItems.find((item) => item.id === section)?.label;

  return (
    <AdminChromeContext.Provider
      value={{
        workspace,
        section,
        go,
        announce,
        openOrder,
        handedOrderId,
        clearHandedOrder,
      }}
    >
      <div className="admin-shell">
        <aside
          className={`admin-sidebar ${mobileNav ? "is-open" : ""}`}
          aria-label="ناوبری مدیریت"
        >
          <button
            className="nav-close"
            type="button"
            onClick={() => setMobileNav(false)}
            aria-label="بستن منو"
          >
            <X />
          </button>
          <div className="brand-lockup">
            <span className="brand-mark">
              <img src="/rad-logo.png" alt="رَد" width={52} height={52} />
            </span>
            <div>
              <strong>دفتر کوره</strong>
              <small>پنل مدیریت استودیو</small>
            </div>
          </div>
          <nav className="admin-nav">
            {navItems.map(({ id, label, icon: Icon }) => {
              const className =
                id === "reviews"
                  ? reviewsActive
                    ? "active"
                    : ""
                  : id === "help"
                    ? helpActive
                      ? "active"
                      : ""
                    : id === "messages"
                      ? messagesActive
                        ? "active"
                        : ""
                      : id === "shape"
                        ? shapeActive
                          ? "active"
                          : ""
                        : !routeActive && section === id
                          ? "active"
                          : "";
              const body = (
                <>
                  <Icon />
                  <span>
                    {label}
                    {id === "messages" && openMessages ? (
                      <em
                        className="nav-count"
                        aria-label={`${number.format(openMessages)} پیام رسیدگی‌نشده`}
                      >
                        {number.format(openMessages)}
                      </em>
                    ) : null}
                    {id === "damage" && openDamage ? (
                      <em
                        className="nav-count"
                        aria-label={`${number.format(openDamage)} گزارش آسیب باز`}
                      >
                        {number.format(openDamage)}
                      </em>
                    ) : null}
                  </span>
                  <ChevronLeft />
                </>
              );
              if (
                id === "reviews" ||
                id === "help" ||
                id === "messages" ||
                id === "shape"
              ) {
                return (
                  <Link
                    key={id}
                    href={studioNavHref(id)}
                    className={className}
                    onClick={() => followStudioLink(id)}
                  >
                    {body}
                  </Link>
                );
              }
              return (
                <button
                  key={id}
                  type="button"
                  className={className}
                  onClick={() => go(id)}
                >
                  {body}
                </button>
              );
            })}
          </nav>
          <div className="sidebar-foot">
            <div className="avatar">
              {workspace.user?.name.trim().charAt(0)}
            </div>
            <div>
              <strong>{workspace.user?.name}</strong>
              <small>{roleLabels[workspace.currentRole]}</small>
            </div>
            <button
              type="button"
              aria-label="خروج از حساب"
              onClick={() => {
                void workspace.logout();
              }}
            >
              <LogOut />
            </button>
          </div>
        </aside>

        {mobileNav && (
          <button
            className="nav-scrim"
            type="button"
            onClick={() => setMobileNav(false)}
            aria-label="بستن منو"
          />
        )}

        <main className="admin-main">
          <header className="admin-topbar">
            <button
              className="menu-button"
              type="button"
              onClick={() => setMobileNav(true)}
              aria-label="باز کردن منو"
            >
              <Menu />
            </button>
            <div>
              <span className="context-label">رَد / عملیات استودیو</span>
              <h1>{title}</h1>
            </div>
            <Link
              href="/messages"
              className="topbar-bell"
              onClick={() => followStudioLink("messages")}
              aria-label={
                openMessages
                  ? `${number.format(openMessages)} پیام رسیدگی‌نشده`
                  : "پیام‌ها"
              }
            >
              <Bell />
              {openMessages > 0 && (
                <em className="nav-count">{number.format(openMessages)}</em>
              )}
            </Link>
            <div className="topbar-status">
              <span className="live-dot" />
              پایگاه داده Postgres
            </div>
          </header>
          {children}
        </main>
        <div
          className={`admin-toast ${toast ? "visible" : ""}`}
          role="status"
          aria-live="polite"
        >
          {toast}
        </div>
      </div>
    </AdminChromeContext.Provider>
  );
}

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
import { Button } from "@rad/ui";
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
  QrCode,
  ScrollText,
  Shapes,
  ShoppingBag,
  SlidersHorizontal,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useStaffNoticeReads } from "../hooks/use-staff-notice-reads";
import {
  commissionNoticeHash,
  latestCustomerMessage,
} from "../lib/commission-notice-link";
import {
  commissionNoticeKey,
  messageNoticeKey,
  orderNoticeKey,
} from "../lib/staff-notice-keys";
import { useAdminWorkspace } from "../hooks/use-admin-workspace";
import { roleLabels, type AdminSection } from "../lib/admin-data";
import {
  initialDashboardSection,
  isHelpPath,
  isMessagesPath,
  isProductsPath,
  isTagsPath,
  isReviewsPath,
  isShapePath,
  settleStudioPath,
  staffGate,
  startHelpLink,
  startMessagesLink,
  startProductsLink,
  startTagsLink,
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
  { id: "tags", label: "تگ‌ها و QR", icon: QrCode },
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
  readNotice: (key: string) => void;
};

const AdminChromeContext = createContext<AdminChrome | null>(null);

export function useOptionalAdminChrome() {
  return useContext(AdminChromeContext);
}

export function useAdminChrome() {
  const chrome = useContext(AdminChromeContext);
  if (!chrome) {
    throw new Error("Admin chrome is only available inside the studio shell");
  }
  return chrome;
}

export function AdminShell({ children }: { children: ReactNode }) {
  const workspace = useAdminWorkspace();
  const noticeReads = useStaffNoticeReads(workspace.user?.id);
  const readNotice = useCallback(
    (key: string) => {
      if (!noticeReads.keys?.has(key))
        void noticeReads.markRead(key).catch(() => {});
    },
    [noticeReads.keys, noticeReads.markRead],
  );
  const pathname = usePathname();
  const router = useRouter();
  const [section, setSection] = useState<AdminSection>(() =>
    initialDashboardSection(
      typeof window === "undefined" ? "" : window.location.hash,
    ),
  );
  const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);
  const [noticesOpen, setNoticesOpen] = useState(false);
  const noticeMenuRef = useRef<HTMLDivElement>(null);
  const noticeBellRef = useRef<HTMLButtonElement>(null);
  const reviewsActive = isReviewsPath(pathname);
  const helpActive = isHelpPath(pathname);
  const messagesActive = isMessagesPath(pathname);
  const shapeActive = isShapePath(pathname);
  const productsActive = isProductsPath(pathname);
  const tagsActive = isTagsPath(pathname);
  const routeActive =
    reviewsActive ||
    helpActive ||
    messagesActive ||
    shapeActive ||
    productsActive ||
    tagsActive;
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
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2800);
  };

  const go = (next: AdminSection) => {
    setMobileNav(false);
    setNoticesOpen(false);
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
    if (!action.pending) setHandedOrderId(orderId);
  };

  const openCommissionNotice = (targetHash: string) => {
    setNoticesOpen(false);
    setMobileNav(false);
    const action = startSectionSelect(
      { pathname, section: sectionRef.current },
      pendingNav.current,
      "commissions",
    );
    pendingNav.current = action.pending;
    skipPathLoad.current = action.skip;
    if (action.section !== sectionRef.current) setSection(action.section);
    sectionRef.current = action.section;
    const url = `/${targetHash}`;
    if (action.push) router.push(url);
    else if (action.replace) router.replace(url);
    else window.location.hash = targetHash;
    if (action.load) void workspace.loadSection(action.load);
  };

  useEffect(() => {
    if (!noticesOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!noticeMenuRef.current?.contains(event.target as Node)) {
        setNoticesOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setNoticesOpen(false);
      noticeBellRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [noticesOpen]);

  const followStudioLink = (
    route: "reviews" | "help" | "messages" | "shape" | "products" | "tags",
  ) => {
    setMobileNav(false);
    setNoticesOpen(false);
    const visible = { pathname, section: sectionRef.current };
    const action =
      route === "reviews"
        ? startReviewsLink(visible, pendingNav.current)
        : route === "help"
          ? startHelpLink(visible, pendingNav.current)
          : route === "messages"
            ? startMessagesLink(visible, pendingNav.current)
            : route === "shape"
              ? startShapeLink(visible, pendingNav.current)
              : route === "products"
                ? startProductsLink(visible, pendingNav.current)
                : startTagsLink(visible, pendingNav.current);
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
      <div className="admin-shell" aria-busy="true">
        <aside className="admin-sidebar" aria-hidden="true">
          <div className="brand-lockup">
            <span className="brand-mark">
              <img src="/rad-logo.png" alt="" width={52} height={52} />
            </span>
            <strong>دفتر کوره</strong>
          </div>
          <div className="admin-nav admin-nav-placeholder">
            {navItems.map(({ id, label, icon: Icon }) => (
              <div key={id}>
                <Icon />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </aside>
        <main className="admin-main">
          <header className="admin-topbar">
            <h1>{navItems.find((item) => item.id === section)?.label}</h1>
          </header>
          <p className="admin-loading" role="status">
            در حال بارگذاری…
          </p>
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
            <Button
              variant="primary"
              onClick={() => {
                void workspace.retryAuth();
              }}
            >
              تلاش دوباره
            </Button>
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
    (message) =>
      !message.parentId &&
      message.status === "new" &&
      noticeReads.ready &&
      !noticeReads.keys?.has(
        messageNoticeKey(
          message,
          workspace.messages.filter((reply) => reply.parentId === message.id),
        ),
      ),
  ).length;
  const pendingOrders = workspace.orders.filter(
    (order) =>
      noticeReads.ready &&
      !noticeReads.keys?.has(orderNoticeKey(order)) &&
      (order.status === "pending_payment" ||
        order.status === "pending_verification" ||
        order.status === "confirmed"),
  );
  const pendingCommissions = workspace.commissions.filter((commission) => {
    const last = commission.messages
      .filter((message) => !message.internal)
      .at(-1);
    return (
      noticeReads.ready &&
      !noticeReads.keys?.has(commissionNoticeKey(commission)) &&
      (commission.stage === "design_submitted" ||
        commission.stage === "feasibility" ||
        last?.author === "customer")
    );
  });
  const notificationCount =
    openMessages + pendingOrders.length + pendingCommissions.length;
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
          : productsActive
            ? "آثار و محصولات"
            : tagsActive
              ? "تگ‌ها و QR"
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
        readNotice,
      }}
    >
      <div className="admin-shell">
        <aside
          className={`admin-sidebar ${mobileNav ? "is-open" : ""}`}
          aria-label="ناوبری مدیریت"
        >
          <Button
            variant="ghost"
            shape="icon"
            className="nav-close"
            onClick={() => setMobileNav(false)}
            aria-label="بستن منو"
          >
            <X />
          </Button>
          <div className="brand-lockup">
            <Link
              href="/"
              className="brand-mark"
              aria-label="مرور استودیو"
              onClick={(event) => {
                event.preventDefault();
                go("overview");
              }}
            >
              <img src="/rad-logo.png" alt="رَد" width={52} height={52} />
            </Link>
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
                        : id === "products"
                          ? productsActive
                            ? "active"
                            : ""
                          : id === "tags"
                            ? tagsActive
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
                        aria-label={`${number.format(openMessages)} پیام خوانده‌نشده`}
                      >
                        {number.format(openMessages)}
                      </em>
                    ) : null}
                    {id === "orders" && pendingOrders.length ? (
                      <em className="nav-count">
                        {number.format(pendingOrders.length)}
                      </em>
                    ) : null}
                    {id === "commissions" && pendingCommissions.length ? (
                      <em className="nav-count">
                        {number.format(pendingCommissions.length)}
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
                id === "shape" ||
                id === "products" ||
                id === "tags"
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
                <Button
                  key={id}
                  variant="ghost"
                  fullWidth
                  className={className}
                  onClick={() => go(id)}
                >
                  {body}
                </Button>
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
            <Button
              variant="ghost"
              shape="icon"
              aria-label="خروج از حساب"
              onClick={() => {
                void workspace.logout();
              }}
            >
              <LogOut />
            </Button>
          </div>
        </aside>

        {mobileNav && (
          <Button
            variant="ghost"
            className="nav-scrim"
            onClick={() => setMobileNav(false)}
            aria-label="بستن منو"
          />
        )}

        <main className="admin-main">
          <header className="admin-topbar">
            <Button
              variant="ghost"
              shape="icon"
              className="menu-button"
              onClick={() => {
                setNoticesOpen(false);
                setMobileNav(true);
              }}
              aria-label="باز کردن منو"
            >
              <Menu />
            </Button>
            <div>
              <span className="context-label">رَد / عملیات استودیو</span>
              <h1>{title}</h1>
            </div>
            <div className="admin-notice-menu" ref={noticeMenuRef}>
              <button
                ref={noticeBellRef}
                type="button"
                className="topbar-bell"
                aria-label="اعلان‌های استودیو"
                aria-expanded={noticesOpen}
                aria-controls="admin-notices"
                onClick={() => setNoticesOpen((open) => !open)}
              >
                <Bell />
                {notificationCount > 0 && (
                  <em className="nav-count">
                    {number.format(notificationCount)}
                  </em>
                )}
              </button>
              {noticesOpen && (
                <section
                  id="admin-notices"
                  className="admin-notice-panel"
                  aria-label="اعلان‌ها"
                >
                  <strong>اعلان‌های خوانده‌نشده</strong>
                  {openMessages > 0 && (
                    <button
                      type="button"
                      className="admin-notice-row"
                      onClick={() => {
                        setNoticesOpen(false);
                        go("messages");
                      }}
                    >
                      <span className="admin-notice-dot" aria-hidden="true" />
                      <span className="admin-notice-copy">
                        <b>
                          {number.format(openMessages)} گفت‌وگوی خوانده‌نشده
                        </b>
                      </span>
                    </button>
                  )}
                  {pendingOrders.map((order) => (
                    <button
                      key={order.id}
                      type="button"
                      className="admin-notice-row"
                      onClick={() => {
                        setNoticesOpen(false);
                        openOrder(order.id);
                      }}
                    >
                      <span className="admin-notice-dot" aria-hidden="true" />
                      <span className="admin-notice-copy">
                        <b>سفارش فروشگاه</b>
                        <span className="admin-notice-id">{order.id}</span>
                      </span>
                    </button>
                  ))}
                  {pendingCommissions.map((commission) => {
                    const message = latestCustomerMessage(commission);
                    return (
                      <a
                        key={commission.id}
                        className="admin-notice-row"
                        href={`/${commissionNoticeHash(commission)}`}
                        onClick={(event) => {
                          event.preventDefault();
                          openCommissionNotice(
                            commissionNoticeHash(commission),
                          );
                        }}
                      >
                        <span className="admin-notice-dot" aria-hidden="true" />
                        <span className="admin-notice-copy">
                          <b>
                            {message ? "پیام سفارش اختصاصی" : "سفارش اختصاصی"}
                          </b>
                          <span className="admin-notice-id">
                            {commission.id}
                          </span>
                        </span>
                      </a>
                    );
                  })}
                  {!notificationCount && <p>اعلان خوانده‌نشده‌ای نیست.</p>}
                </section>
              )}
            </div>
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

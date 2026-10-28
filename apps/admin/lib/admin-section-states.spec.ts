import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type {
  AdminContactMessage,
  AdminMember,
  AdminReview,
  AdminUser,
  HelpQuestion,
  ShapeQuestion,
} from "./admin-data";
import { AdminAsyncRegion } from "../components/admin-async-region";
import { AdminContactMessageItem } from "../components/admin-contact-message";
import { InviteDialog, Members } from "../components/admin-members";
import { UsersPanel } from "../components/admin-users";
import { ConfirmDialog } from "../components/admin-dialog";
import { AdminHelpQuestions } from "../components/admin-help-questions";
import { AdminMessages } from "../components/admin-messages";
import { AdminReviews } from "../components/admin-reviews";
import { AdminShapeQuestions } from "../components/admin-shape-questions";

const retry = () => {};
const noop = async () => {};
const save = async () => true;

const message: AdminContactMessage = {
  id: "m1",
  topic: "order",
  source: "contact",
  name: "نگار تست",
  contact: "n@example.com",
  body: "سلام",
  status: "new",
  fromAdmin: false,
  fromOrderOwner: true,
  signedIn: false,
  createdAt: Date.UTC(2026, 0, 2),
};

const review: AdminReview = {
  id: "r1",
  productSlug: "vase",
  author: "سارا تست",
  rating: 5,
  comment: "عالی بود",
  createdAt: Date.UTC(2026, 0, 2),
  hidden: false,
};

const choice = (value: number, fa: string, en: string) => ({
  label: { fa, en },
  note: { fa: `${fa} توضیح`, en: `${en} note` },
  photo: { src: `/${en}.jpg`, alt: { fa, en } },
  value,
});

const shape: ShapeQuestion = {
  id: "s1",
  trait: "crooked",
  prompt: { fa: "کج ایستاده؟", en: "crooked?" },
  hint: { fa: "به لبه نگاه کن", en: "look at the rim" },
  choices: [choice(0.2, "آرام", "calm"), choice(0.9, "کج", "crooked")],
};

const help: HelpQuestion = {
  id: "h1",
  question: { fa: "چطور سفارش بدهم؟", en: "How do I order?" },
  answer: { fa: "از فروشگاه", en: "From the shop" },
};

const customer: AdminUser = {
  id: "u1",
  name: "مینا تست",
  email: "mina@example.com",
  status: "active",
  createdAt: Date.UTC(2026, 0, 2),
};

const member: AdminMember = {
  id: "mb1",
  name: "سحر تست",
  email: "sahar@example.com",
  role: "editor",
  status: "active",
};

function html(node: ReactElement) {
  return renderToStaticMarkup(node);
}

test("messages stay on a skeleton while the first request is pending", () => {
  const markup = html(
    createElement(AdminMessages, {
      messages: [],
      loading: true,
      loadError: false,
      onRetry: retry,
      orders: [],
      canWrite: true,
      onSetStatus: noop,
      onReply: noop,
      onOpenOrder: () => {},
    }),
  );
  assert.match(markup, /admin-skeleton/);
  assert.match(markup, /در حال بارگذاری پیام‌ها/);
  assert.doesNotMatch(markup, /پیام رسیدگی‌نشده‌ای نیست/);
});

test("a failed message load offers retry and does not look empty", () => {
  const markup = html(
    createElement(AdminMessages, {
      messages: [],
      loading: false,
      loadError: true,
      onRetry: retry,
      orders: [],
      canWrite: true,
      onSetStatus: noop,
      onReply: noop,
      onOpenOrder: () => {},
    }),
  );
  assert.match(markup, /تلاش دوباره/);
  assert.match(markup, /دریافت پیام‌ها ناموفق بود/);
  assert.doesNotMatch(markup, /پیام رسیدگی‌نشده‌ای نیست/);
  assert.doesNotMatch(markup, /admin-skeleton/);
});

test("messages show the empty copy only after a successful empty response", () => {
  const markup = html(
    createElement(AdminMessages, {
      messages: [],
      loading: false,
      loadError: false,
      onRetry: retry,
      orders: [],
      canWrite: false,
      onSetStatus: noop,
      onReply: noop,
      onOpenOrder: () => {},
    }),
  );
  assert.match(markup, /پیام رسیدگی‌نشده‌ای نیست/);
  assert.doesNotMatch(markup, /admin-skeleton/);
});

test("a loaded message stays visible when a background refresh fails", () => {
  const markup = html(
    createElement(AdminMessages, {
      messages: [message],
      loading: false,
      loadError: false,
      refreshing: true,
      refreshError: true,
      onRetry: retry,
      orders: [],
      canWrite: false,
      onSetStatus: noop,
      onReply: noop,
      onOpenOrder: () => {},
    }),
  );
  assert.match(markup, /نگار تست/);
  assert.match(markup, /در حال به‌روزرسانی/);
  assert.match(markup, /اطلاعات قبلی هنوز نمایش داده می‌شود/);
  assert.doesNotMatch(markup, /admin-skeleton/);
});

test("reviews distinguish loading, failure, empty, and a real row", () => {
  const loading = html(
    createElement(AdminReviews, {
      reviews: [],
      loading: true,
      loadError: false,
      onRetry: retry,
      canWrite: false,
      onSetHidden: noop,
      onDelete: noop,
    }),
  );
  assert.match(loading, /admin-skeleton/);
  assert.doesNotMatch(loading, /هنوز نظری در این دسته نیست/);

  const failed = html(
    createElement(AdminReviews, {
      reviews: [],
      loading: false,
      loadError: true,
      onRetry: retry,
      canWrite: false,
      onSetHidden: noop,
      onDelete: noop,
    }),
  );
  assert.match(failed, /دریافت نظرها ناموفق بود/);
  assert.doesNotMatch(failed, /هنوز نظری در این دسته نیست/);

  const empty = html(
    createElement(AdminReviews, {
      reviews: [],
      loading: false,
      loadError: false,
      onRetry: retry,
      canWrite: false,
      onSetHidden: noop,
      onDelete: noop,
    }),
  );
  assert.match(empty, /هنوز نظری در این دسته نیست/);

  const ready = html(
    createElement(AdminReviews, {
      reviews: [review],
      loading: false,
      loadError: false,
      onRetry: retry,
      canWrite: false,
      onSetHidden: noop,
      onDelete: noop,
    }),
  );
  assert.match(ready, /سارا تست/);
});

test("a loaded review stays visible when a background refresh fails", () => {
  const markup = html(
    createElement(AdminReviews, {
      reviews: [review],
      loading: false,
      loadError: false,
      refreshing: true,
      refreshError: true,
      onRetry: retry,
      canWrite: false,
      onSetHidden: noop,
      onDelete: noop,
    }),
  );
  assert.match(markup, /سارا تست/);
  assert.match(markup, /در حال به‌روزرسانی/);
  assert.match(markup, /اطلاعات قبلی هنوز نمایش داده می‌شود/);
  assert.doesNotMatch(markup, /هنوز نظری در این دسته نیست/);
  assert.doesNotMatch(markup, /admin-skeleton/);
});

test("shape questions distinguish loading, failure, empty, a real row, and a failed refresh", () => {
  const loading = html(
    createElement(AdminShapeQuestions, {
      questions: [] as ShapeQuestion[],
      loading: true,
      loadError: false,
      onRetry: retry,
      canWrite: true,
      onSave: save,
      onDelete: noop,
      onReorder: noop,
    }),
  );
  assert.match(loading, /در حال بارگذاری پرسش‌های شکل/);
  assert.doesNotMatch(loading, /هیچ سؤالی نیست/);
  assert.match(loading, /disabled/);

  const failed = html(
    createElement(AdminShapeQuestions, {
      questions: [] as ShapeQuestion[],
      loading: false,
      loadError: true,
      onRetry: retry,
      canWrite: true,
      onSave: save,
      onDelete: noop,
      onReorder: noop,
    }),
  );
  assert.match(failed, /دریافت پرسش‌های شکل ناموفق بود/);
  assert.match(failed, /تلاش دوباره/);
  assert.doesNotMatch(failed, /هیچ سؤالی نیست/);

  const empty = html(
    createElement(AdminShapeQuestions, {
      questions: [] as ShapeQuestion[],
      loading: false,
      loadError: false,
      onRetry: retry,
      canWrite: true,
      onSave: save,
      onDelete: noop,
      onReorder: noop,
    }),
  );
  assert.match(empty, /هیچ سؤالی نیست/);
  assert.doesNotMatch(empty, /disabled/);

  const ready = html(
    createElement(AdminShapeQuestions, {
      questions: [shape],
      loading: false,
      loadError: false,
      refreshing: true,
      refreshError: true,
      onRetry: retry,
      canWrite: true,
      onSave: save,
      onDelete: noop,
      onReorder: noop,
    }),
  );
  assert.match(ready, /کج ایستاده؟/);
  assert.match(ready, /اطلاعات قبلی هنوز نمایش داده می‌شود/);
  assert.doesNotMatch(ready, /هیچ سؤالی نیست/);
});

test("help questions distinguish loading, failure, empty, a real row, and a failed refresh", () => {
  const loading = html(
    createElement(AdminHelpQuestions, {
      questions: [] as HelpQuestion[],
      loading: true,
      loadError: false,
      onRetry: retry,
      canWrite: true,
      onSave: save,
      onDelete: noop,
      onReorder: noop,
    }),
  );
  assert.match(loading, /در حال بارگذاری پرسش‌های راهنما/);
  assert.doesNotMatch(loading, /هنوز سؤالی نیست/);
  assert.match(loading, /disabled/);

  const failed = html(
    createElement(AdminHelpQuestions, {
      questions: [] as HelpQuestion[],
      loading: false,
      loadError: true,
      onRetry: retry,
      canWrite: true,
      onSave: save,
      onDelete: noop,
      onReorder: noop,
    }),
  );
  assert.match(failed, /دریافت پرسش‌های راهنما ناموفق بود/);
  assert.match(failed, /تلاش دوباره/);
  assert.doesNotMatch(failed, /هنوز سؤالی نیست/);

  const empty = html(
    createElement(AdminHelpQuestions, {
      questions: [] as HelpQuestion[],
      loading: false,
      loadError: false,
      onRetry: retry,
      canWrite: true,
      onSave: save,
      onDelete: noop,
      onReorder: noop,
    }),
  );
  assert.match(empty, /هنوز سؤالی نیست/);

  const ready = html(
    createElement(AdminHelpQuestions, {
      questions: [help],
      loading: false,
      loadError: false,
      refreshError: true,
      onRetry: retry,
      canWrite: true,
      onSave: save,
      onDelete: noop,
      onReorder: noop,
    }),
  );
  assert.match(ready, /چطور سفارش بدهم؟/);
  assert.match(ready, /اطلاعات قبلی هنوز نمایش داده می‌شود/);
  assert.doesNotMatch(ready, /هنوز سؤالی نیست/);
});

test("customers distinguish loading, failure, empty, a real row, and a failed refresh", () => {
  const loading = html(
    createElement(UsersPanel, {
      users: [],
      loading: true,
      loadError: false,
      onRetry: retry,
    }),
  );
  assert.match(loading, /در حال بارگذاری مشتریان/);
  assert.match(loading, /admin-skeleton-block table/);
  assert.doesNotMatch(loading, /هنوز کسی از فروشگاه ثبت‌نام نکرده است/);

  const failed = html(
    createElement(UsersPanel, {
      users: [],
      loading: false,
      loadError: true,
      onRetry: retry,
    }),
  );
  assert.match(failed, /دریافت فهرست مشتریان ناموفق بود/);
  assert.match(failed, /تلاش دوباره/);
  assert.doesNotMatch(failed, /هنوز کسی از فروشگاه ثبت‌نام نکرده است/);

  const empty = html(
    createElement(UsersPanel, {
      users: [],
      loading: false,
      loadError: false,
      onRetry: retry,
    }),
  );
  assert.match(empty, /هنوز کسی از فروشگاه ثبت‌نام نکرده است/);

  const ready = html(
    createElement(UsersPanel, {
      users: [customer],
      loading: false,
      loadError: false,
      refreshing: true,
      refreshError: true,
      onRetry: retry,
    }),
  );
  assert.match(ready, /مینا تست/);
  assert.match(ready, /اطلاعات قبلی هنوز نمایش داده می‌شود/);
  assert.doesNotMatch(ready, /هنوز کسی از فروشگاه ثبت‌نام نکرده است/);
});

test("members distinguish loading, failure, empty, a real row, and a failed refresh", () => {
  const loading = html(
    createElement(Members, {
      members: [],
      loading: true,
      loadError: false,
      onRetry: retry,
      canWrite: true,
      onInvite: retry,
      onChange: noop,
    }),
  );
  assert.match(loading, /در حال بارگذاری افراد/);
  assert.match(loading, /admin-skeleton-block rows/);
  assert.doesNotMatch(loading, /هنوز فردی ثبت نشده/);
  assert.match(loading, /disabled/);

  const failed = html(
    createElement(Members, {
      members: [],
      loading: false,
      loadError: true,
      onRetry: retry,
      canWrite: true,
      onInvite: retry,
      onChange: noop,
    }),
  );
  assert.match(failed, /دریافت افراد و دسترسی ناموفق بود/);
  assert.match(failed, /تلاش دوباره/);
  assert.doesNotMatch(failed, /هنوز فردی ثبت نشده/);

  const empty = html(
    createElement(Members, {
      members: [],
      loading: false,
      loadError: false,
      onRetry: retry,
      canWrite: true,
      onInvite: retry,
      onChange: noop,
    }),
  );
  assert.match(empty, /هنوز فردی ثبت نشده/);

  const ready = html(
    createElement(Members, {
      members: [member],
      loading: false,
      loadError: false,
      refreshError: true,
      onRetry: retry,
      canWrite: true,
      onInvite: retry,
      onChange: noop,
    }),
  );
  assert.match(ready, /سحر تست/);
  assert.match(ready, /اطلاعات قبلی هنوز نمایش داده می‌شود/);
  assert.doesNotMatch(ready, /هنوز فردی ثبت نشده/);
});

test("shape and help questions do not show their empty copy before a successful load", () => {
  const shapeLoading = html(
    createElement(AdminShapeQuestions, {
      questions: [] as ShapeQuestion[],
      loading: true,
      loadError: false,
      onRetry: retry,
      canWrite: true,
      onSave: save,
      onDelete: noop,
      onReorder: noop,
    }),
  );
  assert.match(shapeLoading, /در حال بارگذاری پرسش‌های شکل/);
  assert.doesNotMatch(shapeLoading, /هیچ سؤالی نیست/);
  assert.match(shapeLoading, /disabled/);

  const helpFailed = html(
    createElement(AdminHelpQuestions, {
      questions: [] as HelpQuestion[],
      loading: false,
      loadError: true,
      onRetry: retry,
      canWrite: true,
      onSave: save,
      onDelete: noop,
      onReorder: noop,
    }),
  );
  assert.match(helpFailed, /دریافت پرسش‌های راهنما ناموفق بود/);
  assert.match(helpFailed, /تلاش دوباره/);
  assert.doesNotMatch(helpFailed, /هنوز سؤالی نیست/);
});

test("table and row skeletons are used for customers and members, and children render after load", () => {
  const table = html(
    createElement(
      AdminAsyncRegion,
      {
        loading: true,
        loadError: false,
        onRetry: retry,
        errorMessage: "دریافت فهرست مشتریان ناموفق بود.",
        loadingLabel: "در حال بارگذاری مشتریان…",
        skeleton: "table",
      },
      createElement("p", null, "should-not-show"),
    ),
  );
  assert.match(table, /admin-skeleton-block table/);
  assert.doesNotMatch(table, /should-not-show/);

  const rows = html(
    createElement(
      AdminAsyncRegion,
      {
        loading: false,
        loadError: true,
        onRetry: retry,
        errorMessage: "دریافت افراد و دسترسی ناموفق بود.",
        loadingLabel: "در حال بارگذاری افراد…",
        skeleton: "rows",
      },
      createElement("p", null, "should-not-show"),
    ),
  );
  assert.match(rows, /دریافت افراد و دسترسی ناموفق بود/);
  assert.doesNotMatch(rows, /should-not-show/);

  const ready = html(
    createElement(
      AdminAsyncRegion,
      {
        loading: false,
        loadError: false,
        refreshError: true,
        onRetry: retry,
        errorMessage: "unused",
        loadingLabel: "unused",
      },
      createElement("p", null, "لیست قبلی"),
    ),
  );
  assert.match(ready, /لیست قبلی/);
  assert.match(ready, /اطلاعات قبلی هنوز نمایش داده می‌شود/);
});

test("a reply box keeps its textarea and does not claim success in markup", () => {
  const markup = html(
    createElement(AdminContactMessageItem, {
      message,
      canWrite: true,
      onSetStatus: noop,
      onReply: noop,
    }),
  );
  assert.match(markup, /پاسخ به مشتری/);
  assert.match(markup, /ارسال پاسخ/);
  assert.doesNotMatch(markup, /admin-inline-error/);
});

test("a destructive confirm waits for the server before closing copy", () => {
  const markup = html(
    createElement(ConfirmDialog, {
      title: "حذف نظر سارا تست؟",
      description: "نظر برای همیشه حذف می‌شود.",
      confirmLabel: "حذف نظر",
      onCancel: retry,
      onConfirm: noop,
    }),
  );
  assert.match(markup, /حذف نظر سارا تست؟/);
  assert.match(markup, />حذف نظر</);
  assert.doesNotMatch(markup, /در حال انجام/);
  assert.doesNotMatch(markup, /admin-inline-error/);
});

test("invite keeps the typed fields in markup until the server answers", () => {
  const markup = html(
    createElement(InviteDialog, {
      onClose: retry,
      onInvite: noop,
    }),
  );
  assert.match(markup, /دعوت فرد جدید/);
  assert.match(markup, /افزودن دعوت/);
  assert.doesNotMatch(markup, /در حال ثبت/);
});

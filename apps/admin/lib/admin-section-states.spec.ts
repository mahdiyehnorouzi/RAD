import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type {
  AdminContactMessage,
  AdminReview,
  HelpQuestion,
  ShapeQuestion,
} from "./admin-data";
import { AdminAsyncRegion } from "../components/admin-async-region";
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

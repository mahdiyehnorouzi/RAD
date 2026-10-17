/**
 * P1 — Messaging: customer -> admin (contact messages).
 *
 * The /contact page's exact form DOM (apps/storefront/app/[locale]/contact/
 * page.tsx + apps/storefront/components/contact/help-panel.tsx) was not
 * fully mapped during this task's investigation — a grep for
 * input/textarea/name= in help-panel.tsx returned nothing, meaning the
 * actual compose form lives in a component not yet located. Per AGENTS.md,
 * selectors are not invented; this spec instead covers the flow at the API
 * boundary (`POST /contact/messages` -> `ContactService.create`,
 * `POST /contact/messages/:id/reply` -> `replyAsCustomer`), which
 * docs/qa/bug-report.md item 2 already verified end-to-end for ownership.
 * A follow-up task should locate the actual contact form component and add
 * a UI-level version.
 *
 * WRITTEN BUT BLOCKED in this sandbox: no running apps/api/DB. See
 * tests/e2e/automation-strategy.md.
 */
import { test, expect } from "@playwright/test";
import { newApiContext, API_BASE_URL } from "../../fixtures/api";

test("customer can create a contact message and reply to their own thread", async () => {
  const api = await newApiContext();

  const createRes = await api.post(`${API_BASE_URL}/contact/messages`, {
    data: {
      topic: "other",
      source: "contact",
      contact: "mahdiyeh.e2e-test@example.com",
      body: "سؤال تستی درباره‌ی ارسال سفارش",
    },
  });
  expect(createRes.status(), await createRes.text()).toBe(201);
  const thread = await createRes.json();
  expect(thread.id).toBeTruthy();

  const replyRes = await api.post(
    `${API_BASE_URL}/contact/messages/${thread.id}/reply`,
    { data: { body: "پیگیری سؤال قبلی" } },
  );
  expect(replyRes.status(), await replyRes.text()).toBe(201);

  await api.dispose();
});

test("a different guest cannot reply into someone else's contact thread", async () => {
  const owner = await newApiContext();
  const createRes = await owner.post(`${API_BASE_URL}/contact/messages`, {
    data: {
      topic: "other",
      source: "contact",
      contact: "owner-e2e@example.com",
      body: "پیام اول",
    },
  });
  const thread = await createRes.json();

  const stranger = await newApiContext();
  const res = await stranger.post(
    `${API_BASE_URL}/contact/messages/${thread.id}/reply`,
    { data: { body: "تلاش برای پاسخ غیرمجاز" } },
  );
  // contact.service.ts replyAsCustomer throws ForbiddenException
  // ("این گفت‌وگو متعلق به شما نیست.") per docs/qa/bug-report.md item 2.
  expect(res.status()).toBe(403);

  await owner.dispose();
  await stranger.dispose();
});

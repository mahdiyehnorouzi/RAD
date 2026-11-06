import { expect, test } from "@playwright/test";
import { E2E_TEST_PRODUCT_SLUGS, urls } from "../support/flows";

test("two concurrent buyers can never both reserve the same 1/1 item", async ({
  browser,
}) => {
  const { storefront } = urls();
  const productSlug = E2E_TEST_PRODUCT_SLUGS.concurrency;

  // Two fully independent guest sessions (separate cookie jars), like two
  // different people on two different phones.
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  // domcontentloaded, not the default "load": Next's dev server keeps
  // HMR's connection open as part of the page, so "load" never fires.
  await Promise.all([
    pageA.goto(`${storefront}/products/${productSlug}?lang=en`, {
      waitUntil: "domcontentloaded",
    }),
    pageB.goto(`${storefront}/products/${productSlug}?lang=en`, {
      waitUntil: "domcontentloaded",
    }),
  ]);

  const clickAddAndWait = async (page: typeof pageA) => {
    const response = page.waitForResponse(
      (res) => res.url().includes("/backend/cart/items") && res.request().method() === "POST",
    );
    await page.getByRole("button", { name: /add to bag/i }).click();
    await response;
  };

  const [resultA, resultB] = await Promise.allSettled([
    clickAddAndWait(pageA),
    clickAddAndWait(pageB),
  ]);

  // Both clicks resolve (one as a successful add, one as a visible "taken"
  // error) — what matters is checked against the API below, not which
  // promise settled how.
  expect(resultA.status).toBe("fulfilled");
  expect(resultB.status).toBe("fulfilled");

  // Let the React state update from each POST's response settle before
  // reading button text/error copy.
  await Promise.all([
    pageA
      .getByRole("button", { name: "In your bag" })
      .or(pageA.getByText(/took this work|another collector|currently reserved|sold/i))
      .first()
      .waitFor(),
    pageB
      .getByRole("button", { name: "In your bag" })
      .or(pageB.getByText(/took this work|another collector|currently reserved|sold/i))
      .first()
      .waitFor(),
  ]);

  const inBagA = await pageA.getByRole("button", { name: "In your bag" }).count();
  const inBagB = await pageB.getByRole("button", { name: "In your bag" }).count();

  // Exactly one of the two browser sessions actually got the hold.
  expect(inBagA + inBagB).toBe(1);

  if (inBagB === 1) {
    await expect(pageA.getByText(/took this work|another collector|currently reserved|sold/i).first()).toBeVisible();
  } else {
    await expect(pageB.getByText(/took this work|another collector|currently reserved|sold/i).first()).toBeVisible();
  }

  // Server-side truth: the product is held (publicly shown as "sold" while
  // on hold — see AGENTS.md), never left simultaneously purchasable by both.
  // `heldBy` is internal and never exposed by the public catalog response,
  // so `holdExpiresAt` is the externally-visible proof of a real hold.
  const api = urls().api;
  const product = await (
    await pageA.request.get(`${api}/products/${productSlug}`)
  ).json();
  expect(product.status).toBe("sold");
  expect(product.reservedUntil).toBeTruthy();

  await contextA.close();
  await contextB.close();
});

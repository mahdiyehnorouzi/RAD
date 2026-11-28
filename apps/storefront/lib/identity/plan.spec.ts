import assert from "node:assert/strict";
import { test } from "node:test";
import { planIdentityRequest } from "./plan";
import {
  identityHoldDocument,
  identityNotFoundDocument,
} from "./hold-document";

const reserved = {
  radNumber: 84,
  code: "084",
  status: "reserved" as const,
  storyPublished: false,
  passportPath: null,
};

test("a reserved identity stays on its short URL", () => {
  const plan = planIdentityRequest({
    code: "084",
    search: "?lang=en",
    lookup: { kind: "found", identity: reserved },
  });
  assert.equal(plan.status, 200);
});

test("an unfinished story does not redirect, and a published one does", () => {
  const draft = planIdentityRequest({
    code: "084",
    search: "",
    lookup: {
      kind: "found",
      identity: { ...reserved, status: "assigned", storyPublished: false },
    },
  });
  assert.equal(draft.status, 200);
  const published = planIdentityRequest({
    code: "084",
    search: "?lang=en",
    lookup: {
      kind: "found",
      identity: {
        ...reserved,
        status: "assigned",
        storyPublished: true,
        passportPath: "/passport/084",
      },
    },
  });
  assert.deepEqual(published, {
    status: 307,
    location: "/passport/084?lang=en",
  });
});

test("canonical padding redirects once and an unknown code is not a placeholder", () => {
  assert.deepEqual(
    planIdentityRequest({
      code: "84",
      search: "?utm=tag",
      lookup: { kind: "found", identity: reserved },
    }),
    { status: 307, location: "/r/084?utm=tag" },
  );
  assert.equal(
    planIdentityRequest({
      code: "nope",
      search: "",
      lookup: { kind: "missing" },
    }).status,
    404,
  );
});

test("an unreachable API is not reported as a missing number", () => {
  assert.equal(
    planIdentityRequest({
      code: "084",
      search: "",
      lookup: { kind: "unreachable" },
    }).status,
    503,
  );
});

test("the placeholder names the number and stays out of search indexes", () => {
  const html = identityHoldDocument({ identity: reserved, locale: "fa" });
  assert.match(html, /رَد شماره ۰۸۴/);
  assert.match(html, /این شماره، جای یک داستان تازه‌ست\./);
  assert.match(html, /هنوز قصه‌ی این رَد اینجا ثبت نشده\./);
  assert.match(html, /noindex/);
  assert.match(html, /data-rad-code="084"/);
  const english = identityHoldDocument({ identity: reserved, locale: "en" });
  assert.match(english, /RAD 084/);
  assert.match(english, /lang="en"/);
});

test("a QR cannot redirect to another identity or an external URL", () => {
  for (const passportPath of ["/passport/085", "//example.org/passport/084"]) {
    const plan = planIdentityRequest({
      code: "084",
      search: "",
      lookup: {
        kind: "found",
        identity: {
          ...reserved,
          status: "assigned",
          storyPublished: true,
          passportPath,
        },
      },
    });
    assert.equal(plan.status, 200);
  }
});

test("unknown QR numbers get a readable, nonindexed 404 document in both locales", () => {
  const fa = identityNotFoundDocument("fa");
  const en = identityNotFoundDocument("en");
  assert.match(fa, /<!doctype html>/);
  assert.match(fa, /شماره رَد پیدا نشد/);
  assert.match(fa, /noindex/);
  assert.match(fa, /dir="rtl"/);
  assert.match(en, /RAD number not found/);
  assert.match(en, /dir="ltr"/);
});

test("retired or unpublished assigned identities never redirect to a passport", () => {
  for (const identity of [
    { ...reserved, status: "retired" as const, storyPublished: false },
    { ...reserved, status: "assigned" as const, storyPublished: false },
  ]) {
    assert.equal(
      planIdentityRequest({
        code: "084",
        search: "",
        lookup: { kind: "found", identity },
      }).status,
      200,
    );
  }
});

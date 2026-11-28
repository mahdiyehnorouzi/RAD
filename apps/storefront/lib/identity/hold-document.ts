import { formatRadCode, type Locale, type PublicRadIdentity } from "@rad/types";

const persianDigits = "۰۱۲۳۴۵۶۷۸۹";

function digits(code: string, locale: Locale) {
  if (locale !== "fa") return code;
  return code.replace(/\d/g, (digit) => persianDigits[Number(digit)] ?? digit);
}

export function identityHoldDocument(input: {
  identity: PublicRadIdentity;
  locale: Locale;
  unavailable?: boolean;
}) {
  const locale = input.locale;
  const code = input.identity.code || formatRadCode(input.identity.radNumber);
  const title = input.unavailable
    ? locale === "fa"
      ? "رَد الان در دسترس نیست"
      : "RAD is unreachable"
    : locale === "fa"
      ? `رَد شماره ${digits(code, "fa")}`
      : `RAD ${code}`;
  const line1 = input.unavailable
    ? locale === "fa"
      ? "اتصال به شناسنامه برقرار نشد. کمی بعد دوباره اسکن کنید."
      : "The identity record could not be loaded. Scan again in a moment."
    : locale === "fa"
      ? "این شماره، جای یک داستان تازه‌ست."
      : "This number is waiting for a new story.";
  const line2 = input.unavailable
    ? ""
    : locale === "fa"
      ? "هنوز قصه‌ی این رَد اینجا ثبت نشده."
      : "Its story has not been written here yet.";
  const other = locale === "fa" ? "en" : "fa";
  const otherLabel = locale === "fa" ? "English" : "فارسی";
  return `<!doctype html>
<html lang="${locale}" dir="${locale === "fa" ? "rtl" : "ltr"}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex" />
  <title>${title}</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #eee7dc; color: #18231f; font-family: Tahoma, sans-serif; }
    main { width: min(28rem, calc(100% - 2.5rem)); }
    p { font-size: 1.05rem; line-height: 1.8; }
    a { color: #263d34; }
  </style>
</head>
<body>
  <main data-rad-code="${code}">
    <h1>${title}</h1>
    <p>${line1}</p>
    ${line2 ? `<p>${line2}</p>` : ""}
    <p><a href="?lang=${other}">${otherLabel}</a></p>
  </main>
</body>
</html>`;
}

/** A real 404 page for an unknown printed number, not a misleading reserved tag. */
export function identityNotFoundDocument(locale: Locale) {
  const fa = locale === "fa";
  const title = fa ? "این شماره رَد پیدا نشد" : "RAD number not found";
  const message = fa
    ? "برای این شماره شناسنامه‌ای ثبت نشده. شماره روی برچسب را بررسی کنید."
    : "There is no identity record for this number. Check the number on the tag.";
  return `<!doctype html>
<html lang="${locale}" dir="${fa ? "rtl" : "ltr"}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex" />
  <title>${title}</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #eee7dc; color: #18231f; font-family: Tahoma, sans-serif; }
    main { width: min(28rem, calc(100% - 2.5rem)); }
    p { font-size: 1.05rem; line-height: 1.8; }
    a { color: #263d34; }
  </style>
</head>
<body>
  <main><h1>${title}</h1><p>${message}</p><p><a href="/">${fa ? "بازگشت به رَد" : "Back to RAD"}</a></p></main>
</body>
</html>`;
}

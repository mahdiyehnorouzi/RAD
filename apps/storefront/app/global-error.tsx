"use client";

import { useEffect } from "react";

// Replaces the root layout, so globals.css and the locale providers are absent.
export default function GlobalError({
  error,
  retry,
  reset,
}: {
  error: Error & { digest?: string };
  retry?: () => void;
  reset?: () => void;
}) {
  useEffect(() => {
    console.error("[rad:root]", error);
  }, [error]);

  return (
    <html lang="fa" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#fbf8f1",
          color: "#201b17",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
        }}
      >
        <title>خطا | رَد</title>
        <main style={{ padding: "2rem", maxWidth: "28rem" }}>
          <h1 style={{ fontSize: "1.5rem", margin: "0 0 0.75rem" }}>
            صفحه بارگذاری نشد
          </h1>
          <p style={{ margin: "0 0 1.5rem", lineHeight: 1.8 }}>
            مشکلی پیش آمد. دوباره تلاش کنید یا به صفحه اصلی برگردید.
          </p>
          {error.digest ? (
            <p style={{ fontSize: "0.75rem", opacity: 0.6 }}>
              <code>{error.digest}</code>
            </p>
          ) : null}
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              justifyContent: "center",
            }}
          >
            <button
              type="button"
              onClick={() => (retry ?? reset)?.()}
              style={{
                font: "inherit",
                padding: "0.6rem 1.4rem",
                border: 0,
                borderRadius: "999px",
                background: "#201b17",
                color: "#fbf8f1",
                cursor: "pointer",
              }}
            >
              تلاش دوباره
            </button>
            <a
              href="/"
              style={{
                padding: "0.6rem 1.4rem",
                borderRadius: "999px",
                border: "1px solid currentColor",
                color: "inherit",
                textDecoration: "none",
              }}
            >
              صفحه اصلی
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}

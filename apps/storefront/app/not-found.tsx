import type { Metadata } from "next";
import Link from "next/link";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...privatePageMetadata,
  title: "صفحه پیدا نشد",
  description: "این صفحه در رَد وجود ندارد.",
};

export default function NotFound() {
  return (
    <section className="section" style={{ paddingBlock: "4rem", textAlign: "center" }}>
      <h1>صفحه پیدا نشد</h1>
      <p style={{ marginBlock: "1rem" }}>
        آدرس را بررسی کنید یا از آثار و صفحهٔ اصلی ادامه دهید.
      </p>
      <p>
        <Link href="/">خانه</Link>
        {" · "}
        <Link href="/products">آثار</Link>
      </p>
    </section>
  );
}

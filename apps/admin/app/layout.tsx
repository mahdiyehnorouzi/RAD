import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "دفتر کوره | مدیریت رَد",
  description: "مدیریت محصولات، سفارش‌ها و دسترسی‌های استودیوی رَد",
  icons: {
    icon: "/rad-logo.png",
    apple: "/rad-logo.png",
    shortcut: "/rad-logo.png",
  },
};
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <html lang="fa" dir="rtl"><body>{children}</body></html>;
}

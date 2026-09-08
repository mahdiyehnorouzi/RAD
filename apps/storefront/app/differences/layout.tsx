import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "از ایده تا اثر؛ روایت ساخت آثار هنری",
  description:
    "ببینید ایده اولیه چگونه با تصمیم هنرمند، رفتار متریال و کوره به یک اثر هنری یکتا تبدیل می‌شود.",
  path: "/differences",
});

export default function DifferencesLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import { HelpHub } from "@/components/help";
import { fetchHelpQuestions } from "@/lib/api";
import { pageMetadata } from "@/lib/seo";
import { recover } from "@/lib/log";

export const metadata = pageMetadata({
  title: "راهنمای خرید و قوانین",
  description:
    "خرید آثار آماده، سفارش اختصاصی، ارسال و تحویل، مرجوعی و آسیب؛ قوانین رَد به زبان ساده، به‌همراه شرایط استفاده و حریم خصوصی.",
  path: "/help",
});

export default async function HelpRoute() {
  const questions = await fetchHelpQuestions().catch(
    recover("help questions", []),
  );
  return <HelpHub questions={questions} />;
}

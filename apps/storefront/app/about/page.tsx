import { AboutPage } from "@/components/about";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "درباره رَد",
  description:
    "داستان رَد؛ جایی که یک ایده از ذهن، دست و ماده عبور می‌کند و به اثری یگانه تبدیل می‌شود.",
  path: "/about",
});

export default function AboutRoute() {
  return <AboutPage />;
}

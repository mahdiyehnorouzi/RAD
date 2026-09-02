import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "@/components/i18n";

function backFallbackPath(pathname: string) {
  if (pathname.startsWith("/products/")) return "/products";
  if (pathname.startsWith("/orders")) return "/account";
  if (pathname === "/checkout") return "/cart";
  if (pathname === "/cart" || pathname === "/favorites") return "/products";
  if (pathname === "/account") return "/";
  return "/";
}

export function useBackNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { href } = useLocale();
  const fallbackHref = href(backFallbackPath(pathname));

  const goBack = () => {
    const referrer = document.referrer;
    const sameOrigin =
      referrer.startsWith(window.location.origin) &&
      !referrer.endsWith(pathname);
    if (sameOrigin && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallbackHref);
  };

  return { pathname, goBack, isHome: pathname === "/" };
}

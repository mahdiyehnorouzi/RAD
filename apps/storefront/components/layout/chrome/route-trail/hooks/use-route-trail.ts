"use client";

import { usePublicPathname } from "@/hooks/use-public-pathname";
import { useCatalogIndex } from "@/components/catalog";
import { formatPolicyDate, policyDocument } from "@/components/help";
import { useLocale } from "@/components/i18n";
import { useCommissionLookup } from "@/hooks/use-making-workspace";
import { categoryLabel } from "@/lib/catalog/artwork";
import { copy } from "@/lib/making";
import { TRAIL_HIDDEN_PATHS, trailCopy } from "../const";
import type { Crumb } from "../type";

function segmentText(segment: string) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function humanize(segment: string) {
  return segmentText(segment).replace(/[-_]+/g, " ");
}

/** The page path as clickable steps, ending at the current page. */
export function useRouteTrail() {
  const pathname = usePublicPathname();
  const { locale } = useLocale();
  const { find } = useCatalogIndex();
  const findCommission = useCommissionLookup();
  const c = trailCopy[locale];

  const crumbs: Crumb[] = [{ label: c.home, path: "/" }];
  const add = (label: string, path: string) => crumbs.push({ label, path });
  const [first, second, third, fourth] = pathname.split("/").filter(Boolean);

  switch (first) {
    case "products": {
      add(c.works, "/products");
      if (!second) break;
      const entry = find(second);
      const product =
        entry?.inShop && entry.slug === second ? entry : undefined;
      if (product) {
        add(
          categoryLabel(product.category, locale),
          `/products?category=${product.category}`,
        );
      }
      add(
        product ? product.title[locale] : humanize(second),
        `/products/${second}`,
      );
      if (third === "qr") add(c.qr, `/products/${second}/qr`);
      break;
    }
    case "cart":
      add(c.bag, "/cart");
      break;
    case "checkout":
      add(c.bag, "/cart");
      add(c.checkout, "/checkout");
      break;
    case "favorites":
      add(c.favorites, "/favorites");
      break;
    case "account": {
      add(c.account, "/account");
      if (!second) break;
      const pages: Record<string, string> = {
        info: c.accountInfo,
        making: c.customOrders,
        notifications: c.notifications,
      };
      add(pages[second] ?? humanize(second), `/account/${second}`);
      break;
    }
    case "orders":
      add(c.account, "/account");
      add(c.orders, "/orders");
      if (second) {
        add(c.order.replace("{id}", segmentText(second)), `/orders/${second}`);
      }
      break;
    case "making": {
      if (!second) {
        add(c.making, "/making");
        break;
      }
      add(c.account, "/account");
      add(c.customOrders, "/account/making");
      const commission = findCommission(second);
      add(
        commission ? copy(commission.title, locale) : c.commission,
        `/making/${second}`,
      );
      break;
    }
    case "workshop": {
      add(c.workshop, "/workshop");
      if (!second) break;
      const commission = findCommission(second);
      add(
        commission ? copy(commission.title, locale) : c.commission,
        `/workshop/${second}`,
      );
      break;
    }
    case "about":
      add(c.about, "/about");
      break;
    case "studio":
      add(c.studio, "/studio");
      break;
    case "shape":
      add(c.studio, "/studio");
      add(c.shape, "/shape");
      break;
    case "differences": {
      add(c.differences, "/differences");
      if (!second) break;
      const entry = find(second);
      const portrait =
        entry?.hasDifference && entry.slug === second ? entry : undefined;
      add(
        portrait ? portrait.title[locale] : humanize(second),
        `/differences/${second}`,
      );
      break;
    }
    case "now":
    case "passport": {
      add(
        first === "now" ? c.now : c.works,
        first === "now" ? "/now" : "/products",
      );
      if (!second) break;
      const artwork = find(second);
      add(
        artwork ? artwork.title[locale] : humanize(second),
        `/${first}/${second}`,
      );
      break;
    }
    case "reviews":
      add(c.reviews, "/reviews");
      break;
    case "help": {
      add(c.help, "/help");
      if (!second) break;
      const doc = policyDocument(second);
      add(doc ? doc.title[locale] : humanize(second), `/help/${second}`);
      if (third === "v" && fourth) {
        add(
          c.version.replace("{date}", formatPolicyDate(fourth, locale)),
          `/help/${second}/v/${fourth}`,
        );
      }
      break;
    }
    case "contact":
      add(c.contact, "/contact");
      break;
    case "design":
      if (second === "cards") add(c.cards, "/design/cards");
      else add(c.design, pathname);
      break;
    default: {
      let path = "";
      for (const segment of pathname.split("/").filter(Boolean)) {
        path += `/${segment}`;
        add(humanize(segment), path);
      }
    }
  }

  const current = crumbs[crumbs.length - 1];
  crumbs[crumbs.length - 1] = { label: current.label };

  return {
    crumbs,
    pathname,
    hidden: TRAIL_HIDDEN_PATHS.includes(pathname),
  };
}

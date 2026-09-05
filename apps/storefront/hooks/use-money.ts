import { useLocale } from "@/components/i18n";
import { cartTotal, formatTotal, productPrice } from "@/lib/money";
import type {Product} from "@rad/types";

export function useMoney() {
  const { locale } = useLocale();
  return {
    locale,
    productPrice: (product: Product) => productPrice(product, locale),
    cartTotal: (products: Product[]) => cartTotal(products, locale),
    formatTotal: (value: number) => formatTotal(value, locale),
  };
}

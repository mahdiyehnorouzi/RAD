/** Mirrors `CartSnapshot` in `@rad/types`. */
export interface CartPriceAtAdd {
  toman: number;
  usd: number;
}

export interface CartSnapshot {
  slugs: string[];
  holds: Record<string, number>;
  prices: Record<string, CartPriceAtAdd>;
}

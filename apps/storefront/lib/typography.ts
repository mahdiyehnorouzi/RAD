export const fontFamily = {
  sans: '"Vazirmatn", "Vazir", Tahoma, sans-serif',
} as const;

export const fontWeight = {
  regular: 400,
  medium: 500,
} as const;

export const lineHeight = {
  tight: 1.2,
  body: 1.8,
  prose: 1.85,
  quote: 1.55,
  display: 0.8,
} as const;

export const letterSpacing = {
  label: "0.12em",
  index: "0.11em",
} as const;

export const fontSize = {
  label: "0.68rem",
  caption: "0.72rem",
  identifier: "0.78rem",
  eyebrow: "0.8rem",
  button: "0.95rem",
  body: "17px",
  bodyMobile: "16px",
  price: "1.05rem",
  faq: "1.15rem",
  lede: "clamp(1rem, 1.3vw, 1.18rem)",
  prose: "clamp(1rem, 1.25vw, 1.125rem)",
  productTitle: "clamp(1.4rem, 2vw, 1.75rem)",
  h3: "clamp(1.75rem, 2.3vw, 2.25rem)",
  h2: "clamp(3rem, 4.4vw, 4rem)",
  designer: "clamp(3.2rem, 5vw, 5.5rem)",
  quote: "clamp(2rem, 4vw, 3.75rem)",
  hero: "clamp(4.5rem, 7vw, 6.75rem)",
  display: "clamp(7rem, 16vw, 15rem)",
} as const;

export const typeClass = {
  label: "text-label",
  caption: "text-caption",
  identifier: "text-identifier",
  eyebrow: "text-eyebrow",
  button: "text-button",
  body: "text-body",
  price: "text-price",
  faq: "text-faq",
  lede: "text-lede",
  prose: "text-prose",
  productTitle: "text-product-title",
  h3: "text-h3",
  h2: "text-h2",
  designer: "text-designer",
  quote: "text-quote",
  hero: "text-hero",
  display: "text-display",
} as const;

export type TypeRole = keyof typeof typeClass;

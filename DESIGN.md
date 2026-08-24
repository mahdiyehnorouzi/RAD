---
version: alpha
colors:
  primary: "#a13d2e"
  canvas: "#eee7da"
  paper: "#fbf8f1"
  ink: "#201b17"
  clay: "#a13d2e"
  sand: "#cfb890"
  moss: "#4a5039"
typography:
  display:
    fontFamily: "Vazirmatn, Vazir, Tahoma, sans-serif"
  body:
    fontFamily: "Vazirmatn, Vazir, Tahoma, sans-serif"
rounded:
  control: "999px"
  card: "1.5rem"
  artwork: "3rem"
spacing:
  page: "clamp(1.25rem, 5vw, 5rem)"
  section: "clamp(4rem, 9vw, 8rem)"
components:
  button:
    rounded: "{rounded.control}"
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
  productCard:
    rounded: "{rounded.card}"
    backgroundColor: "{colors.sand}"
---

## Overview

رَد is a hybrid editorial storefront and product tool for Iranian collectors of one-of-one ceramics. It should feel like entering a working pottery studio: mineral colors, hand-shaped silhouettes, useful annotations, and deliberate empty space. The signature is the living ceramic silhouette—each product has its own CSS-built vessel rather than a generic ecommerce photograph.

## Colors

Canvas and paper carry the gallery register. Clay marks brand actions and sold/limited states; moss is reserved for the AI studio. Runtime ownership is `app/globals.css` variables with exact mirrored values.

## Typography

All Persian and Latin interface text uses Vazirmatn/Vazir. Large Persian headlines use weight and line rhythm instead of a foreign display serif.

## Layout

RTL by default, wide asymmetrical compositions on desktop, single-column reading order below 760px. Product information remains visible without hover.

The interface supports Persian (`fa`, default, RTL) and English (`en`, LTR). Locale is owned by `components/i18n.tsx`; all shared navigation, commerce copy, product content, numbers, and accessibility labels must follow the active locale. Internal links preserve English with the shareable `?lang=en` parameter.

Never mix scripts in owned interface copy: Persian mode uses Persian wording and Persian numerals throughout; English mode uses English wording and Western numerals. Structural dividers must group content rather than decorate empty space. Process numbers stay visually attached to their corresponding step, and the one-of-one mark remains a compact identifier rather than a display headline.

## Elevation & Depth

Flat surfaces with borders; depth comes from overlapping vessel forms and tonal fields, not generic shadows.

## Shapes

Controls are pill-shaped. Content cards are softly rounded. Artwork fields use exaggerated asymmetric radii that reference thrown clay.

## Components

Header, footer, product cards, vessel artwork and buttons are shared across routes. Buttons expose solid, outline and light treatments with consistent focus states.

Commerce utilities use the Lucide line-icon family with compact count badges. Basket, favourites, account, search, and notifications stay visible in the sticky header; on phones their text labels collapse before any operation disappears. Product-card hearts sit on the artwork field like a maker's annotation. Account, orders, reviews, and checkout surfaces retain the gallery palette and use bordered paper panels instead of introducing a separate dashboard style.

Header commerce actions are icon-only at every desktop width, with counts anchored to their owning icon. Header overlays are mutually exclusive. Product cards expose a compact, reversible add/remove action on the lower artwork edge so shopping never requires entering the PDP while the ceramic remains unobscured.

Product media is a gallery rather than a single fixed image: PDP thumbnails select the active image, while missing media always resolves to a localized branded placeholder. Lightweight localized toast feedback confirms favourite, basket, and review actions without changing page context.

Desktop PDP media uses one generous contained stage with a horizontal thumbnail rail; never use a tall sliver thumbnail column. Uploaded imagery is contained rather than cropped, and missing media sits inside a smaller dashed maker-frame so absence does not become the dominant artwork.

English commerce surfaces use curated USD prices with the dollar symbol; Persian commerce keeps toman values and Persian numerals. Order status is shown as a restrained four-step kiln-to-delivery progress line rather than a generic dashboard timeline.

The profile uses a maker-mark avatar, two compact collection cards, and one moss installation panel. Mobile type deliberately steps down across heroes, application headings, actions, and the footer; the artwork remains the dominant object.

Every product owns an explicit category (`vases`, `tableware`, or `sculpture`). Category labels appear on cards and PDP context, and PLP filters use that data directly.

## Do's and Don'ts

Do use real Persian copy, Persian numerals and one-of-one inventory language. Do not use stock luxury imagery, glassmorphism, generic gradients, or hover-only product details.

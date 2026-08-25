---
version: alpha
colors:
  primary: "#263d34"
  canvas: "#eee7dc"
  paper: "#f7f2e9"
  ink: "#18231f"
  clay: "#8a4938"
  sand: "#cbb892"
  moss: "#263d34"
  muted: "#6f726b"
  line: "#d6cfc3"
typography:
  display:
    fontFamily: "Vazirmatn, Vazir, Tahoma, sans-serif"
  body:
    fontFamily: "Vazirmatn, Vazir, Tahoma, sans-serif"
rounded:
  control: "2px"
  card: "4px"
  artwork: "4px"
spacing:
  page: "clamp(1.25rem, 5vw, 5rem)"
  section: "clamp(5rem, 11vw, 11rem)"
components:
  button:
    rounded: "{rounded.control}"
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
  productCard:
    rounded: "{rounded.artwork}"
    backgroundColor: "{colors.sand}"
---

## Overview

رَد is a hybrid editorial storefront and product tool for Iranian collectors of one-of-one ceramics. Its North Star is a quiet studio archive: raw, exact, and calm. The signature is the maker identifier—`RĀD / 027` plus `1 / 1`—used consistently beside hand-shaped silhouettes. No competing serial-number notation is permitted.

## Colors

Warm paper and plaster tones carry the gallery register. The new RAD mark defines the system: deep kiln green is the primary signature, while oxide red is secondary and rare. Runtime ownership is `app/globals.css` variables with exact mirrored values.

## Typography

All Persian and Latin interface text uses Vazirmatn/Vazir to preserve the project's explicit type requirement. Large Persian headlines use scale, regular-to-medium weight, and line rhythm rather than heavy weight. Hierarchy comes from size and space, not ubiquitous boldness.

## Layout

RTL by default, wide curated asymmetrical compositions on desktop, intentional mixed-width sequencing on mobile, and single-column reading order where clarity requires it. Product information remains visible without hover. Home and PLP should read as an exhibition archive rather than a commodity ecommerce grid. Home alternates quiet ivory, full-width dark evidence, sand archive, and mineral studio surfaces to pace a long editorial journey.

The interface supports Persian (`fa`, default, RTL) and English (`en`, LTR). Locale is owned by `components/i18n.tsx`; all shared navigation, commerce copy, product content, numbers, and accessibility labels must follow the active locale. Internal links preserve English with the shareable `?lang=en` parameter.

Never mix scripts in owned interface copy: Persian mode uses Persian wording and Persian numerals throughout; English mode uses English wording and Western numerals. Structural dividers must group content rather than decorate empty space. Process numbers stay visually attached to their corresponding step, and the one-of-one mark remains a compact identifier rather than a display headline.

## Elevation & Depth

Flat surfaces with almost no containers. Separation comes from whitespace, typography, image scale, and occasional hairlines; depth comes from overlapping vessel forms and tonal fields, not generic shadows.

## Shapes

Brand CTAs and artwork fields are nearly square with a 0–4px radius. Circular 1/1 stamps are the intentional exception. Application forms may retain slightly softer geometry for usability.

## Components

Header, footer, product cards, vessel artwork and buttons are shared across routes. Primary navigation is limited to works, custom studio, and the RAD story; Journal stays absent until it has a real content library. Buttons expose solid and text-link treatments with consistent focus states.

Commerce utilities use the Lucide line-icon family with compact count badges. Basket, favourites, account, search, and notifications stay visible in the sticky header; on phones their text labels collapse before any operation disappears. Product-card hearts sit on the artwork field like a maker's annotation. Account, orders, reviews, and checkout surfaces retain the gallery palette and use bordered paper panels instead of introducing a separate dashboard style.

Header commerce actions are limited to search, favourites, and bag, with counts anchored to their owning icon. Profile and orders live in the account route/mobile menu. Header overlays are mutually exclusive. Product cards lead to the work itself; selection happens deliberately inside the PDP rather than through quick commerce. Home section identifiers use Roman numerals while process steps use `01 / 04`, keeping editorial taxonomy separate from sequence.

Product media is a gallery rather than a single fixed image: PDP thumbnails select the active image, while missing media always resolves to a localized branded placeholder. Lightweight localized toast feedback confirms favourite, basket, and review actions without changing page context.

Desktop PDP media uses one generous contained stage with a horizontal thumbnail rail; never use a tall sliver thumbnail column. Uploaded imagery is contained rather than cropped, and missing media sits inside a smaller dashed maker-frame so absence does not become the dominant artwork.

English commerce surfaces use curated USD prices with the dollar symbol; Persian commerce keeps toman values and Persian numerals. Order status is shown as a restrained four-step kiln-to-delivery progress line rather than a generic dashboard timeline.

The profile uses a maker-mark avatar, two compact collection cards, and one moss installation panel. Mobile type deliberately steps down across heroes, application headings, actions, and the footer; the artwork remains the dominant object.

Every product owns an explicit category (`vases`, `tableware`, or `sculpture`). Category labels appear on cards and PDP context, and PLP filters use that data directly.

## Do's and Don'ts

Do use real Persian copy, Persian numerals, generous uneven whitespace, curated image ratios, and one-of-one inventory language. Do use the numbering system as structural information. Do not use stock luxury imagery, glassmorphism, generic gradients, uniform card grids, decorative borders, or hover-only product details.

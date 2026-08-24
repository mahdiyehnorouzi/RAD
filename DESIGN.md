---
version: alpha
colors:
  primary: "#8b2e25"
  canvas: "#ebe4d8"
  paper: "#f4f0e8"
  ink: "#1d1a17"
  clay: "#8b2e25"
  sand: "#d3bd95"
  moss: "#59604b"
  muted: "#6e685f"
  line: "#d8d1c6"
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

رَد is a hybrid editorial storefront and product tool for Iranian collectors of one-of-one ceramics. Its North Star is a quiet studio archive: raw, exact, and calm. The signature is the maker identifier—RĀD number, Tehran/date, and 1/1—used consistently beside hand-shaped silhouettes and deliberately uneven compositions.

## Colors

Warm paper and plaster tones carry the gallery register. Oxide red is rare and meaningful: identifiers, active states, maker marks, and primary commitments. Moss is reserved for the co-creation studio. Runtime ownership is `app/globals.css` variables with exact mirrored values.

## Typography

All Persian and Latin interface text uses Vazirmatn/Vazir to preserve the project's explicit type requirement. Large Persian headlines use scale, regular-to-medium weight, and line rhythm rather than heavy weight. Hierarchy comes from size and space, not ubiquitous boldness.

## Layout

RTL by default, wide curated asymmetrical compositions on desktop, intentional mixed-width sequencing on mobile, and single-column reading order where clarity requires it. Product information remains visible without hover. Home and PLP should read as an exhibition archive rather than a uniform ecommerce grid.

The interface supports Persian (`fa`, default, RTL) and English (`en`, LTR). Locale is owned by `components/i18n.tsx`; all shared navigation, commerce copy, product content, numbers, and accessibility labels must follow the active locale. Internal links preserve English with the shareable `?lang=en` parameter.

Never mix scripts in owned interface copy: Persian mode uses Persian wording and Persian numerals throughout; English mode uses English wording and Western numerals. Structural dividers must group content rather than decorate empty space. Process numbers stay visually attached to their corresponding step, and the one-of-one mark remains a compact identifier rather than a display headline.

## Elevation & Depth

Flat surfaces with almost no containers. Separation comes from whitespace, typography, image scale, and occasional hairlines; depth comes from overlapping vessel forms and tonal fields, not generic shadows.

## Shapes

Brand CTAs and artwork fields are nearly square with a 0–4px radius. Circular 1/1 stamps are the intentional exception. Application forms may retain slightly softer geometry for usability.

## Components

Header, footer, product cards, vessel artwork and buttons are shared across routes. Primary navigation is limited to works, custom studio, and the RAD story; Journal is footer-level until it has a real content library. Buttons expose solid, text-link and restrained outline treatments with consistent focus states.

Commerce utilities use the Lucide line-icon family with compact count badges. Basket, favourites, account, search, and notifications stay visible in the sticky header; on phones their text labels collapse before any operation disappears. Product-card hearts sit on the artwork field like a maker's annotation. Account, orders, reviews, and checkout surfaces retain the gallery palette and use bordered paper panels instead of introducing a separate dashboard style.

Header commerce actions are icon-only at every desktop width, with counts anchored to their owning icon. Header overlays are mutually exclusive. Product cards expose a compact, reversible add/remove action on the artwork edge so shopping never requires entering the PDP while the ceramic remains unobscured. The action reads as a maker annotation rather than a fast-commerce banner.

Product media is a gallery rather than a single fixed image: PDP thumbnails select the active image, while missing media always resolves to a localized branded placeholder. Lightweight localized toast feedback confirms favourite, basket, and review actions without changing page context.

Desktop PDP media uses one generous contained stage with a horizontal thumbnail rail; never use a tall sliver thumbnail column. Uploaded imagery is contained rather than cropped, and missing media sits inside a smaller dashed maker-frame so absence does not become the dominant artwork.

English commerce surfaces use curated USD prices with the dollar symbol; Persian commerce keeps toman values and Persian numerals. Order status is shown as a restrained four-step kiln-to-delivery progress line rather than a generic dashboard timeline.

The profile uses a maker-mark avatar, two compact collection cards, and one moss installation panel. Mobile type deliberately steps down across heroes, application headings, actions, and the footer; the artwork remains the dominant object.

Every product owns an explicit category (`vases`, `tableware`, or `sculpture`). Category labels appear on cards and PDP context, and PLP filters use that data directly.

## Do's and Don'ts

Do use real Persian copy, Persian numerals, generous uneven whitespace, curated image ratios, and one-of-one inventory language. Do use the numbering system as structural information. Do not use stock luxury imagery, glassmorphism, generic gradients, uniform card grids, decorative borders, or hover-only product details.

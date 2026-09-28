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
    fontFamily: "IRANYekanX, Vazirmatn, Tahoma, sans-serif"
  body:
    fontFamily: "IRANYekanX, Vazirmatn, Tahoma, sans-serif"
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

رَد is a hybrid editorial storefront and product tool for Iranian collectors of one-of-one art and design, including ceramics, painting, textile, woodwork, sculpture, jewellery, and hand printing. Its North Star is a quiet living archive: raw, exact, and calm. The signature is the maker identifier—`RĀD / NNN` plus `1 / 1`—with one permanent three-digit archive number per work. The same number anchors the work's reverse-side barcode record; no competing serial-number notation is permitted.

## Colors

Warm paper and plaster tones carry the gallery register. The new RAD mark defines the system: deep kiln green is the primary signature, while oxide red is secondary and rare. Runtime ownership is `app/globals.css` variables with exact mirrored values.

## Typography

All Persian and Latin interface text uses IRANYekanX (FaNum) as the primary face, with Vazirmatn and Tahoma as fallbacks. Large Persian headlines use scale, regular-to-medium weight, and line rhythm rather than heavy weight. Hierarchy comes from size and space, not ubiquitous boldness.

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

Product cards use a specimen-plate composition: a quiet monochrome context layer sits behind one crisp colour window, with the `RĀD / NNN` and `1 / 1` identifiers attached as the image label. The effect recalls an archive contact print, not a floating ecommerce tile; metadata remains visible below and cards keep flat edges with no decorative shadow. The PDP opens with a breadcrumb row, then a buying column at the start beside a photographic gallery with a vertical thumbnail rail. The buying column reads `RĀD / NNN · 1/1`, name, one-line description and maker (centred on mobile), then availability badge opposite the price, one full-width buy button with a bag icon (kept but disabled once a work is sold or withdrawn, with a one-line sold note), three two-line policy-backed assurances, the made-by-hand note, a full-width passport card (title, one line, dark arrow action, work photo at the far edge) with a smaller secondary QR card beneath it holding the real code behind a hairline divider, and the details ledger as an open fold. Under the gallery sit the story with a wide second photograph, the anatomy of the work, the making path, care cards parsed from the work's own care text, a closed fold row for shipping and questions, and similar works, which are never folded away (four catalog plates). On mobile the gallery keeps its thumbnails as a strip beneath it, every section between the record cards and similar works collapses into one continuous list of ⊕ fold rows, and similar works follow as an open, swipeable carousel. Sections appear only when the record holds real content for them; nothing is stood in.

Each work carries its own identity inside the shared system. A RAD fingerprint, open broken ridges seeded from the work number and never repeated, sits beside `RĀD / NNN · 1/1`, faintly inside the passport card, after the QR card, at the end of the making path, on the QR label and on the passport page. The object stamp is a circular oxide seal (`RĀD OBJECT · № NNN · ONE OF ONE · year`) with an uneven ink edge. It overlaps the passport card's edge at a tilt, straightens by about 6° on hover, and is meant for packaging, certificates and box cards too. Grey dividers give way to the work's own surface: a narrow crop of its photograph sits under “About this work” and before similar works, and the details ledger shows each material as a small circle cut from that same photograph, never a flat CSS colour. Crops come from authored material spots on the image, or else from the widest solid area found in the cutout's alpha; drawn-only works keep a plain hairline. The made-by-hand note is a sketchbook annotation (hand, two lines, `~ NNN` signature) inside a loose hand-drawn loop, not a card. The work number is set very large at about 4.5% opacity behind “About this work”. The anatomy of the work is an editorial diagram: the cutout with three numbered leader annotations taken from the maker's marks, which turns into a horizontal swipe of cards on narrow containers. The making path (`Clay → Form → Drying → Glaze → Kiln → RĀD / NNN`) is shown only for ceramic categories, and the glaze step only when the materials say so.

Commerce utilities use the Lucide line-icon family with compact count badges. Basket, favourites, account, search, and notifications stay visible in the sticky header; on phones their text labels collapse before any operation disappears. Product-card hearts sit on the artwork field like a maker's annotation. Account, orders, reviews, and checkout surfaces retain the gallery palette and use bordered paper panels instead of introducing a separate dashboard style.

Header commerce actions are limited to search, favourites, and bag, with counts anchored to their owning icon. Profile and orders live in the account route/mobile menu. Header overlays are mutually exclusive. Product cards lead to the work itself; selection happens deliberately inside the PDP rather than through quick commerce. Home section identifiers use Roman numerals while process steps use `01 / 04`, keeping editorial taxonomy separate from sequence.

Every non-home route exposes one quiet back control immediately below the global header. Sold works remain visible in the archive and carry the same oxide-coloured sold badge on every product image surface, including cards, PDP media, thumbnails, and bag previews.

Product media is a gallery rather than a single fixed image: PDP thumbnails select the active image, while missing or failed backend media always resolves to the established fantasy artwork for that product category. Lightweight localized toast feedback confirms favourite, basket, and review actions without changing page context.

PDP media uses one generous 4:5 stage driven by a scroll-snapped track (touch swipe, arrows, keyboard and thumbnails stay in sync) with a counter, and a horizontal thumbnail rail below; never use a tall sliver thumbnail column. Studio lifestyle photographs fill the stage; the transparent cutout follows as a final archive plate on the work's colour field carrying `RĀD / NNN` and `1 / 1`. Uploaded imagery without a lifestyle photograph is contained rather than cropped, and default media must use the matching ceramics, painting, textile, woodwork, sculpture, jewellery, or print fantasy artwork rather than defaulting every work to a ceramic vessel.

English commerce surfaces use curated USD prices with the dollar symbol; Persian commerce keeps toman values and Persian numerals. Order status is shown as a restrained four-step kiln-to-delivery progress line rather than a generic dashboard timeline.

The profile uses a maker-mark avatar, two compact collection cards, and one moss installation panel. Mobile type deliberately steps down across heroes, application headings, actions, and the footer; the artwork remains the dominant object.

Every product owns an explicit category (`ceramics`, `painting`, `textile`, `woodwork`, `sculpture`, `jewelry`, or `print`). Category labels appear on cards and PDP context, PLP filters use that data directly, and custom design starts with the same canonical category list before revealing category-specific options.

Empty, error, not-found and no-access moments share one still-life state screen (`components/states`): a single handmade object photographed on white and multiplied onto the page, a medium-weight title, one plain sentence, a solid kiln-green action and a bordered secondary. Full-page states (404, route errors, private pages) sit copy-beside-object on desktop; states inside a page (bag, favourites, catalog results) stack centred with the object first. Only 404 and load failures carry a small oxide status line. Each object tells its state—a cracked bowl for failure, an empty basket for the bag, a clay heart for favourites—and a way forward uses real data: stocked category chips after a failed search, currently available works under an empty bag or list.

## Do's and Don'ts

## Admin application

The admin application uses the same kiln-green, paper, oxide and IRANYekanX foundations, but shifts to a denser operational rhythm. Its sidebar owns section navigation; paper panels own data views; product, order and member rows stay readable without hover. Product editing uses one shared dialog pattern with app-owned validation, while destructive actions always require an explicit confirmation dialog.

Do use real Persian copy, Persian numerals, generous uneven whitespace, curated image ratios, and one-of-one inventory language. Do use the numbering system as structural information. Do not use stock luxury imagery, glassmorphism, generic gradients, uniform card grids, decorative borders, or hover-only product details.

## About page

The About page uses a quiet editorial reading rhythm: medium-weight, wide Persian headlines, 16–18px body copy, landscape workbench imagery, and a kiln-green maker section. Page-scoped styles in `apps/storefront/components/about/about-page.css` reuse the global palette and font tokens. Keep the full bilingual story and both works/custom-studio destinations. Workshop video is user-controlled rather than autoplaying.

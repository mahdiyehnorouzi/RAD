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

The home hero is one full-bleed still life: a sunlit plaster wall with an arch and olive branch over a travertine plinth (a portrait crop on phones), ending in a torn paper edge. The headline and thesis sit centred on the wall, a fan of three pinned paper cards stands on the plinth, and the two actions sit on the plinth's face. The centre card is a photograph with a small concept tag; after a beat it turns over like a label to show its record (title, material, note, a real QR code, and a link to begin a RAD), then the next work steps forward toward the reading end while the last card slips behind the fan. The fan pauses on hover, keyboard focus, when offscreen or hidden, and from its own pause control; swipe, arrow keys and the side cards move it by hand. Under reduced motion it never autoplays and the record crossfades instead of turning.

Below the hero, the ways into RAD hang on one red thread (oxide `#8a4938`) that is drawn down the page as it scrolls, its tip following a pen line at 64% of the viewport. The thread comes straight out of the hero's torn edge, and the bands below are layered torn-paper strips set just apart. Their photographs are warm, low-sun still lives with olive leaves (`public/home/journey/`). In order:
- The ready-works band: the copy sits on a sheet whose torn inner edge overlaps the vase photograph. A kraft tag, hand-lettered `رَد ۱/۱`, is threaded on the line mid-band: in through its hole, out at its foot.
- The custom-order band: a sketching photograph at the start, then a short step rail (گفتگو / طراحی / ساخت) whose dots fill one by one. Beside the rail is a torn card with a brass pin; the thread pins it, runs behind it and comes out underneath.
- Today in the workshop: a pinned torn-paper panel whose making rail, with every stage named, fills to the current stage.
- A full-bleed hands photograph: the thread slips through a ring, and the note اثر دست / ماده / اتفاق is hand-lettered with short pen rules between the words.
- The closing band: a sunlit olive photograph with the torn "What is RAD?" card. The thread loops over the photograph and writes رَد on top.

Hand lettering uses Aref Ruqaa (`--font-hand`), and only for notes and tags. Everything the thread reaches reacts once it arrives: pins press in, photographs uncover top-down, and dots fill. Pinned papers sit above the thread so it runs behind them. Without JavaScript, and under reduced motion, the whole thread and every end state are shown at once.

The interface supports Persian (`fa`, default, RTL) and English (`en`, LTR). Locale is owned by `components/i18n.tsx`; all shared navigation, commerce copy, product content, numbers, and accessibility labels must follow the active locale. Internal links preserve English with the shareable `?lang=en` parameter.

Never mix scripts in owned interface copy: Persian mode uses Persian wording and Persian numerals throughout; English mode uses English wording and Western numerals. Structural dividers must group content rather than decorate empty space. Process numbers stay visually attached to their corresponding step, and the one-of-one mark remains a compact identifier rather than a display headline.

## Elevation & Depth

Flat surfaces with almost no containers. Separation comes from whitespace, typography, image scale, and occasional hairlines; depth comes from overlapping vessel forms and tonal fields, not generic shadows.

## Shapes

Brand CTAs and artwork fields are nearly square with a 0–4px radius. Circular 1/1 stamps are the intentional exception. Application forms may retain slightly softer geometry for usability.

## Components

Header, footer, product cards, vessel artwork and buttons are shared across routes. Primary navigation is limited to works, custom studio, and the RAD story; Journal stays absent until it has a real content library. Buttons expose solid and text-link treatments with consistent focus states.

Product cards are one `ProductCard` with four variants: `featured` (the wide home plate with a view rail and a one-line lede), `standard` (home and favourites), `compact` (catalogue grid and the PDP carousel) and `suggest` (empty and error states, with a round arrow). Cards carry no "more details" button; the photograph and the name are the way in, and the name never underlines. Each card is a soft 14px paper plate with a hairline and a low offset shadow; the photograph fills the top and a rounded paper label overlaps its lower edge carrying name, the maker byline ("اثری از …", from the work's artist, falling back to the studio), `RĀD / NNN` and the full toman price, with the work's real QR at the far edge and the work's own fingerprint pressed faintly into the label corner beneath it. Phones keep the same full label; only the featured card changes there, dropping its view rail and lede so it reads like a standard card. The number is also pencilled onto the photo in light digits with a hand-drawn underline, opposite the heart and the one badge. Badge tones are taupe for sold, moss for in the bag, oxide with a breathing glow and flickering flame for popular (only when explicitly passed, never inferred), and paper for other statuses. Motion is small and interruptible: hover lifts the card and redraws the pencil line, the QR scans (brackets, beam, check) on hover or focus and once on touch when in view, and saving a favourite pops the heart with an eight-ray burst. On cards and on the PDP the work's fingerprint presses in from its core ridge outward when it comes into view, then a faint ink ripple runs outward every few seconds, and hovering its line replays the press. All of it stops under reduced motion. Narrow cards drop the QR and stack the badge under the heart. The PDP opens with a breadcrumb row, then a buying column at the start beside a photographic gallery with a vertical thumbnail rail. The buying column reads `RĀD / NNN · 1/1`, name, one-line description and maker (centred on mobile), then availability badge opposite the price, one full-width buy button with a bag icon (kept but disabled once a work is sold or withdrawn, with a one-line sold note), three two-line policy-backed assurances, the made-by-hand note, a full-width passport card (title, one line, dark arrow action, work photo at the far edge) with a smaller secondary QR card beneath it holding the real code behind a hairline divider, and the details ledger as an open fold. Under the gallery sit the story with a wide second photograph, the anatomy of the work, the making path, care cards parsed from the work's own care text, a closed fold row for shipping and questions, and similar works, which are never folded away (four catalog plates). On mobile the gallery keeps its thumbnails as a strip beneath it, every section between the record cards and similar works collapses into one continuous list of ⊕ fold rows, and similar works follow as an open, swipeable carousel. Sections appear only when the record holds real content for them; nothing is stood in.

Each work carries its own identity inside the shared system. A RAD fingerprint, open broken ridges seeded from the work number and never repeated, sits beside `RĀD / NNN · 1/1`, faintly inside the passport card, after the QR card, at the end of the making path, on the QR label and on the passport page. The object stamp is a circular oxide seal (`RĀD OBJECT · № NNN · ONE OF ONE · year`) with an uneven ink edge. It overlaps the passport card's edge at a tilt, straightens by about 6° on hover, and is meant for packaging, certificates and box cards too. Dividers carry the work's own surface. On wide screens, under “About this work” and in place of the fold list's closing line before similar works, the hairline begins with a short rounded glaze tab (8rem × 1rem) cropped from the work's photograph near natural scale, like a test chip tied to the rule. Never stretch a crop across the column: a magnified band reads as a smear. The details ledger shows each material as a small circle cut from that same photograph, never a flat CSS colour. Crops come from authored material spots on the image. Otherwise the cutout is read for the area fully inside the object that is evenly lit, free of glare and shadow, and closest in hue to the work's recorded colour. Drawn-only works keep a plain hairline. The made-by-hand note is a sketchbook annotation (hand, two lines, `~ NNN` signature) inside a loose hand-drawn loop, not a card. The work number is set very large at about 4.5% opacity behind “About this work”. The anatomy of the work is an editorial diagram: the cutout with three numbered leader annotations taken from the maker's marks, which turns into a horizontal swipe of cards on narrow containers. The making path (`Clay → Form → Drying → Glaze → Kiln → RĀD / NNN`) is shown only for ceramic categories, and the glaze step only when the materials say so.

On phones the PDP's lower sections are numbered paper cards (`۰۱`, `۰۲`, … counted in document order; `01`, `02` in English). Each header runs, from the reading start: a ⊕/⊖ oxide circle, the title with a one-line muted lede, a brushstroke, a hairline divider and the number. The brushstroke is a crop of the work's own photograph masked by one of two dry-brush shapes (`/marks/brush-a.svg`, `/marks/brush-b.svg`). Successive cards step through a small palette of distinct surfaces read from the photo, or through the authored material spots, so the strip of cards shows the work's real colours rather than a theme accent. Works without a photograph get a plain sand stroke. Wide screens keep the plain open sections without card chrome. The details ledger is a three-column row: an icon at the start (category outline icon, the material's photo circle, the work's fingerprint for the maker, clock for the year, stacked squares for the edition), the value, and a muted label at the end. Care is a list of titled steps; each title (Washing, Heat, Light…) is derived from the real care sentence, and an oxide icon sits at the end behind a hairline. A sand note with a sprig about hand-laid glaze follows only when the materials mention glaze. When the maker has left a note in the difference record, “About this work” closes with a sand quote card: a large muted quote mark, the note, and a hand squiggle before the maker's name. The questions section opens with the shipping card, then FAQ rows with the toggle at the start and a topic icon at the end, and closes with a sand “Still have a question?” card carrying a brushstroke and an arrow to the contact page.

Commerce utilities use the Lucide line-icon family with compact count badges. Basket, favourites, account, search, and notifications stay visible in the sticky header; on phones their text labels collapse before any operation disappears. Product-card hearts sit on the artwork field like a maker's annotation. Account, orders, reviews, and checkout surfaces retain the gallery palette and use bordered paper panels instead of introducing a separate dashboard style.

Header commerce actions are limited to search, favourites, and bag, with counts anchored to their owning icon. Profile and orders live in the account route/mobile menu. Header overlays are mutually exclusive. Product cards lead to the work itself; selection happens deliberately inside the PDP rather than through quick commerce. Home section identifiers use Roman numerals while process steps use `01 / 04`, keeping editorial taxonomy separate from sequence.

Every non-home route exposes one quiet back control immediately below the global header. Sold works remain visible in the archive and carry a sold badge on every product image surface, including cards, PDP media, thumbnails, and bag previews; on cards it is the translucent taupe pill so it never competes with the oxide popular badge.

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

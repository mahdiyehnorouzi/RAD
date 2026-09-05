export const localFixes = String.raw`
button,.button,.language-switch,.utility-button,.search-toggle,.menu{box-shadow:none!important;outline:0!important}
.button{border:0!important}
.button.outline{min-height:auto!important;padding:.45rem 0!important;border:0!important;border-bottom:1px solid currentColor!important;border-radius:0!important;background:transparent!important}
.language-switch{border:0!important;border-bottom:1px solid var(--line)!important;border-radius:0!important}
button:focus-visible,.button:focus-visible,.language-switch:focus-visible{outline:0!important;box-shadow:inset 0 -2px 0 #8a4938!important}
.process .steps article > span{width:58px!important;min-width:58px!important;height:58px!important;padding:0!important;border-radius:50%!important;aspect-ratio:1!important;font-size:.68rem!important;direction:ltr!important;place-items:center!important}
html[dir="rtl"] .process .steps{direction:rtl!important}
html[dir="rtl"] .process .steps article{direction:rtl!important;text-align:right!important}
html[dir="rtl"] .process .steps article>span{justify-self:start!important}
html[dir="rtl"] .process .steps article h3,html[dir="rtl"] .process .steps article p{text-align:right!important;justify-self:stretch!important}
.shipping-faq .faq-list details{border-top:1px solid var(--line)!important;padding:0!important}
.shipping-faq .faq-list summary{list-style:none!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:1rem!important;min-height:78px!important;padding:1rem 0!important;cursor:pointer}
.shipping-faq .faq-list summary::marker{content:""!important}
.shipping-faq .faq-list summary::-webkit-details-marker{display:none!important}
.shipping-faq .faq-title{display:inline-flex!important;align-items:center!important;gap:.9rem!important}
.shipping-faq .faq-title svg{width:23px!important;height:23px!important;flex:0 0 23px!important;color:#8a4938!important;stroke-width:1.5!important}
.shipping-faq .faq-chevron{display:block!important;width:19px!important;height:19px!important;flex:0 0 19px!important;transition:transform 240ms ease-out!important}
.shipping-faq details[open] .faq-chevron{transform:rotate(180deg)!important}
.plp .product-grid .product-art{aspect-ratio:4/5!important}
.evidence-film{align-items:center!important}
.film-frame{aspect-ratio:16/9!important}
.studio-film{display:block!important;width:100%!important;height:100%!important;min-height:0!important;aspect-ratio:auto!important;object-fit:cover!important}
.mock-artwork{--art-color:#31534a;--art-accent:#d87855;position:relative;z-index:2;width:62%;height:60%;background:var(--art-color);overflow:hidden}
.mock-artwork span,.mock-artwork i{position:absolute;display:block}
.mock-artwork.painting{height:auto;aspect-ratio:4/5;border:10px solid var(--paper);background:linear-gradient(145deg,var(--art-color) 0 58%,var(--art-accent) 59% 73%,#d9c59e 74%)}
.mock-artwork.painting span{width:70%;height:24%;left:-8%;top:18%;background:color-mix(in srgb,var(--art-accent) 68%,transparent);transform:rotate(-9deg)}
.mock-artwork.painting i{width:2px;height:70%;right:24%;top:8%;background:var(--paper);transform:rotate(12deg)}
.mock-artwork.textile{height:auto;aspect-ratio:3/4;border-radius:42% 42% 4px 4px;background:repeating-linear-gradient(90deg,var(--art-color) 0 14px,color-mix(in srgb,var(--art-color) 76%,var(--paper)) 14px 18px)}
.mock-artwork.textile span{inset:12%;border:2px dashed var(--art-accent);border-radius:50% 38% 45% 30%}
.mock-artwork.textile i{width:42%;height:52%;right:10%;bottom:-8%;background:var(--art-accent);border-radius:60% 40% 0 0}
.mock-artwork.wood{height:38%;border-radius:50%;background:radial-gradient(ellipse at center,var(--art-accent) 0 40%,var(--art-color) 42% 63%,#3c2b21 64%);transform:perspective(420px) rotateX(56deg);box-shadow:0 35px 30px rgba(24,35,31,.18)}
.mock-artwork.sculpture{width:52%;height:68%;clip-path:polygon(28% 0,77% 8%,100% 43%,72% 100%,14% 87%,0 38%);background:linear-gradient(135deg,var(--art-accent),var(--art-color) 56%)}
.mock-artwork.sculpture span{width:28%;height:100%;left:35%;background:rgba(247,242,233,.18);transform:skew(-9deg)}
.mock-artwork.jewelry{width:48%;height:auto;aspect-ratio:1;background:transparent;border:15px solid var(--art-color);border-radius:50%;overflow:visible}
.mock-artwork.jewelry i{width:25%;aspect-ratio:1;right:-8%;top:4%;background:var(--art-accent);transform:rotate(45deg);border-radius:3px}
.mock-artwork.print{height:auto;aspect-ratio:3/4;border:10px solid var(--paper);background:repeating-linear-gradient(155deg,var(--art-color) 0 8px,var(--art-accent) 9px 13px,var(--paper) 14px 17px)}
.mock-artwork.print span{inset:14%;border:4px solid var(--art-color);background:color-mix(in srgb,var(--paper) 58%,transparent)}
.product-art .mock-artwork,.pdp-main-art .mock-artwork{transition:transform 650ms ease-out,filter 650ms ease-out}
.product-card:hover .mock-artwork,.product-card:focus-within .mock-artwork{transform:scale(1.02);filter:saturate(.94)}
.pdp-detail-art .mock-artwork,.cart-art .mock-artwork{width:58%;height:58%}
.design-category-fieldset{border:0;padding:0;margin:2.25rem 0}
.design-category-fieldset legend,.brief-fields legend{display:flex!important;flex-direction:column;gap:.35rem;width:100%;margin-bottom:1rem;color:var(--paper)!important}
.design-category-fieldset legend small,.brief-fields legend small{color:#c77963;font-size:.65rem;letter-spacing:.08em}
.design-category-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1px;background:rgba(247,242,233,.18);border:1px solid rgba(247,242,233,.18)}
.design-category-grid button{display:flex;align-items:center;gap:.75rem;min-height:66px;padding:.75rem;background:var(--moss);border:0;color:var(--paper);text-align:start;cursor:pointer}
.design-category-grid button:hover,.design-category-grid button.active{background:color-mix(in srgb,var(--moss) 78%,var(--sand));color:var(--paper)}
.category-swatch{display:block;width:30px;height:30px;flex:0 0 30px;background:var(--swatch);border:1px solid rgba(247,242,233,.4);border-radius:2px}
.category-swatch.painting,.category-swatch.print{border:4px solid var(--paper)}
.category-swatch.textile{background:repeating-linear-gradient(90deg,var(--swatch) 0 5px,var(--swatch-accent) 5px 7px)}
.category-swatch.wood{border-radius:50%}
.category-swatch.sculpture{clip-path:polygon(30% 0,100% 30%,70% 100%,0 75%)}
.category-swatch.jewelry{border:5px solid var(--swatch);border-radius:50%;background:transparent}
.brief-fields{grid-template-columns:1fr!important}
.brief-choice{display:grid;grid-template-columns:minmax(90px,.38fr) 1fr;gap:1rem;padding:1rem 0;border-bottom:1px solid rgba(247,242,233,.18)}
.brief-choice>span{color:rgba(247,242,233,.68);font-size:.78rem}
.brief-choice>div{display:flex;flex-wrap:wrap;gap:.45rem}
.brief-choice button{padding:.35rem .65rem;border:1px solid rgba(247,242,233,.28);border-radius:999px;background:transparent;color:var(--paper);cursor:pointer}
.brief-choice button:hover,.brief-choice button.active{border-color:var(--sand);background:var(--sand);color:var(--ink)}
.designer-form textarea:disabled{cursor:not-allowed;opacity:.55}
.resize-none{resize:none!important}
.designer-empty-preview{display:grid;place-items:center;align-content:center;gap:1.25rem;height:100%;padding:2rem;text-align:center}
.designer-empty-preview>span{display:grid;place-items:center;width:78px;aspect-ratio:1;border:1px solid currentColor;border-radius:50%;font-size:.75rem}
.designer-empty-preview p{max-width:18rem;color:var(--muted)}
.designer-preview .designer-artwork{width:48%;height:56%}
.filterbar>div{flex-wrap:wrap}
/* Shared navigation/media-state owners — intentionally override legacy screen-local rules. */
.route-back-bar{width:100%;max-width:1600px;margin-inline:auto;padding:.85rem var(--page) 0;direction:inherit}
.route-back-button{display:inline-flex;align-items:center;gap:.55rem;min-height:42px;padding:.35rem 0;border:0;border-bottom:1px solid var(--line);background:transparent;color:var(--moss);font:inherit;font-size:.82rem;cursor:pointer}
.route-back-button:hover{border-bottom-color:var(--clay);color:var(--clay)}
.route-back-button svg{width:18px;height:18px;stroke-width:1.6}
.button-arrow{width:18px;height:18px;flex:0 0 18px;stroke-width:1.6}
.sold-media-badge{position:absolute;z-index:8;top:1rem;inset-inline-end:1rem;display:inline-flex;align-items:center;min-height:30px;padding:.32rem .7rem;border:1px solid color-mix(in srgb,var(--paper) 66%,transparent);border-radius:999px;background:var(--clay);color:var(--paper);font-size:.68rem;font-weight:700;line-height:1;box-shadow:0 4px 18px rgba(24,35,31,.12);pointer-events:none}
.product-art,.pdp-main-art,.pdp-detail-art button,.cart-art{position:relative}
.pdp-detail-art .sold-media-badge{top:.35rem;inset-inline-end:.35rem;min-height:22px;padding:.22rem .4rem;font-size:.52rem}
.cart-art .sold-media-badge{top:.5rem;inset-inline-end:.5rem;min-height:24px;padding:.25rem .48rem;font-size:.55rem}
/* Category rail keeps its scrollbar and adds an explicit swipe cue and clipped-edge affordance. */
.filterbar{display:grid!important;grid-template-columns:minmax(0,1fr)!important;align-items:stretch!important;gap:.35rem!important;margin:1rem 0 1.5rem!important;padding:.5rem 0!important}
.filter-heading{grid-column:1/-1;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:.5rem!important;width:100%!important;margin:0!important}
.filter-heading>b{font-size:.82rem;font-weight:600}
.filter-scroll-hint{display:inline-flex;align-items:center;gap:.4rem;color:var(--muted);font-size:.7rem;white-space:nowrap}
.filter-scroll-hint svg{width:18px;height:18px;stroke-width:1.5}
.filter-scroll-shell{position:relative;min-width:0;width:100%;overflow:hidden}
.filter-scroll-shell::after{content:"";position:absolute;z-index:2;top:0;bottom:.65rem;inset-inline-end:0;width:42px;background:linear-gradient(to var(--fade-direction,left),transparent,color-mix(in srgb,var(--canvas) 94%,transparent));pointer-events:none}
html[dir="rtl"] .filter-scroll-shell{--fade-direction:left}
html[dir="ltr"] .filter-scroll-shell{--fade-direction:right}
.filter-scroll{display:flex!important;flex-wrap:nowrap!important;align-items:center!important;gap:.55rem!important;width:100%!important;overflow-x:auto!important;overscroll-behavior-inline:contain;scroll-snap-type:x proximity;padding:.1rem 0 .35rem;scrollbar-width:thin;scrollbar-gutter:auto}
.filter-scroll:focus-visible{outline:1px solid var(--clay);outline-offset:4px}
.filter-scroll button{flex:0 0 auto!important;min-height:42px;padding:.5rem .85rem!important;border:1px solid var(--line)!important;border-radius:999px!important;background:var(--paper)!important;scroll-snap-align:start;white-space:nowrap}
.filter-scroll button.active{border-color:var(--clay)!important;background:var(--clay)!important;color:var(--paper)!important}
.filter-count{grid-column:1/-1!important;justify-self:stretch!important;text-align:start!important;white-space:nowrap;margin:0!important;padding-top:.15rem!important}
html[dir="rtl"] .filter-count{text-align:right!important}
.product-category{margin-bottom:.2rem!important}
.logo{width:auto!important;min-width:0!important;align-items:center!important}
.logo-mark{width:54px!important;height:54px!important;overflow:visible!important}
.logo-mark img{position:static!important;width:100%!important;height:100%!important;max-width:none!important;transform:none!important;object-fit:contain!important}
.logo>span:last-child{margin-top:.35rem!important}
.hero-copy h1{max-width:10ch!important;font-size:clamp(2.35rem,4.8vw,4.75rem)!important;line-height:1.22!important;font-weight:400!important}
.home-products .product-meta,.home-products .product-meta>div{display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:.35rem!important;min-height:0!important;width:100%!important;text-align:right!important}
.home-products .product-meta>span{align-self:start!important;width:auto!important;margin-top:.15rem!important;text-align:start!important}
.home-products .product-meta h3,.home-products .product-meta p{min-height:0!important;margin:0!important}
.home-products .product-meta h3{font-size:var(--text-product-title)!important;font-weight:400!important;line-height:1.35!important}
.home-products .product-meta p{font-size:.82rem!important}
.process .section-heading{justify-content:flex-start!important;align-items:start!important;width:100%!important;text-align:right!important;margin-bottom:2rem!important}
.process .section-heading>div{width:100%!important;text-align:right!important}
.process .section-heading h2,.archive-section .section-heading h2,.entry-paths h2{font-size:clamp(1.45rem,6.5vw,1.85rem)!important;font-weight:400!important;line-height:1.25!important}
.process .steps article h3{font-size:clamp(1rem,4.2vw,1.15rem)!important;font-weight:400!important}
.entry-paths h2{margin:1rem 0 .65rem!important;max-width:none!important}
.entry-paths article>span{margin:0!important}
.entry-paths .button.outline{width:fit-content!important}
@media(max-width:600px){
.entry-paths article{padding:clamp(2rem,5vw,2.5rem) clamp(1rem,4vw,1.25rem)!important}
}
html[dir="rtl"] .archive-section .section-heading>.button,html[dir="rtl"] .process .section-heading>.button{align-self:start!important}
html[dir="rtl"] .archive-section .section-heading,html[dir="rtl"] .process .section-heading{align-items:start!important}
html[dir="rtl"] .checkout-page,html[dir="rtl"] .checkout-page>header,html[dir="rtl"] .checkout-grid,html[dir="rtl"] .checkout-form,html[dir="rtl"] .checkout-summary,html[dir="rtl"] .checkout-review{direction:rtl!important;text-align:right!important}
html[dir="rtl"] .checkout-form label,html[dir="rtl"] .checkout-form input,html[dir="rtl"] .checkout-form textarea,html[dir="rtl"] .checkout-summary span,html[dir="rtl"] .checkout-summary b,html[dir="rtl"] .checkout-review dt,html[dir="rtl"] .checkout-review dd{width:100%;text-align:right!important}
html[dir="rtl"] .orders-page,html[dir="rtl"] .orders-heading,html[dir="rtl"] .order-card,html[dir="rtl"] .order-card>header,html[dir="rtl"] .order-card dl,html[dir="rtl"] .order-card ul{direction:rtl!important;text-align:right!important}
html[dir="rtl"] .order-card>header,html[dir="rtl"] .order-card dl{align-items:flex-start!important}
html[dir="rtl"] .order-card>header>div{direction:rtl!important;justify-content:flex-start!important}
html[dir="rtl"] .order-card>strong{text-align:start!important}
html[dir="rtl"] .order-progress{direction:rtl!important;text-align:start!important}
html[dir="rtl"] .making-page,html[dir="rtl"] .workshop-page,html[dir="rtl"] .making-heading,html[dir="rtl"] .making-situation,html[dir="rtl"] .making-layout,html[dir="rtl"] .workshop-form,html[dir="rtl"] .making-brief,html[dir="rtl"] .making-quote{direction:rtl!important;text-align:right!important}
@media(min-width:901px){
html[dir="rtl"] .hero{direction:ltr!important;grid-template-areas:"media copy"!important;grid-template-columns:minmax(420px,1.08fr) minmax(360px,.92fr)!important;gap:clamp(5rem,8vw,10rem)!important}
html[dir="rtl"] .hero-copy{grid-area:copy!important;direction:rtl!important;text-align:right!important}
html[dir="rtl"] .hero-art{grid-area:media!important;width:100%!important;max-width:720px!important;height:auto!important;min-height:0!important;aspect-ratio:4/5!important;justify-self:start!important;transform:none!important}
.hero-copy h1{max-width:10ch!important;font-size:clamp(2.35rem,4.8vw,4.75rem)!important;line-height:1.22!important;font-weight:400!important}
html[dir="rtl"] .section-heading,html[dir="rtl"] .plp-head,html[dir="rtl"] .film-copy,html[dir="rtl"] .pdp-info,html[dir="rtl"] .product-meta,html[dir="rtl"] .product-meta>div{direction:rtl!important;text-align:right!important}
html[dir="rtl"] .archive-section .section-heading,html[dir="rtl"] .process .section-heading{width:100%;direction:rtl!important;text-align:right!important}
html[dir="rtl"] .archive-section .section-heading>div,html[dir="rtl"] .process .section-heading>div{width:100%;text-align:right!important}
html[dir="rtl"] .product-meta{display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:.75rem!important}
html[dir="rtl"] .product-meta>div,html[dir="rtl"] .product-meta>span,html[dir="rtl"] .product-meta .product-category,html[dir="rtl"] .product-meta h3,html[dir="rtl"] .product-meta p{display:block!important;width:100%!important;text-align:right!important;justify-self:stretch!important;align-self:stretch!important}
html[dir="rtl"] .home-products .product-meta>span{align-self:start!important;width:auto!important}
}
@media(max-width:900px){
html[dir="rtl"] body,html[dir="rtl"] main,html[dir="rtl"] .section{direction:rtl!important;text-align:right!important}
html[dir="rtl"] .section-heading,html[dir="rtl"] .plp-head,html[dir="rtl"] .orders-heading,html[dir="rtl"] .checkout-page>header,html[dir="rtl"] .favorites-heading,html[dir="rtl"] .profile-hero{direction:rtl!important;text-align:right!important;align-items:start!important}
html[dir="rtl"] .hero{direction:rtl!important}
.hero{gap:1rem!important;padding-bottom:0!important;background:var(--sand)!important;overflow:visible!important}
.hero-copy{padding-bottom:0!important}
.hero-art,[dir="ltr"] .hero-art{background:var(--sand)!important;border-radius:0!important;overflow:hidden!important;transform:none!important}
.hero-identifier{display:grid!important;gap:.25rem!important;max-width:calc(100% - 2rem)!important;white-space:normal!important}
html[dir="rtl"] .product-meta,html[dir="rtl"] .product-meta>div,html[data-locale="fa"] .product-meta,html[data-locale="fa"] .product-meta>div{width:100%!important;direction:rtl!important;text-align:right!important;align-items:stretch!important}
html[dir="rtl"] .product-meta .product-category,html[dir="rtl"] .product-meta h3,html[dir="rtl"] .product-meta p,html[data-locale="fa"] .product-meta .product-category,html[data-locale="fa"] .product-meta h3,html[data-locale="fa"] .product-meta p{display:block!important;width:100%!important;align-self:stretch!important;text-align:right!important}
html[dir="rtl"] .product-meta>span,html[data-locale="fa"] .product-meta>span{width:100%!important;text-align:right!important;align-self:start!important}
html[dir="rtl"] .home-products .product-meta>span,html[data-locale="fa"] .home-products .product-meta>span{width:auto!important;text-align:start!important}
html[dir="rtl"] input,html[dir="rtl"] textarea,html[dir="rtl"] select{text-align:right!important;direction:rtl!important}
html[dir="rtl"] .process .steps article,html[data-locale="fa"] .process .steps article{display:block!important;position:relative!important;min-height:150px!important;padding:0 76px 2rem 0!important;text-align:right!important}
html[dir="rtl"] .process .steps article>span,html[data-locale="fa"] .process .steps article>span{position:absolute!important;top:0!important;right:0!important;left:auto!important;margin:0!important}
html[dir="rtl"] .process .steps article h3,html[dir="rtl"] .process .steps article p,html[data-locale="fa"] .process .steps article h3,html[data-locale="fa"] .process .steps article p{display:block!important;width:100%!important;margin-right:0!important;margin-left:0!important;text-align:right!important}
html[dir="rtl"] .process .steps article h3,html[data-locale="fa"] .process .steps article h3{margin-top:0!important;margin-bottom:.5rem!important}
}
@media(max-width:600px){
.route-back-bar{padding-top:.55rem}
.route-back-button{min-height:38px;font-size:.76rem}
.hero.section{padding-top:1rem!important;padding-bottom:0!important;background:var(--sand)!important;min-height:0!important}
.hero-copy h1{font-size:clamp(1.55rem,7.2vw,2.05rem)!important;line-height:1.2!important}
.hero-thesis{margin-top:.55rem!important;font-size:.92rem!important}
.hero-art,[dir="ltr"] .hero-art{background:var(--sand)!important;border-radius:0!important;min-height:0!important;height:auto!important;max-height:38svh!important;aspect-ratio:4/5!important}
.hero-identifier{top:1rem!important;inset-inline-start:1rem!important;inset-inline-end:auto!important;left:1rem!important;right:auto!important;max-width:calc(100% - 2rem)!important;letter-spacing:.08em!important;font-size:.68rem!important}
html[dir="rtl"] .hero-identifier{left:auto!important;right:1rem!important;inset-inline-start:auto!important;inset-inline-end:1rem!important;text-align:right!important}
.hero-art .one-badge{inset-inline-start:auto!important;inset-inline-end:1rem!important;left:auto!important;right:1rem!important;bottom:1rem!important;width:74px!important;height:74px!important}
.hero.section+.difference-story{margin-top:0}
.hero.section+.evidence-film{margin-top:0!important;padding-top:0!important;border-top:0!important}
.evidence-film{padding-top:0!important;padding-block:0 2.5rem!important}
.evidence-film .film-frame{aspect-ratio:16/9!important}
.evidence-film .studio-film{min-height:0!important;height:100%!important;object-fit:contain!important;object-position:center!important}
.evidence-film .film-frame figcaption{position:static!important;inset:auto!important;margin:.85rem 0 0!important;padding:0!important;letter-spacing:.08em!important;white-space:normal!important;max-width:none!important}
.museum-page.section,.entry-paths.section,.archive-section.section,.studio-page.section,.plp.section,.human-story.section,.story.section,.studio-callout.section,.provenance.section,.process.section,.orders-entry.section,.final-cta.section,.difference-story.section,.making-page.section,.shipping-faq.section,.related.section,.cart-empty.section,.cart-page.section,.account-page.section,.favorites-page.section{padding-block:2rem!important;padding-inline:1rem!important}
.studio-callout.section{min-height:0!important;padding-block:1.5rem!important;gap:1.15rem!important}
.studio-callout h2{font-size:clamp(1.45rem,6.5vw,1.85rem)!important;line-height:1.25!important}
.studio-callout p{margin:.7rem 0 1rem!important;font-size:.95rem!important}
.studio-callout .studio-visual{width:100%!important;height:auto!important;min-height:0!important;aspect-ratio:4/5!important;justify-self:stretch!important}
.studio-callout .studio-visual:before{top:.85rem!important;inset-inline-start:.85rem!important}
.studio-callout .studio-visual .vessel,.studio-callout .studio-visual .mock-artwork{width:48%!important;height:62%!important}
.cart-item{grid-template-columns:138px minmax(0,1fr)!important;gap:.9rem!important;padding:.85rem 0!important;align-items:center!important}
.cart-art{width:138px!important;height:176px!important;overflow:hidden!important}
.cart-art .product-fallback{min-height:0!important;height:100%!important;width:100%!important;margin:0!important;padding:.45rem .4rem!important;gap:.3rem!important;overflow:hidden!important}
.cart-art .product-fallback svg{width:22px!important;height:22px!important;flex:0 0 22px!important}
.cart-art .product-fallback span{max-width:100%!important;font-size:.58rem!important;line-height:1.3!important;overflow-wrap:anywhere!important}
.entry-paths{padding-block:0!important}
.entry-paths article{min-height:0!important;padding:1.35rem 1rem!important}
.studio-page{padding-top:1.5rem!important}
.home-products .product-meta{display:flex!important;flex-direction:column!important;gap:.35rem!important;min-height:0!important}
.process .section-heading{align-items:start!important;text-align:right!important}
.process .section-heading>div{text-align:right!important}
html[dir="rtl"] .archive-section .section-heading>.button,html[dir="rtl"] .process .section-heading>.button{align-self:start!important}
.home-products{width:100%!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;place-items:stretch!important;gap:1.15rem .7rem!important}
.home-products>.product-card:nth-child(n){grid-column:auto!important;width:100%!important;max-width:none!important;margin-inline:0!important;justify-self:stretch!important}
.home-products .product-media-shell,.home-products .product-art{width:100%!important;max-width:100%!important}
.home-products .product-art,.home-products .product-art:has(.product-photo){aspect-ratio:3/4!important;height:auto!important;min-height:0!important}
.home-products .product-photo{width:100%!important;height:100%!important;object-fit:cover!important}
.archive-section .section-heading,.process .section-heading{align-items:start!important;text-align:start!important}
.archive-section .section-heading>.button,.process .section-heading>.button{align-self:start!important}
.plp{overflow-x:clip!important}
.plp .product-grid{width:100%!important;grid-template-columns:minmax(0,1fr)!important;place-items:center!important}
.plp .product-grid>.product-card{width:min(100%,390px)!important;max-width:390px!important;margin-inline:auto!important;justify-self:center!important}
.plp .product-grid .product-media-shell,.plp .product-grid .product-art,.plp .product-grid .product-meta{width:100%!important;max-width:100%!important}
.filterbar{grid-template-columns:minmax(0,1fr)!important;align-items:stretch!important;padding:1rem .9rem!important;margin:1rem 0 1.25rem!important;gap:.85rem!important}
.filter-heading{align-items:flex-start!important;flex-direction:row!important;flex-wrap:wrap!important;gap:.35rem!important;margin:0!important}
.filter-scroll-shell{width:100%!important;max-width:100%!important}
.filter-scroll{width:100%!important;padding-inline:0 .35rem!important;scrollbar-gutter:auto!important}
.filter-count{display:block!important;width:100%!important;margin:.35rem 0 0!important;padding-top:.35rem!important;text-align:start!important;justify-self:stretch!important}
html[dir="rtl"] .filter-count{text-align:right!important}
html[dir="rtl"] .checkout-page>header,html[dir="rtl"] .checkout-form,html[dir="rtl"] .checkout-summary{align-items:stretch!important;text-align:right!important}
html[dir="rtl"] .checkout-summary{display:grid!important;justify-items:start!important}
.design-category-grid{grid-template-columns:1fr}
.brief-choice{grid-template-columns:1fr;gap:.65rem}
.designer-preview .designer-artwork{width:56%;height:52%}
}

.studio-page .form-actions{position:sticky;bottom:0;z-index:5;margin-top:1.25rem;padding:1rem 0 1.25rem;background:linear-gradient(transparent,var(--ink) 28%)}
.surprise-permission{border:0;padding:0;margin:2.25rem 0 0}
.surprise-permission legend{display:flex;flex-direction:column;gap:.35rem;width:100%;margin-bottom:1rem;color:var(--paper)}
.difference-story{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:clamp(2rem,5vw,5rem);align-items:end;background:var(--paper)}
.difference-story-maker,.difference-year{color:#5c574f;font-size:.82rem}
.difference-story-actions{display:flex;flex-wrap:wrap;gap:1.25rem;margin-top:1.5rem}
.difference-strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px;margin:0;padding:0;list-style:none;background:var(--line)}
.difference-strip li{display:grid;gap:.65rem;padding:1rem .85rem 1.1rem;background:var(--canvas)}
.difference-strip li span{color:var(--clay);font-size:.68rem;letter-spacing:.08em}
.difference-strip li b{font-weight:400;font-size:.78rem;line-height:1.45}
.difference-strip-swatch{width:100%;aspect-ratio:4/5;background:linear-gradient(160deg,var(--swatch) 0 62%,var(--swatch-accent) 63%);border-radius:2px}
.difference-strip-swatch.stage-described{background:repeating-linear-gradient(135deg,var(--swatch) 0 10px,var(--swatch-accent) 10px 12px)}
.difference-portrait{margin-top:clamp(3rem,8vw,6rem);padding-top:clamp(2rem,5vw,3.5rem);border-top:1px solid rgba(247,242,233,.22);color:var(--paper)}
.museum-page .difference-portrait{margin-top:0;padding-top:0;border-top:0;color:var(--ink)}
.difference-portrait-head h2{font-size:clamp(1.8rem,4vw,3rem);font-weight:400;line-height:1.2;margin:.4rem 0 1rem}
.difference-portrait-head p,.difference-certificate p,.museum-heading p,.impossible-brief p{max-width:40rem;color:#5c574f}
.difference-meta{display:flex;flex-wrap:wrap;gap:.4rem 1.1rem;margin-top:1.1rem;font-size:.8rem;color:#cbb892}
.difference-stage-tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px;margin:2rem 0 0;background:rgba(24,35,31,.18)}
.difference-stage-tabs button{display:grid;gap:.35rem;min-height:78px;padding:.85rem .7rem;border:0;background:var(--paper);color:var(--ink);text-align:start;cursor:pointer}
.difference-stage-tabs button small{color:var(--clay);font-size:.68rem}
.difference-stage-tabs button.active{background:var(--sand)}
.difference-stage-panel{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);gap:clamp(1.5rem,4vw,3rem);margin-top:1.5rem;align-items:stretch}
.difference-stage-art{position:relative;min-height:min(58vw,420px);display:grid;place-items:center;overflow:hidden;background:var(--sand);border-radius:2px}
.difference-stage-art img{width:100%;height:100%;object-fit:cover}
.difference-described-text{position:relative;z-index:2;max-width:22rem;padding:1.5rem;font-size:clamp(1.05rem,2.2vw,1.35rem);line-height:1.7;text-align:center}
.difference-annotations{display:grid;align-content:start;gap:1rem}
.difference-certificate{display:grid;grid-template-columns:88px minmax(0,1fr);gap:1.5rem;margin-top:2.5rem;padding:1.5rem;background:var(--paper);color:var(--ink)}
.museum-page{background:var(--canvas);color:var(--ink)}
.museum-heading h1,.impossible-brief h2{font-size:clamp(1.8rem,4.5vw,3.1rem);font-weight:400;line-height:1.2;margin:.4rem 0 1rem}
.museum-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1.5rem;margin-top:2.5rem}
.museum-card{display:grid;gap:.85rem;padding:1.35rem;background:var(--paper);align-content:start}
.museum-card h2{font-size:1.15rem;font-weight:400;line-height:1.55;margin:0}
.museum-detail-actions,.impossible-brief{display:flex;flex-wrap:wrap;gap:1.25rem;align-items:center;margin-top:2.5rem}
.impossible-brief{display:grid;gap:1rem;padding:clamp(1.5rem,4vw,2.5rem);background:var(--ink);color:var(--paper)}
.making-page,.workshop-page{background:var(--canvas);color:var(--ink)}
.making-heading h1,.workshop-page h1{font-size:clamp(1.8rem,4.5vw,3.1rem);font-weight:400;line-height:1.2;margin:.4rem 0 1rem;max-width:18ch}
.making-heading p,.workshop-page>header p{max-width:42rem;color:#5c574f}
.making-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1.25rem;margin-top:2.5rem}
.making-card,.workshop-card{display:grid;gap:.85rem;padding:1.5rem;background:var(--paper);align-content:start}
.making-card h2,.workshop-card h3{font-weight:400;font-size:1.2rem;margin:0;line-height:1.4}
.making-situation{display:grid;gap:1rem;padding:clamp(1.5rem,4vw,2.5rem);background:var(--ink);color:var(--paper);margin:2rem 0}
.making-rail{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:.65rem 1rem;margin:0 0 2.5rem;padding:0;list-style:none}
.making-layout{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(280px,.8fr);gap:clamp(1.5rem,4vw,3rem);align-items:start}
.making-photos{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem;margin:0;padding:0;list-style:none}
.making-swatch{width:100%;aspect-ratio:4/5;border-radius:2px;background:linear-gradient(160deg,#9f4030 0 62%,#ead9bd 63%)}
.making-request{display:grid;gap:.85rem;margin-top:2.5rem;padding:clamp(1.5rem,4vw,2.5rem);background:color-mix(in srgb,var(--moss) 88%,var(--sand));color:var(--paper)}
.making-request p,.making-request small{color:#d4c7b6}
.making-actions{display:grid;gap:.75rem;justify-items:start}
.workshop-columns{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1.25rem;margin-top:2rem}
.workshop-tabs{display:flex;gap:1.25rem;margin:0 0 1.5rem}
@media(max-width:900px){
.difference-story,.difference-stage-panel,.museum-grid,.making-grid,.making-layout,.making-photos,.workshop-columns,.making-rail{grid-template-columns:1fr!important}
.difference-strip,.difference-stage-tabs{grid-template-columns:1fr 1fr!important}
}

`;

export const localFixes = String.raw`
.eyebrow{display:block;margin-bottom:1.25rem;color:var(--clay);font-size:var(--text-eyebrow);font-weight:400;letter-spacing:.12em}
button,.button,.language-switch,.utility-button,.search-toggle,.menu{box-shadow:none!important;outline:0!important}
.button{border:0!important}
.button.outline{display:inline-flex!important;align-items:center!important;width:fit-content!important;max-width:100%!important;align-self:flex-start!important;min-height:auto!important;padding:.45rem 0!important;border:0!important;border-bottom:1px solid currentColor!important;border-radius:0!important;background:transparent!important}
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
.plp .product-grid .product-media-shell,.plp .product-grid .product-art,.plp .product-grid .product-meta{width:100%!important;max-width:100%!important}
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
.filterbar{display:grid!important;grid-template-columns:minmax(0,1fr)!important;align-items:stretch!important;gap:.35rem!important;margin:1rem 0 1.5rem!important;padding-block:.5rem!important}
.filter-heading{grid-column:1/-1;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:.5rem!important;width:100%!important;margin:0!important}
.filter-heading>b{font-size:.82rem;font-weight:600}
.filter-scroll-hint{display:inline-flex;align-items:center;gap:.4rem;color:var(--muted);font-size:.7rem;white-space:nowrap}
.filter-scroll-hint svg{width:18px;height:18px;stroke-width:1.5}
.filter-scroll-shell{position:relative;min-width:0;overflow:hidden}
.filter-scroll-shell::after{content:"";position:absolute;z-index:2;top:0;bottom:.65rem;inset-inline-end:0;width:42px;background:linear-gradient(to var(--fade-direction,left),transparent,color-mix(in srgb,var(--canvas) 94%,transparent));pointer-events:none}
html[dir="rtl"] .filter-scroll-shell{--fade-direction:left}
html[dir="ltr"] .filter-scroll-shell{--fade-direction:right}
.filter-scroll{display:flex!important;flex-wrap:nowrap!important;align-items:center!important;gap:.55rem!important;width:100%!important;overflow-x:auto!important;overscroll-behavior-inline:contain;scroll-snap-type:x proximity;padding:.1rem .1rem .35rem;scrollbar-width:thin;scrollbar-gutter:stable}
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
.home-products .product-meta,.home-products .product-meta>div{display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:.35rem!important;min-height:0!important;width:100%!important;text-align:right!important}
.home-products .product-meta>span{align-self:start!important;width:auto!important;margin-top:.15rem!important;text-align:start!important}
.home-products .product-meta h3,.home-products .product-meta p{min-height:0!important;margin:0!important}
.home-products .product-meta h3{font-size:var(--text-product-title)!important;font-weight:400!important;line-height:1.35!important}
.home-products .product-meta p{font-size:.82rem!important}
.process .section-heading{justify-content:flex-start!important;align-items:start!important;width:100%!important;text-align:right!important;margin-bottom:2rem!important}
.process .section-heading>div{width:100%!important;text-align:right!important}
.process .section-heading h2,.archive-section .section-heading h2,.entry-paths h2,.studio-callout h2,.human-story h2,.provenance h2,.orders-entry h2,.final-cta h2,.film-copy h2{font-size:var(--text-h2)!important;font-weight:400!important;line-height:1.25!important;max-width:none!important}
.process .steps article h3{font-size:clamp(1rem,4.2vw,1.15rem)!important;font-weight:400!important}
.entry-paths h2{margin:0 0 .75rem!important}
.entry-paths p{margin:0 0 1.75rem!important}
.entry-paths article>span{display:block!important;margin:0 0 1rem!important;unicode-bidi:isolate}
.entry-paths article:nth-child(2)>span{color:var(--sand)!important}
.entry-paths .button.outline{width:fit-content!important}
@media(max-width:600px){
.entry-paths article{padding:clamp(2.25rem,6vw,3rem) var(--page)!important}
}
html[dir="rtl"] .archive-section .section-heading>.button,html[dir="rtl"] .process .section-heading>.button,html[dir="rtl"] .orders-entry .button,html[dir="rtl"] .final-cta .button{align-self:flex-start!important}
html[dir="rtl"] .archive-section .section-heading,html[dir="rtl"] .process .section-heading,html[dir="rtl"] .orders-entry,html[dir="rtl"] .final-cta{align-items:flex-start!important;text-align:right!important}
html[dir="rtl"] .checkout-page,html[dir="rtl"] .checkout-page>header,html[dir="rtl"] .checkout-grid,html[dir="rtl"] .checkout-form,html[dir="rtl"] .checkout-summary,html[dir="rtl"] .checkout-review{direction:rtl!important;text-align:right!important}
html[dir="rtl"] .checkout-form label,html[dir="rtl"] .checkout-form input,html[dir="rtl"] .checkout-form textarea,html[dir="rtl"] .checkout-summary span,html[dir="rtl"] .checkout-summary b,html[dir="rtl"] .checkout-review dt,html[dir="rtl"] .checkout-review dd{width:100%;text-align:right!important}
html[dir="rtl"] .orders-page,html[dir="rtl"] .orders-heading,html[dir="rtl"] .order-card,html[dir="rtl"] .order-card>header,html[dir="rtl"] .order-card dl,html[dir="rtl"] .order-card ul{direction:rtl!important;text-align:right!important}
html[dir="rtl"] .order-card>header,html[dir="rtl"] .order-card dl{align-items:flex-start!important}
html[dir="rtl"] .order-card>header>div{direction:rtl!important;justify-content:flex-start!important}
html[dir="rtl"] .order-card>strong{text-align:start!important}
html[dir="rtl"] .making-page,html[dir="rtl"] .workshop-page,html[dir="rtl"] .making-heading,html[dir="rtl"] .making-situation,html[dir="rtl"] .making-layout,html[dir="rtl"] .workshop-form,html[dir="rtl"] .making-brief,html[dir="rtl"] .making-quote{direction:rtl!important;text-align:right!important}
@media(min-width:901px){
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
html[dir="rtl"] .product-meta,html[dir="rtl"] .product-meta>div,html[data-locale="fa"] .product-meta,html[data-locale="fa"] .product-meta>div{width:100%!important;direction:rtl!important;text-align:right!important;align-items:stretch!important}
html[dir="rtl"] .product-meta .product-category,html[dir="rtl"] .product-meta h3,html[dir="rtl"] .product-meta p,html[data-locale="fa"] .product-meta .product-category,html[data-locale="fa"] .product-meta h3,html[data-locale="fa"] .product-meta p{display:block!important;width:100%!important;align-self:stretch!important;text-align:right!important}
html[dir="rtl"] .product-meta>span,html[data-locale="fa"] .product-meta>span{width:100%!important;text-align:right!important;align-self:start!important}
html[dir="rtl"] .home-products .product-meta>span,html[data-locale="fa"] .home-products .product-meta>span{width:auto!important;text-align:start!important}
html[dir="rtl"] input,html[dir="rtl"] textarea,html[dir="rtl"] select{text-align:right!important;direction:rtl!important}
html[dir="rtl"] .process .steps article,html[data-locale="fa"] .process .steps article{display:block!important;position:relative!important;min-height:150px!important;padding:0!important;padding-block:0 2rem!important;padding-inline:76px 0!important;text-align:right!important}
html[dir="rtl"] .process .steps article>span,html[data-locale="fa"] .process .steps article>span{position:absolute!important;top:0!important;inset-inline-start:0!important;inset-inline-end:auto!important;right:auto!important;left:auto!important;margin:0!important}
html[dir="rtl"] .process .steps article h3,html[dir="rtl"] .process .steps article p,html[data-locale="fa"] .process .steps article h3,html[data-locale="fa"] .process .steps article p{display:block!important;width:100%!important;margin-right:0!important;margin-left:0!important;text-align:right!important}
html[dir="rtl"] .process .steps article h3,html[data-locale="fa"] .process .steps article h3{margin-top:0!important;margin-bottom:.5rem!important}
}
.studio-page .form-actions{position:sticky;bottom:0;z-index:5;margin-top:1.25rem;padding:1rem 0 1.25rem;background:linear-gradient(transparent,var(--ink) 28%)}
.designer-form>small,#prompt-help,#memory-help{color:#d4c7b6!important}
.studio-notes{color:#d4c7b6!important;font-size:.8rem!important}
.designer-memory{min-height:96px!important}
.surprise-permission{border:0;padding:0;margin:2.25rem 0 0}
.surprise-permission legend{display:flex;flex-direction:column;gap:.35rem;width:100%;margin-bottom:1rem;color:var(--paper)}
.surprise-permission legend small{color:#e08b72;font-size:.65rem;letter-spacing:.08em}
.surprise-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;background:rgba(247,242,233,.18);border:1px solid rgba(247,242,233,.18)}
.surprise-grid button{display:grid;gap:.55rem;min-height:132px;padding:1rem .9rem;border:0;background:var(--moss);color:var(--paper);text-align:start;cursor:pointer}
.surprise-grid button b{font-weight:500;font-size:1rem}
.surprise-grid button span{color:#ead9bd;font-size:.82rem;line-height:1.55}
.surprise-grid button:hover,.surprise-grid button.active{background:color-mix(in srgb,var(--moss) 72%,var(--sand));color:var(--paper)}
.surprise-grid button:focus-visible{box-shadow:inset 0 -2px 0 #c77963}
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
.studio-page .difference-portrait-head p,.studio-page .difference-certificate p{color:#d4c7b6}
.difference-meta{display:flex;flex-wrap:wrap;gap:.4rem 1.1rem;margin-top:1.1rem;font-size:.8rem;color:#cbb892}
.difference-stage-tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px;margin:2rem 0 0;background:rgba(24,35,31,.18)}
.difference-stage-tabs button{display:grid;gap:.35rem;min-height:78px;padding:.85rem .7rem;border:0;background:var(--paper);color:var(--ink);text-align:start;cursor:pointer}
.studio-page .difference-stage-tabs button{background:var(--moss);color:var(--paper)}
.difference-stage-tabs button small{color:var(--clay);font-size:.68rem}
.difference-stage-tabs button.active{background:var(--sand)}
.studio-page .difference-stage-tabs button.active{background:color-mix(in srgb,var(--moss) 55%,var(--sand));color:var(--paper)}
.difference-stage-tabs button:focus-visible{box-shadow:inset 0 -2px 0 #8a4938}
.difference-stage-panel{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);gap:clamp(1.5rem,4vw,3rem);margin-top:1.5rem;align-items:stretch}
.difference-stage-art{position:relative;min-height:min(58vw,420px);display:grid;place-items:center;overflow:hidden;background:var(--sand);border-radius:2px}
.difference-stage-art img{width:100%;height:100%;object-fit:cover}
.difference-stage-art.stage-artist img{filter:saturate(.88) contrast(1.06);transform:scale(1.05)}
.difference-stage-art.stage-material img{filter:hue-rotate(-12deg) saturate(.72) contrast(1.14) sepia(.18)}
.difference-stage-art.permission-material.stage-material img{filter:hue-rotate(-28deg) saturate(.62) contrast(1.2) sepia(.28)}
.difference-stage-art.stage-material:after{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-radial-gradient(circle at 20% 30%,rgba(24,35,31,.12) 0 1px,transparent 1px 4px)}
.difference-described-text{position:relative;z-index:2;max-width:22rem;padding:1.5rem;font-size:clamp(1.05rem,2.2vw,1.35rem);line-height:1.7;text-align:center}
.difference-annotations{display:grid;align-content:start;gap:1rem}
.difference-annotations small{color:var(--clay);letter-spacing:.08em;font-size:.68rem}
.difference-annotations ul{margin:0;padding:0;list-style:none;display:grid;gap:1rem}
.difference-annotations li{padding-block:.2rem;border-bottom:1px solid var(--line);font-size:1.05rem;line-height:1.7}
.studio-page .difference-annotations li{border-bottom-color:rgba(247,242,233,.18)}
.difference-certificate{display:grid;grid-template-columns:88px minmax(0,1fr);gap:1.5rem;margin-top:2.5rem;padding:1.5rem;background:var(--paper);color:var(--ink)}
.studio-page .difference-certificate{background:color-mix(in srgb,var(--moss) 88%,var(--sand));color:var(--paper)}
.difference-qr{width:72px;height:72px;border:1px solid var(--ink)}
.material-fingerprint{display:grid;grid-template-columns:1fr 1fr;gap:1rem 1.5rem;margin:1.25rem 0}
.material-fingerprint dt{color:#6a645c;font-size:.72rem;margin-bottom:.25rem}
.studio-page .material-fingerprint dt{color:#ead9bd}
.material-fingerprint dd{margin:0;font-size:.92rem;line-height:1.55}
.museum-page{background:var(--canvas);color:var(--ink)}
.museum-heading h1,.impossible-brief h2{font-size:clamp(1.8rem,4.5vw,3.1rem);font-weight:400;line-height:1.2;margin:.4rem 0 1rem}
.museum-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1.5rem;margin-top:2.5rem}
.museum-card{display:grid;gap:.85rem;padding:1.35rem;background:var(--paper);align-content:start}
.museum-card h2{font-size:1.15rem;font-weight:400;line-height:1.55;margin:0}
.museum-card p,.museum-card>span{color:#5c574f;font-size:.82rem}
.museum-card .difference-strip{margin-top:.4rem}
.museum-detail-actions,.impossible-brief{display:flex;flex-wrap:wrap;gap:1.25rem;align-items:center;margin-top:2.5rem}
.impossible-brief{display:grid;gap:1rem;padding:clamp(1.5rem,4vw,2.5rem);background:var(--ink);color:var(--paper)}
.impossible-brief p{color:#d4c7b6}
.impossible-brief .button{width:fit-content}
@media(max-width:900px){
.difference-story,.difference-stage-panel,.museum-grid,.material-fingerprint{grid-template-columns:1fr!important}
.surprise-grid{grid-template-columns:1fr!important}
.difference-strip,.difference-stage-tabs{grid-template-columns:1fr 1fr!important}
}
@media(max-width:600px){
.route-back-bar{padding-top:.55rem}
.route-back-button{min-height:38px;font-size:.76rem}
.evidence-film{padding-top:0!important}
.home-products .product-meta{display:flex!important;flex-direction:column!important;gap:.35rem!important;min-height:0!important}
.process .section-heading{align-items:start!important;text-align:right!important}
.process .section-heading>div{text-align:right!important}
html[dir="rtl"] .archive-section .section-heading>.button,html[dir="rtl"] .process .section-heading>.button{align-self:start!important}
.home-products{width:100%!important;grid-template-columns:minmax(0,1fr)!important;place-items:center!important}
.home-products>.product-card:nth-child(n){grid-column:1!important;width:min(100%,390px)!important;max-width:390px!important;margin-inline:auto!important;justify-self:center!important}
.archive-section .section-heading,.process .section-heading,.orders-entry,.final-cta{align-items:flex-start!important;text-align:start!important}
.archive-section .section-heading>.button,.process .section-heading>.button,.orders-entry .button,.final-cta .button{align-self:flex-start!important}
.plp{overflow-x:clip!important}
.plp .product-grid{width:100%!important;grid-template-columns:minmax(0,1fr)!important;place-items:center!important}
.plp .product-grid>.product-card{width:min(100%,390px)!important;max-width:390px!important;margin-inline:auto!important;justify-self:center!important}
.plp .product-grid .product-media-shell,.plp .product-grid .product-art,.plp .product-grid .product-meta{width:100%!important;max-width:100%!important}
.filterbar{grid-template-columns:minmax(0,1fr)!important;align-items:stretch!important;padding-block:.5rem!important;margin:1rem 0 1.25rem!important;gap:.3rem!important}
.filter-heading{align-items:flex-start!important;flex-direction:row!important;flex-wrap:wrap!important;gap:.35rem!important;margin:0!important}
.filter-scroll-shell{width:100%!important}
.filter-scroll{padding-inline:.1rem 1.8rem!important}
.filter-count{display:block!important;width:100%!important;margin:0!important;padding-top:.1rem!important;text-align:start!important;justify-self:stretch!important}
html[dir="rtl"] .filter-count{text-align:right!important}
html[dir="rtl"] .checkout-page>header,html[dir="rtl"] .checkout-form,html[dir="rtl"] .checkout-summary{align-items:stretch!important;text-align:right!important}
html[dir="rtl"] .checkout-summary{display:grid!important;justify-items:start!important}
.design-category-grid{grid-template-columns:1fr}
.brief-choice{grid-template-columns:1fr;gap:.65rem}
.designer-preview .designer-artwork{width:56%;height:52%}
.difference-strip{grid-template-columns:1fr 1fr!important}
.difference-stage-tabs{grid-template-columns:1fr 1fr!important}
.difference-stage-panel,.difference-certificate,.difference-story{grid-template-columns:1fr!important}
.surprise-grid{grid-template-columns:1fr!important}
.museum-grid{grid-template-columns:1fr!important}
.museum-card .button{width:fit-content}
.header-nav.is-open{top:86px!important}
.logo-mark{width:44px!important;height:44px!important}
.footer{padding-bottom:5.5rem!important}
.footer-brand{grid-template-columns:72px minmax(0,1fr)!important}
.footer-mark{width:72px!important;height:72px!important}
}
.making-page,.workshop-page{background:var(--canvas);color:var(--ink)}
.making-heading h1,.workshop-page h1{font-size:clamp(1.8rem,4.5vw,3.1rem);font-weight:400;line-height:1.2;margin:.4rem 0 1rem;max-width:18ch}
.making-heading p,.workshop-page>header p{max-width:42rem;color:#5c574f}
.making-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1.25rem;margin-top:2.5rem}
.making-card,.workshop-card{display:grid;gap:.85rem;padding:1.5rem;background:var(--paper);align-content:start}
.making-card h2,.workshop-card h3{font-weight:400;font-size:1.2rem;margin:0;line-height:1.4}
.making-card .button,.workshop-card .button{width:fit-content}
.making-situation{display:grid;gap:1rem;padding:clamp(1.5rem,4vw,2.5rem);background:var(--ink);color:var(--paper);margin:2rem 0}
.making-situation h2{font-weight:400;font-size:clamp(1.4rem,3vw,2.2rem);line-height:1.3;margin:0;max-width:22ch}
.making-situation p{color:#d4c7b6;max-width:46rem}
.making-situation dl{display:grid;grid-template-columns:1fr 1fr;gap:1.25rem}
.making-situation dt{color:#cbb892;font-size:.72rem;letter-spacing:.08em;margin-bottom:.35rem}
.making-situation dd{margin:0;line-height:1.55}
.making-rail{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:.65rem 1rem;margin:0 0 2.5rem;padding:0;list-style:none}
.making-rail li{display:grid;grid-template-columns:28px 1fr;gap:.55rem;align-items:start;color:#6a645c;font-size:.78rem}
.making-rail i{display:grid;place-items:center;width:28px;height:28px;border:1px solid var(--line);border-radius:50%;font-style:normal;background:var(--paper)}
.making-rail li.done i{background:var(--moss);border-color:var(--moss);color:var(--paper)}
.making-rail li.active{color:var(--ink)}
.making-rail li.active i{background:var(--clay);border-color:var(--clay);color:var(--paper)}
.making-layout{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(280px,.8fr);gap:clamp(1.5rem,4vw,3rem);align-items:start}
.making-main,.making-side{display:grid;gap:1.25rem;align-content:start}
.making-main h2,.making-side h2{font-weight:400;font-size:1.15rem;margin:0}
.making-brief,.making-quote dl,.making-kiln dl,.making-firing,.making-changes dl{display:grid;gap:1rem}
.making-brief>div,.making-quote dl>div,.making-kiln dl>div,.making-firing>div,.making-changes dl>div{border-bottom:1px solid var(--line);padding-bottom:.85rem}
.making-brief dt,.making-quote dt,.making-kiln dt,.making-firing dt,.making-changes dt{color:#6a645c;font-size:.72rem;margin-bottom:.3rem}
.making-brief dd,.making-quote dd,.making-kiln dd,.making-firing dd,.making-changes dd{margin:0;line-height:1.6}
.making-quote,.making-kiln,.making-changes article,.making-record{padding:1.35rem;background:var(--paper)}
.making-quote.snapshot{outline:1px solid var(--moss)}
.making-photos{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem;margin:0;padding:0;list-style:none}
.making-swatch{width:100%;aspect-ratio:4/5;border-radius:2px;background:linear-gradient(160deg,#9f4030 0 62%,#ead9bd 63%)}
.making-swatch.kind-concept{background:repeating-linear-gradient(135deg,#31534a 0 10px,#d87855 10px 12px)}
.making-swatch.kind-forming{background:radial-gradient(circle at 40% 30%,#c9b39a,#7a5340)}
.making-swatch.kind-cleaned{background:linear-gradient(180deg,#e8dcc8,#b9a089)}
.making-swatch.kind-glaze,.making-swatch.kind-tile{background:linear-gradient(145deg,#4f6a4a 0 55%,#c77963 56%)}
.making-swatch.kind-fired,.making-swatch.kind-finished{background:linear-gradient(160deg,#3d4a36,#8a6a3b 70%)}
.making-swatch.kind-packed{background:#d8cbb6}
.making-photos small{color:var(--clay);letter-spacing:.08em;font-size:.68rem}
.making-photos p,.making-messages p{margin:.35rem 0;line-height:1.55}
.making-messages,.making-audit,.making-payments{list-style:none;margin:0;padding:0;display:grid;gap:1rem}
.making-messages li,.making-audit li,.making-payments li{padding:1rem 0;border-bottom:1px solid var(--line)}
.making-messages header,.making-audit li,.making-payments li{display:grid;gap:.25rem}
.making-messages .internal{opacity:.78}
.making-messages .internal b{color:var(--clay)}
.making-payments li.paid b{color:var(--moss)}
.making-warning{color:var(--clay);font-size:.9rem;line-height:1.55}
.making-actions{display:grid;gap:.75rem;justify-items:start}
.making-compose,.workshop-form{display:grid;gap:.65rem}
.making-compose textarea,.workshop-form textarea,.making-request textarea,.workshop-form input,.workshop-form select{width:100%;border:0;border-bottom:1px solid var(--line);background:transparent;padding:.55rem 0;font:inherit}
.making-empty{color:#5c574f}
.making-check{display:flex;gap:.6rem;align-items:center}
.making-concept-image{width:100%;max-height:360px;object-fit:cover}
.workshop-columns{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1.25rem;margin-top:2rem}
.workshop-columns h2{font-weight:400;font-size:1.05rem}
.workshop-card.warn{box-shadow:inset 0 0 0 1px var(--clay)}
.workshop-card .deadline{color:var(--clay);font-size:.72rem}
.workshop-tabs{display:flex;gap:1.25rem;margin:0 0 1.5rem}
.workshop-tabs button{border:0;border-bottom:1px solid var(--line);background:transparent;padding:.4rem 0;font:inherit;cursor:pointer}
.workshop-tabs button.active{border-bottom-color:var(--clay);color:var(--clay)}
.making-request{display:grid;gap:.85rem;margin-top:2.5rem;padding:clamp(1.5rem,4vw,2.5rem);background:color-mix(in srgb,var(--moss) 88%,var(--sand));color:var(--paper)}
.making-request p,.making-request small{color:#d4c7b6}
.making-request textarea{border-bottom-color:rgba(247,242,233,.42);color:var(--paper)}
.making-tracking{letter-spacing:.06em}
.studio-notes a{color:#ead9bd}
@media(max-width:900px){
.making-grid,.making-layout,.making-photos,.workshop-columns,.making-situation dl,.making-rail{grid-template-columns:1fr!important}
.studio-callout{grid-template-columns:1fr!important;grid-template-areas:"copy" "visual"!important;gap:2.5rem!important}
.studio-callout-copy{grid-area:copy!important}
.studio-visual{grid-area:visual!important;width:100%!important;height:min(78vw,420px)!important}
.orders-entry,.final-cta{display:flex!important;flex-direction:column!important;align-items:flex-start!important;text-align:start!important}
html[dir="rtl"] .orders-entry,html[dir="rtl"] .final-cta{text-align:right!important}
.provenance article+article{border-top:1px solid var(--line)!important;padding-top:1.75rem!important}
}
.footer{display:grid!important;gap:2.5rem 4rem!important;padding:clamp(2.5rem,6vw,4rem) var(--page) 2.75rem!important;background:var(--clay)!important;color:var(--paper)!important}
.footer-brand{display:grid!important;grid-template-columns:88px minmax(0,1fr)!important;align-items:center!important;gap:1.25rem!important}
.footer-mark{display:block!important;width:88px!important;height:88px!important}
.footer-nav{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:1.5rem 2rem!important}
.footer-nav section{display:grid!important;gap:.55rem!important}
.footer-nav b{color:var(--sand)!important;font-size:.72rem!important;letter-spacing:.12em!important}
.footer-bottom{display:flex!important;flex-wrap:wrap!important;align-items:center!important;justify-content:space-between!important;gap:.75rem 1.5rem!important;padding-top:1.25rem!important;border-top:1px solid color-mix(in srgb,var(--paper) 22%,transparent)!important;grid-column:1/-1!important}
.footer-meta{display:flex!important;flex-wrap:wrap!important;align-items:center!important;gap:.85rem!important;unicode-bidi:isolate}
@media(min-width:901px){
.footer{grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr)!important}
.orders-entry{flex-direction:row!important;align-items:end!important;justify-content:space-between!important}
}
@media(max-width:600px){
.footer{padding-bottom:5.5rem!important}
.footer-brand{grid-template-columns:72px minmax(0,1fr)!important}
.footer-mark{width:72px!important;height:72px!important}
.logo-mark{width:44px!important;height:44px!important}
.header-nav.is-open{top:86px!important}
.header{padding-inline:var(--page)!important}
}
`;

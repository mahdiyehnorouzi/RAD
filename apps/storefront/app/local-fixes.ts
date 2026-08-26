export const localFixes = String.raw`
button,.button,.language-switch,.utility-button,.search-toggle,.menu{box-shadow:none!important;outline:0!important}
.button{border:0!important}
.button.outline{min-height:auto!important;padding:.45rem 0!important;border:0!important;border-bottom:1px solid currentColor!important;border-radius:0!important;background:transparent!important}
.language-switch{border:0!important;border-bottom:1px solid var(--line)!important;border-radius:0!important}
button:focus-visible,.button:focus-visible,.language-switch:focus-visible{outline:0!important;box-shadow:inset 0 -2px 0 #8a4938!important}
.process .steps article > span{width:58px!important;min-width:58px!important;height:58px!important;padding:0!important;border-radius:50%!important;aspect-ratio:1!important;font-size:.68rem!important;direction:ltr!important;place-items:center!important}
html[dir="rtl"] .process .steps{direction:rtl!important}
html[dir="rtl"] .process .steps article{direction:rtl!important;text-align:right!important}
html[dir="rtl"] .process .steps article>span{justify-self:end!important}
html[dir="rtl"] .process .steps article h3,html[dir="rtl"] .process .steps article p{text-align:right!important;justify-self:stretch!important}
.shipping-faq .faq-list details{border-top:1px solid var(--line)!important;padding:0!important}
.shipping-faq .faq-list summary{list-style:none!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:1rem!important;min-height:78px!important;padding:1rem 0!important;cursor:pointer}
.shipping-faq .faq-list summary::marker{content:""!important}
.shipping-faq .faq-list summary::-webkit-details-marker{display:none!important}
.shipping-faq .faq-title{display:inline-flex!important;align-items:center!important;gap:.9rem!important}
.shipping-faq .faq-title svg{width:23px!important;height:23px!important;flex:0 0 23px!important;color:#8a4938!important;stroke-width:1.5!important}
.shipping-faq .faq-chevron{display:block!important;width:19px!important;height:19px!important;flex:0 0 19px!important;transition:transform 240ms ease-out!important}
.shipping-faq details[open] .faq-chevron{transform:rotate(180deg)!important}
@media(max-width:900px){
html[dir="rtl"] body,html[dir="rtl"] main,html[dir="rtl"] .section{direction:rtl!important;text-align:right!important}
html[dir="rtl"] .section-heading,html[dir="rtl"] .plp-head,html[dir="rtl"] .orders-heading,html[dir="rtl"] .checkout-page>header,html[dir="rtl"] .favorites-heading,html[dir="rtl"] .profile-hero{direction:rtl!important;text-align:right!important;align-items:flex-end!important}
html[dir="rtl"] .product-meta,html[dir="rtl"] .product-meta>div,html[data-locale="fa"] .product-meta,html[data-locale="fa"] .product-meta>div{width:100%!important;direction:rtl!important;text-align:right!important;align-items:stretch!important}
html[dir="rtl"] .product-meta .product-category,html[dir="rtl"] .product-meta h3,html[dir="rtl"] .product-meta p,html[data-locale="fa"] .product-meta .product-category,html[data-locale="fa"] .product-meta h3,html[data-locale="fa"] .product-meta p{display:block!important;width:100%!important;align-self:stretch!important;text-align:right!important}
html[dir="rtl"] .product-meta>span,html[data-locale="fa"] .product-meta>span{width:100%!important;text-align:right!important;align-self:flex-end!important}
html[dir="rtl"] .order-card,html[dir="rtl"] .order-card>header,html[dir="rtl"] .order-card dl,html[dir="rtl"] .checkout-grid,html[dir="rtl"] .checkout-form{direction:rtl!important;text-align:right!important}
html[dir="rtl"] .order-card>header,html[dir="rtl"] .order-card dl{align-items:flex-end!important}
html[dir="rtl"] .order-card>header>div{direction:rtl!important;justify-content:flex-start!important}
html[dir="rtl"] .order-progress{direction:rtl!important}
html[dir="rtl"] input,html[dir="rtl"] textarea,html[dir="rtl"] select{text-align:right!important;direction:rtl!important}
html[dir="rtl"] .process .steps article,html[data-locale="fa"] .process .steps article{display:block!important;position:relative!important;min-height:150px!important;padding:0 76px 2rem 0!important;text-align:right!important}
html[dir="rtl"] .process .steps article>span,html[data-locale="fa"] .process .steps article>span{position:absolute!important;top:0!important;right:0!important;left:auto!important;margin:0!important}
html[dir="rtl"] .process .steps article h3,html[dir="rtl"] .process .steps article p,html[data-locale="fa"] .process .steps article h3,html[data-locale="fa"] .process .steps article p{display:block!important;width:100%!important;margin-right:0!important;margin-left:0!important;text-align:right!important}
html[dir="rtl"] .process .steps article h3,html[data-locale="fa"] .process .steps article h3{margin-top:0!important;margin-bottom:.5rem!important}
}`;

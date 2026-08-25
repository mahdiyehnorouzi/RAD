"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

export type Locale = "fa" | "en";

const messages = {
  fa: {
    navProducts: "آثار",
    navStudio: "طراحی اختصاصی",
    navAbout: "درباره رَد",
    navJournal: "ژورنال",
    bag: "کیسه",
    bagAria: "مشاهده محصولات و کیسه خرید",
    navAria: "ناوبری اصلی",
    openMenu: "باز کردن منو",
    closeMenu: "بستن منو",
    search: "جست‌وجو",
    searchAria: "جست‌وجوی آثار",
    searchPlaceholder: "نام یا ویژگی اثر را جست‌وجو کنید…",
    searchResults: "نتایج جست‌وجو",
    searchEmpty: "اثری با این مشخصات پیدا نشد.",
    clearSearch: "پاک‌کردن جست‌وجو",
    closeSearch: "بستن جست‌وجو",
    closeToast: "بستن پیام",
    toastFavoriteAdded: "به علاقه‌مندی‌ها اضافه شد:",
    toastFavoriteRemoved: "از علاقه‌مندی‌ها حذف شد:",
    toastReviewAdded: "نظر شما ثبت شد.",
    toastCartAdded: "به کیسه اضافه شد:",
    imageUnavailable: "تصویر محصول هنوز ثبت نشده",
    imageNumber: "تصویر",
    orders: "سفارش‌های من",
    ordersEyebrow: "تاریخچه سفارش",
    ordersTitle: "سفارش‌های شما",
    orderId: "شماره سفارش",
    orderStatus: "وضعیت",
    orderReceived: "درخواست دریافت شد",
    orderProcessing: "در حال آماده‌سازی",
    orderShipped: "ارسال شده",
    orderDelivered: "تحویل داده شده",
    orderProgress: "مراحل سفارش",
    orderDate: "تاریخ ثبت",
    orderItems: "آثار سفارش",
    noOrders: "هنوز سفارشی ثبت نکرده‌اید.",
    noOrdersBody: "پس از ثبت درخواست، وضعیت آن را در این صفحه دنبال می‌کنید.",
    reviewsEyebrow: "نظر خریداران",
    reviewsTitle: "دیدگاه درباره این اثر",
    ratingLabel: "امتیاز شما",
    commentLabel: "نظر شما",
    commentPlaceholder: "تجربه یا برداشت‌تان از این اثر را بنویسید…",
    photoLabel: "افزودن تصویر",
    photoHelp: "یک تصویر JPG، PNG یا WebP تا حجم ۱ مگابایت",
    photoRemove: "حذف تصویر",
    photoError: "تصویر باید JPG، PNG یا WebP و کوچک‌تر از ۱ مگابایت باشد.",
    reviewError: "امتیاز و نظری با حداقل ۳ نویسه وارد کنید.",
    submitReview: "ثبت نظر",
    loginToReview: "برای ثبت نظر وارد حساب شوید.",
    noReviews: "هنوز نظری برای این اثر ثبت نشده است.",
    reviewPhotoAlt: "تصویر ارسالی کاربر برای نظر محصول",
    profile: "پروفایل",
    login: "ورود",
    logout: "خروج از حساب",
    notifications: "اعلان‌ها",
    notificationCenter: "مرکز اعلان",
    markAllRead: "خواندن همه",
    noNotifications: "هنوز اعلانی ندارید.",
    noticeFavorite: "به علاقه‌مندی‌ها اضافه شد:",
    noticeCart: "به کیسه اضافه شد:",
    noticeWelcome: "خوش آمدید؛ پروفایل شما روی این دستگاه فعال شد.",
    noticeOrder: "درخواست سفارش شما در نسخه نمایشی ثبت شد.",
    home: "خانه رَد",
    logoSubtitle: "استودیو سرامیک",
    collectionEyebrow: "مجموعه ۰۱",
    studioEyebrow: "رَد × تصویرساز هوشمند",
    processEyebrow: "فرآیند سفارش",
    shopEyebrow: "فروشگاه آثار یگانه",
    relatedEyebrow: "تازه از کوره",
    bagEyebrow: "کیسه شما",
    designerEyebrow: "رَد × تصویرساز هوشمند",
    footerTagline: "هر اثر، یک‌بار.",
    footerStudio: "استودیو",
    footerUnique: "آثار یگانه",
    footerCustom: "سفارش اختصاصی",
    footerRad: "رَد",
    footerStory: "داستان ما",
    footerCommunity: "اجتماع",
    footerInstagram: "اینستاگرام",
    footerNewsletter: "خبرنامه",
    footerCopyright: "© ۱۴۰۵ استودیو رَد — تهران",
    heroEyebrow: "سرامیک دست‌ساز • تهران",
    heroTitle1: "هیچ‌چیز دوبار",
    heroTitle2: "ساخته نمی‌شود.",
    heroBody:
      "هر قطعه از رَد یک اثر یگانه است؛ ساخته‌شده با دست، آتش و ردّی که فقط یک‌بار به‌جا می‌ماند.",
    designMine: "طراحی قطعه‌ی من ←",
    viewWorks: "دیدن آثار",
    onlyOne: "تنها یک نسخه",
    artworkLabel: "اثر شماره ۲۷ — تهران، ۱۴۰۵",
    featureHandmade: "ساخته‌شده با دست",
    featureUnique: "تنها یک نسخه",
    featureTehran: "طراحی در تهران",
    featureIran: "ارسال به سراسر ایران",
    collectionTitle: "آثار یگانه",
    collectionBody:
      "قطعات تازه از کوره؛ هرکدام شماره‌گذاری شده و غیرقابل تکرار.",
    allWorks: "همه‌ی آثار ←",
    studioTitle1: "خیال شما،",
    studioTitle2: "در قالب خاک.",
    studioBody:
      "ایده‌ی قطعه‌ی دلخواه‌تان را بنویسید، تصویر اولیه را با هوش مصنوعی بسازید و همراه هنرمند رَد آن را برای ساخت نهایی کنید.",
    enterStudio: "ورود به استودیوی طراحی ✦",
    philosophy: "فلسفه‌ی رَد",
    philosophyTitle: "ارزش در تکرارناپذیری است.",
    philosophyBody:
      "ما قالب ثابت نداریم. هر اثر از گفت‌وگوی خاک، دست و آتش شکل می‌گیرد و تفاوت‌های کوچک آن بخشی از هویت قطعه است، نه نقص آن. رَد در تهران و در تیراژ یک تولید می‌کند.",
    processTitle: "از خیال تا خاک",
    step1Title: "توصیف کنید",
    step1Body: "ایده، کاربرد و حسی را که می‌خواهید بنویسید.",
    step2Title: "تصویر بسازید",
    step2Body: "هوش مصنوعی فرم اولیه را برایتان تجسم می‌کند.",
    step3Title: "با ما نهایی کنید",
    step3Body: "هنرمند رَد امکان ساخت و جزئیات را بررسی می‌کند.",
    step4Title: "تنها برای شما",
    step4Body: "قطعه با دست ساخته و شماره‌گذاری می‌شود.",
    journalTitle1: "آتش، خاک و",
    journalTitle2: "حافظه‌ی دست",
    journalBody:
      "قصه‌ی مواد، آزمون‌های لعاب و زندگی آرام اشیایی که هر روز کنارمان هستند.",
    readJournal: "خواندن ژورنال ←",
    shopTitle: "همه‌ی آثار",
    shopBody:
      "هر اثر فقط یک‌بار ساخته شده است. موجودی این صفحه یک مجموعه‌ی زنده و دائماً در حال تغییر است.",
    filterAll: "همه",
    filterVases: "گلدان",
    filterTableware: "ظروف",
    filterSculpture: "مجسمه",
    availableWorks: "اثر در مجموعه",
    emptyTitle: "فعلاً اثری در این گروه نیست.",
    emptyBody:
      "مجموعه‌ی رَد دائماً تغییر می‌کند؛ گروه دیگری را ببینید یا قطعه‌ی خودتان را طراحی کنید.",
    seeAll: "دیدن همه‌ی آثار",
    viewProduct: "مشاهده",
    addFavorite: "افزودن به علاقه‌مندی‌ها",
    removeFavorite: "حذف از علاقه‌مندی‌ها",
    saveFavorite: "ذخیره اثر",
    savedFavorite: "ذخیره‌شده",
    backWorks: "→ بازگشت به آثار",
    previousPage: "→ بازگشت به صفحه قبل",
    previousWorks: "آثار قبلی",
    nextWorks: "آثار بعدی",
    uniqueAvailable: "اثر یگانه / موجود",
    addBag: "افزودن به کیسه",
    quickAdd: "افزودن سریع",
    inBag: "در کیسه است ✓",
    shipping: "ارسال رایگان و بیمه‌شده در ایران • آماده‌سازی ۲ تا ۴ روز کاری",
    moreWorks: "آثار دیگر",
    emptyBag: "کیسه‌ی شما خالی است.",
    emptyBagBody:
      "هر اثر رَد فقط یک نسخه دارد. مجموعه‌ی تازه از کوره را ببینید و قطعه‌ی خودتان را انتخاب کنید.",
    shoppingBag: "کیسه‌ی خرید",
    clearBag: "خالی‌کردن کیسه",
    uniquePiece: "اثر یگانه • ۱/۱",
    removeBag: "حذف از کیسه",
    orderSummary: "خلاصه سفارش",
    worksSubtotal: "جمع آثار",
    insuredShipping: "ارسال بیمه‌شده",
    free: "رایگان",
    finalTotal: "مبلغ نهایی",
    checkout: "ادامه برای پرداخت",
    checkoutNote: "پرداخت آنلاین در نسخه‌ی بعدی فروشگاه فعال می‌شود.",
    accountEyebrow: "حساب رَد",
    loginTitle: "ورود به فضای شخصی",
    loginBody: "علاقه‌مندی‌ها، اعلان‌ها و مسیر سفارش را در یک‌جا نگه دارید.",
    localAccountNote:
      "نسخه نمایشی: اطلاعات حساب فقط روی همین دستگاه نگهداری می‌شود و رمز عبور ذخیره نمی‌شود.",
    nameLabel: "نام و نام خانوادگی",
    emailLabel: "ایمیل",
    passwordLabel: "رمز عبور",
    passwordHelp:
      "حداقل ۸ نویسه؛ امکان چسباندن و استفاده از مدیر رمز عبور فعال است.",
    showPassword: "نمایش رمز عبور",
    hidePassword: "پنهان‌کردن رمز عبور",
    loginError: "نام، ایمیل معتبر و رمز عبور حداقل ۸ نویسه‌ای را وارد کنید.",
    profileEyebrow: "پروفایل شما",
    hello: "سلام،",
    favoriteEyebrow: "علاقه‌مندی‌ها",
    savedWorks: "اثر ذخیره‌شده",
    favoriteProfileBody:
      "فهرست شخصی‌تان را ببینید یا آن را با دوستانتان به اشتراک بگذارید.",
    viewFavorites: "دیدن علاقه‌مندی‌ها",
    favoritesTitle: "فهرست آثار محبوب",
    sharedListEyebrow: "فهرست مشترک",
    shareList: "اشتراک‌گذاری فهرست",
    linkCopied: "لینک آماده شد ✓",
    shareFavoritesText: "این آثار یگانه از استودیو رَد را ببینید.",
    emptyFavorites: "هنوز اثری ذخیره نکرده‌اید.",
    emptyFavoritesBody: "روی نشان قلب هر اثر بزنید تا به این فهرست اضافه شود.",
    pwaEyebrow: "برنامه رَد",
    pwaTitle: "رَد روی دستگاه شما",
    pwaInstallHelp:
      "از منوی مرورگر، «افزودن به صفحه اصلی» را انتخاب کنید تا رَد مانند یک برنامه اجرا شود.",
    pwaPromptTitle: "رَد را روی صفحه اصلی داشته باشید",
    pwaPromptBody:
      "سایت را مثل یک برنامه باز کنید و سریع‌تر به سفارش‌ها و آثار ذخیره‌شده برسید.",
    pwaInstallSteps:
      "آیفون و آیپد: در Safari روی اشتراک‌گذاری و سپس «افزودن به صفحه اصلی» بزنید. اندروید: منوی Chrome را باز کنید و «نصب برنامه» را انتخاب کنید.",
    installApp: "افزودن به صفحه اصلی",
    dismissInstall: "فعلاً نه",
    pwaInstalled: "نسخه نصب‌شده رَد روی این دستگاه در حال اجراست.",
    enableNotifications: "فعال‌کردن اعلان دستگاه",
    notificationsEnabled: "اعلان دستگاه فعال است",
    notificationReady: "اعلان‌های رَد فعال شد",
    notificationReadyBody: "خبر آثار ذخیره‌شده و سفارش‌ها را اینجا می‌بینید.",
    checkoutEyebrow: "ثبت سفارش نمایشی",
    checkoutTitle: "جزئیات دریافت اثر",
    checkoutBody:
      "این جریان برای بررسی تجربه خرید است و هیچ پرداخت واقعی انجام نمی‌شود.",
    phoneLabel: "شماره تماس",
    cityLabel: "شهر",
    addressLabel: "نشانی",
    checkoutError: "همه اطلاعات دریافت را کامل کنید.",
    nameError: "نام و نام خانوادگی را کامل وارد کنید.",
    phoneError: "شماره تماس معتبر وارد کنید.",
    cityError: "نام شهر را وارد کنید.",
    addressError: "نشانی کامل را وارد کنید.",
    reviewOrder: "بررسی سفارش",
    editDetails: "ویرایش اطلاعات",
    placeDemoOrder: "ثبت درخواست سفارش",
    orderSuccessTitle: "درخواست شما ثبت شد.",
    orderSuccessBody:
      "این ثبت، نمایشی است و مبلغی پرداخت نشده. در نسخه متصل به فروشگاه، ادامه از طریق درگاه امن انجام می‌شود.",
    returnHome: "بازگشت به خانه",
    toman: "تومان",
    designerTitle1: "قطعه‌ای که هنوز",
    designerTitle2: "وجود ندارد.",
    designerBody:
      "ایده‌تان را به فارسی بنویسید. فرم، رنگ، لعاب و حس اثر را توصیف کنید؛ هوش مصنوعی یک تصویر اولیه برای گفت‌وگو با هنرمند رَد می‌سازد.",
    promptLabel: "توصیف قطعه‌ی شما",
    promptPlaceholder:
      "مثلاً یک گلدان بلند با فرم نامتقارن، لعاب سبز زیتونی و خطوط الهام‌گرفته از کویر لوت…",
    promptHelp:
      "هرچه درباره اندازه، بافت و کاربرد دقیق‌تر بنویسید، نتیجه نزدیک‌تر می‌شود.",
    stopGeneration: "توقف ساخت",
    generate: "ساخت تصویر با هوش مصنوعی",
    generating: "در حال شکل‌دادن به ایده‌ی شما…",
    preview: "پیش‌نمایش قطعه اینجا ساخته می‌شود",
    anotherVersion: "ساخت نسخه‌ی دیگر",
    talkArtist: "گفت‌وگو با هنرمند",
    generatedAlt: "تصویر پیشنهادی قطعه سرامیکی شما",
    designError: "تصویر ساخته نشد.",
    note1: "تصویر اولیه، طرح قطعی ساخت نیست.",
    note2: "هر سفارش پیش از ساخت توسط هنرمند بررسی می‌شود.",
    note3: "زمان معمول ساخت: ۴ تا ۸ هفته.",
    preset1: "لعاب سبز زیتونی",
    preset2: "فرم نامتقارن",
    preset3: "الهام از کویر لوت",
    preset4: "بافت خام خاک",
  },
  en: {
    navProducts: "Works",
    navStudio: "Custom design",
    navAbout: "About RAD",
    navJournal: "Journal",
    bag: "Bag",
    bagAria: "View products and shopping bag",
    navAria: "Main navigation",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    search: "Search",
    searchAria: "Search works",
    searchPlaceholder: "Search by work name or detail…",
    searchResults: "Search results",
    searchEmpty: "No work matches this search.",
    clearSearch: "Clear search",
    closeSearch: "Close search",
    closeToast: "Close message",
    toastFavoriteAdded: "Added to favourites:",
    toastFavoriteRemoved: "Removed from favourites:",
    toastReviewAdded: "Your review was added.",
    toastCartAdded: "Added to bag:",
    imageUnavailable: "Product image is not available yet",
    imageNumber: "Image",
    orders: "My orders",
    ordersEyebrow: "ORDER HISTORY",
    ordersTitle: "Your orders",
    orderId: "Order number",
    orderStatus: "Status",
    orderReceived: "Request received",
    orderProcessing: "Processing",
    orderShipped: "Shipped",
    orderDelivered: "Delivered",
    orderProgress: "Order progress",
    orderDate: "Created",
    orderItems: "Ordered works",
    noOrders: "You have not placed an order yet.",
    noOrdersBody: "After placing a request, you can follow its status here.",
    reviewsEyebrow: "COLLECTOR REVIEWS",
    reviewsTitle: "Thoughts on this work",
    ratingLabel: "Your rating",
    commentLabel: "Your review",
    commentPlaceholder: "Share your experience or response to this work…",
    photoLabel: "Add a photo",
    photoHelp: "One JPG, PNG, or WebP image up to 1 MB",
    photoRemove: "Remove photo",
    photoError: "Use a JPG, PNG, or WebP image smaller than 1 MB.",
    reviewError: "Choose a rating and write at least 3 characters.",
    submitReview: "Post review",
    loginToReview: "Sign in to post a review.",
    noReviews: "This work has no reviews yet.",
    reviewPhotoAlt: "User photo attached to a product review",
    profile: "Profile",
    login: "Sign in",
    logout: "Sign out",
    notifications: "Notifications",
    notificationCenter: "NOTIFICATION CENTRE",
    markAllRead: "Mark all read",
    noNotifications: "You have no notifications yet.",
    noticeFavorite: "Added to favourites:",
    noticeCart: "Added to bag:",
    noticeWelcome: "Welcome—your local profile is now active.",
    noticeOrder: "Your demo order request was recorded.",
    home: "RAD home",
    logoSubtitle: "CERAMIC STUDIO",
    collectionEyebrow: "COLLECTION 01",
    studioEyebrow: "RAD × AI IMAGE",
    processEyebrow: "CUSTOM PROCESS",
    shopEyebrow: "ONE OF ONE / SHOP",
    relatedEyebrow: "MORE FROM THE KILN",
    bagEyebrow: "YOUR BAG",
    designerEyebrow: "RAD × AI IMAGE",
    footerTagline: "One work. One time.",
    footerStudio: "Studio",
    footerUnique: "Unique works",
    footerCustom: "Custom order",
    footerRad: "RAD",
    footerStory: "Our story",
    footerCommunity: "Community",
    footerInstagram: "Instagram",
    footerNewsletter: "Newsletter",
    footerCopyright: "© 2026 RAD Studio — Tehran",
    heroEyebrow: "HANDMADE CERAMICS • TEHRAN",
    heroTitle1: "Nothing is ever",
    heroTitle2: "made twice.",
    heroBody:
      "Every RAD piece is a singular work, shaped by hand, fire, and a trace that can only happen once.",
    designMine: "Design my piece →",
    viewWorks: "View works",
    onlyOne: "Only one exists",
    artworkLabel: "Work no. 27 — Tehran, 2026",
    featureHandmade: "Made by hand",
    featureUnique: "One of one",
    featureTehran: "Designed in Tehran",
    featureIran: "Shipping across Iran",
    collectionTitle: "Singular works",
    collectionBody:
      "Fresh from the kiln; each piece is numbered and cannot be repeated.",
    allWorks: "All works →",
    studioTitle1: "Your imagination,",
    studioTitle2: "shaped in clay.",
    studioBody:
      "Describe the piece you imagine, generate an initial image with AI, and refine it with the RAD artist for production.",
    enterStudio: "Enter the design studio ✦",
    philosophy: "RAD PHILOSOPHY",
    philosophyTitle: "Value lives in the unrepeatable.",
    philosophyBody:
      "We do not use fixed moulds. Each work grows from a conversation between clay, hand, and fire. Its small variations are part of its identity—not a defect. RAD makes one of each in Tehran.",
    processTitle: "From idea to clay",
    step1Title: "Describe it",
    step1Body: "Write the function, feeling, and idea you have in mind.",
    step2Title: "Visualize it",
    step2Body: "GPT creates an initial form for your idea.",
    step3Title: "Refine with us",
    step3Body: "The RAD artist reviews feasibility and details.",
    step4Title: "Made only for you",
    step4Body: "Your piece is made by hand and individually numbered.",
    journalTitle1: "Fire, clay, and",
    journalTitle2: "the memory of hands",
    journalBody:
      "Stories of materials, glaze tests, and the quiet lives of objects we keep close every day.",
    readJournal: "Read the journal →",
    shopTitle: "All works",
    shopBody:
      "Each work is made only once. This is a living collection that is always changing.",
    filterAll: "All",
    filterVases: "Vases",
    filterTableware: "Tableware",
    filterSculpture: "Sculpture",
    availableWorks: "works in the collection",
    emptyTitle: "There are no works in this group yet.",
    emptyBody:
      "The RAD collection is always changing. Explore another group or design your own piece.",
    seeAll: "See all works",
    viewProduct: "View",
    addFavorite: "Add to favourites",
    removeFavorite: "Remove from favourites",
    saveFavorite: "Save work",
    savedFavorite: "Saved",
    backWorks: "← Back to works",
    previousPage: "← Back to previous page",
    previousWorks: "Previous works",
    nextWorks: "Next works",
    uniqueAvailable: "Unique work / available",
    addBag: "Add to bag",
    quickAdd: "Quick add",
    inBag: "In your bag ✓",
    shipping: "Free insured shipping in Iran • dispatch in 2–4 business days",
    moreWorks: "More works",
    emptyBag: "Your bag is empty.",
    emptyBagBody:
      "Every RAD work has only one edition. Explore the latest pieces from the kiln and choose yours.",
    shoppingBag: "Shopping bag",
    clearBag: "Clear bag",
    uniquePiece: "Unique work • 1/1",
    removeBag: "Remove from bag",
    orderSummary: "Order summary",
    worksSubtotal: "Works subtotal",
    insuredShipping: "Insured shipping",
    free: "Free",
    finalTotal: "Total",
    checkout: "Continue to checkout",
    checkoutNote: "Online payment will be enabled in the next store release.",
    accountEyebrow: "RAD ACCOUNT",
    loginTitle: "Sign in to your space",
    loginBody:
      "Keep favourites, notifications, and your order journey in one place.",
    localAccountNote:
      "Demo version: account details stay on this device and the password is never stored.",
    nameLabel: "Full name",
    emailLabel: "Email",
    passwordLabel: "Password",
    passwordHelp:
      "At least 8 characters. Paste and password managers are supported.",
    showPassword: "Show password",
    hidePassword: "Hide password",
    loginError:
      "Enter your name, a valid email, and a password of at least 8 characters.",
    profileEyebrow: "YOUR PROFILE",
    hello: "Hello,",
    favoriteEyebrow: "FAVOURITES",
    savedWorks: "saved works",
    favoriteProfileBody: "Open your personal list or share it with friends.",
    viewFavorites: "View favourites",
    favoritesTitle: "Favourite works",
    sharedListEyebrow: "SHARED LIST",
    shareList: "Share this list",
    linkCopied: "Link ready ✓",
    shareFavoritesText: "See these one-of-one works from RAD Studio.",
    emptyFavorites: "You have not saved a work yet.",
    emptyFavoritesBody: "Select the heart on any work to add it to this list.",
    pwaEyebrow: "RAD APP",
    pwaTitle: "RAD on your device",
    pwaInstallHelp:
      "Choose Add to Home Screen from your browser menu to run RAD like an app.",
    pwaPromptTitle: "Add RAD to your Home Screen",
    pwaPromptBody:
      "Open the studio like an app and reach your orders and saved works faster.",
    pwaInstallSteps:
      "iPhone and iPad: open Safari, tap Share, then Add to Home Screen. Android: open the Chrome menu and choose Install app.",
    installApp: "Add to Home Screen",
    dismissInstall: "Not now",
    pwaInstalled: "The installed RAD app is running on this device.",
    enableNotifications: "Enable device notifications",
    notificationsEnabled: "Device notifications enabled",
    notificationReady: "RAD notifications enabled",
    notificationReadyBody:
      "Updates about saved works and orders will appear here.",
    checkoutEyebrow: "DEMO ORDER",
    checkoutTitle: "Delivery details",
    checkoutBody:
      "This flow demonstrates the purchase experience. No real payment is made.",
    phoneLabel: "Phone number",
    cityLabel: "City",
    addressLabel: "Address",
    checkoutError: "Complete all delivery details.",
    nameError: "Enter your full name.",
    phoneError: "Enter a valid phone number.",
    cityError: "Enter your city.",
    addressError: "Enter your full address.",
    reviewOrder: "Review order",
    editDetails: "Edit details",
    placeDemoOrder: "Place demo order",
    orderSuccessTitle: "Your request is recorded.",
    orderSuccessBody:
      "This is a demo record and no payment was made. The connected store will continue through a secure payment gateway.",
    returnHome: "Return home",
    toman: "USD",
    designerTitle1: "A piece that does not",
    designerTitle2: "exist yet.",
    designerBody:
      "Describe your idea in Persian or English—its form, colour, glaze, and mood. AI will create a first image for your conversation with the RAD artist.",
    promptLabel: "Describe your piece",
    promptPlaceholder:
      "For example: a tall asymmetric vase with olive-green glaze and lines inspired by the Lut Desert…",
    promptHelp: "Include size, texture, and function for a closer result.",
    stopGeneration: "Stop generation",
    generate: "Create with GPT",
    generating: "Shaping your idea…",
    preview: "Your piece preview will appear here",
    anotherVersion: "Create another version",
    talkArtist: "Talk to the artist",
    generatedAlt: "AI concept for your ceramic piece",
    designError: "The image could not be created.",
    note1:
      "The generated image is an initial concept, not a final production design.",
    note2: "Every order is reviewed by the artist before production.",
    note3: "Typical production time: 4–8 weeks.",
    preset1: "Olive-green glaze",
    preset2: "Asymmetric form",
    preset3: "Inspired by the Lut Desert",
    preset4: "Raw clay texture",
  },
} as const;

type MessageKey = keyof typeof messages.fa;
type LocaleContextValue = {
  locale: Locale;
  t: (key: MessageKey) => string;
  setLocale: (locale: Locale) => void;
  href: (path: string) => string;
  number: (value: number) => string;
};
const LocaleContext = createContext<LocaleContextValue | null>(null);
const storageKey = "rad-locale";

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("fa");
  const pathname = usePathname();
  useEffect(() => {
    const query = new URLSearchParams(window.location.search).get("lang");
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(storageKey);
    } catch {}
    const initial: Locale =
      query === "en" || query === "fa" ? query : saved === "en" ? "en" : "fa";
    setLocaleState(initial);
  }, []);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "fa" ? "rtl" : "ltr";
    document.documentElement.dataset.locale = locale;
    try {
      localStorage.setItem(storageKey, locale);
    } catch {}
    const route = pathname;
    const labels =
      locale === "fa"
        ? {
            account: "حساب کاربری",
            favorites: "علاقه‌مندی‌ها",
            cart: "کیسه خرید",
            checkout: "ثبت سفارش",
            products: "آثار",
            studio: "طراحی اختصاصی",
          }
        : {
            account: "Account",
            favorites: "Favourites",
            cart: "Shopping bag",
            checkout: "Checkout",
            products: "Works",
            studio: "Custom design",
          };
    const section = Object.entries(labels).find(([key]) =>
      route.includes(key),
    )?.[1];
    document.title = section
      ? `${section} | ${locale === "fa" ? "رَد" : "RAD"}`
      : locale === "fa"
        ? "رَد — استودیو سرامیک"
        : "RAD — Ceramic Studio";
  }, [locale, pathname]);
  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      t: (key) => messages[locale][key],
      setLocale: (next) => {
        setLocaleState(next);
        const url = new URL(window.location.href);
        if (next === "en") url.searchParams.set("lang", "en");
        else url.searchParams.delete("lang");
        window.history.replaceState({}, "", url);
      },
      href: (path) => {
        if (locale !== "en") return path;
        const [base, hash] = path.split("#");
        const localized = `${base}${base.includes("?") ? "&" : "?"}lang=en`;
        return hash ? `${localized}#${hash}` : localized;
      },
      number: (value) =>
        new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US").format(
          value,
        ),
    }),
    [locale],
  );
  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useLocale must be used inside LocaleProvider");
  return value;
}

/** Production storefront. The apex domain 308-redirects here, so load it directly. */
export const SITE_URL = 'https://www.rad-object.com/';

/** Hosts that stay inside the app; any other link opens in the system browser. */
export const INTERNAL_HOSTS = ['rad-object.com'];

/** Appended to the WebView user agent so the site can tell it runs inside the app. */
export const USER_AGENT_SUFFIX = 'RadApp';

/** Design tokens mirrored from apps/storefront/styles/tokens.css. */
export const colors = {
  canvas: '#eee7dc',
  ink: '#18231f',
  moss: '#263d34',
  muted: '#6f726b',
  line: '#d6cfc3',
} as const;

/** App copy. The subtitle mirrors apps/storefront/lib/brand.ts. */
export const copy = {
  subtitle: 'گالری آثار یکتا',
  offlineTitle: 'اتصال برقرار نشد',
  offlineBody: 'اینترنت دستگاه را بررسی کنید و دوباره تلاش کنید.',
  errorTitle: 'مشکلی پیش آمد',
  serverBody: 'رَد در این لحظه پاسخ نمی‌دهد. چند لحظه بعد دوباره تلاش کنید.',
  crashBody: 'صفحه به‌درستی بارگذاری نشد. لطفاً دوباره تلاش کنید.',
  retry: 'تلاش دوباره',
  reload: 'بارگذاری دوباره',
  home: 'بازگشت به صفحه اصلی',
  pressBackAgain: 'برای خروج دوباره بزنید',
} as const;

/** Keep the splash visible at least this long so it doesn't flash. */
export const SPLASH_MIN_MS = 800;
/** Hide the splash even if the page never reports load end. */
export const SPLASH_MAX_MS = 10000;

/** Two WebView process crashes within this window show the error screen instead of reloading again. */
export const CRASH_LOOP_WINDOW_MS = 30000;
/** Android: a second back press within this window on the first page exits the app. */
export const BACK_EXIT_WINDOW_MS = 2000;

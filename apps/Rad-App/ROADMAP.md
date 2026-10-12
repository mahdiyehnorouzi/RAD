# Rad app roadmap

What's next for the React Native wrapper (`apps/Rad-App`), roughly in priority order. Items 1–3 were requested directly; the rest are suggestions, marked as such.

Status legend: ⬜ not started · 🟨 partly done · ✅ done. Finished work is ~~struck through~~.

---

## 1. ✅ ~~Production error boundary (Persian)~~

~~**Goal:** if anything breaks, the user sees a calm Persian screen with a way out, never a blank or white screen.~~

- ~~React error boundary (`src/ErrorBoundary.tsx`) around the whole app, splash included. A JS crash shows *«مشکلی پیش آمد»* with **بارگذاری دوباره**, which remounts the app on the home page.~~
- ~~One shared Persian error screen (`src/ErrorScreen.tsx`) for every failure:~~
  - ~~Network errors: *«اتصال برقرار نشد»* + **تلاش دوباره**.~~
  - ~~HTTP 5xx on the page itself (main document only, 4xx left to the site): reload, or **بازگشت به صفحه اصلی**.~~
  - ~~WebView process crashes: the first one recovers quietly; a second within 30 s shows the error screen instead of looping.~~
- ~~No stack traces or technical messages in production.~~
- Still open: send caught errors to crash reporting (item 6).

~~**Done when:** a forced JS error, a 500 from the site, and airplane mode each show the Persian screen, and the reload action recovers.~~ Verified: JS crash and recovery covered by `__tests__/ErrorBoundary.test.tsx`; the network-error screen checked on the iOS simulator. The 5xx and crash-loop paths are not yet exercised on a device.

## 2. ⬜ QA build with a control panel

**Goal:** a separate build testers can install next to production, which can point at any environment and shows what went wrong.

- **Variant:** iOS `QA` build configuration plus scheme; Android `qa` build type (`initWith release`, so it behaves like production).
  - Name "Rad QA", ID `com.radobject.app.qa`, its own icon badge so it's never confused with production.
  - Expose the variant to JS through one flag (e.g. a small native constant or `react-native-config`). Never decide based on `__DEV__`.
- **First screen: control panel**
  - **URL:** presets (production `https://www.rad-object.com/`, staging, `http://localhost:3000` / LAN IP for local dev) plus a free-text custom URL. Remember the last choice; open the site with an "Open" button.
  - **Errors:** a log of WebView load errors, HTTP errors (status + URL), JS errors and `console.error` from the page (forwarded by an injected script through `postMessage`), and errors caught by the error boundary. Each entry has a time; the log can be copied or shared.
  - **Info:** app version, build number, flavor/store, WebView user agent, current URL.
  - **Tools:** clear cookies and cache, reset storage, toggle WebView inspection (`webviewDebuggingEnabled`).
- **Getting back to the panel:** a small floating button over the site, or shake to open.
- **Production safety:** none of this code path runs in production builds. The QA build may allow cleartext (`http://`) for local URLs; production must not.
- **Distribution:** TestFlight internal group for iOS; for Android a signed `qa` APK, or Google Play internal testing.

**Done when:** a tester can install Rad QA next to Rad, switch to a custom URL, trigger an error on the site, and see it in the log.

## 3. ⬜ Google Analytics

The storefront already loads GA4 (`apps/storefront/components/layout/chrome/google-analytics.tsx`), and its page views already fire inside the WebView. The work is to make app traffic distinguishable and add native-only events.

- **Phase A, web side (small):** when the user agent contains `RadApp`, send GA user properties such as `platform: "app"`, `app_os`, `app_store` (play / cafebazaar / myket / ios), and app version. App and web traffic then split cleanly in the existing reports. The app can pass store and version through the user agent or an injected script. This touches the storefront, so coordinate it as a web change.
- **Phase B, native:** Firebase Analytics (`@react-native-firebase/analytics`) for what the web can't see: installs, first open, app opens, store attribution, app version adoption, and the error screens from item 1.
  - Check that Google endpoints are reachable for Iranian users before relying on this. Phase A works wherever the site's GA already works.
- **Privacy:** update the privacy policy, App Store privacy labels and the Google Play Data safety form. Analytics alone doesn't need App Tracking Transparency, as long as data isn't used to track users across other apps.

## 4. ⬜ Tune splash and logo

- **Higher-resolution source logo:** the current `rad-logo.png` is 512px, so the 1024 iOS icon is upscaled. Get an SVG or 1024+ PNG of the mark, replace `assets-src/rad-logo.png`, and run `npm run app:assets`.
- **Hand-off timing:** the splash currently hides on the first `onLoadEnd` (800 ms minimum, 10 s fallback). Consider hiding when the page is actually painted (signal from the page via `postMessage`), so there's no white flash between splash and content.
- **Splash motion:** a subtle mark animation (fade/scale or the web's brush-stroke feel), honoring reduced-motion settings.
- **Android 12+:** the system splash crops the icon to a circle. Check that the mark sits well inside it on real devices; optionally add a branded background ring.
- **Dark mode:** decide whether the splash and icon follow the system theme (iOS 18 dark/tinted icon variants, Android themed icons via `<monochrome>` in the adaptive icon).
- **Icon badges:** distinct badges for Dev and QA icons.

## 5. ⬜ Status bar and system bars

- The status bar is fixed to dark content on the canvas color. Make it follow the page:
  - The site reports its header color (or `theme-color` meta) to the app through `postMessage`; the app updates the status bar style.
  - Covers dark sections, full-screen image viewers, and dialogs.
- Android: React Native 0.87 runs edge-to-edge. Check the navigation bar color and contrast in gesture and 3-button modes, and the bottom safe area on pages with sticky bottom bars (cart, checkout).
- Hide the status bar for full-screen media if the site gets a gallery or lightbox.

---

## Suggested additions

### 6. ⬜ Crash and error reporting
Native crashes and JS errors are currently invisible. Add Sentry (the web side could share the same project) or Firebase Crashlytics; upload source maps and dSYMs from the release scripts. Feeds the production error boundary (item 1).

### 7. 🟨 Reduce APK size
Release APKs were **53 MB** because they shipped native libraries for four CPU types (`armeabi-v7a`, `arm64-v8a`, `x86`, `x86_64`). x86 is only for emulators.
- ~~Cafe Bazaar / Myket APKs: drop x86/x86_64.~~ Done per flavor in `android/app/build.gradle`: **52.7 MB → 26.8 MB**. Note: Bazaar/Myket debug builds no longer run on Intel (x86) emulators; Apple Silicon emulators and real devices are fine.
- Google Play AAB already serves per-device splits, so it's unaffected.
- Turn on R8 (`enableProguardInReleaseBuilds`) and resource shrinking, then retest the WebView and file upload.
- Track size per release; `npm run app:check:isolation` already guards the JS bundle.

### 8. 🟨 Payment receipt upload on Android and iOS
The core purchase flow depends on uploading a receipt image through the website's file input.
- Test it end to end on real devices: gallery, files, and camera on both platforms.
- ~~Android camera capture needs the `CAMERA` permission.~~ Added (camera marked optional hardware); react-native-webview asks for it only when the user picks the camera.
- iOS photo and camera usage texts are in Info.plist. Translate them to Persian (`fa.lproj/InfoPlist.strings`).

### 9. ⬜ Deep links (Universal Links / App Links)
Open `rad-object.com` links (shared product links, order emails) in the app instead of the browser.
- Web side: serve `/.well-known/apple-app-site-association` and `/.well-known/assetlinks.json` from the storefront.
- App side: associated domains on iOS, intent filters on Android, and pass the URL into the WebView.

### 10. ⬜ Push notifications
Order status updates (payment verified, shipped). This also makes App Store review easier: guideline 4.2 rejects apps that are "just a website", and native features help.
- Firebase Cloud Messaging plus APNs, or Pushe / Najva if Google services are unreliable for Iranian users.
- Needs an API side to send them (`apps/api` order events).

### 11. ⬜ Store integrations for Cafe Bazaar and Myket
- "Rate us" and "update available" prompts should open the right store for each flavor (Bazaar and Myket intents, Play in-app review on `play`, `SKStoreReviewController` on iOS).
- Optional force-update check: the app reads a minimum supported version from the API and shows a Persian "please update" screen with the store link.

### 12. ⬜ Offline and connectivity UX
Use `@react-native-community/netinfo` to show the offline screen immediately and reload automatically when the connection returns. Optionally cache the shell for a faster cold start.

### 13. ⬜ Android pull-to-refresh
`pullToRefreshEnabled` is iOS-only in react-native-webview. On Android, either wrap in a refresh control or let the site handle it.

### 14. 🟨 CI builds and release automation
- GitHub Actions on a macOS runner: typecheck, lint, test, `check:isolation`, and the Android store builds; iOS archives via Fastlane or `xcodebuild`.
- Keep signing secrets (`RAD_UPLOAD_*`, App Store Connect API key) in CI secrets.
- Optionally Fastlane for TestFlight and Play uploads; Bazaar and Myket uploads stay manual or use their developer APIs.
- ~~Version bumping: one command that updates iOS and Android together.~~ `npm run app:version:set -- 1.2.0 [build]` (build defaults to current + 1).

### 15. ⬜ Store listings and compliance
- Privacy policy URL (the storefront `policies` pages), App Store privacy labels, Google Play Data safety, Persian store descriptions and screenshots for Bazaar and Myket.
- Account deletion: Apple requires in-app account deletion if users can create accounts. Confirm the website flow covers it.

### 16. 🟨 Small polish
- ~~Android back press on the home page: confirm before exit (*«برای خروج دوباره بزنید»*).~~
- Haptic feedback on key actions (add to cart, payment submitted) through a small `postMessage` bridge.
- ~~Native share sheet when the site calls `navigator.share`.~~ Bridged on Android, whose WebView lacks the Web Share API (used by the favorites page); iOS uses its built-in support.
- Keep WebView and React Native up to date. Check the `react-native-webview` TypeScript workaround in `src/RadWebView.tsx` on each upgrade.

### 17. ⬜ Android release signing key (do before the first store upload)
Release builds are currently signed with the debug key, because no upload keystore is configured (the build prints *"no upload keystore configured"*). Google Play rejects these builds, and the debug key is public, so anyone could sign an "update" with it.
- Generate the real key with the `keytool` command in `android/keystore.properties.example`, then fill in `android/keystore.properties` (gitignored), or set the `RAD_UPLOAD_*` variables on CI (item 14).
- **Cafe Bazaar and Myket:** the key that signs the first published APK is permanent. Every later update must use the same key, or users have to uninstall to upgrade. Never publish a debug-signed build to these stores.
- **Google Play:** enroll in Play App Signing. Google holds the app signing key, and this key is only the upload key, which can be reset if it's lost.
- Back up the keystore and its passwords outside the repo (a password manager plus an offline copy). Losing it means Bazaar and Myket users can't receive updates.
- **Done when:** `assemble*Release` builds no longer print the debug-key warning, and `apksigner verify --print-certs` shows the upload certificate.

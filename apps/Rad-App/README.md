# Rad (mobile app)

React Native wrapper that loads the RAD storefront (`https://www.rad-object.com/`) in a WebView, for publishing on the App Store and Google Play.

It lives in `apps/Rad-App` but is deliberately **not** an npm workspace. The root `package.json` lists its workspaces explicitly so this app is left out: React Native pins its own React version, and hoisting would clash with the web apps. It has its own `node_modules`, lockfile, ESLint and Prettier config. If you add a new app under `apps/`, add it to the root `workspaces` list.

Planned work is tracked in [ROADMAP.md](ROADMAP.md).

## What's inside

- `App.tsx`: safe-area shell, WebView, and the splash overlay.
- `src/RadWebView.tsx`: WebView setup. `rad-object.com` links stay in the app; anything else (`tel:`, `mailto:`, social links) opens in the system. Handles Android back, offline/error retry, and WebView process crashes.
- `src/SplashOverlay.tsx`: continues the native launch screen (same canvas color and mark) until the first page load finishes, then fades out.
- `src/config.ts`: site URL, allowed hosts, colors and copy mirrored from the storefront.
- `scripts/generate-assets.mjs`: builds every app icon and splash image from `assets-src/rad-logo.png`, a copy of the storefront logo.
- `scripts/check-isolation.mjs`: builds the production bundles and fails if any file in them comes from outside this folder.

The WebView user agent ends with `RadApp`, so the site can detect it is running inside the app.

## Isolation from the web project

The app and the web project don't depend on each other in either direction:

- **App → web.** Metro only reads files inside `apps/Rad-App`. Importing anything from `apps/storefront`, `packages/*` or the root `node_modules` fails with "Unable to resolve module", even if the package is installed at the root. Build tooling (`sharp` for icons) and the logo are local copies too. Colors and copy in `src/config.ts` are copied values, not imports.
- **Web → app.** The app isn't in the root `workspaces`, so root `npm install`/`npm ci`, `build:all`, `typecheck:all`, `test` and CI ignore it. Root ESLint, Prettier and `.dockerignore` exclude it, and nothing in the web apps imports from it.

Run `npm run app:check:isolation` to confirm. Today each production bundle has about 540 modules (about 870 KB, the normal React Native baseline), with zero from outside the app. If the brand logo changes, replace `assets-src/rad-logo.png` and run `npm run app:assets`.

## Setup

Requirements: Node ≥ 22.11, Xcode with CocoaPods (Ruby/Bundler), Android Studio with SDK and JDK 17.

From the monorepo root:

```sh
npm run app:setup       # npm install in Rad-App + bundle install + pod install
npm run app:start       # Metro bundler
npm run app:ios         # debug build on the iOS simulator
npm run app:android     # debug build on an emulator/device
```

Every `app:*` script at the root forwards to the script of the same name in `Rad-App/package.json`, so you can also run them from inside `apps/Rad-App` without the `app:` prefix.

## Scripts

| Root | Rad-App | What it does |
|---|---|---|
| `app:install` | `npm install` | Install JS dependencies |
| `app:pods` | `pods` | `bundle install` + `pod install` |
| `app:setup` | n/a | Install JS dependencies, then pods |
| `app:start` / `app:start:reset` | `start` / `start:reset` | Metro (optionally clearing its cache) |
| `app:ios` / `app:ios:release` | `ios` / `ios:release` | Run Debug / Release on the simulator |
| `app:android` / `app:android:release` | `android` / `android:release` | Run debug / release on emulator or device |
| `app:build:ios:debug` | `build:ios:debug` | Simulator Debug build into `ios/build` |
| `app:build:ios:release` | `build:ios:release` | Release archive at `ios/build/Rad.xcarchive` |
| `app:build:ios:ipa` | `build:ios:ipa` | Archive and export an App Store `.ipa` to `ios/build/ipa` |
| `app:build:android:debug` | `build:android:debug` | Debug APK (`play` flavor) |
| `app:build:android:release` | `build:android:release` | Release AAB for Google Play |
| `app:build:android:apk` | `build:android:apk` | Google Play release APK (sideloading or testing) |
| `app:build:android:cafebazaar` | `build:android:cafebazaar` | Cafe Bazaar release APK (`-CB`) |
| `app:build:android:myket` | `build:android:myket` | Myket release APK (`-MK`) |
| `app:build:android:stores` | `build:android:stores` | All three store builds in one go |
| `app:clean` | `clean` | Gradle clean + remove `ios/build` |
| `app:assets` | `assets` | Regenerate icons and splash images |
| `app:check:isolation` | `check:isolation` | Fail if a production bundle includes files from outside the app |
| `app:typecheck` / `app:test` | `typecheck` / `test` | TypeScript / Jest |

Other Rad-App scripts: `android:cafebazaar` / `android:myket` (run that flavor's debug build), `ios:device`, `pods:update`, `pods:clean`, `lint`.

Build outputs:

- Google Play AAB: `android/app/build/outputs/bundle/playRelease/app-play-release.aab`
- Cafe Bazaar APK: `android/app/build/outputs/apk/cafebazaar/release/app-cafebazaar-release.apk`
- Myket APK: `android/app/build/outputs/apk/myket/release/app-myket-release.apk`

## Android store flavors

| Flavor | Store | Version name | Default artifact |
|---|---|---|---|
| `play` | Google Play | `1.0` | AAB |
| `cafebazaar` | Cafe Bazaar | `1.0-CB` | APK |
| `myket` | Myket | `1.0-MK` | APK |

All flavors share the application ID `com.radobject.app` (`.dev` for debug builds) and the same `versionCode`, and they're signed with the same upload key. Combine a flavor with a build type to get a Gradle task, e.g. `./gradlew assembleMyketRelease`. Store-specific code or resources can go in `android/app/src/<flavor>/`.

## Release signing

**Android.** Copy `android/keystore.properties.example` to `android/keystore.properties` (gitignored), generate an upload key with the `keytool` command in that file, and put the keystore in `android/app/`. On CI, export the same `RAD_UPLOAD_*` variables instead. Without them, release builds fall back to the debug key and print a warning. That's fine for local testing, but Google Play rejects it.

**iOS.** Open `ios/Rad.xcworkspace` in Xcode once and choose your Team under Signing & Capabilities for the `Rad` target. The archive and export scripts use automatic signing (`-allowProvisioningUpdates`) and `ios/ExportOptions.plist` (`app-store-connect`).

## Identifiers and versions

| Build | Name on device | iOS bundle ID / Android application ID |
|---|---|---|
| Debug (dev) | Rad Dev | `com.radobject.app.dev` |
| Release (store) | Rad | `com.radobject.app` |

Dev builds have their own ID, so they install next to the store app instead of replacing it. Names are set per configuration: `APP_DISPLAY_NAME` in the Xcode build settings, and `resValue "app_name"` per build type in `android/app/build.gradle`.

Versions: iOS `MARKETING_VERSION` / `CURRENT_PROJECT_VERSION` in the Xcode project. Android `versionName` / `versionCode` in `android/app/build.gradle`. Bump the build number for every store upload.

## Icons and splash

`npm run app:assets` regenerates everything from `assets-src/rad-logo.png`, the same file the website uses as its favicon and PWA icon.

- **App icons** are that logo itself: the iOS `AppIcon` (1024, opaque), and Android legacy, round and adaptive icons (adaptive background `#f2e8db`, the logo's own cream).
- **Splash screens** use the mark cut out of the logo on the storefront `--canvas` color (`#eee7dc`): the iOS `SplashLogo`, the pre-Android-12 launch drawable, the Android 12+ splash icon, and the in-app overlay.

The logo is 512px, so the 1024 iOS icon is upscaled. Drop in a larger `rad-logo.png` and rerun to sharpen it.

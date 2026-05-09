# Capacitor Setup — BayFatura

> Phase 7 deliverable. Native mobile shell setup for iOS and Android.

## Architecture

Capacitor wraps the existing Vite + React web app as a **native shell**. The web app remains the source of truth — no React Native rewrite required.

```
React Web App  ←  source of truth
      ↓  (npm run build → dist/)
 Capacitor Native Shell
   ├── android/  (Android Studio project)
   └── ios/      (Xcode project)
```

## Prerequisites

### Android
- Android Studio (latest)
- Java 17+ (bundled with Android Studio)
- Android SDK (API 34+)

### iOS
- macOS with Xcode 15+
- CocoaPods: `sudo gem install cocoapods`
- Apple Developer account (for distribution)

## Setup Steps

### 1. Install Dependencies (Done ✅)
```bash
npm install @capacitor/core @capacitor/android @capacitor/ios
npm install -D @capacitor/cli
```

### 2. Initialize (Done ✅)
```bash
npx cap init BayFatura com.bayfatura.app --web-dir dist
```

### 3. Add Platforms
```bash
# Android (Done ✅)
npx cap add android

# iOS (requires CocoaPods)
sudo gem install cocoapods
npx cap add ios
```

### 4. Build & Sync
```bash
# Build web app and sync to native platforms
npm run native:dev

# Or step by step:
npm run build
npx cap sync
```

### 5. Open in IDE
```bash
# Android
npm run cap:open:android

# iOS
npm run cap:open:ios
```

## Development Workflow

```bash
# 1. Make web changes
# 2. Build web app
npm run build

# 3. Sync to native
npx cap sync

# 4. Open in IDE and run on device/emulator
npm run cap:open:android  # or cap:open:ios
```

## Platform Detection

Use `src/lib/platform.js` to detect the current platform:

```js
import { isNativePlatform, getPlatform } from '../lib/platform';

if (isNativePlatform()) {
  // Running inside Capacitor shell
}

const platform = getPlatform();
// Returns: 'web' | 'android-web' | 'ios-web' | 'native' | 'server'
```

Feature flags automatically evaluate against the platform:
```js
const { enabled: useNativeCamera } = useFeatureFlag('native_camera_receipts', {
  user: currentUser,
  platform: isNativePlatform() ? 'native' : 'web',
});
```

## Native Plugins (Ready to Add)

| Plugin | Package | Purpose | Priority |
|--------|---------|---------|----------|
| Camera | `@capacitor/camera` | Native receipt photo capture | High |
| Push Notifications | `@capacitor/push-notifications` | Native push notifications | High |
| Share | `@capacitor/share` | Share invoices via native share sheet | Medium |
| File System | `@capacitor/filesystem` | Save PDFs to device | Medium |
| Splash Screen | `@capacitor/splash-screen` | Custom splash screen | Low |

### Installing a Plugin
```bash
npm install @capacitor/camera
npx cap sync
```

## Environment Variables in Native

Capacitor apps read `VITE_*` environment variables at **build time** (when `npm run build` runs). The variables are baked into the JS bundle.

For environment-specific builds:
```bash
# Production build
VITE_APP_ENV=production npm run build && npx cap sync

# Staging build
VITE_APP_ENV=staging npm run build && npx cap sync
```

## iOS Setup (CocoaPods)

### Install CocoaPods
```bash
sudo gem install cocoapods
```

### Add iOS Platform
```bash
npx cap add ios
```

### Open in Xcode
```bash
npx cap open ios
```

### Configure Signing
1. Open `ios/App/App.xcworkspace` in Xcode
2. Select the App target
3. Under Signing & Capabilities, select your team
4. Update the Bundle Identifier if needed

## Android Setup

### Build Configuration
The Android project is at `android/`. Open it in Android Studio:
```bash
npx cap open android
```

### App Icon
Replace `android/app/src/main/res/mipmap-*` with your icons.

### App Name
Update `android/app/src/main/res/values/strings.xml`:
```xml
<string name="app_name">BayFatura</string>
```

## Firebase Auth in Capacitor

Firebase Auth works differently in Capacitor:
- `signInWithPopup` and `signInWithRedirect` may not work in all scenarios
- Recommended approach: Use `@capacitor-firebase/authentication` plugin

```bash
npm install @capacitor-firebase/authentication
npx cap sync
```

## Build & Distribution

### Android (APK/AAB)
```bash
# Build signed APK
cd android
./gradlew assembleRelease

# Or use Android Studio → Build → Generate Signed Bundle / APK
```

### iOS (IPA)
```bash
# In Xcode:
# Product → Archive → Distribute App
```

### Firebase App Distribution (Beta)
```bash
# Upload to Firebase App Distribution
npx firebase appdistribution:distribute android/app/build/outputs/apk/release/app-release.apk \
  --app 1:845794218840:android:xxxxxxxxxxxx \
  --groups "beta-testers"
```

## Limitations

- **PDF Generation**: `html2canvas` + `jsPDF` works but may need adjustments on native WebView
- **Camera**: Use `<input capture="environment" type="file">` for basic capture, or Capacitor Camera plugin for native
- **File Picker**: Use `<input type="file">` or Capacitor File Picker plugin
- **Offline**: Service worker caching works in Capacitor WebView by default

## Rollback

To remove Capacitor without affecting the web app:
```bash
rm -rf android/ ios/ capacitor.config.ts capacitor.config.json
npm uninstall @capacitor/core @capacitor/android @capacitor/ios @capacitor/cli
```
The web app continues to work as before.

# Native Beta Distribution — BayFatura

> Phase 8 deliverable. Instructions for distributing Capacitor native builds to beta testers.

## Overview

Native beta builds are distributed to invited testers via:
- **Android**: Firebase App Distribution
- **iOS**: TestFlight (Apple's official beta testing platform)

## Prerequisites

### Android
- Google Play Console account (or Firebase App Distribution account)
- Signed release APK/AAB
- Tester email addresses

### iOS
- Apple Developer Program membership ($99/year)
- App Store Connect setup
- TestFlight configured

## Firebase App Distribution (Android)

### Setup
```bash
# Install Firebase CLI (if not already)
npm install -g firebase-tools

# Login
firebase login

# Add testers group
firebase appdistribution:group:create --group "beta-testers" \
  --project bayfatura-b283c
```

### Add Testers
```bash
firebase appdistribution:testers:add \
  --emails "tester1@email.com,tester2@email.com" \
  --group "beta-testers" \
  --project bayfatura-b283c
```

### Build & Distribute
```bash
# Build the web app
npm run build

# Sync to Capacitor
npx cap sync android

# Build Android APK
cd android
./gradlew assembleRelease

# Distribute to testers
cd ..
firebase appdistribution:distribute \
  android/app/build/outputs/apk/release/app-release.apk \
  --app 1:845794218840:android:xxxxxxxxxxxx \
  --groups "beta-testers" \
  --release-notes "Bug fixes and improvements" \
  --project bayfatura-b283c
```

## TestFlight (iOS)

### Prerequisites
1. CocoaPods installed: `sudo gem install cocoapods`
2. Xcode 15+ installed
3. Apple Developer account enrolled
4. App created in App Store Connect

### Build & Upload
```bash
# Build web app
npm run build

# Sync to iOS
npx cap sync ios

# Open in Xcode
npx cap open ios
```

In Xcode:
1. Select Product → Archive
2. Organizer opens
3. Select the archive → Distribute App
4. Choose "TestFlight & App Store"
5. Upload

### Add Testers in App Store Connect
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app → TestFlight
3. Add tester emails under "Internal Testing" or "External Testing"
4. For external testing, Apple requires Beta App Review

## Versioning

Use semantic versioning matching web releases:

| Platform | Version File | Update Command |
|----------|-------------|----------------|
| Android | `android/app/build.gradle` (versionName) | Manual |
| iOS | `ios/App/App.xcodeproj` (MARKETING_VERSION) | Manual |

It's recommended to use the same version as the web release:
```
Web: v1.2.0  →  Android: 1.2.0  →  iOS: 1.2.0
```

## Beta Tester Lifecycle

### Invitation
1. Tester receives email with download link
2. Opens link on device → installs app
3. Firebase App Distribution handles updates automatically

### Feedback Collection
- In-app feedback via email
- Feature flag tracking
- Sentry crash reports

### Removal
```bash
# From Firebase App Distribution
firebase appdistribution:testers:remove \
  --emails "tester@email.com" \
  --group "beta-testers" \
  --project bayfatura-b283c
```

## Testing Checklist for Beta Testers

- [ ] Login (email/password, Google, Apple)
- [ ] Create invoice with all required fields
- [ ] Send invoice via email
- [ ] Download invoice PDF
- [ ] View dashboard
- [ ] Manage customers and products
- [ ] Track expenses
- [ ] Generate report
- [ ] Test with different languages (DE, TR, EN, FR, ES, PT)
- [ ] Test offline behavior (PWA caching)

## Rollback

To remove a tester from beta:
1. Android: Remove from Firebase App Distribution group
2. iOS: Remove from TestFlight group
3. The tester can still use the web app at bayfatura.com

## Promoting Beta → Production

1. Feature flagged in web and enabled for beta users
2. Once stable, promote feature flag to 100%
3. Submit to Google Play Store and Apple App Store
4. Announce general availability

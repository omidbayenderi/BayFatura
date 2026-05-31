# iOS Smoke Test Matrix — BayFatura

> Use this checklist before TestFlight and again before App Store release.

## Scope

This matrix covers real iPhone validation. Simulator can be useful for layout checks, but auth, push, camera, and share flows must be validated on a physical device before beta release.

## Build Context

| Field | Value |
|-------|-------|
| Bundle ID | `com.bayfatura.app` |
| Firebase target | Staging first, production only after release approval |
| Auth providers | Email/password, Google, Apple after provider setup |
| Distribution | Xcode real device, then TestFlight |

## Test Matrix

| Area | Scenario | Expected Result | Status |
|------|----------|-----------------|--------|
| Launch | App opens from cold start | Login screen or dashboard appears without crash | ⬜ |
| Auth | Email/password login | User reaches dashboard | ⬜ |
| Auth | Google login | Native/system auth completes and returns to app | ⬜ |
| Auth | Apple login | Native Apple sheet completes and returns to app | ⬜ |
| Auth | Logout | User returns to login screen | ⬜ |
| Onboarding | New user setup | Company/language setup completes | ⬜ |
| CRM | Create customer | Customer appears in list | ⬜ |
| CRM | Create product | Product appears in list | ⬜ |
| Invoice | Create invoice | Invoice saves and appears in archive | ⬜ |
| Invoice | PDF download/share | PDF is generated and share sheet opens | ⬜ |
| Email | Send invoice email | Function returns success and email arrives | ⬜ |
| Team | Send invitation | Function returns success and email arrives after Resend domain verification | ⬜ |
| Expenses | Camera capture | Camera permission prompt appears and image is attached | ⬜ |
| Expenses | AI receipt scan | Scan function returns parsed data or clear error | ⬜ |
| Notifications | Push opt-in | iOS permission prompt appears and token is stored | ⬜ |
| Offline | Brief network loss | App remains usable and recovers Firestore sync | ⬜ |
| Legal | Privacy/Terms/Impressum | Pages open without layout break | ⬜ |

## Required External Setup

- [ ] Apple Developer Program active
- [ ] Bundle ID `com.bayfatura.app` registered
- [ ] Sign in with Apple capability active
- [ ] Push Notifications capability active
- [ ] APNs key/certificate uploaded to Firebase
- [ ] Firebase Apple provider enabled
- [ ] `GoogleService-Info.plist` matches target Firebase project
- [ ] Resend domain verified before email smoke tests

## Failure Triage

| Symptom | First Check |
|---------|-------------|
| Apple login disabled message | Firebase Apple provider and Apple capability |
| Google login does not return | URL schemes and `GoogleService-Info.plist` |
| Push token missing | APNs config, capability, notification permission |
| PDF/share fails | WebView console, file/share permissions, PDF generation logs |
| Email fails | Cloud Function logs and Resend domain status |

## Exit Criteria

- No crash during launch, auth, invoice, PDF/share, camera, or push flows.
- Auth providers either work or show intentional setup messages.
- Firestore data created on iOS appears on Web App with the same account.
- TestFlight build can be installed and opened by an internal tester.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev                  # Web dev server (localhost:5173)
npm run dev:preview          # Preview channel env

# Build
npm run build                # Production build → dist/
npm run build:preview        # Preview channel build

# Quality gate (run before any deploy)
npm run check:release        # lint + test + build

# Tests
npm test                     # Vitest unit tests
npm run test:rules           # Firestore security rules (requires Firebase emulator)

# Deploy
npm run deploy:production    # Full production deploy (hosting + functions + firestore + storage)
npm run deploy:preview       # 7-day preview channel
npm run deploy:functions     # Functions only
npm run deploy:rules         # Firestore + Storage rules only

# Native (Capacitor)
npm run cap:build:android    # build → sync → open Android Studio
npm run cap:build:ios        # build → sync → open Xcode
npm run native:dev           # build + sync (no IDE open)
```

**Functions (from `functions/` dir):**
```bash
firebase emulators:start --only functions   # Local functions emulator
firebase deploy --only functions            # Deploy all functions
firebase deploy --only functions:fnName     # Deploy single function
```

## Architecture

### Stack
- **Frontend:** React 19 + Vite, React Router v7, Framer Motion, Lucide icons, Recharts
- **Backend:** Firebase Cloud Functions v1 (Node 22, ES modules), Genkit + Gemini 1.5 Flash for AI
- **Database:** Firestore (persistent local cache, `experimentalAutoDetectLongPolling` for WebView compat)
- **Auth:** Firebase Auth — Email/Password, Google (popup → redirect fallback), Microsoft, Anonymous demo
- **Payments:** Stripe (server-side webhook in `functions/index.js`, no secret keys in frontend)
- **Email:** Resend via Cloud Function (never called directly from browser)
- **Native:** Capacitor 8 with Swift Package Manager (no CocoaPods); appId `com.bayfatura.app`

### Multi-environment
- `VITE_APP_ENV` controls environment. Two Firebase projects: production (`bayfatura-b283c`) and staging.
- `vite.config.js` inlines env vars only in `preview` mode; production reads from hosting environment.
- Auth domain resolution in `src/lib/firebase.js → resolveFirebaseAuthDomain()` handles Safari/WebKit cookie restrictions.

### Plan system
Plans: `standard` (free) | `elite` | `premium`. No `lifetime` plan.

`users/{uid}` fields that control access:
```
plan: 'standard' | 'elite' | 'premium'
subscriptionType: 'subscription' | 'granted' | null
planGrantedBy, planGrantReason, planActivatedAt, planExpiresAt
```

- `isPro` in `AuthContext` = `['premium', 'elite'].includes(plan)`
- **Free limit:** 5 invoices+quotes/month — enforced by `checkInvoiceLimit` Cloud Function (called from `InvoiceContext.saveInvoice/saveQuote` before Firestore write)
- **Elite AI limit:** 50 calls/day — enforced inside `requireElitePlan()` in functions
- **Granted plans with expiry:** `checkGrantedPlanExpiry` scheduled function runs nightly at 00:00 Berlin time; `AuthContext.syncFirebaseUser` also checks on every login
- Admin grant via DCC: calls `grantElitePlan` Cloud Function (only `omidbayenderi@gmail.com` + `support@bayfatura.com` authorized)

### Cloud Functions (`functions/index.js`)
Single file, ES module exports. Key functions:
- `stripeWebhook` — HTTP, verifies Stripe signature, updates `users/{uid}.plan`
- `syncUserPlan` — callable, post-checkout plan sync
- `checkInvoiceLimit` — callable, free plan monthly gate
- `grantElitePlan` — callable, admin-only Elite grant with optional expiry
- `checkGrantedPlanExpiry` — pubsub scheduled nightly, downgrades expired grants
- `analyzeBankStatement`, `scanReceipt`, `analyzeFinancials` — callable, Genkit/Gemini AI, Elite only
- `sendInvoiceEmail`, `sendInvitationEmail` — callable, Resend email
- `processRecurringTemplates` — pubsub scheduled nightly (02:00)
- `checkOverdueInvoices` — pubsub scheduled daily (09:00)
- `onUserCreated` / `onUserDeleted` — Auth triggers, provision/cleanup Firestore

Rate limiting uses Firestore `rate_limits/{uid}_{scope}` documents with sliding window.

### Frontend data flow
- `AuthContext` — auth state, `currentUser`, `isPro`. `syncFirebaseUser` is the single source of truth for user profile including plan expiry check.
- `InvoiceContext` — all invoice/quote/expense CRUD. Uses Firestore `onSnapshot` for real-time updates. Calls `checkInvoiceLimit` Cloud Function before any `saveInvoice`/`saveQuote`.
- `LanguageContext` — i18n. 6 languages: TR, EN, DE, FR, ES, PT. Translation files in `src/translations/`.
- `PanelContext` — toast notifications, global UI state.

### Firestore collections
`invoices`, `quotes`, `expenses`, `recurring_templates` — all scoped by `userId`.
`users/{uid}` — profile + plan.
`customizations/{uid}` — invoice design settings.
`rate_limits/{uid}_{scope}` — AI/email rate limiting.
`audit_logs` — admin action history.
`users/{uid}/notifications` — in-app notifications.
`users/{uid}/team` — team invitations.

### Native / Capacitor
- Platform detection: `src/lib/platform.js → isNativePlatform()`
- Native Google auth: `src/lib/nativeAuth.js` — lazy-loads Capacitor Firebase Auth plugin, falls back to web popup
- Crashlytics: `src/lib/nativeCrashlytics.js` — no-op on web
- Android: `minSdkVersion=28`, `targetSdkVersion=36`, `versionCode`/`versionName` from `android/gradle.properties`
- Keystore: `android/bayfatura-release.keystore` — passwords in `gradle.properties` (RELEASE_STORE_PASSWORD / RELEASE_KEY_PASSWORD)
- iOS: Swift Package Manager (`ios/App/CapApp-SPM`), no Podfile

### Compliance modules
- **Germany:** §19 UStG Kleinunternehmer toggle, Reverse Charge, XRechnung B2G XML
- **Portugal:** ATCUD, QR Code AT, NIF validation, UBL 2.1/CIUS-PT B2G XML
- Invoice language (`invoiceLanguage`) is separate from app language (`appLanguage`)

### Key conventions
- All Cloud Functions are in a single `functions/index.js` (ES modules, named exports)
- `PLANS` constant in `functions/index.js` is the single source of truth for limits
- Super-admin check: email must be in `['support@bayfatura.com', 'omidbayenderi@gmail.com']`
- `firestore.indexes.json` defines composite indexes for limit queries (userId + isDeleted + createdAt)
- AdSense publisher: `ca-pub-6878862794554027` — script in `index.html`, `AdsComponent` only rendered for `!isPro` users

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec

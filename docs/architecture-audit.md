# Architecture Audit — BayFatura

> Generated: Phase 1 of the zero-downtime mobile transition plan.
> Date: 2026-05-07

## 1. Project Overview

| Attribute | Value |
|-----------|-------|
| Name | BayFatura |
| Type | Production SaaS invoicing platform |
| Frontend | React 19.2 + Vite 7 (JavaScript, ESM) |
| Backend | Firebase (Auth, Firestore, Storage, Functions, Hosting) |
| AI Engine | Google Genkit + Gemini 1.5 Flash (server-side via Cloud Functions) |
| Payments | Stripe (server-side via Cloud Functions) |
| Email | Resend API |
| Monitoring | Sentry (configured but DSN is empty — **not active**) |
| Testing | Vitest 4 + Testing Library (2 smoke tests only) |
| Linting | ESLint 9 (flat config, many rules disabled) |
| Deployment | Firebase Hosting PWA (manual deploy via `npm run deploy`) |
| CI/CD | **None** (no `.github/` directory) |
| Type System | **None** (plain JavaScript, no TypeScript) |
| State Mgmt | React Context API (6 contexts nested in `main.jsx`) |

## 2. Repository Structure

```
bayfatura/
├── .env                          # Environment variables (gitignored)
├── .firebaserc                   # Firebase project: bayfatura-b283c
├── .gitignore
├── firebase.json                 # Hosting, Functions, Firestore, Storage config
├── firestore.rules               # Firestore security rules (userId-based isolation)
├── storage.rules                 # Storage security rules
├── index.html                    # Vite HTML entry point
├── package.json                  # Dependencies & scripts
├── vite.config.js                # Vite config with manual chunk splitting
├── vitest.config.js              # Test config
├── vitest.setup.js               # Test setup (jest-dom import)
├── eslint.config.js              # ESLint 9 flat config
├── public/
│   ├── manifest.json             # PWA manifest (standalone, maskable icons)
│   ├── sw.js                     # Service Worker v2 (caching strategies)
│   ├── logo-192.png
│   ├── logo-512.png
│   └── logo.svg
├── src/
│   ├── main.jsx                  # Entry point (providers, SW, Sentry init)
│   ├── App.jsx                   # Root component with all routes
│   ├── index.css                 # 5800+ lines of custom CSS (no Tailwind)
│   ├── __tests__/
│   │   └── app.test.js           # 2 smoke tests
│   ├── assets/
│   │   └── react.svg
│   ├── components/
│   │   ├── Layout.jsx            # Main layout (sidebar + header + bottom nav)
│   │   ├── Sidebar.jsx           # Desktop sidebar
│   │   ├── MobileBottomNav.jsx   # Mobile bottom navigation (5 items + FAB)
│   │   ├── InvoicePaper.jsx      # Invoice/quote PDF paper layout
│   │   ├── InvoiceEditor.jsx     # Legacy invoice editor
│   │   ├── InvoiceForm.jsx       # Invoice form wrapper
│   │   ├── DashboardChart.jsx    # 6-month revenue/expense chart
│   │   ├── ConfirmDialog.jsx     # Reusable confirm/cancel modal
│   │   ├── CookieConsent.jsx     # GDPR cookie consent banner
│   │   ├── ErrorBoundary.jsx     # React error boundary
│   │   ├── LoadingPage.jsx       # Full-screen loading spinner
│   │   ├── OnboardingWizard.jsx  # First-time user onboarding
│   │   ├── PremiumModal.jsx      # Upgrade-to-Elite modal
│   │   ├── ProtectedRoute.jsx    # Auth guard wrapper
│   │   ├── QuickAddExpenseModal.jsx
│   │   ├── SeoAgent.jsx          # Background SEO meta tag manager
│   │   ├── Toast.jsx             # Toast notification
│   │   └── AdsComponent.jsx      # Google AdSense placements
│   ├── config/
│   │   └── industryFields.js     # Industry-specific invoice form fields
│   ├── context/
│   │   ├── AuthContext.jsx       # Firebase Auth + user profile (238 lines)
│   │   ├── InvoiceContext.jsx    # Invoice/quote/expense CRUD (232 lines)
│   │   ├── CustomerContext.jsx   # Customer CRUD
│   │   ├── ProductContext.jsx    # Product CRUD
│   │   ├── LanguageContext.jsx   # i18n translations (6 languages)
│   │   └── PanelContext.jsx      # Sidebar menu + toast state
│   ├── hooks/
│   │   └── .useStripeCheckout.js.swp  # Stale vim swap file
│   ├── lib/
│   │   ├── firebase.js           # Firebase init + auth providers
│   │   ├── bankMatcher.js        # Bank CSV parser + fuzzy matching
│   │   ├── demoDataGenerator.js  # Demo data generator
│   │   ├── emailService.js       # Resend email builder (6 languages)
│   │   ├── geminiService.js      # Genkit AI callable wrappers
│   │   ├── portugalCompliance.js # ATCUD, NIF, PT QR, IVA rates
│   │   ├── ublGenerator.js       # UBL 2.1 / CIUS-PT XML
│   │   └── xrechnungGenerator.js # XRechnung/ZUGFeRD XML
│   ├── pages/
│   │   ├── Landing.jsx           # Marketing landing page
│   │   ├── Auth.jsx              # Login/Register
│   │   ├── Dashboard.jsx         # Main dashboard (eager loaded)
│   │   ├── NewInvoice.jsx        # Create invoice (eager loaded)
│   │   ├── InvoiceView.jsx       # View invoice/quote
│   │   ├── InvoiceEdit.jsx       # Edit invoice/quote
│   │   ├── Archive.jsx           # Invoice archive (eager loaded)
│   │   ├── Quotes.jsx            # Quote list
│   │   ├── NewQuote.jsx          # Create quote
│   │   ├── Customers.jsx         # Customer CRM
│   │   ├── Products.jsx          # Product catalog
│   │   ├── Expenses.jsx          # Expense tracking
│   │   ├── Reports.jsx           # Financial reports + DATEV export
│   │   ├── Billing.jsx           # Subscription plans
│   │   ├── Team.jsx              # Team management
│   │   ├── Settings.jsx          # Company settings
│   │   ├── ProfileSettings.jsx   # User profile
│   │   ├── Notifications.jsx     # In-app notifications
│   │   ├── Forecasting.jsx       # AI cash flow forecasting
│   │   ├── BankMatcher.jsx       # AI bank reconciliation
│   │   ├── Recurring.jsx         # Recurring invoice templates
│   │   ├── Success.jsx           # Post-payment success page
│   │   ├── PublicView.jsx        # Shared invoice/quote view
│   │   ├── NotFound.jsx          # 404 page
│   │   ├── DeveloperControlCenter.jsx  # Super admin portal
│   │   ├── Privacy.jsx           # Privacy policy
│   │   ├── Impressum.jsx         # Legal notice
│   │   └── Terms.jsx             # Terms of service
│   ├── styles/
│   │   └── auth-landing.css      # Auth + landing page styles (1074 lines)
│   └── utils/
│       ├── sentry.js             # Sentry error reporting init
│       └── serviceWorker.js      # PWA service worker registration
├── functions/
│   ├── index.js                  # Stripe webhook, Genkit AI, Resend email, Pub/Sub cron
│   ├── package.json
│   └── node_modules/
├── dataconnect/
│   ├── dataconnect.yaml          # PostgreSQL connection config
│   ├── schema/schema.gql         # GraphQL schema
│   ├── example/connector.yaml    # GraphQL connector
│   ├── example/queries.gql       # GraphQL queries
│   └── seed_data.gql             # Seed data
├── .agents/                      # AI agent skill definitions
├── .claude/                      # Claude AI skills reference
├── docs/                         # Documentation (being created)
├── config/                       # Configuration (being created)
├── README.md
└── GEMINI.md
```

## 3. Architecture Characteristics

### 3.1 Frontend Architecture
- **SPA with lazy loading**: 25/28 pages lazy-loaded, 3 eager (Dashboard, NewInvoice, Archive)
- **Context providers**: 6 nested providers in `main.jsx` — Language → Auth → Invoice → Customer → Product → Panel
- **No TypeScript**: Pure JavaScript, no type safety
- **No CSS framework**: 5800+ lines of custom CSS with `!important` usage
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Icons**: Lucide React

### 3.2 Backend Architecture
- **Firebase First**: Direct client-side Firestore SDK calls (no REST API layer)
- **Real-time listeners**: `onSnapshot` used extensively in all contexts
- **Cloud Functions**: Stripe webhooks, AI (Genkit), email (Resend), Pub/Sub cron
- **Security**: userId-based Firestore rules, super admin emails allowlisted
- **Storage**: Per-user directories for assets, invoices, expenses

### 3.3 PWA Configuration
- **Service Worker**: Custom v2 with network-first (HTML), cache-first (CSS/JS/fonts/images)
- **Manifest**: Standalone display, maskable icons, shortcuts
- **Offline**: Basic support via cache strategies
- **Push notifications**: Implemented in SW but needs Firebase Cloud Messaging integration

### 3.4 Current Mobile Readiness
- MobileBottomNav component exists
- CSS media queries for responsive layout
- PDF engine handles mobile rendering
- **Missing**: Touch optimization, card view for tables, virtualized lists, touch-action CSS

## 4. Critical Gaps

| Gap | Severity | Impact |
|-----|----------|--------|
| No CI/CD | **Critical** | Manual deploys, no preview channels, high risk |
| No TypeScript | **High** | Increasing fragility as codebase grows |
| Sentry DSN empty | **High** | No error monitoring in production |
| Only 2 tests | **High** | No safety net for refactoring |
| No feature flags | **High** | Cannot safely rollout risky features |
| Many ESLint rules disabled | **Medium** | Code quality not enforced |
| No .github/ directory | **Critical** | No automated workflows |
| Capacitor not present | **Medium** | Native mobile not yet possible |

## 5. Environment Variable Usage

| Variable | Status | Used In |
|----------|--------|---------|
| `VITE_FIREBASE_API_KEY` | ✅ Active | firebase.js |
| `VITE_FIREBASE_AUTH_DOMAIN` | ✅ Active | firebase.js |
| `VITE_FIREBASE_PROJECT_ID` | ✅ Active | firebase.js |
| `VITE_FIREBASE_STORAGE_BUCKET` | ✅ Active | firebase.js |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ✅ Active | firebase.js |
| `VITE_FIREBASE_APP_ID` | ✅ Active | firebase.js |
| `VITE_FIREBASE_MEASUREMENT_ID` | ✅ Active | firebase.js |
| `VITE_SUCCESS_URL` | ✅ Active | (Stripe success redirect) |
| `VITE_CANCEL_URL` | ✅ Active | (Stripe cancel redirect) |
| `VITE_FROM_EMAIL` | ✅ Active | emailService.js |
| `VITE_SENTRY_DSN` | ❌ **Empty** | sentry.js |
| `VITE_APP_ENV` | ✅ Active | sentry.js (set to "production") |

## 6. Deployment Flow (Current)

```
npm run dev         → Vite dev server (localhost:5173)
npm run build       → Vite production build → dist/
npm run deploy      → vite build + firebase deploy (hosting, functions, firestore, storage)
```

**Firebase Hosting**: SPA rewrite all routes to `index.html`
**Functions runtime**: Node.js 20

## 7. Branch Strategy (Current)

Only `main` branch exists. No `develop`, `staging`, or feature branches.
No GitHub Actions workflows.
Deployment is done directly from local machine.

## 8. Database Collections

| Collection | Purpose | Security |
|------------|---------|----------|
| `users/{uid}` | User profiles, plan info | Own user + super admin |
| `customers/{docId}` | Customer records | Own user's data |
| `products/{docId}` | Product/service catalog | Own user's data |
| `invoices/{docId}` | Invoices | Own user's data |
| `quotes/{docId}` | Quotes | Own user's data |
| `expenses/{docId}` | Expenses | Own user's data |
| `recurring_templates/{docId}` | Recurring templates | Own user's data |
| `bankMatches/{docId}` | Bank reconciliation matches | Own user's data |
| `customizations/{orgId}` | UI customizations | Own org |
| `audit_logs/{logId}` | Admin audit logs | Super admin only |
| `users/{uid}/notifications/{id}` | In-app notifications | Own user |
| `users/{uid}/team/{memberId}` | Team members | Own user |
| `users/{uid}/invites/{inviteId}` | Team invites | Own user |

## 9. Key Libraries & Versions

| Library | Version | Purpose | Native Alternative |
|---------|---------|---------|-------------------|
| react | 19.2 | UI framework | Same in RN |
| react-router-dom | 7.1.5 | Routing | `@react-navigation` |
| firebase | 12.11 | Backend | `@react-native-firebase/*` |
| framer-motion | 12.4.2 | Animations | `react-native-reanimated` |
| lucide-react | 0.474 | Icons | `lucide-react-native` |
| recharts | 3.7 | Charts | `victory-native` |
| html2canvas + jspdf | 4.0 | PDF generation | Server-side API |
| stripe | 22.1 | Payments | Same (server-side) |
| resend | 6.12 | Email | Same (server-side) |
| genkit | 1.33 | AI | Same (server-side) |

## 10. Summary of Findings

BayFatura is **functionally complete** for a SaaS invoicing platform with strong EU tax compliance, AI features, and multi-language support. However, it lacks the **engineering infrastructure** needed for safe, iterative development:

- **No CI/CD** — every deploy is a manual risk
- **No testing** — no safety net
- **No feature flags** — cannot do staged rollouts
- **No error monitoring** — production issues are invisible
- **No TypeScript** — growing codebase fragility

The mobile transition plan must address these infrastructure gaps first, then add Capacitor as a native shell without disrupting existing web users.

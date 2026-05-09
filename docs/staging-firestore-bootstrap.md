# Staging Firestore Bootstrap — BayFatura

> How to set up Firestore in the staging Firebase project for preview testing.

## Prerequisites

- Staging Firebase project created
- Firestore database created in the staging project (Firebase Console → Firestore → Create database)
- You have your Firebase Auth UID and email ready

## Step 1: Create the Feature Flags Document

1. Open [Firebase Console](https://console.firebase.google.com) → Select your **staging** project (not `bayfatura-b283c`)
2. Go to **Firestore** → Start collection
3. Collection ID: `app_config`
4. Document ID: `feature_flags`
5. Add the following fields:

| Field | Type | Value |
|-------|------|-------|
| `flags` | `map` | (see seed JSON below) |

### Seed JSON (All Flags OFF)

Use `config/staging-feature-flags-bootstrap.json` as reference. Here's the exact value for the `flags` field:

```json
{
  "mobile_card_layout": {
    "enabled": false,
    "killSwitch": false,
    "allowedEmails": [],
    "allowedUserIds": [],
    "betaTesters": []
  },
  "optimized_invoice_list": {
    "enabled": false,
    "killSwitch": false,
    "allowedEmails": [],
    "allowedUserIds": [],
    "betaTesters": []
  },
  "virtualized_customer_list": {
    "enabled": false,
    "killSwitch": false,
    "allowedEmails": [],
    "allowedUserIds": [],
    "betaTesters": []
  },
  "new_dashboard_metrics": {
    "enabled": false,
    "killSwitch": false,
    "allowedEmails": [],
    "allowedUserIds": [],
    "betaTesters": []
  },
  "beta_invoice_editor": {
    "enabled": false,
    "killSwitch": true,
    "allowedEmails": [],
    "allowedUserIds": [],
    "betaTesters": []
  },
  "native_camera_receipts": {
    "enabled": false,
    "killSwitch": false,
    "allowedEmails": [],
    "allowedUserIds": [],
    "betaTesters": []
  },
  "native_push_notifications": {
    "enabled": false,
    "killSwitch": false,
    "allowedEmails": [],
    "allowedUserIds": [],
    "betaTesters": []
  }
}
```

## Step 2: Enable a Flag for My Account Only

To test a feature flag as your account only:

1. Edit the `feature_flags` document in Firestore Console
2. Change `mobile_card_layout.enabled` → `true`
3. Add your email to `mobile_card_layout.allowedEmails` → `["your@email.com"]`
4. Optionally add your UID to `mobile_card_layout.allowedUserIds` → `["your-uid"]`

The app will evaluate: if `allowedEmails` contains your email, the flag is ON for you. For everyone else (not in the list), the flag evaluates to OFF even though `enabled` is `true`.

## Step 3: Verify No Global Enable

**NEVER** set `enabled: true` with empty `allowedEmails` and `allowedUserIds`. That would enable the feature for ALL users. Always pair `enabled: true` with at least one targeting list.

Safe config for my-account-only:
```json
{
  "mobile_card_layout": {
    "enabled": true,
    "killSwitch": false,
    "allowedEmails": ["your@email.com"],
    "allowedUserIds": [],
    "betaTesters": []
  }
}
```

## How the App Reads This

In `src/lib/featureFlags/evaluate.js`, the evaluation logic:

```js
// 1. Load remote overrides from Firestore
// 2. If no Firestore doc → return {} → all flags default to false
// 3. If Firestore doc exists → merge with defaults
// 4. For each flag:
//    - If killSwitch is true → OFF everywhere
//    - If enabled is false → OFF
//    - If enabled is true → check allowedEmails, allowedUserIds, betaTesters
//    - If user is in any allowed list → ON
//    - Otherwise → OFF
```

## What If I Don't Create This Document?

If `app_config/feature_flags` doesn't exist in staging Firestore:

- `loadRemoteOverrides()` catches the Firestore error
- Returns `{}` (empty object)
- All flags default to `enabled: false`
- App UI behaves as if no feature flags exist

This is the safe default. The app works fine. It just can't toggle any flags.

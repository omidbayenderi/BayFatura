# Staging Feature Flags — BayFatura

> How feature flags work in the staging environment for safe preview testing.

## Where Feature Flags Live

Feature flags are stored in Firestore **within each Firebase project**:

| Environment | Firestore Document |
|-------------|-------------------|
| **Production** | `app_config/feature_flags` in `bayfatura-b283c` Firestore |
| **Staging** | `app_config/feature_flags` in `bayfatura-staging` Firestore |

Since preview builds connect to **staging Firebase**, the feature flags are read from **staging Firestore** — completely separate from production.

## Creating Feature Flags in Staging

After setting up the staging Firebase project:

### Step 1: Create the Document
In Firebase Console → Staging project → Firestore:
```
Collection: app_config
Document ID: feature_flags
```

### Step 2: Set Default Config (All Flags OFF)
Copy from `config/staging-feature-flags-example.json`:
```json
{
  "flags": {
    "mobile_card_layout": {
      "enabled": false,
      "allowedEmails": [],
      "allowedUserIds": [],
      "killSwitch": false
    },
    "optimized_invoice_list": {
      "enabled": false,
      "allowedEmails": [],
      "allowedUserIds": [],
      "killSwitch": false
    }
  }
}
```

### Step 3: Enable for My Account
To test a flag, add your email:
```json
{
  "mobile_card_layout": {
    "enabled": true,
    "allowedEmails": ["your@email.com"],
    "allowedUserIds": [],
    "killSwitch": false
  }
}
```

## Safety Guarantees

| Scenario | Behavior |
|----------|----------|
| Production user views site | Reads flags from **production** Firestore. Staging flags invisible. |
| Preview user views site | Reads flags from **staging** Firestore. No effect on production. |
| No Firestore doc in staging | `loadRemoteOverrides()` returns `{}` → all flags default to OFF |
| Firebase unreachable | `loadRemoteOverrides()` catches error → returns `{}` → all flags OFF |
| Preview build with missing staging config | App falls back to demo mode (no Firebase connection at all) |

## Important: Don't Share Flag Configs

Since production and staging have **separate Firestore databases**, changes to staging flags do NOT affect production. But don't accidentally copy a staging config with `enabled: true` into production Firestore.

## Config File

The example staging config is at `config/staging-feature-flags-example.json`. Copy it as a starting point for your staging Firestore document.

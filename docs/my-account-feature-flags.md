# My Account Feature Flags — BayFatura

> Enable flags only for yourself. No other user is affected.

## How Targeting Works

The feature flag system supports three ways to target your account:

| Field | Matches | Example |
|-------|---------|---------|
| `allowedEmails` | Your login email | `["omid@example.com"]` |
| `allowedUserIds` | Your Firebase Auth UID | `["abc123xyz"]` |
| `betaTesters` | Your login email (alias) | `["omid@example.com"]` |

**Logic:** If ANY targeting list is specified, the user must match at least one list. If no targeting lists are specified, the flag falls through to other checks (global `enabled`, defaults, etc.).

## Example Config (For Firestore)

Document path: `app_config/feature_flags`

```json
{
  "flags": {
    "mobile_card_layout": {
      "enabled": true,
      "allowedEmails": ["omid@example.com"],
      "allowedUserIds": ["abc123xyz"],
      "killSwitch": false
    },
    "optimized_invoice_list": {
      "enabled": true,
      "allowedEmails": ["omid@example.com"],
      "allowedUserIds": [],
      "killSwitch": false
    },
    "virtualized_customer_list": {
      "enabled": false,
      "allowedEmails": [],
      "allowedUserIds": []
    }
  }
}
```

**What this does:**
- `mobile_card_layout` → ON only for `omid@example.com` OR uid `abc123xyz`
- `optimized_invoice_list` → ON only for `omid@example.com`
- `virtualized_customer_list` → OFF for everyone (even the listed user — because `enabled: false`)

## How to Find Your Firebase UID

```javascript
// 1. Login to the app
// 2. Open browser console and run:
firebase.auth().currentUser.uid
// or check the app's logged-in user object
```

Or check Firestore → `users/{uid}` collection — the document ID is your UID.

## How to Enable a Flag for Yourself

### Step 1: Open Firestore
Go to [Firebase Console](https://console.firebase.google.com) → Firestore → `app_config/feature_flags`

### Step 2: Create/Update the Document
If it doesn't exist:
```
Collection: app_config
Document ID: feature_flags
```

### Step 3: Set Your Targeting
```json
{
  "flags": {
    "mobile_card_layout": {
      "enabled": true,
      "allowedEmails": ["YOUR_EMAIL"],
      "allowedUserIds": ["YOUR_UID"],
      "killSwitch": false
    }
  }
}
```

### Step 4: Open Preview & Login
The flag activates immediately (config is fetched on page load). Just refresh the preview URL.

## Safety Guarantees

| Scenario | Result |
|----------|--------|
| `allowedEmails` specified, user matches | Passes targeting check → continues to `enabled` check |
| `allowedEmails` specified, user doesn't match | **Flag is OFF** |
| `allowedUserIds` specified, user matches | Passes targeting check → continues to `enabled` check |
| `allowedUserIds` specified, user doesn't match | **Flag is OFF** |
| Both specified, user matches either | Passes targeting check |
| Neither specified, `enabled: true` | **Flag is ON for ALL users** (use with caution) |
| Neither specified, `enabled: false` | Flag is OFF (default behavior) |
| Firestore unreachable | **Flag is OFF** (safe fallback) |
| Flag name typo in code | **Flag is OFF** (unknown flag returns false) |
| Kill switch is `true` | **Flag is forced OFF**, targeting ignored |

## Important Warning

**Do NOT set `enabled: true` without also setting `allowedEmails` or `allowedUserIds`.**  
That would enable the feature for ALL users, including production.

✅ **Safe:** `enabled: true` + `allowedEmails: ["MY_EMAIL"]`  
❌ **Unsafe:** `enabled: true` with no targeting lists

## How to Verify Only You Are Targeted

1. Open preview URL in **incognito/private window** → login with a different account → flag should be OFF
2. Open **production** URL (bayfatura.com) → login with YOUR account → flag should be OFF (flags are only in Firestore, not deployed to production)
3. Open **preview** URL → login with YOUR account → flag should be ON

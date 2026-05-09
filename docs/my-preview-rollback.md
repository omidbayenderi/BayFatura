# My Preview Rollback — BayFatura

> How to instantly disable your flags, delete preview channels, and confirm production was untouched.

## 1. Disable Flags Instantly

### Option A: Remove yourself from targeting (fastest)

In Firestore `app_config/feature_flags`, set `allowedEmails: []` and `allowedUserIds: []`:

```json
{
  "flags": {
    "mobile_card_layout": {
      "enabled": true,
      "allowedEmails": [],
      "allowedUserIds": [],
      "killSwitch": false
    }
  }
}
```

**Effect:** No user matches → flag is OFF. Changes take effect on next page refresh (or after up to 5 minutes cache).

### Option B: Kill switch (if available)

For flags with `killSwitch: true`, set:

```json
{
  "beta_invoice_editor": {
    "killSwitch": true
  }
}
```

**Effect:** Flag is forced OFF for everyone, ignoring all targeting.

### Option C: Delete the Firestore document

Delete the entire `app_config/feature_flags` document.

**Effect:** All flags fall back to local defaults (all `enabled: false`). No remote overrides exist.

### Option D: Set enabled to false

```json
{
  "mobile_card_layout": {
    "enabled": false,
    "allowedEmails": ["YOUR_EMAIL"]
  }
}
```

**Effect:** Even though you match the targeting, `enabled: false` means the flag is OFF for everyone.

## 2. Delete a Preview Channel

Preview channels auto-expire in 7 days, but you can delete them immediately:

```bash
# List all channels
npx firebase hosting:channel:list --project bayfatura-b283c

# Delete a specific preview channel
npx firebase hosting:channel:delete pr-123 --project bayfatura-b283c
```

**Effect:** The preview URL stops working immediately. No live channels affected.

## 3. Close the PR (Without Merging)

If you opened a PR just for testing:

1. Go to the PR on GitHub
2. Click "Close pull request" (do NOT merge)
3. Optionally delete the branch: `git push origin --delete my-test-branch`

**Effect:** No code changes reach `main` or `develop`. Production code is unchanged.

## 4. Confirm Production Was Untouched

### Check 1: Firebase Hosting
```bash
npx firebase hosting:channel:list --project bayfatura-b283c
```
Verify `live` channel has the expected version. No unexpected deploys.

### Check 2: GitHub Actions
Check the Actions tab — verify no "Deploy Production" workflow was triggered. Only "Preview Deploy" workflows should exist.

### Check 3: Firestore
Verify that `app_config/feature_flags` either doesn't exist, or has `enabled: false` / empty targeting. The Firestore document by itself doesn't affect production since the web app on `live` channel doesn't load it differently from preview. But confirm no destructive changes.

### Check 4: App Behavior
Open `bayfatura.com` → login → verify everything behaves as expected (same as before testing).

## 5. Rollback Actions Summary

| Action | Speed | Effect |
|--------|-------|--------|
| Clear `allowedEmails`/`allowedUserIds` | Seconds | Flag OFF for your account |
| Set `enabled: false` | Seconds | Flag OFF for everyone |
| Set `killSwitch: true` | Seconds | Flag forced OFF (only for killSwitch flags) |
| Delete Firestore doc | Seconds | All flags fall back to OFF |
| Delete preview channel | 1 command | Preview URL stops working |
| Close PR | 1 click | No code merged to main |
| Delete test branch | 1 command | No leftover branches |

## 6. Final Verification Command

```bash
# Confirm live channel is untouched
npx firebase hosting:channel:list --project bayfatura-b283c
# Expected output: live channel exists, preview channel(s) exist, nothing unexpected
```

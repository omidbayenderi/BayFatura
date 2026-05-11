# My Preview Flow — BayFatura

> How to get a preview URL and test changes without affecting live users.

## Step 1: Open a Pull Request

Create a PR against the `develop` branch (or `main` if `develop` doesn't exist). The PR can be in **draft** state — you don't need to merge it.

```bash
git checkout -b my-test-branch
# make your changes
git add .
git commit -m "feat: test my-changes"
git push origin my-test-branch
```

Then open a PR on GitHub from `my-test-branch` → `develop` (or `main`).

## Step 2: Wait for Preview Deploy

Once the PR is created:
1. Go to GitHub → Actions tab
2. Look for the "Preview Deploy (Safe — No Live)" workflow
3. Wait for the green checkmark (takes ~2-3 minutes)
4. The workflow runs: `npm ci` → `npm run lint` → `npm test` → `npm run build` → Firebase preview deploy

## Step 3: Find Your Preview URL

**Option A:** Look in the PR comments — the workflow automatically posts:
```
🔬 Preview Deploy Complete
URL: https://bayfatura-b283c--pr-<NUMBER>.web.app
Expires: 7 days
```

**Option B:** In GitHub Actions, click the preview deploy workflow → expand the "Deploy to Firebase Preview Channel" step → find the URL in the output.

**Option C:** Use the direct URL format:
```
https://bayfatura-b283c--pr-<PR_NUMBER>.web.app
```

## Step 4: Enable Flags for My Account

1. Go to [Firebase Console](https://console.firebase.google.com) → Firestore → `app_config/feature_flags`
2. If the document doesn't exist, create it with:
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
3. Replace `YOUR_EMAIL` and `YOUR_UID` with your actual account info
4. See `config/my-account-flag-example.json` for full examples

## Step 5: Test on Preview

1. Open the preview URL in a browser
2. Login with your account → flagged features are active
3. Open production in another tab → compare behavior
4. Ask another user (or use incognito) → they see no flags

## Step 6: Clean Up (When Done Testing)

1. Delete the Firestore `app_config/feature_flags` document (or set `allowedEmails: []` and `enabled: false`)
2. Close the PR (no need to merge)
3. Wait 7 days — preview channel auto-expires

## Safety Notes

- **Preview channel is NOT production** — it's a temporary URL that expires in 7 days
- **Feature flags default to OFF** — no user gets any flag unless explicitly listed
- **Production is untouched** — no Firebase live deploy, no Cloud Function deploy, no Firestore rule change
- **PR doesn't need to merge** — you can test without merging a single line

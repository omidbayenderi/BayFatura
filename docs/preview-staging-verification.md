# Preview → Staging Verification — BayFatura

> How to verify that preview uses the staging Firebase backend and production uses the production backend.

## 1. Runtime Firebase Project ID Check

Open the preview URL in your browser and run this in DevTools Console:

```javascript
// Check which Firebase project this build is connected to
import { firebase } from './src/lib/firebase.js';
// or check directly:
firebase.app().options.projectId
```

For convenience, add this to your browser console:

```javascript
// Works in any environment — paste this in DevTools Console:
(async () => {
  const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js');
  // Read the app that's already initialized
  const app = firebase.app();  // or window.__FIREBASE_APP__
  console.log('🔥 Firebase Project:', app.options.projectId);
  console.log('🔑 API Key:', app.options.apiKey);
})();
```

**Expected results:**

| Environment | `projectId` |
|-------------|-------------|
| Preview URL | `bayfatura-staging` (or your staging project name) |
| Production URL | `bayfatura-b283c` |
| Local dev | `bayfatura-b283c` |

## 2. Firestore Data Isolation Check

Write a test document in preview and confirm it doesn't appear in production.

### In Preview:
```javascript
// Open preview → DevTools Console
const { getFirestore, doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');
const db = getFirestore(firebase.app());
await setDoc(doc(db, '_preview_test', 'verify'), {
  timestamp: new Date().toISOString(),
  env: 'preview',
  message: 'This should ONLY appear in staging Firestore'
});
console.log('✅ Written to staging Firestore');
```

### In Production:
```javascript
// Open production → DevTools Console
const { getFirestore, getDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');
const db = getFirestore(firebase.app());
const snap = await getDoc(doc(db, '_preview_test', 'verify'));
console.log('Document exists in production?', snap.exists());
// Should be FALSE — data written from preview is in staging Firestore, not production
```

### Clean Up:
```javascript
// Delete the test document from staging
const { getFirestore, doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');
const db = getFirestore(firebase.app());
await deleteDoc(doc(db, '_preview_test', 'verify'));
```

## 3. Auth Isolation Check

Register a new test user in preview:
```
Preview URL → Login → Create Account → test+staging@bayfatura.com / TestPassword123!
```

Then try logging in with the same credentials on production:
```
Production URL → Login → test+staging@bayfatura.com / TestPassword123!
```

**Expected:** Login fails on production (user only exists in staging Auth).

## 4. Feature Flag Isolation Check

### Set a flag in staging Firestore:
1. Open staging Firebase Console → Firestore → `app_config/feature_flags`
2. Set `mobile_card_layout.enabled = true` and `mobile_card_layout.allowedEmails = ["YOUR_EMAIL"]`

### Open preview:
- Login with YOUR_EMAIL → `mobile_card_layout` should be ON

### Open production:
- Login with same email → `mobile_card_layout` should be OFF (production Firestore has no such flag, or different config)

## 5. Build Config Check

Check which `.env` mode files were used:

```bash
# In the built JS bundle, search for the project ID
grep -o 'bayfatura-[a-z0-9-]*' dist/assets/*.js | sort -u
```

**Expected:**
- After `npm run build` → shows `bayfatura-b283c`
- After `npm run build:preview` → shows `bayfatura-staging` (if configured)

## 6. Network Tab Verification

1. Open preview → DevTools → Network tab
2. Filter by `firestore.googleapis.com`
3. Check the URL — it should contain the STAGING project ID
4. Compare with production URL — it should contain the PRODUCTION project ID

## 7. Acceptance Checklist

- [ ] Preview URL shows `projectId = bayfatura-staging` in console
- [ ] Production URL shows `projectId = bayfatura-b283c` in console
- [ ] Writing data from preview does NOT appear in production Firestore
- [ ] Auth users created in preview cannot login to production
- [ ] Feature flags set in staging Firestore do NOT affect production
- [ ] Feature flags set in staging Firestore DO affect preview
- [ ] Local dev (`npm run dev`) still connects to production (or your configured env)

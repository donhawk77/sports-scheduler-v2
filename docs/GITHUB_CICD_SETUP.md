# GitHub CI/CD → Firebase Hosting: Setup & Troubleshooting Guide

**Project:** SportsScheduler (`sports-scheduler-v2`)  
**Hosting:** Firebase Hosting (`sportsscheduler.web.app`)  
**Repository:** `https://github.com/donhawk77/sports-scheduler-v2`  
**Last Updated:** February 21, 2026

---

## Table of Contents
1. [How the Pipeline Works](#how-the-pipeline-works)
2. [Required GitHub Secrets](#required-github-secrets)
3. [Workflow Files Explained](#workflow-files-explained)
4. [Issues Encountered & Fixes Applied](#issues-encountered--fixes-applied)
5. [Firebase Hosting Cache Configuration](#firebase-hosting-cache-configuration)
6. [Firebase App Check Configuration](#firebase-app-check-configuration)
7. [Admin Portal Access](#admin-portal-access)
8. [How to Trigger a Redeployment](#how-to-trigger-a-redeployment)
9. [Checklist: If the Site Goes Blank Again](#checklist-if-the-site-goes-blank-again)

---

## How the Pipeline Works

Every time code is pushed to the `main` branch, GitHub Actions automatically:

```
1. Checks out the code
2. Runs: npm ci --legacy-peer-deps && npm run build
          ↑ Environment variables from GitHub Secrets are injected HERE
3. Uploads the /dist folder to Firebase Hosting (live channel)
4. Site is live at sportsscheduler.web.app
```

**Why environment variables must be in GitHub Secrets:**  
Vite bakes `import.meta.env.VITE_*` variables directly into the JavaScript bundle at **compile time**. The `.env` file on your local machine is NOT available in the GitHub Actions CI environment — it is gitignored and never committed. If secrets are missing during the build, the variables become `undefined` in the bundle, and Firebase/Stripe fail to initialize, causing a blank screen.

---

## Required GitHub Secrets

Navigate to: **GitHub → Repository → Settings → Secrets and variables → Actions**

All secrets below are **required**. If any one of them is missing or has a typo, the app will break.

### Firebase Configuration Secrets

| Secret Name | Where to Find the Value | Notes |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase Console → Project Settings → General → Your apps → Web API Key | ⚠️ Must NOT have a trailing newline or space when pasting |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Console → Project Settings → General | Format: `sportsscheduler.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Console → Project Settings → General | Format: `sportsscheduler` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Console → Project Settings → General | Format: `sportsscheduler.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Console → Project Settings → General | Format: numeric string, e.g. `1052235117998` |
| `VITE_FIREBASE_APP_ID` | Firebase Console → Project Settings → General → Your apps | Format: `1:1052235117998:web:452e9b92...` |

### Stripe Configuration Secrets

| Secret Name | Where to Find the Value | Notes |
|---|---|---|
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API Keys | Starts with `pk_test_` (test) or `pk_live_` (production) |

### GitHub / Firebase Deploy Secrets (Auto-Managed)

| Secret Name | Source | Notes |
|---|---|---|
| `GITHUB_TOKEN` | Automatically provided by GitHub Actions | Do NOT set this manually — GitHub injects it |
| `FIREBASE_SERVICE_ACCOUNT_SPORTSSCHEDULER` | Firebase CLI generated this automatically when `firebase init hosting:github` was run | Contains the JSON credentials for Firebase to accept deployments from GitHub |

### ⚠️ Critical: How to Paste Secrets Correctly

When entering secrets in GitHub, **never copy-paste from a terminal** that adds a trailing newline. Instead:
1. Copy the value from Firebase Console or your `.env` file
2. Paste into the GitHub secret field
3. Before saving, click inside the text box and press `End` on the keyboard — confirm your cursor is at the last character of the actual value, not on a blank line below it

**If a trailing newline gets into the API key**, Firebase Auth requests will send `key=...%0A` (URL-encoded newline), which Firebase rejects with `auth/invalid-api-key` — causing a complete login failure.

---

## Workflow Files Explained

### `firebase-hosting-merge.yml` — Production Deploy
```
Trigger: Any push to the `main` branch
Action:  Builds the app → deploys to live channel (sportsscheduler.web.app)
```

Location: `.github/workflows/firebase-hosting-merge.yml`

```yaml
- run: npm ci --legacy-peer-deps && npm run build
  env:
    VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
    VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
    VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
    VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
    VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
    VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
    VITE_STRIPE_PUBLISHABLE_KEY: ${{ secrets.VITE_STRIPE_PUBLISHABLE_KEY }}
```

### `firebase-hosting-pull-request.yml` — Preview Deploy
```
Trigger: Any pull request opened against the repository
Action:  Builds the app → deploys to a preview channel (temporary URL)
         GitHub bot comments the preview URL on the PR automatically
```

Location: `.github/workflows/firebase-hosting-pull-request.yml`  
Contains the same `env:` block as the merge workflow.

---

## Issues Encountered & Fixes Applied

### Issue 1 — Blank Screen on Live Site (Root Cause)
**Symptom:** `sportsscheduler.web.app` showed a completely black/blank screen.  
**Browser Console Error:** `Firebase: Error (auth/invalid-api-key)` and `projectId: undefined`  
**Root Cause:** The `npm run build` step in GitHub Actions had no `env:` block — Vite compiled the app with all `import.meta.env.VITE_*` values as `undefined`.  
**Fix:** Added the full `env:` block with all `${{ secrets.VITE_* }}` references to both workflow files.  
**Files Changed:** `.github/workflows/firebase-hosting-merge.yml`, `.github/workflows/firebase-hosting-pull-request.yml`

---

### Issue 2 — App Check Blocking All Authentication
**Symptom:** Even after secrets were added, login still failed with 400 errors from `www.google.com/recaptcha/enterprise`.  
**Root Cause:** `src/lib/firebase.ts` initialized Firebase App Check with a hardcoded `'PLACEHOLDER_RECAPTCHA_KEY'` fallback. When no real reCAPTCHA key was provided, App Check sent requests to Google with an invalid key, and the resulting 400 error blocked all Firebase Auth operations.  
**Fix:** App Check initialization is now conditional — it only activates when `VITE_RECAPTCHA_SITE_KEY` is present **and** is not the placeholder string.  
**File Changed:** `src/lib/firebase.ts`

```typescript
// BEFORE (broken):
initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider(
    import.meta.env.VITE_RECAPTCHA_SITE_KEY || 'PLACEHOLDER_RECAPTCHA_KEY'
  )
});

// AFTER (fixed):
const recaptchaKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
if (recaptchaKey && recaptchaKey !== 'PLACEHOLDER_RECAPTCHA_KEY') {
  initializeAppCheck(app, { provider: new ReCaptchaEnterpriseProvider(recaptchaKey), ... });
}
// If no key → App Check is simply skipped, auth works normally
```

---

### Issue 3 — Trailing Newline in API Key Secret
**Symptom:** Login button spinner appeared but auth request failed silently. Network logs showed `key=AIzaSy...%0A` (the `%0A` is a URL-encoded newline character).  
**Root Cause:** When the `VITE_FIREBASE_API_KEY` secret was saved in GitHub, a newline character was included at the end of the value.  
**Fix:** Re-enter the secret in GitHub with no trailing newline. The exact value must be:  
```
AIzaSyClzJ_JR68a6uLBr8-2ZGak2_c_wFo36Hs
```
Navigate to: GitHub → Settings → Secrets → `VITE_FIREBASE_API_KEY` → Update

---

### Issue 4 — Site "Disappears" After Each New Deployment
**Symptom:** After a new deploy, returning users see a blank page until they hard-refresh (`Cmd+Shift+R`).  
**Root Cause:** Firebase Hosting had no cache headers configured. The browser would cache `index.html` for an unspecified time. When a new build deployed, the JS bundle filename changed (Vite appends a content hash, e.g. `index-BGSpuA_E.js` → `index-CZTPcm5d.js`), but users with stale `index.html` still requested the old filename — which no longer existed — causing a blank screen.  
**Fix:** Added explicit cache headers to `firebase.json`:
- `index.html` → `no-cache, no-store, must-revalidate` (always fetched fresh)
- All assets (`/assets/**`, `.js`, `.css`, images, fonts) → `max-age=31536000, immutable` (cached 1 year — safe because filenames include a unique hash)

**File Changed:** `firebase.json`

---

### Issue 5 — No Admin Login Route
**Symptom:** The login page showed Coach, Player, and Venue Owner options but no way to access the admin portal. Navigating to `/admin` directly redirected to login, which then had no admin option — a dead loop.  
**Root Cause:** `LoginView.tsx` only had three role options and no `'admin'` case in its routing logic.  
**Fix:**
- Added a red-styled **Admin** button to the login role selector
- Added `'admin'` to the `effectiveRole` type union in TypeScript
- Added `case 'admin'` to `getRoleConfig()` that routes to `/admin`
- Added path inference: if redirected from `/admin`, `effectiveRole` automatically becomes `'admin'`

**File Changed:** `src/views/LoginView.tsx`

---

## Firebase Hosting Cache Configuration

The current `firebase.json` cache strategy is:

```json
"headers": [
  {
    "source": "/index.html",
    "headers": [{ "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }]
  },
  {
    "source": "/assets/**",
    "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
  },
  {
    "source": "**/*.@(js|css|png|jpg|jpeg|gif|webp|svg|woff|woff2|ttf|eot|ico)",
    "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
  }
]
```

**Why this works:**
- `index.html` is always re-fetched → users always get the entry point that references the current bundle filenames
- JS/CSS/image assets are cached for 1 year → fast load times; safe because Vite gives every file a unique content-hash name on every build

---

## Firebase App Check Configuration

App Check adds an extra layer of security by verifying that requests come from your actual app (not bots or scrapers).

**Current status:** App Check is **disabled** because no reCAPTCHA Enterprise key has been configured.

**To enable App Check in production:**
1. Go to [Firebase Console](https://console.firebase.google.com) → `sportsscheduler` → **App Check**
2. Register your web app with reCAPTCHA Enterprise
3. Copy the Site Key
4. Add it to your `.env` file:
   ```
   VITE_RECAPTCHA_SITE_KEY=your_site_key_here
   ```
5. Add it to GitHub Secrets as `VITE_RECAPTCHA_SITE_KEY`
6. Add it to both workflow files in the `env:` block:
   ```yaml
   VITE_RECAPTCHA_SITE_KEY: ${{ secrets.VITE_RECAPTCHA_SITE_KEY }}
   ```
7. Redeploy

**Important:** Do NOT add the secret without also adding it to the workflow files — the secret won't be injected into the build automatically.

---

## Admin Portal Access

The admin portal at `/admin` is accessible to:
- Any user whose Firestore `users` document has `role: "admin"`
- **Or** any user logged in with the email addresses listed in `SUPERUSER_EMAILS` in `RequireAuth.tsx` (bypasses the role check entirely):
  - `don.hawk77@gmail.com`
  - `dhawk@valkyrieprosperity.com`
  - `admin@sportsscheduler.com`
  - `agent@valkyrie.com`

**To log in as admin:**
1. Go to `sportsscheduler.web.app/login`
2. Click the red **Admin** button
3. Enter your email and password
4. You are automatically routed to `/admin`

---

## How to Trigger a Redeployment

If you need to force a new build and deployment without making a code change:

```bash
cd /Users/dhawk/Documents/Practice/sports-scheduler-v2
git commit --allow-empty -m "ci: trigger redeployment"
git push origin main
```

The build typically takes **2–4 minutes** to complete. You can monitor progress at:  
`https://github.com/donhawk77/sports-scheduler-v2/actions`

---

## Checklist: If the Site Goes Blank Again

Work through this list in order:

- [ ] **1. Hard refresh the browser** — `Cmd+Shift+R` (Mac) / `Ctrl+Shift+R` (Windows). If it loads after this, the issue was a stale browser cache (should now be prevented by the cache headers fix).

- [ ] **2. Check the GitHub Actions log** — Go to the repo → **Actions** tab → click the latest workflow run → expand the `npm run build` step. Look for:
  - Any build errors
  - Whether env vars are being picked up (you won't see the values, but missing ones cause `undefined`)

- [ ] **3. Check Firebase Console** — Go to `console.firebase.google.com` → Hosting → confirm a recent successful deployment is listed

- [ ] **4. Check GitHub Secrets** — Go to Settings → Secrets → Confirm all 7 secrets exist:
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_STORAGE_BUCKET`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - `VITE_FIREBASE_APP_ID`
  - `VITE_STRIPE_PUBLISHABLE_KEY`

- [ ] **5. Check the browser console** — Open DevTools (`F12`) → Console tab. Key errors to look for:
  - `auth/invalid-api-key` → API key missing or has a trailing newline in the secret
  - `projectId: undefined` → `VITE_FIREBASE_PROJECT_ID` secret is missing
  - `Failed to load resource` on a `.js` file → stale `index.html` cache (hard refresh)
  - `recaptcha` 400 errors → App Check is trying to use a bad reCAPTCHA key

- [ ] **6. Trigger a fresh deploy** — Use the empty commit command above, wait 4 minutes, hard refresh

---

*This document should be updated whenever new environment variables, services, or workflow changes are made to the project.*

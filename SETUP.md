# eKIZAMINI — Setup Guide

## 🚀 First-Time Superadmin Setup

After deploying for the first time, you need to bootstrap the **first Superadmin** account manually via the Firebase Console.

### Step 1 — Create your admin account
1. Go to [https://ekizamini.web.app/admin/signup](https://ekizamini.web.app/admin/signup)
2. Register with your email and password
3. You'll see a "Pending" screen — this is expected

### Step 2 — Promote to Superadmin via Firebase Console
1. Go to [Firebase Console → Firestore](https://console.firebase.google.com/project/ekizamini/firestore/databases/-default-/data)
2. Navigate to: `users → {your user UID}`
3. Edit the document:
   - Set `role` → `superadmin`
   - Set `status` → `active`
4. Save

### Step 3 — Login
1. Go to [https://ekizamini.web.app/admin/login](https://ekizamini.web.app/admin/login)
2. Login with your credentials
3. You now have full superadmin access ✅

---

## 🔑 GitHub Actions Secrets (for CI/CD)

Go to: https://github.com/nadchannels/eKIZAMINI/settings/secrets/actions

Add these secrets:

| Secret Name | Value |
|---|---|
| `VITE_FIREBASE_API_KEY` | `AIzaSyDhbGly_XWJxsD2nDyX9lb8SRwC2YWucxo` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `ekizamini.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `ekizamini` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `ekizamini.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `852666724455` |
| `VITE_FIREBASE_APP_ID` | `1:852666724455:web:ee89fa07f20eb05d7424c2` |
| `VITE_FIREBASE_MEASUREMENT_ID` | `G-CC1JM7VCNR` |
| `FIREBASE_SERVICE_ACCOUNT` | *(see below)* |

### Getting the Firebase Service Account
1. Go to [Firebase Console → Project Settings → Service Accounts](https://console.firebase.google.com/project/ekizamini/settings/serviceaccounts/adminsdk)
2. Click **"Generate new private key"**
3. Copy the entire JSON contents
4. Paste as the value for `FIREBASE_SERVICE_ACCOUNT`

After adding secrets, every push to `main` will automatically build and deploy! 🎉

---

## 🎓 Role System

| Role | Access |
|---|---|
| **Superadmin** | Full access — all faculties, users management, can promote/demote |
| **Trainer** | Faculty-scoped — only exams and submissions for their assigned faculty |
| **Pending** | No access until superadmin approves |

## 📋 Faculty List
- Filmmaking and Video Production
- Multimedia Production
- Photography and Graphic Design
- Software Development

## 🌐 Live URLs
- **Public (Trainee):** https://ekizamini.web.app
- **Admin Login:** https://ekizamini.web.app/admin/login
- **Admin Signup:** https://ekizamini.web.app/admin/signup

# 🏦 Campaign Portal — Setup Guide

A mobile-friendly campaign reporting system hosted on GitHub Pages,  
powered by Google Sheets as a backend.

---

## 📁 Files

| File | Description |
|------|-------------|
| `index.html` | **Branch interface** — staff submit daily reports |
| `admin-cpx7k2m9.html` | **Admin dashboard** — manage campaigns & view reports |
| `Code.gs` | **Google Apps Script** — backend API |

> ⚠️ Keep `admin-cpx7k2m9.html` URL confidential — it is your secret admin page.  
> You can rename it to any random string for extra security.

---

## ⚙️ Step-by-Step Setup

### 1. Create a Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a **new blank spreadsheet**
2. Copy the **Spreadsheet ID** from the URL:  
   `https://docs.google.com/spreadsheets/d/`**`THIS_IS_YOUR_ID`**`/edit`

### 2. Set Up Google Apps Script

1. In your spreadsheet, go to **Extensions → Apps Script**
2. Delete all existing code in the editor
3. Paste the entire contents of `Code.gs`
4. Replace `YOUR_SPREADSHEET_ID_HERE` on line 5 with your actual Spreadsheet ID:
   ```javascript
   const SPREADSHEET_ID = 'paste_your_id_here';
   ```
5. Click **Save** (💾)
6. Click **Deploy → New deployment**
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
7. Click **Deploy** → authorize permissions → Copy the **Web App URL**

### 3. Update HTML Files

Replace `YOUR_APPS_SCRIPT_URL_HERE` in **both** `index.html` and `admin-cpx7k2m9.html`:

```javascript
const API = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
```

### 4. Change the Admin Password

In `admin-cpx7k2m9.html`, find and change:
```javascript
const ADMIN_PW = 'admin@2024';   // ← CHANGE THIS!
```

### 5. Initialize the Google Sheet

1. Open your admin page in a browser
2. Log in with your admin password
3. Click **"⚙ Setup Sheet"** in the top-right corner
4. This creates all required sheets and imports all 46 branch names

### 6. Host on GitHub Pages

1. Create a new repository on GitHub (can be public or private)
2. Upload `index.html` and `admin-cpx7k2m9.html`
3. Go to **Settings → Pages**
4. Source: **Deploy from a branch** → `main` / `root`
5. Your portal will be live at:  
   `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

---

## 🔗 URLs

| Role | URL |
|------|-----|
| Branch Staff | `https://yoursite.github.io/repo/` |
| Admin Panel | `https://yoursite.github.io/repo/admin-cpx7k2m9.html` |

---

## 🎯 How to Create the "CYCLING WITH CMC" Campaign

After setup, log into the admin panel and:

1. Click **"+ New Campaign"**
2. Name: `CYCLING WITH CMC`
3. Set start & end dates
4. Frequency: `Daily`
5. Add 3 parameters:
   - `PAI` → Number
   - `PAI AUTORENEWAL` → Number  
   - `PAI NON-AUTORENEWAL` → Number
6. Click **Create Campaign**

> **Note:** Each campaign automatically creates its own sheet in Google Sheets.

---

## 📋 Features

### Branch Interface
- 🔍 Searchable branch dropdown
- 💾 Remembers branch selection (localStorage)
- 📊 Shows all active campaigns for today
- ↩ Displays previously submitted values inline
- ⚠️ Zero-report warning before submission
- ✅ Multiple submissions per day supported (values accumulate)
- 📱 Fully mobile-optimised

### Admin Dashboard
- 🟢 Branch activity monitor (green = visited, red = not yet)
- 📋 Campaign CRUD (create, activate, deactivate)
- 📊 Reports: filter by campaign, branch, date range
- 📥 Export reports as CSV
- 🏦 Branch management (add/remove)
- 🔒 Password-protected access

---

## 🔄 Re-deploying After Code Changes

If you update `Code.gs`:
1. Go to Apps Script → **Deploy → Manage deployments**
2. Edit your existing deployment → **New version**
3. Deploy — the **URL stays the same**, no need to update HTML files

---

## 🛠 Troubleshooting

| Issue | Fix |
|-------|-----|
| "Could not load branches" | Check API URL in HTML file |
| "Campaign sheet not found" | Re-run Setup Sheet from admin |
| CORS errors | Ensure Apps Script is deployed as "Anyone" |
| Admin login fails | Check `ADMIN_PW` in `admin-cpx7k2m9.html` |
| No campaigns showing | Check campaign dates include today |

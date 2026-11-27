# POSTMATE Public Hosting Guide (100% Free Stack)

Your POSTMATE project is configured for zero-cost public hosting using:
- **Frontend:** Vercel (Free Hobby plan) — configured via [`vercel.json`](../vercel.json)
- **Backend API:** Render (Free Web Service) — configured via [`render.yaml`](../render.yaml)
- **Persistent Shared Database (Optional but Recommended):** MongoDB Atlas (Free M0 cluster, 512 MB)

> Note: If `MONGODB_URI` is left blank, the backend automatically starts in **Local Demo Fallback** mode and seeds demo data on boot (note that Render's free container resets ephemeral disk files when it sleeps after ~15 minutes of inactivity). Connect free MongoDB Atlas M0 if you want friend changes to persist permanently across restarts.

---

## Step 1: Push Project to GitHub

1. Create an empty repository on [GitHub](https://github.com/new) named `postmate` (Public or Private).
2. In your project folder (`POSTMATE`), run:
   ```bash
   git init
   git add .
   git commit -m "Prepare POSTMATE for public deployment"
   git branch -M main
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/postmate.git
   git push -u origin main
   ```
   *(Sensitive files like `.env`, `database/storage.json`, and `*.zip` are already excluded by `.gitignore`.)*

---

## Step 2 (Recommended): Create Free MongoDB Atlas Database

1. Sign up / sign in at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).
2. Create an **M0 Free** cluster.
3. Under **Database Access**, create a database user (save the username & password).
4. Under **Network Access**, add IP `0.0.0.0/0` (allows Render's dynamic IP addresses).
5. Click **Connect → Drivers** and copy your connection string, e.g.:
   ```text
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/postmate?retryWrites=true&w=majority
   ```

---

## Step 3: Deploy Backend API on Render (Free)

1. Sign up / log in at [Render](https://dashboard.render.com) with your GitHub account.
2. Click **New + → Blueprint** (or **New + → Web Service** and connect your `postmate` GitHub repo):
   - **Root Directory:** *(leave blank / repo root)*
   - **Runtime:** `Node`
   - **Plan:** `Free`
   - **Build Command:** `npm install --include=dev && npm run build:shared && npm run build:api`
   - **Start Command:** `node apps/api/dist/index.js`
   - **Health Check Path:** `/api/health`
3. Under **Environment Variables**, set:
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = *(click Generate, or any long random string)*
   - `JWT_EXPIRES_IN` = `7d`
   - `USE_LOCAL_DB_FALLBACK` = `true`
   - `MONGODB_URI` = *(paste your MongoDB Atlas URI from Step 2, or leave blank for built-in demo fallback)*
   - `FRONTEND_URL` = *(set after Step 4 once you have your Vercel URL)*
4. Deploy and wait for **Live**. Copy your public backend URL, e.g. `https://postmate-api-xxxx.onrender.com`.
5. Test `https://postmate-api-xxxx.onrender.com/api/health` in your browser — you should see `{"status":"ONLINE", ...}`.
   *(Free Render services spin down after 15 minutes idle; the very first request after sleep takes ~30–50 seconds to wake up.)*

---

## Step 4: Deploy Web Frontend on Vercel (Free)

1. Sign up / log in at [Vercel](https://vercel.com) with your GitHub account.
2. Click **Add New → Project** and import your `postmate` GitHub repository.
3. Keep **Root Directory** at `.` (repo root — `vercel.json` is already configured!).
4. Under **Environment Variables**, add:
   - **Name:** `VITE_API_BASE_URL`
   - **Value:** `https://postmate-api-xxxx.onrender.com` *(your exact Render URL from Step 3, no trailing slash)*
5. Click **Deploy**.
6. Once deployed, copy your public Vercel URL (e.g. `https://postmate-xxxx.vercel.app`).

---

## Step 5: Link CORS & Verify from Another Device

1. Go back to **Render → `postmate-api` → Environment** and set:
   - `FRONTEND_URL` = `https://postmate-xxxx.vercel.app` *(save to redeploy; note `*.vercel.app` is also pre-authorized automatically).*
2. Open `https://postmate-xxxx.vercel.app` on your phone (mobile data) or a friend's browser.
3. Test 1-Click Demo Login (`Postmaster PM600040`, password `password123`) and verify Dashboard, Digital Register, Delivery, Cashbook, and Reports load properly.

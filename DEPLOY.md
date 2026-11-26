# Deploying NaijaOpenMarket (web + mobile)

Architecture: one Django API on Render, one React site on Vercel, and the same site
wrapped as Android/iOS apps with Capacitor. All three talk to the same API.

## What was changed in the code

- `frontend/src/api.js` and five other files no longer hardcode `http://127.0.0.1:8001`.
  They read `VITE_API_URL` instead (falls back to localhost for local work).
- Renamed `Components/ui/spinner.jsx` -> `Spinner.jsx` and `placeholder.jsx` -> `Placeholder.jsx`.
  Your imports used capital letters, which works on Windows/macOS but fails on the Linux build servers.
- Added `frontend/vercel.json` (page refresh/deep links work with React Router).
- Added PWA files: `manifest.webmanifest`, `sw.js`, icons, and service-worker registration in `main.jsx`.
- Added `frontend/capacitor.config.json` for the native wrappers.
- Backend: CORS now also allows the Capacitor app origins, product images are served in production,
  and the email login comes from environment variables instead of the file.
- `render.yaml`: added the Flutterwave encryption key and the two email variables.

## Step 1: Backend on Render

1. Push the changes to GitHub.
2. Render dashboard -> New -> Blueprint -> pick `Lanzyus/naija-market`. It reads `render.yaml`
   and creates the API and the Postgres database.
3. When prompted (or later under Environment), fill in: `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY`,
   `FLUTTERWAVE_PUBLIC_KEY`, `FLUTTERWAVE_SECRET_KEY`, `FLUTTERWAVE_ENCRYPTION_KEY`,
   `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` (a Gmail app password), and leave `FRONTEND_URL` for step 3.
4. Wait for the deploy, then open `https://<your-service>.onrender.com/api/`. Note this URL.

## Step 2: Web app on Vercel

1. Vercel -> Add New Project -> import the repo.
2. Set **Root Directory** to `frontend`. Framework preset: Vite (build `npm run build`, output `dist`).
3. Add environment variable `VITE_API_URL` = your Render URL (no trailing slash, no `/api`).
4. Deploy. You get a `https://<project>.vercel.app` address; add a custom domain later if you want one.

## Step 3: Connect the two

In Render -> your API -> Environment, set `FRONTEND_URL` to the Vercel address
(for example `https://naija-market.vercel.app`, no trailing slash) and redeploy.
Until this is set, the browser will block API calls (CORS).

## Step 4: Installable web app (PWA)

Already done. After step 2, open the site on a phone: Chrome shows "Install app" / "Add to Home screen",
Safari uses Share -> Add to Home Screen. Check it in Chrome DevTools -> Application -> Manifest.

## Step 5: Android and iOS apps (Capacitor)

Run these on your computer inside `frontend/` (they need npm access):

```bash
npm install
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
echo "VITE_API_URL=https://<your-service>.onrender.com" > .env.production.local
npm run build
npx cap add android
npx cap add ios          # Mac only
npx cap sync
npx cap open android     # opens Android Studio -> Build -> Generate Signed Bundle (AAB)
npx cap open ios         # opens Xcode -> Product -> Archive
```

Store icons: use `public/icons/app-icon-1024.png` as the source (placeholder "N" artwork; replace with your logo).

Accounts: Apple Developer Program (about $99/year) and Google Play Console (one-time fee, about $25).
Both stores need a privacy policy URL before you submit. Check current prices on their sites.

## Before real customers: known limits

- **Product images disappear on redeploy.** Render's free web service has no persistent disk.
  Move uploads to Cloudinary or S3 (`django-storages`) before launch.
- **Free database expires 30 days after creation** (then a 14-day grace period before deletion).
  Upgrade the database to a paid plan or you will lose your data.
- **Free API sleeps after 15 minutes idle** and takes about a minute to wake. Fine for testing, not for shoppers.
- **No shell on the free plan**, so you cannot run `createsuperuser` there. Upgrade the API or add a
  one-off `python manage.py createsuperuser --noinput` step (with `DJANGO_SUPERUSER_*` env vars) to `build.sh`.
- **Test Paystack and Flutterwave inside the mobile app.** Payment redirects return to the web address,
  which may open the browser instead of the app. This needs a real-device test.
- Apple can reject apps that are only a website in a wrapper. Native features (push notifications,
  camera for product photos) help with review.
- `backend/requirements.txt` includes Celery, Channels, Redis and Daphne, which the Render blueprint does not run.
  They are harmless but unused unless you add those services.

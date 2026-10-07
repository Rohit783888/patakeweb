# Paper & Nib — Stationery Store

A stationery store catalog built with React + Vite and Firebase. There's a
public storefront at `/` and a login-gated admin dashboard at `/admin` for
managing products. Every product card has an **Order on WhatsApp** button
that opens WhatsApp with a pre-filled message so a customer can send an
order straight to the store's number.

## What it does

- **`/` — public storefront**: browse products, order on WhatsApp. No login,
  no edit controls.
- **`/admin` — signed-in only**: full CRUD (create, edit, delete products),
  drag-and-drop photo uploads. Anyone who isn't signed in sees a login form
  instead.
- **Order on WhatsApp** — button on each card opens `wa.me` with the product
  name, SKU, and price pre-filled in the message.
- **Photo uploads** — drag-and-drop (or click to browse) multiple product
  photos, uploaded to Cloudinary; reorder or remove them, first photo is the
  cover shown on the card.

## 1. Install

```bash
npm install
```

## 2. Create a Firebase project

1. Go to the [Firebase console](https://console.firebase.google.com) and create a project.
2. Click **Build > Firestore Database > Create database** (start in test
   mode for local development — we'll lock it down with rules below).
3. Click **Build > Authentication > Get started**, then enable the
   **Email/Password** sign-in provider (under the "Sign-in method" tab).
4. Still in Authentication, go to the **Users** tab and click **Add user** to
   create your admin login — an email and password you'll use to sign in at
   `/admin`. There's no public sign-up form in the app by design; you add
   admins manually here.
5. Click the gear icon > **Project settings**, scroll to **Your apps**, and
   add a **Web app**. Firebase will show you a config object — you'll need
   those values next.

## 3. Configure environment variables

Copy the example file:

```bash
cp .env.example .env
```

Fill in `.env` with:

- The six `VITE_FIREBASE_*` values from your Firebase web app config.
- `VITE_WHATSAPP_NUMBER` — the store's WhatsApp number in full international
  format, **digits only** (no `+`, spaces, or dashes). Example: for
  `+1 555 123 4567` use `15551234567`.
- The two `VITE_CLOUDINARY_*` values — see the next section.

## 4. Set up image uploads (Cloudinary)

Photo uploads go straight from the browser to Cloudinary using an
**unsigned upload preset**, so there's no backend or Firebase Storage (and
no Blaze billing plan) required.

1. Create a free account at [cloudinary.com](https://cloudinary.com).
2. On your Cloudinary **Dashboard**, copy the **Cloud name** near the top —
   that's `VITE_CLOUDINARY_CLOUD_NAME`.
3. Go to **Settings** (gear icon) **> Upload > Upload presets > Add upload preset**.
4. Set:
   - **Signing Mode: Unsigned** (required — this is what lets the browser
     upload directly without a secret key)
   - **Preset name** — copy this into `VITE_CLOUDINARY_UPLOAD_PRESET`
   - Optionally set a **Folder** (e.g. `stationery-store`) to keep uploads
     organized
5. While you're in the preset settings, it's worth tightening it up since an
   unsigned preset is publicly usable by anyone who has the preset name:
   - **Allowed formats**: restrict to `jpg,png,webp` (or similar)
   - **Max file size**: set a reasonable cap, e.g. 5 MB
6. Save the preset.

No API key or secret goes in the app. The Cloud name and preset name are
safe to expose in client code — they can only be used to upload under your
configured restrictions, not to read your account or delete anything.

## 5. Deploy Firestore security rules

`firestore.rules` lets anyone **read** the catalog (needed for the public
storefront) but only signed-in users **write** to it:

```
allow read: if true;
allow write: if request.auth != null;
```

Checkout orders go to an `orders` collection that works the other way round:
anyone can **create** an order (with a valid name, 10-digit mobile number and
at least one item), but only signed-in admins can **read**, update or delete
them, so customers' numbers stay private. Checkout fails with "Couldn't place
your order" until these rules are deployed.

Deploy it with the Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # point it at this project, keep firestore.rules
firebase deploy --only firestore:rules
```

If you skip this, Firestore's default test-mode rules may allow anyone to
write to your catalog — the login screen would still gate the `/admin` UI,
but someone could still write directly to the database, so don't skip it
before going live.

## 6. Run it

```bash
npm run dev
```

Open the printed local URL — that's the public storefront. Go to `/admin`,
sign in with the user you created in step 2, add a product with a few
photos, and click its WhatsApp stamp to confirm it opens a chat with the
right number and message.

## 7. Build for production

```bash
npm run build
```

This outputs static files to `dist/`, deployable to Firebase Hosting, Vercel,
Netlify, or any static host. Since this is a single-page app with client-side
routing, make sure your host rewrites all paths to `index.html`. For Firebase
Hosting:

```bash
firebase init hosting   # set "dist" as the public directory, configure as a single-page app
firebase deploy --only hosting
```

## Project structure

```
src/
  firebase.js                Firebase app, Firestore + Auth init
  App.jsx                     Router: "/" storefront, "/admin" dashboard
  index.css                   Design system (stationery/ledger theme)
  context/
    AuthContext.jsx            Current user, login, logout
  hooks/
    useProducts.js              Shared Firestore products subscription
  pages/
    Storefront.jsx               Public read-only catalog
    Admin.jsx                     Login gate + CRUD dashboard
  lib/
    cloudinary.js                 Unsigned-upload helper for photos
  components/
    ProductCard.jsx                Product display + WhatsApp order button
    ProductForm.jsx                 Add/edit modal form
    ImageDropzone.jsx                Drag-and-drop multi-photo uploader
    LoginForm.jsx                     Admin sign-in form
```

## Adding more admins

Repeat step 2.4 (Authentication > Users > Add user) in the Firebase console
for each person who should have access to `/admin`. There's no self-service
sign-up in the app.

## Customizing the WhatsApp message

The message text is built in `src/components/ProductCard.jsx` inside
`buildWhatsAppUrl()`. Edit the `lines` array there to change the wording,
add a store name, or include a link back to your site.
